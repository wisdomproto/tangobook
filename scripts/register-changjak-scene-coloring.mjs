/** Register requested series; held scenes remain unavailable until final review. */
import fs from 'node:fs/promises';
const inventory = JSON.parse(
  await fs.readFile('D:/ComfyUI-output/classic-scene-coloring/changjak-2-10/book-list.json', 'utf8')
);
const file = new URL('./scene-coloring-collections.json', import.meta.url);
const collections = JSON.parse(await fs.readFile(file, 'utf8'));
for (const category of [...new Set(inventory.map((book) => book.category))].sort()) {
  const id = inventory
    .find((book) => book.category === category)
    .id.split('-')
    .slice(0, 2)
    .join('-');
  if (!collections.some((collection) => collection.id === id))
    collections.push({
      id,
      label: `창작동화 ${Number(category.slice(0, 2))} · ${category.split('. ')[1]}`,
      directory: id,
      categories: [category],
    });
}
await fs.writeFile(file, JSON.stringify(collections, null, 2) + '\n');
const galleryFile = new URL('./classic-scene-coloring-gallery.html', import.meta.url);
let gallery = await fs.readFile(galleryFile, 'utf8');
const tabs = collections
  .map(
    (collection) =>
      `<button id="${collection.id}-tab" role="tab" aria-selected="${collection.id === 'classic'}">${collection.label}</button>`
  )
  .join('');
gallery = gallery.replace(/(<div role="tablist"[^>]*>).*?(<\/div><\/header>)/, `$1${tabs}$2`);
gallery = gallery.replace(
  /const collections=\[[^;]*\];/,
  `const collections=${JSON.stringify(collections.map((collection) => collection.id))};`
);
await fs.writeFile(galleryFile, gallery);
console.log(`Registered ${collections.length} collections`);
