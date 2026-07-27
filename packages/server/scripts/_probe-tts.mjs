import { loadEnv, getStorybook } from './translation-core.mjs';
loadEnv();
for (const id of ['kr-h1-u02','kr-h2-u01','en-b2-u01']) {
  const sb = await getStorybook(id);
  const cards = (sb.flashcards ?? []).slice(0,4);
  console.log(`\n=== ${id} (flashcards ${sb.flashcards?.length ?? 0}) ===`);
  for (const c of cards) console.log(`  ${c.word}  img=${c.imageUrl?'Y':'-'}  ttsUrl=${c.ttsUrl ? 'Y' : '❌ 없음'}`);
}
