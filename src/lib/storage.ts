import type { LibraryData, LibraryEntry } from '../types';

export const STORAGE_KEY = 'my-anime-library:v1';
const MAX_ENTRIES = 5000;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const integer = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const date = (value: unknown) => text(value, 40) && Number.isFinite(Date.parse(value));

function validEntry(value: unknown): value is LibraryEntry {
  if (!isRecord(value)) return false;
  let posterValid = value.poster === '';
  if (text(value.poster, 3000) && value.poster) {
    try { posterValid = ['https:', 'http:'].includes(new URL(value.poster).protocol); } catch { return false; }
  }
  return integer(value.id, 1) && text(value.title, 500) && value.title.trim().length > 0
    && text(value.originalTitle, 500) && posterValid
    && (value.year === null || integer(value.year, 1900, 2200))
    && Array.isArray(value.genres) && value.genres.length <= 30 && value.genres.every(g => text(g, 100))
    && (value.episodes === null || integer(value.episodes, 1, 100000))
    && text(value.synopsis, 30000) && text(value.format, 50)
    && ['planned', 'watching', 'completed'].includes(String(value.status))
    && integer(value.progress, 0, typeof value.episodes === 'number' ? value.episodes : 100000)
    && (value.status !== 'planned' || value.progress === 0)
    && (value.status !== 'completed' || value.episodes === null || value.progress === value.episodes)
    && (value.rating === null || integer(value.rating, 1, 10))
    && text(value.review, 10000) && date(value.addedAt) && date(value.updatedAt);
}

export function parseLibrary(json: string): LibraryData {
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new Error('Файл не является корректным JSON.'); }
  if (!isRecord(data) || data.version !== 1) throw new Error('Неизвестная версия файла. Нужен экспорт My Anime Library версии 1.');
  if (!Array.isArray(data.entries) || data.entries.length > MAX_ENTRIES || !data.entries.every(validEntry)) {
    throw new Error('Структура коллекции повреждена. Проверьте поля, статусы, оценки и прогресс.');
  }
  if (new Set(data.entries.map(entry => entry.id)).size !== data.entries.length) throw new Error('В файле найдены повторяющиеся ID аниме.');
  // Copy only known fields: imported objects never become application configuration.
  return { version: 1, entries: data.entries.map(entry => ({
    id: entry.id, title: entry.title, originalTitle: entry.originalTitle, poster: entry.poster,
    year: entry.year, genres: [...entry.genres], episodes: entry.episodes, synopsis: entry.synopsis,
    format: entry.format, status: entry.status, progress: entry.progress, rating: entry.rating,
    review: entry.review, addedAt: entry.addedAt, updatedAt: entry.updatedAt,
  })) };
}

export interface LibraryRepository {
  load(): LibraryEntry[];
  save(entries: LibraryEntry[]): void;
}

export const localLibraryRepository: LibraryRepository = {
  load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? [] : parseLibrary(stored).entries;
  },
  save(entries) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries } satisfies LibraryData)); },
};

export function serializeLibrary(entries: LibraryEntry[]): string {
  return JSON.stringify({ version: 1, entries } satisfies LibraryData, null, 2);
}

export function mergeLibraries(current: LibraryEntry[], incoming: LibraryEntry[]): LibraryEntry[] {
  const result = new Map(current.map(entry => [entry.id, entry]));
  for (const entry of incoming) {
    const existing = result.get(entry.id);
    if (!existing || Date.parse(entry.updatedAt) > Date.parse(existing.updatedAt)) result.set(entry.id, entry);
  }
  return [...result.values()];
}
