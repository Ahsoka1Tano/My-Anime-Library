import type { Anime } from '../types';

interface AniListMedia {
  idMal: number | null;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string }; startDate: { year: number | null };
  genres: string[]; episodes: number | null; description: string | null; format: string | null;
}
interface ShikiMedia {
  malId: string | null; name: string; russian: string; poster: { originalUrl: string } | null;
  airedOn: { year: number } | null; genres: { name: string; russian: string }[];
  episodes: number; description: string | null; kind: string;
}
const genreNames: Record<string, string> = {
  Action: 'Экшен', Adventure: 'Приключения', Comedy: 'Комедия', Drama: 'Драма', Fantasy: 'Фэнтези',
  Romance: 'Романтика', 'Sci-Fi': 'Фантастика', 'Slice of Life': 'Повседневность', Mystery: 'Тайна',
  Supernatural: 'Сверхъестественное', Thriller: 'Триллер', Sports: 'Спорт', Psychological: 'Психология',
  Horror: 'Ужасы', Music: 'Музыка', Mecha: 'Меха', Ecchi: 'Этти', 'Mahou Shoujo': 'Махо-сёдзё',
};
const formats: Record<string, string> = { TV: 'Сериал', MOVIE: 'Фильм', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Спецвыпуск', TV_SHORT: 'Короткий сериал', MUSIC: 'Клип', tv: 'Сериал', movie: 'Фильм' };
const clean = (value: string | null) => (value || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\[\/?[^\]]+\]/g, '').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&amp;/g, '&').trim();
const mediaFields = 'idMal title { romaji english native } coverImage { extraLarge } startDate { year } genres episodes description format';

function fromAniList(a: AniListMedia): Anime {
  return { id: a.idMal!, title: a.title.english || a.title.romaji, originalTitle: a.title.native || a.title.romaji,
    poster: a.coverImage.extraLarge || '', year: a.startDate.year,
    genres: a.genres.map(g => genreNames[g] || g), episodes: a.episodes && a.episodes > 0 ? a.episodes : null,
    synopsis: clean(a.description), format: formats[a.format || ''] || 'Аниме' };
}

let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;
const cache = new Map<string, { time: number; data: Anime[] }>();
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function request<T>(url: string, query: string, variables: Record<string, unknown>, signal: AbortSignal): Promise<T> {
  const task = queue.catch(() => {}).then(async () => {
    signal.throwIfAborted();
    await delay(Math.max(0, 1100 - (Date.now() - lastRequest)));
    signal.throwIfAborted();
    for (let attempt = 0; attempt < 2; attempt++) {
      lastRequest = Date.now();
      const shikimori = url.includes('shikimori');
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': shikimori ? 'application/x-www-form-urlencoded' : 'application/json', Accept: 'application/json' }, body: shikimori ? new URLSearchParams({ query, variables: JSON.stringify(variables) }) : JSON.stringify({ query, variables }), signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
      if (response.status === 429 && attempt === 0) {
        await delay(Math.min(10000, Math.max(2000, Number(response.headers.get('Retry-After') || 2) * 1000)));
        continue;
      }
      if (!response.ok) throw new Error(response.status === 429 ? 'Каталог просит немного подождать. Повторите поиск через минуту.' : 'Каталог временно недоступен. Попробуйте ещё раз чуть позже.');
      const result = await response.json() as { data?: T; errors?: { message: string }[] };
      if (result.errors?.length || !result.data) throw new Error('Каталог не смог обработать запрос. Попробуйте другое название.');
      return result.data;
    }
    throw new Error('Не удалось получить ответ каталога.');
  });
  queue = task;
  return task;
}

export async function searchAnime(query: string, signal: AbortSignal): Promise<Anime[]> {
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < 300000) return cached.data;
  let data: Anime[];
  if (/[а-яё]/i.test(key)) {
    const results = await request<{ animes: ShikiMedia[] }>('https://shikimori.io/api/graphql',
      'query($search: String!) { animes(search: $search, limit: 18, censored: true) { malId name russian poster { originalUrl } airedOn { year } genres { name russian } episodes description kind } }', { search: query }, signal);
    data = results.animes.filter(a => a.malId && Number(a.malId) > 0).map(a => ({
      id: Number(a.malId), title: a.russian || a.name, originalTitle: a.name, poster: a.poster?.originalUrl || '',
      year: a.airedOn?.year || null, genres: a.genres.map(g => g.russian || g.name), episodes: a.episodes || null,
      synopsis: clean(a.description), format: formats[a.kind] || 'Аниме',
    }));
  } else {
    const results = await request<{ Page: { media: AniListMedia[] } }>('https://graphql.anilist.co',
      `query($search: String) { Page(perPage: ${key ? 18 : 6}) { media(type: ANIME, search: $search, sort: ${key ? 'SEARCH_MATCH' : 'FAVOURITES_DESC'}, isAdult: false) { ${mediaFields} } } }`, { search: key ? query : null }, signal);
    data = results.Page.media.filter(a => a.idMal).map(fromAniList);
  }
  data = [...new Map(data.map(a => [a.id, a])).values()];
  cache.set(key, { time: Date.now(), data });
  return data;
}

export function apiError(error: unknown): string {
  if (error instanceof Error && error.name === 'TimeoutError') return 'Каталог отвечает слишком долго. Попробуйте ещё раз.';
  if (error instanceof TypeError) return 'Не удалось связаться с каталогом. Проверьте интернет или попробуйте английское название.';
  return error instanceof Error ? error.message : 'Не удалось загрузить аниме. Попробуйте ещё раз.';
}
