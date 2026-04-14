import 'dotenv/config';
import { R2Repository } from '../repositories/r2.repository.js';
import { walkAndCollect, makeExtensionMatcher } from '../utils/url-walker.js';

(async () => {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: tsx check-storybook-urls.ts <storybookId>');
    process.exit(1);
  }
  const sb = await R2Repository.getStorybook(id);
  if (!sb) {
    console.error('Not found');
    process.exit(1);
  }
  const all = walkAndCollect(
    sb,
    makeExtensionMatcher(['wav', 'png', 'mp3', 'webp', 'jpg', 'jpeg'])
  );
  const counts = { wav: 0, png: 0, mp3: 0, webp: 0, other: 0 };
  for (const { url } of all) {
    if (/\.wav(\?|$)/i.test(url)) counts.wav++;
    else if (/\.png(\?|$)/i.test(url)) counts.png++;
    else if (/\.mp3(\?|$)/i.test(url)) counts.mp3++;
    else if (/\.webp(\?|$)/i.test(url)) counts.webp++;
    else counts.other++;
  }
  console.log(`Title: ${sb.title}`);
  console.log(`Total URLs: ${all.length}`);
  console.log(counts);
  console.log('\nSample URLs:');
  for (const { url, path } of all.slice(0, 3)) {
    console.log(`  ${path}: ${url}`);
  }
})();
