import { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import type { Anime } from '../types';
import { searchAnime, apiError } from '../lib/api';
import { AnimeCard } from './AnimeCard';

export function Discover({ onOpen, onSearch }: { onOpen: (anime: Anime) => void; onSearch: () => void }) {
  const [items, setItems] = useState<Anime[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    searchAnime('', controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); }).catch(err => { if (!controller.signal.aborted) setError(apiError(err)); });
    return () => controller.abort();
  }, [attempt]);
  return <section className="discover-section" aria-label="Открыть новые истории"><div className="section-heading"><div><span className="eyebrow">ЗА ПРЕДЕЛАМИ КОЛЛЕКЦИИ</span><h2>Возможно, ваша следующая история</h2></div><button className="text-button" onClick={onSearch}>Найти своё<ArrowUpRight size={16} /></button></div>
    {error ? <div className="catalog-error"><p>{error}</p><button className="text-button" onClick={() => { setError(''); setAttempt(a => a + 1); }}><RefreshCw size={14} />Повторить</button></div> : items.length ? <div className="anime-grid discovery-grid">{items.map((anime, index) => <AnimeCard key={anime.id} anime={anime} discovery index={index} onOpen={() => onOpen(anime)} />)}</div> : <div className="anime-grid" aria-label="Загрузка каталога" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <div className="card-skeleton" key={i}><div className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}</div>}
  </section>;
}
