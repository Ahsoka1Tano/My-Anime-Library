export type WatchStatus = 'planned' | 'watching' | 'completed';
export type Filter = 'all' | WatchStatus;
export type Sort = 'added' | 'title' | 'rating';

export interface Anime {
  id: number;
  title: string;
  originalTitle: string;
  poster: string;
  year: number | null;
  genres: string[];
  episodes: number | null;
  synopsis: string;
  format: string;
}

export interface LibraryEntry extends Anime {
  status: WatchStatus;
  progress: number;
  rating: number | null;
  review: string;
  addedAt: string;
  updatedAt: string;
}

export interface LibraryData {
  version: 1;
  entries: LibraryEntry[];
}

export const STATUS_LABELS: Record<WatchStatus, string> = {
  planned: 'Хочу посмотреть', watching: 'Смотрю', completed: 'Просмотрено',
};

export function createEntry(anime: Anime): LibraryEntry {
  const now = new Date().toISOString();
  return { ...anime, status: 'planned', progress: 0, rating: null, review: '', addedAt: now, updatedAt: now };
}

export function updateEntry(entry: LibraryEntry, patch: Partial<Pick<LibraryEntry, 'status' | 'progress' | 'rating' | 'review'>>): LibraryEntry {
  const next = { ...entry, ...patch, updatedAt: new Date().toISOString() };
  if (next.status === 'planned') next.progress = 0;
  else if (patch.status === 'completed' && next.episodes !== null) next.progress = next.episodes;
  next.progress = Math.max(0, Math.min(Math.floor(next.progress), next.episodes ?? 100000));
  return next;
}
