import { Check, Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { Anime, LibraryEntry } from '../types';
import { STATUS_LABELS } from '../types';
import { Poster } from './Poster';

export function AnimeCard({ anime, onOpen, discovery = false, index = 0 }: { anime: Anime | LibraryEntry; onOpen: () => void; discovery?: boolean; index?: number }) {
  const entry = 'status' in anime ? anime : null;
  return <motion.article className="anime-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(index * 0.045, 0.25) }}>
    <button className="anime-card-button" onClick={onOpen} aria-label={`${discovery ? 'Подробнее об аниме' : 'Открыть'} «${anime.title}»`}>
      <motion.div className="poster-wrap" layoutId={`poster-${anime.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <Poster src={anime.poster} title={anime.title} />
        <div className="poster-shade" />
        {entry?.rating && <span className="rating-badge"><Star size={11} fill="currentColor" />{entry.rating}<span>/ 10</span></span>}
        <span className="poster-open">{discovery ? <Plus size={21} /> : <BookMark />}</span>
        {entry?.status === 'watching' && <div className="poster-progress"><span style={{ width: `${entry.episodes ? entry.progress / entry.episodes * 100 : 0}%` }} /></div>}
      </motion.div>
      <div className="card-title-row"><h3>{anime.title}</h3>{entry?.status === 'completed' && <Check size={14} className="completed-check" />}</div>
      <div className="card-meta">{entry ? <><span className={`status-dot ${entry.status}`} /><span>{STATUS_LABELS[entry.status]}</span>{entry.status === 'watching' && <span className="card-episodes">{entry.progress} / {entry.episodes ?? '?'}</span>}</> : <><span>{anime.year ?? 'Год неизвестен'}</span><span className="meta-dot">·</span><span>{anime.format}</span></>}</div>
    </button>
  </motion.article>;
}
function BookMark() { return <span className="open-caption">Открыть историю ↗</span>; }
