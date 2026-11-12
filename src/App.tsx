import { useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ArrowUpRight, Check, CheckCheck, Download, Feather, Film, Heart, Library, Plus, ShieldCheck, Upload, X } from 'lucide-react';
import type { Anime, Filter, LibraryEntry, Sort } from './types';
import { createEntry, updateEntry } from './types';
import { localLibraryRepository, mergeLibraries, parseLibrary, serializeLibrary } from './lib/storage';
import { Header } from './components/Header';
import { LibraryFilters } from './components/LibraryFilters';
import { AnimeGrid } from './components/AnimeGrid';
import { EmptyState } from './components/EmptyState';
import { AnimeDetails } from './components/AnimeDetails';
import { AnimeSearch } from './components/AnimeSearch';
import { Discover } from './components/Discover';
import { Modal } from './components/Modal';

type Overlay = { type: 'search' } | { type: 'details'; anime: Anime } | { type: 'about' } | { type: 'import'; entries: LibraryEntry[] } | null;
function initialLibrary() {
  try { return { entries: localLibraryRepository.load(), error: '' }; }
  catch { return { entries: [], error: 'Не удалось прочитать сохранённую коллекцию. Исходные данные сохранены: экспортируйте их для восстановления или импортируйте резервную копию.' }; }
}

export default function App() {
  const [initial] = useState(initialLibrary);
  const [entries, setEntries] = useState(initial.entries);
  const [storageError, setStorageError] = useState(initial.error);
  const [blocked, setBlocked] = useState(Boolean(initial.error));
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('added');
  const [query, setQuery] = useState('');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const add = () => {
    if (blocked) { notify('Сначала экспортируйте повреждённые данные и импортируйте резервную копию.'); return; }
    setOverlay({ type: 'search' });
  };
  function notify(message: string) { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); }
  function persist(next: LibraryEntry[], recover = false) {
    setEntries(next);
    if (blocked && !recover) return;
    try { localLibraryRepository.save(next); setStorageError(''); setBlocked(false); }
    catch { setStorageError('Браузер не смог сохранить изменения. Экспортируйте коллекцию в JSON, чтобы не потерять её после закрытия страницы.'); }
  }
  function addAnime(anime: Anime) {
    if (!entries.some(a => a.id === anime.id)) { persist([createEntry(anime), ...entries]); notify('Новая история в вашей коллекции'); }
    setOverlay({ type: 'details', anime });
  }
  function exportLibrary() {
    let json = serializeLibrary(entries);
    if (blocked) {
      try { json = localStorage.getItem('my-anime-library:v1') || json; } catch { /* In-memory export remains available. */ }
    }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `my-anime-library-${new Date().toLocaleDateString('sv-SE')}.json`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Файл коллекции подготовлен для скачивания');
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Файл слишком большой. Максимальный размер — 5 МБ.');
      const data = parseLibrary(await file.text());
      setOverlay({ type: 'import', entries: data.entries });
    } catch (error) { notify(error instanceof Error ? error.message : 'Не удалось прочитать файл.'); }
    finally { if (fileInput.current) fileInput.current.value = ''; }
  }
  const visible = entries.filter(a => (filter === 'all' || a.status === filter) && `${a.title} ${a.originalTitle}`.toLowerCase().includes(query.toLowerCase().trim())).sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'ru') : sort === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) || b.addedAt.localeCompare(a.addedAt) : b.addedAt.localeCompare(a.addedAt));
  const completed = entries.filter(a => a.status === 'completed').length;
  const episodes = entries.reduce((sum, a) => sum + a.progress, 0);
  const selected = overlay?.type === 'details' ? entries.find(a => a.id === overlay.anime.id) || overlay.anime : null;

  return <LayoutGroup><div className="app-shell">
    <Header onAdd={add} onExport={exportLibrary} onImport={() => fileInput.current?.click()} onAbout={() => setOverlay({ type: 'about' })} />
    <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" aria-label="Файл коллекции для импорта" onChange={e => { void importFile(e.target.files?.[0]); }} />
    <main>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-art" /><div className="hero-wash" /><motion.div className="hero-content" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}><div className="hero-eyebrow"><span />ЛИЧНЫЙ АРХИВ АНИМЕ</div><h1 id="hero-title">My Anime Library<span>Моя маленькая вселенная историй</span></h1><p>Истории, которые остаются с вами.<br />Собирайте любимое и открывайте новое.</p><button className="hero-cta" onClick={add}>Пополнить коллекцию<ArrowUpRight size={16} /></button></motion.div><div className="hero-caption"><span className="caption-line" /><span>Кадр настроения</span><strong>Провожающая в последний путь Фрирен</strong></div><span className="hero-japanese" aria-hidden="true">物語は、つづく。</span></section>
      <section id="collection" className="collection-section" aria-label="Моя коллекция"><div className="collection-heading"><div className="collection-title"><h2>Моя коллекция<span className="collection-count">{entries.length.toString().padStart(2, '0')}</span></h2><p>У каждой истории здесь своё место.</p></div><div className="collection-stats"><span><CheckCheck size={16} /><strong>{completed}</strong> просмотрено</span><span className="stats-divider" /><span><Film size={16} /><strong>{episodes}</strong> серий позади</span></div></div>
        {storageError && <div className="storage-warning" role="alert"><p>{storageError}</p><button className="text-button" onClick={exportLibrary}><Download size={15} />Экспортировать</button></div>}
        <LibraryFilters entries={entries} filter={filter} onFilter={setFilter} sort={sort} onSort={setSort} query={query} onQuery={setQuery} />
        {visible.length ? <AnimeGrid entries={visible} onOpen={id => { const anime = entries.find(a => a.id === id); if (anime) setOverlay({ type: 'details', anime }); }} /> : <EmptyState filtered={entries.length > 0 || filter !== 'all' || !!query} onAdd={add} onReset={() => { setFilter('all'); setQuery(''); }} />}
        {entries.length > 0 && <button className="add-story" onClick={add}><Plus size={16} />Ещё одна история</button>}
      </section>
      {entries.length === 0 && !blocked && <Discover onOpen={anime => setOverlay({ type: 'details', anime })} onSearch={add} />}
      <div className="closing-note"><Feather size={17} strokeWidth={1.3} /><p>Некоторые истории заканчиваются. Любимые — остаются.</p></div>
    </main>
    <footer className="site-footer"><span className="footer-brand"><Library size={15} />My Anime Library<span>Личное пространство для любимых историй</span></span><span className="local-note"><span className="status-dot" />{storageError ? 'Есть несохранённые изменения' : 'Сохранено в этом браузере'}</span><button onClick={() => fileInput.current?.click()}>Импорт</button><button onClick={exportLibrary}>Экспорт<ArrowUpRight size={11} /></button></footer>
    <AnimatePresence mode="wait">
      {overlay?.type === 'search' && <AnimeSearch key="search" onClose={() => setOverlay(null)} existingIds={new Set(entries.map(a => a.id))} onSelect={addAnime} />}
      {overlay?.type === 'details' && selected && <AnimeDetails key={`details-${selected.id}`} anime={selected} saved={!storageError} onClose={() => setOverlay(null)} onAdd={addAnime} onUpdate={patch => persist(entries.map(a => a.id === selected.id ? updateEntry(a, patch) : a))} onDelete={() => { persist(entries.filter(a => a.id !== selected.id)); setOverlay(null); notify('История удалена из коллекции'); }} />}
      {overlay?.type === 'about' && <Modal key="about" label="О My Anime Library" onClose={() => setOverlay(null)} className="small-modal"><div className="about-content"><span className="about-icon"><Heart size={27} strokeWidth={1.3} /></span><span className="eyebrow">СОБРАНО С ЛЮБОВЬЮ К ИСТОРИЯМ</span><h2>Ваш маленький<br />аниме-архив.</h2><p>Место для того, что смотрите сейчас, хотите увидеть и не хотите забывать.</p><div className="about-info"><ShieldCheck size={20} /><p>Коллекция хранится локально в этом браузере. В одном профиле браузера она общая. Аккаунтов и синхронизации между устройствами пока нет.</p></div><p className="muted">Экспортируйте JSON для резервной копии или переноса. Импорт объединяет коллекции: для одинакового ID сохраняется более свежая запись. Очистка данных браузера удалит локальную коллекцию.</p><div className="about-actions"><button className="button secondary" onClick={exportLibrary}><Download size={15} />Экспорт</button><button className="button secondary" onClick={() => fileInput.current?.click()}><Upload size={15} />Импорт</button></div><p className="credits">Данные и постеры: AniList, Shikimori, MyAnimeList.<br />Иллюстрация: «Провожающая в последний путь Фрирен», AniList.<br />Изображения принадлежат их правообладателям.</p></div></Modal>}
      {overlay?.type === 'import' && <Modal key="import" label="Подтвердить импорт коллекции" onClose={() => setOverlay(null)} className="small-modal"><div className="import-content"><Upload size={29} strokeWidth={1.4} /><span className="eyebrow">ПЕРЕНОС ИСТОРИЙ</span><h2>Коллекция готова к импорту</h2><p>В файле: {overlay.entries.length} записей. Новых историй: {overlay.entries.filter(a => !entries.some(b => b.id === a.id)).length}.</p><p className="muted">Коллекции будут объединены. При совпадении ID сохраняется запись с более поздней датой изменения, включая её оценку, прогресс и отзыв.</p>{blocked && <p className="muted">Импорт заменит повреждённые данные. Сначала экспортируйте их, если нужна копия.</p>}<div className="import-actions"><button className="button secondary" onClick={() => setOverlay(null)}>Отмена</button><button className="button primary" onClick={() => { persist(mergeLibraries(entries, overlay.entries), true); setOverlay(null); notify('Коллекция импортирована'); }}><Check size={16} />Объединить коллекции</button></div></div></Modal>}
    </AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" role="status" key={toast} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={17} /><span>{toast}</span><button className="icon-button" onClick={() => setToast('')} aria-label="Скрыть уведомление"><X size={15} /></button></motion.div>}</AnimatePresence>
  </div></LayoutGroup>;
}
