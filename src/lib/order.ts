import type { LibraryEntry } from '../types';

// Array order is the saved display order, including JSON exports and imports.
export function reorderEntries(entries: LibraryEntry[], activeId: number, overId: number): LibraryEntry[] {
  const from = entries.findIndex(entry => entry.id === activeId);
  const to = entries.findIndex(entry => entry.id === overId);
  if (from < 0 || to < 0 || from === to) return entries;
  const next = [...entries];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
