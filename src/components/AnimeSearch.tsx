import { useEffect, useState } from 'react';
import { Check, LoaderCircle, Plus, Search, SearchX } from 'lucide-react';
import type { Anime } from '../types';
import { apiError, searchAnime } from '../lib/api';
import { Modal } from './Modal';
import { Poster } from './Poster';

export function AnimeSearch({ onClose, onSelect, existingIds }: { onClose: () => void; onSelect: (anime: Anime) => void; existingIds: Set<number> }) {
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
  return <Modal label="Найти и добавить аниме" onClose={onClose} className="search-modal"><div className="search-heading"><span className="eyebrow">СЛЕДУЮЩАЯ ЛЮБИМАЯ ИСТОРИЯ</span><h2>Что будем смотреть?</h2><p>Найдите аниме и сохраните его для себя.</p></div>
    <label className="catalog-search"><Search size={21} /><input data-autofocus value={query} maxLength={200} onChange={e => changeQuery(e.target.value)} placeholder="Название на русском, английском или японском" aria-label="Название аниме для поиска" />{loading && <LoaderCircle className="spin" size={20} />}</label>
    <div className="search-results" aria-live="polite" aria-busy={loading}>
      {loading ? <div className="search-skeletons">{Array.from({ length: 4 }, (_, i) => <div className="search-skeleton" key={i}><div className="skeleton" /><span className="skeleton" /></div>)}</div>
        : error ? <div className="search-state"><SearchX size={30} /><p>{error}</p><button className="button secondary" onClick={() => { setError(''); setLoading(true); setAttempt(a => a + 1); }}>Попробовать снова</button></div>
        : query.trim().length < 2 ? <div className="search-state"><Search size={30} strokeWidth={1.2} /><p>Кажется, вы уже знаете, что ищете.</p><span>Введите хотя бы 2 символа</span><div className="search-suggestions">{['Фрирен', 'Your Name', 'Cowboy Bebop'].map(name => <button key={name} onClick={() => changeQuery(name)}>{name}<Plus size={12} /></button>)}</div></div>
        : results.length === 0 ? <div className="search-state"><SearchX size={30} /><p>Такой истории пока не нашлось</p><span>Попробуйте оригинальное название или другое написание.</span></div>
        : <div className="search-results-list">{results.map(anime => <button className="search-result" key={anime.id} onClick={() => onSelect(anime)} aria-label={`${existingIds.has(anime.id) ? 'Открыть' : 'Добавить'} «${anime.title}»`}><div className="search-result-poster"><Poster src={anime.poster} title={anime.title} /></div><div><h3>{anime.title}</h3><p>{anime.originalTitle}</p><span>{anime.year ?? 'Год неизвестен'} · {anime.format} · {anime.episodes ? `${anime.episodes} эп.` : 'Серии неизвестны'}</span></div><span className={`result-action ${existingIds.has(anime.id) ? 'in-library' : ''}`}>{existingIds.has(anime.id) ? <><Check size={16} /><span>В коллекции</span></> : <Plus size={19} />}</span></button>)}</div>}
    </div><p className="search-attribution">Каталоги AniList и Shikimori · Для поиска нужен интернет</p>
  </Modal>;
}
