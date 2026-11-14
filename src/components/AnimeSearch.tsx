import { useEffect, useState } from 'react';
import { Check, Download, LoaderCircle, Plus, Search, SearchX, Upload } from 'lucide-react';
import type { Anime } from '../types';
import { apiError, searchAnime } from '../lib/api';
import { Modal } from './Modal';
import { Poster } from './Poster';

interface Props { onClose: () => void; onSelect: (anime: Anime) => void; existingIds: Set<number>; onImport: () => void; onExport: () => void }
export function AnimeSearch({ onClose, onSelect, existingIds, onImport, onExport }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try { const data = await searchAnime(query.trim(), controller.signal); if (!controller.signal.aborted) { setResults(data); setLoading(false); } }
      catch (err) { if (!controller.signal.aborted) { setError(apiError(err)); setLoading(false); } }
    }, 550);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, attempt]);
  function changeQuery(value: string) { setQuery(value); setError(''); setResults([]); setLoading(value.trim().length >= 2); }
  return <Modal label="Найти и добавить аниме" onClose={onClose} className="search-modal">
    <label className="catalog-search"><Search size={21} /><input data-autofocus value={query} maxLength={200} onChange={e => changeQuery(e.target.value)} placeholder="Название аниме" aria-label="Название аниме для поиска" />{loading && <LoaderCircle className="spin" size={20} />}</label>
    <div className="search-results" aria-live="polite" aria-busy={loading}>
      {loading ? <div className="search-skeletons">{Array.from({ length: 4 }, (_, i) => <div className="search-skeleton" key={i}><div className="skeleton" /><span className="skeleton" /></div>)}</div>
        : error ? <div className="search-state"><SearchX size={30} /><p>{error}</p><button className="button secondary" onClick={() => { setError(''); setLoading(true); setAttempt(a => a + 1); }}>Попробовать снова</button></div>
        : query.trim().length < 2 ? (query.trim() ? <p className="search-hint">Минимум 2 символа</p> : null)
        : results.length === 0 ? <div className="search-state"><SearchX size={30} /><p>Ничего не найдено</p></div>
        : <div className="search-results-list">{results.map(anime => <button className="search-result" key={anime.id} onClick={() => onSelect(anime)} aria-label={`${existingIds.has(anime.id) ? 'Открыть' : 'Добавить'} «${anime.title}»`}><div className="search-result-poster"><Poster src={anime.poster} title={anime.title} /></div><div><h3>{anime.title}</h3><p>{anime.originalTitle}</p><span>{anime.year ?? 'Год неизвестен'} · {anime.format} · {anime.episodes ? `${anime.episodes} эп.` : 'Серии неизвестны'}</span></div><span className={`result-action ${existingIds.has(anime.id) ? 'in-library' : ''}`}>{existingIds.has(anime.id) ? <><Check size={16} /><span>В коллекции</span></> : <Plus size={19} />}</span></button>)}</div>}
    </div>
    <div className="search-utilities"><button className="icon-button" onClick={onImport} aria-label="Импортировать коллекцию" title="Импорт JSON"><Upload size={16} /></button><button className="icon-button" onClick={onExport} aria-label="Экспортировать коллекцию" title="Экспорт JSON"><Download size={16} /></button></div>
  </Modal>;
}
