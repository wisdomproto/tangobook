import fs from 'node:fs';
const catalog = JSON.parse(
  fs.readFileSync('packages/client/src/features/games/data/scene-coloring-catalog.json')
);
const books = JSON.parse(fs.readFileSync(process.argv[2] + '/books.json'));
const byId = new Map(books.map((b) => [b.id, b]));
const index = Object.fromEntries(
  Object.entries(catalog).map(([id, scenes]) => [
    id,
    Object.fromEntries(
      ['ko', 'en', 'vi', 'zh', 'th'].map((lang) => [
        lang,
        scenes.filter((s) => {
          const p = byId
            .get(id)
            ?.pages?.find((p, i) => (p.pageNumber ?? p.page_number ?? i + 1) === s.pageNumber);
          return lang === 'ko'
            ? (p ?? s).text
            : (p?.translations?.[lang] ?? s.translations?.[lang])?.text;
        }).length,
      ])
    ),
  ])
);
fs.mkdirSync('packages/client/public/scene-coloring', { recursive: true });
fs.writeFileSync('packages/client/public/scene-coloring/book-index.json', JSON.stringify(index));
