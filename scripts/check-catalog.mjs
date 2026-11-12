// Optional live smoke check. Personal library data is never sent.
const cases = [
  {
    name: 'AniList: английский поиск', url: 'https://graphql.anilist.co',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query($search: String) { Page(perPage: 2) { media(type: ANIME, search: $search, isAdult: false) { idMal title { romaji } } } }', variables: { search: 'Frieren' } }),
    extract: data => data.Page.media,
  },
  {
    name: 'Shikimori: русский поиск', url: 'https://shikimori.io/api/graphql',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ query: 'query($search: String!) { animes(search: $search, limit: 2, censored: true) { malId russian } }', variables: JSON.stringify({ search: 'Фрирен' }) }),
    extract: data => data.animes,
  },
];
for (const test of cases) {
  try {
    const response = await fetch(test.url, { method: 'POST', headers: { ...test.headers, Origin: 'http://127.0.0.1:5174' }, body: test.body, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || result.errors || !result.data || !test.extract(result.data).length) throw new Error(`HTTP ${response.status}: нет корректных результатов`);
    console.log(`OK ${test.name}: ${test.extract(result.data).length} результатов, CORS ${response.headers.get('access-control-allow-origin')}`);
  } catch (error) { console.error(`FAIL ${test.name}: ${error.message}`); process.exitCode = 1; }
  await new Promise(resolve => setTimeout(resolve, 1100));
}
