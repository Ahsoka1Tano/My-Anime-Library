import { useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check, Download, Upload, X } from 'lucide-react';
import type { Anime, LibraryEntry } from './types';
import { createEntry, updateEntry } from './types';
import { localLibraryRepository, mergeLibraries, parseLibrary, serializeLibrary } from './lib/storage';
import { AnimeGrid } from './components/AnimeGrid';
import { AddAnimeButton } from './components/AddAnimeButton';
import { AnimeDetails } from './components/AnimeDetails';
import { AnimeSearch } from './components/AnimeSearch';
import { Modal } from './components/Modal';

type Overlay = { type: 'search' } | { type: 'details'; anime: Anime } | { type: 'import'; entries: LibraryEntry[] } | null;
function initialLibrary() {
  try { return { entries: localLibraryRepository.load(), error: '' }; }
  catch { return { entries: [], error: 'Не удалось прочитать сохранённую коллекцию. Исходные данные сохранены: экспортируйте их для восстановления или импортируйте резервную копию.' }; }
}

export default function App() {
  const [initial] = useState(initialLibrary);
  const [entries, setEntries] = useState(initial.entries);
  const [storageError, setStorageError] = useState(initial.error);
  const [blocked, setBlocked] = useState(Boolean(initial.error));
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const add = () => setOverlay({ type: 'search' });
  function notify(message: string) { setToast(message); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); }
  function persist(next: LibraryEntry[], recover = false) {
    setEntries(next);
    if (blocked && !recover) return;
    try { localLibraryRepository.save(next); setStorageError(''); setBlocked(false); }
    catch { setStorageError('Браузер не смог сохранить изменения. Экспортируйте коллекцию в JSON, чтобы не потерять её после закрытия страницы.'); }
  }
  function addAnime(anime: Anime) {
    if (blocked) { notify('Сначала экспортируйте повреждённые данные и импортируйте резервную копию.'); return; }
    if (!entries.some(a => a.id === anime.id)) persist([createEntry(anime), ...entries]);
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
  const visible = [...entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const selected = overlay?.type === 'details' ? entries.find(a => a.id === overlay.anime.id) || overlay.anime : null;

  return <LayoutGroup><div className="app-shell">
    <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" aria-label="Файл коллекции для импорта" onChange={e => { void importFile(e.target.files?.[0]); }} />
    <header className="library-header">
      <h1 className="library-title">My Anime <span>Library</span></h1>
      {entries.length > 0 && <AddAnimeButton onClick={add} />}
    </header>
    <main className={`minimal-library ${entries.length ? 'has-entries' : 'is-empty'}`} aria-label="Моя коллекция">
      {storageError && <div className="storage-warning" role="alert"><p>{storageError}</p><button className="text-button" onClick={exportLibrary}><Download size={15} />Экспортировать</button></div>}
      {entries.length === 0 && <div className="empty-library"><AddAnimeButton onClick={add} /></div>}
      <AnimeGrid entries={visible} onOpen={id => {
        const anime = entries.find(entry => entry.id === id);
        if (anime) setOverlay({ type: 'details', anime });
      }} />
    </main>
    <AnimatePresence mode="wait">
      {overlay?.type === 'search' && <AnimeSearch key="search" onClose={() => setOverlay(null)} existingIds={new Set(entries.map(a => a.id))} onSelect={addAnime} onImport={() => fileInput.current?.click()} onExport={exportLibrary} />}
      {overlay?.type === 'details' && selected && <AnimeDetails key={`details-${selected.id}`} anime={selected} saved={!storageError} onClose={() => setOverlay(null)} onAdd={addAnime} onUpdate={patch => persist(entries.map(a => a.id === selected.id ? updateEntry(a, patch) : a))} onDelete={() => { persist(entries.filter(a => a.id !== selected.id)); setOverlay(null); notify('История удалена из коллекции'); }} />}
      {overlay?.type === 'import' && <Modal key="import" label="Подтвердить импорт коллекции" onClose={() => setOverlay(null)} className="small-modal"><div className="import-content"><Upload size={29} strokeWidth={1.4} /><span className="eyebrow">ПЕРЕНОС ИСТОРИЙ</span><h2>Коллекция готова к импорту</h2><p>В файле: {overlay.entries.length} записей. Новых историй: {overlay.entries.filter(a => !entries.some(b => b.id === a.id)).length}.</p><p className="muted">Коллекции будут объединены. При совпадении ID сохраняется запись с более поздней датой изменения, включая её оценку, прогресс и отзыв.</p>{blocked && <p className="muted">Импорт заменит повреждённые данные. Сначала экспортируйте их, если нужна копия.</p>}<div className="import-actions"><button className="button secondary" onClick={() => setOverlay(null)}>Отмена</button><button className="button primary" onClick={() => { persist(mergeLibraries(entries, overlay.entries), true); setOverlay(null); notify('Коллекция импортирована'); }}><Check size={16} />Объединить коллекции</button></div></div></Modal>}
    </AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" role="status" key={toast} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={17} /><span>{toast}</span><button className="icon-button" onClick={() => setToast('')} aria-label="Скрыть уведомление"><X size={15} /></button></motion.div>}</AnimatePresence>
  </div></LayoutGroup>;
}
