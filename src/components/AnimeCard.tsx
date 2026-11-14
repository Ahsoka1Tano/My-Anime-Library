import { motion } from 'motion/react';
import type { LibraryEntry } from '../types';
import { Poster } from './Poster';

export function AnimeCard({ anime, onOpen, index = 0 }: { anime: LibraryEntry; onOpen: () => void; index?: number }) {
  return <motion.article className="anime-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(index * 0.045, 0.25) }}>
    <button className="anime-card-button" onClick={onOpen} aria-label={`Открыть «${anime.title}»`} title={anime.title}>
      <motion.div className="poster-wrap" layoutId={`poster-${anime.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <Poster src={anime.poster} title={anime.title} />
      </motion.div>
    </button>
  </motion.article>;
}
