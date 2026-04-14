import 'dotenv/config';
import { R2Repository } from '../repositories/r2.repository.js';

(async () => {
  const keyword = process.argv[2];
  if (!keyword) {
    console.error('Usage: tsx find-storybook.ts <keyword>');
    process.exit(1);
  }
  const list = await R2Repository.listStorybooks();
  console.log('total storybooks:', list.length);
  const matches = list.filter((s) => s.title && s.title.includes(keyword));
  console.log(`matches for "${keyword}":`, matches.length);
  for (const m of matches) {
    console.log(`  ${m.id} | ${m.title} | ${m.pageCount} pages | ${m.type}`);
  }
})();
