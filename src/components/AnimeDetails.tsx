import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { Anime, LibraryEntry } from '../types';
import { Modal } from './Modal';
import { Poster } from './Poster';
import { StatusSelector } from './StatusSelector';
import { RatingSelector } from './RatingSelector';
import { EpisodeProgress } from './EpisodeProgress';

interface Props { anime: Anime | LibraryEntry; onClose: () => void; onAdd: (anime: Anime) => void; onUpdate: (patch: Partial<Pick<LibraryEntry, 'status' | 'progress' | 'rating' | 'review'>>) => void; onDelete: () => void; saved: boolean }
export function AnimeDetails({ anime, onClose, onAdd, onUpdate, onDelete, saved }: Props) {
  const entry = 'status' in anime ? anime : null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return <Modal label={`История: ${anime.title}`} onClose={onClose} className="details-modal">
    <div className="details-layout">
      <aside className="details-aside"><motion.div layoutId={`poster-${anime.id}`} className="details-poster" transition={{ type: 'spring', stiffness: 260, damping: 30 }}><Poster src={anime.poster} title={anime.title} eager /></motion.div><a className="catalog-link" href={`https://myanimelist.net/anime/${anime.id}`} target="_blank" rel="noreferrer">В каталоге MyAnimeList<ExternalLink size={12} /></a></aside>
      <motion.div className="details-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
        <h2>{anime.title}</h2>{anime.originalTitle !== anime.title && <p className="original-title">{anime.originalTitle}</p>}
        <div className="details-meta"><span>{anime.year ?? 'Год не указан'}</span><span>·</span><span>{anime.format}</span><span>·</span><span>{anime.episodes ? `${anime.episodes} эп.` : 'Число серий неизвестно'}</span></div>
        <div className="genre-list">{anime.genres.map(genre => <span key={genre}>{genre}</span>)}</div>
        {anime.synopsis && <div className="synopsis"><p className={expanded ? '' : 'collapsed'}>{anime.synopsis}</p>{anime.synopsis.length > 220 && <button className="text-button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Свернуть описание' : 'Читать описание'}</button>}</div>}
        {entry ? <div className="personal-fields"><div><StatusSelector value={entry.status} onChange={status => onUpdate({ status })} /></div>
          {entry.status === 'watching' && <EpisodeProgress value={entry.progress} total={entry.episodes} onChange={progress => onUpdate({ progress })} />}
          {entry.status === 'completed' && <div className="finished-note"><Check size={15} />История просмотрена{entry.episodes ? ` · ${entry.episodes} эпизодов` : ''}</div>}
          <div><span className="field-label">Оценка</span><RatingSelector value={entry.rating} onChange={rating => onUpdate({ rating })} /></div>
          <div><label className="sr-only" htmlFor="personal-review">Отзыв</label><textarea id="personal-review" rows={3} maxLength={10000} value={entry.review} onChange={e => onUpdate({ review: e.target.value })} placeholder="Отзыв" /></div>
          <div className="details-footer"><span className={`save-note ${saved ? '' : 'unsaved'}`}><span className="status-dot" />{saved ? 'Изменения сохранены' : 'Не сохранено · сделайте экспорт'}</span><button className="icon-button delete-button" onClick={() => setConfirmDelete(true)} aria-label="Удалить аниме из коллекции"><Trash2 size={16} /></button></div>
          {confirmDelete && <div className="delete-confirm" role="alert"><p>Удалить «{anime.title}» вместе с оценкой и отзывом?</p><div><button className="button secondary" onClick={() => setConfirmDelete(false)}>Оставить</button><button className="button danger" onClick={onDelete}>Удалить</button></div></div>}
        </div> : <div className="preview-add"><button className="button primary" onClick={() => onAdd(anime)}><Plus size={17} />Добавить</button></div>}
      </motion.div>
    </div>
  </Modal>;
}
