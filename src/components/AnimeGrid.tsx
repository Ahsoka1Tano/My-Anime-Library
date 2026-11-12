import type { LibraryEntry } from '../types';
import { AnimeCard } from './AnimeCard';

export function AnimeGrid({ entries, onOpen }: { entries: LibraryEntry[]; onOpen: (id: number) => void }) {
  return <div className="anime-grid">{entries.map((entry, index) => <AnimeCard key={entry.id} anime={entry} index={index} onOpen={() => onOpen(entry.id)} />)}</div>;
}
