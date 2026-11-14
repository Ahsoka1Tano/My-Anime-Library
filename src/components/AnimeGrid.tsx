import type { LibraryEntry } from '../types';
import { Plus } from 'lucide-react';
import { AnimeCard } from './AnimeCard';

export function AnimeGrid({ entries, onOpen, onAdd }: { entries: LibraryEntry[]; onOpen: (id: number) => void; onAdd: () => void }) {
  return <div className="anime-grid">
    {entries.map((entry, index) => <AnimeCard key={entry.id} anime={entry} index={index} onOpen={() => onOpen(entry.id)} />)}
    <button className="add-tile" onClick={onAdd} aria-label="Добавить аниме" title="Добавить аниме"><Plus size={30} strokeWidth={1.2} /></button>
  </div>;
}
