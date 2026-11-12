import { describe, expect, it } from 'vitest';
import { createEntry, updateEntry } from '../types';
import type { Anime } from '../types';
import { mergeLibraries, parseLibrary, serializeLibrary } from './storage';

const anime: Anime = { id: 52991, title: 'Фрирен', originalTitle: '葬送のフリーレン', poster: 'https://example.com/poster.jpg', year: 2023, genres: ['Фэнтези'], episodes: 28, synopsis: 'История', format: 'Сериал' };
const entry = createEntry(anime);
const encode = (data: unknown) => JSON.stringify({ version: 1, entries: [data] });

describe('Прогресс и переходы статусов', () => {
  it('ограничивает прогресс диапазоном эпизодов', () => {
    const watching = updateEntry(entry, { status: 'watching' });
    expect(updateEntry(watching, { progress: -5 }).progress).toBe(0);
    expect(updateEntry(watching, { progress: 999 }).progress).toBe(28);
    expect(updateEntry(watching, { progress: 7.9 }).progress).toBe(7);
  });
  it('сохраняет оценку и отзыв при смене статусов', () => {
    const personal = updateEntry(entry, { status: 'watching', progress: 7, rating: 9, review: 'Любимая история' });
    const completed = updateEntry(personal, { status: 'completed' });
    expect(completed.progress).toBe(28);
    const back = updateEntry(completed, { status: 'watching' });
    expect(back.progress).toBe(28);
    expect(updateEntry(back, { progress: 27 }).progress).toBe(27);
    const planned = updateEntry(back, { status: 'planned' });
    expect(planned.progress).toBe(0);
    expect(planned.rating).toBe(9);
    expect(planned.review).toBe('Любимая история');
  });
  it('не выдумывает общее количество эпизодов', () => {
    const unknown = createEntry({ ...anime, episodes: null });
    const watching = updateEntry(unknown, { status: 'watching', progress: 13 });
    expect(updateEntry(watching, { status: 'completed' }).progress).toBe(13);
    expect(watching.episodes).toBeNull();
  });
});

describe('Импорт и экспорт', () => {
  it('восстанавливает полный экспорт без потерь', () => {
    const personal = updateEntry(entry, { status: 'watching', progress: 8, rating: 10, review: 'Многострочный\nотзыв' });
    expect(parseLibrary(serializeLibrary([personal])).entries).toEqual([personal]);
  });
  it.each([
    ['неизвестная версия', '{"version":2,"entries":[]}'],
    ['повреждённый JSON', '{'],
    ['дубли', JSON.stringify({ version: 1, entries: [entry, entry] })],
    ['недопустимый URL', encode({ ...entry, poster: 'javascript:alert(1)' })],
    ['оценка за диапазоном', encode({ ...entry, rating: 11 })],
    ['отрицательный прогресс', encode({ ...entry, progress: -1 })],
    ['дробный прогресс', encode({ ...entry, status: 'watching', progress: 1.5 })],
    ['прогресс выше максимума', encode({ ...entry, status: 'watching', progress: 29 })],
    ['просмотрено с неполным прогрессом', encode({ ...entry, status: 'completed', progress: 3 })],
    ['некорректная дата', encode({ ...entry, updatedAt: 'не дата' })],
    ['неизвестный статус', encode({ ...entry, status: 'dropped' })],
  ])('отклоняет файл: %s', (_, json) => { expect(() => parseLibrary(json)).toThrow(); });
  it('при объединении выбирает свежую запись и сохраняет отсутствующие', () => {
    const old = { ...entry, updatedAt: '2025-01-01T00:00:00Z' };
    const fresh = { ...entry, rating: 9, updatedAt: '2026-01-01T00:00:00Z' };
    const second = { ...entry, id: 1 };
    expect(mergeLibraries([old, second], [fresh])).toEqual([fresh, second]);
    expect(mergeLibraries([fresh], [old])).toEqual([fresh]);
  });
  it('не принимает файл частично, если одна запись повреждена', () => {
    expect(() => parseLibrary(JSON.stringify({ version: 1, entries: [entry, { ...entry, id: 2, rating: 0 }] }))).toThrow();
  });
});
