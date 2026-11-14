import { motion } from 'motion/react';
import type { ButtonHTMLAttributes, Ref } from 'react';
import type { LibraryEntry } from '../types';
import { Poster } from './Poster';

interface Props {
  anime: LibraryEntry;
  onOpen: () => void;
  index?: number;
  buttonRef?: Ref<HTMLButtonElement>;
  dragProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  sorting?: boolean;
}

export function AnimeCard({ anime, onOpen, index = 0, buttonRef, dragProps, sorting = false }: Props) {
  return <motion.article className="anime-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(index * 0.045, 0.25) }}>
    <button {...dragProps} ref={buttonRef} className="anime-card-button" onClick={onOpen} aria-label={`Открыть «${anime.title}»`} title={anime.title}>
      <motion.div className="poster-wrap" layoutId={sorting ? undefined : `poster-${anime.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
        <Poster src={anime.poster} title={anime.title} />
      </motion.div>
    </button>
  </motion.article>;
}
