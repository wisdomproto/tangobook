// Publish the deck with deduplicated, content-addressed assets instead of data URLs.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const imagePattern = /data:image\/([\w.+-]+);base64,([A-Za-z0-9+/=]+)/g;

module.exports = async function publishAssets(html, publicDir) {
  const directory = path.join(publicDir, 'business-plan-assets');
  fs.mkdirSync(directory, { recursive: true });
  const cache = new Map();
  async function optimize(uri) {
    if (cache.has(uri)) return cache.get(uri);
    const work = (async () => {
      const match = /^data:image\/([\w.+-]+);base64,(.*)$/.exec(uri);
      let data = Buffer.from(match[2], 'base64');
      let type = match[1];
      if (type === 'svg+xml') {
        // SVG loaded as an image cannot fetch external dependencies. Keep its
        // vector text and embedded pictures, but compress those pictures too.
        let svg = data.toString('utf8');
        for (const nested of new Set([...svg.matchAll(imagePattern)].map(m => m[0]))) {
          const asset = await optimize(nested);
          svg = svg.split(nested).join(`data:image/${asset.type};base64,${asset.data.toString('base64')}`);
        }
        data = Buffer.from(svg);
      } else if (['png', 'jpeg', 'jpg', 'webp'].includes(type)) {
        const compressed = await sharp(data).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88, effort: 5 }).toBuffer();
        if (compressed.length < data.length) { data = compressed; type = 'webp'; }
      }
      return { data, type };
    })();
    cache.set(uri, work);
    return work;
  }
  function save(data, extension) {
    const name = createHash('sha256').update(data).digest('hex').slice(0, 20) + '.' + extension;
    const destination = path.join(directory, name);
    if (!fs.existsSync(destination)) fs.writeFileSync(destination, data);
    return 'business-plan-assets/' + name;
  }
  for (const uri of new Set([...html.matchAll(imagePattern)].map(m => m[0]))) {
    const { data, type } = await optimize(uri);
    html = html.split(uri).join(save(data, type === 'svg+xml' ? 'svg' : type === 'jpeg' ? 'jpg' : type));
  }
  // The Korean font is also shared by the responsive and full-view styles.
  for (const match of [...html.matchAll(/data:font\/(otf|ttf|woff2?);base64,([A-Za-z0-9+/=]+)/g)]) {
    html = html.split(match[0]).join(save(Buffer.from(match[2], 'base64'), match[1]));
  }
  let first = true;
  html = html.replace(/<img\b[^>]*>/g, tag => {
    const priority = first ? 'eager" fetchpriority="high' : 'lazy';
    first = false;
    return tag.replace(/\s(?:loading|decoding|fetchpriority)="[^"]*"/g, '').replace('<img', `<img loading="${priority}" decoding="async"`);
  });
  return html;
};
