import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root = 'generated-images/activity-completion-20261013',
  read = (p) => JSON.parse(fs.readFileSync(p)),
  save = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));
async function api(route, body) {
  const r = await fetch('https://www.tangobook.co.kr/api' + route, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  assert(r.ok && j.success, route);
  return j.data;
}
const specs = [
  { id: 'changjak-bung-23', word: '나무', en: 'wood', token: 'wood', old: 'cw-bung-02d9ca46d7-23' },
  {
    id: 'changjak-mei-06',
    word: '가위',
    en: 'scissors gesture',
    token: 'scissors-gesture',
    old: 'cw-mei-44d1d4a14f-06',
  },
  {
    id: 'changjak-mei-06',
    word: '바위',
    en: 'rock gesture',
    token: 'rock-gesture',
    old: 'cw-mei-198fd82a97-06',
  },
];
const evidence = [];
const proxy = (u) => '/api/r2-proxy?key=' + encodeURIComponent(new URL(u).pathname.slice(1));
const pub = 'packages/client/public',
  manifest = read(pub + '/coloring/manifest.json'),
  plan = read(pub + '/coloring-plan-data.json');
for (const id of new Set(specs.map((s) => s.id))) {
  const before = await api('/storybooks/' + id),
    desired = structuredClone(before);
  if (!fs.existsSync(root + '/semantic/' + id + '-before.json'))
    save(root + '/semantic/' + id + '-before.json', before);
  for (const s of specs.filter((s) => s.id === id)) {
    const upload = async (type, ext, folder) => {
      const bytes = fs.readFileSync(root + '/semantic/' + s.token + '-' + type + '.' + ext),
        key = 'activity-20261013-' + s.token;
      const { url } = await api('/comic-assets/' + folder, {
        key,
        dataUrl: 'data:image/' + ext + ';base64,' + bytes.toString('base64'),
      });
      const u = new URL(url);
      if (u.hostname.endsWith('.r2.dev')) u.hostname = 'assets.tangobook.co.kr';
      const r = await fetch(u);
      assert(r.ok);
      assert.equal(
        crypto
          .createHash('sha256')
          .update(Buffer.from(await r.arrayBuffer()))
          .digest('hex'),
        crypto.createHash('sha256').update(bytes).digest('hex')
      );
      return u.href;
    };
    const image = await upload('color', 'webp', 'activity-words'),
      lineart = await upload('lineart', 'png', 'coloring-plan');
    desired.key_objects.find((k) => k.name === s.word).nameEn = s.en;
    desired.keyObjectImages.find((k) => k.objectName === s.word).imageUrl = image;
    const item = manifest.find((m) => m.key === s.old);
    assert(item);
    item.lineartUrl = proxy(lineart);
    item.originalUrl = proxy(image);
    let count = 0;
    for (const g of plan.groups)
      for (const sec of g.sections)
        for (const item of sec.items) {
          if (item.bookId === id && item.word === s.word) {
            item.key = 'activity-20261013-' + s.token;
            item.imageUrl = image;
            count++;
          }
        }
    assert(count > 0);
    evidence.push({ ...s, image, lineart, review: 'pass' });
  }
  assert.deepEqual(await api('/storybooks/' + id), before);
  await api('/storybooks', { storybook: desired });
  const got = await api('/storybooks/' + id);
  for (const k of Object.keys(desired).filter((k) => k !== 'updatedAt'))
    assert.deepEqual(got[k], desired[k]);
  await api('/vocabulary-db/sync', { storybookId: id });
  console.log('VERIFIED', id);
}
fs.writeFileSync(pub + '/coloring/manifest.json', JSON.stringify(manifest));
save(pub + '/coloring-plan-data.json', plan);
save(root + '/semantic/registration.json', evidence);
