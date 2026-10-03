import fs from 'node:fs';
import crypto from 'node:crypto';
import { root, later } from './changjak-word-scope.mjs';
if (!later) throw Error('Only --scope=11-19');
const cards = JSON.parse(fs.readFileSync(root + '/cards.json'));
const books = JSON.parse(fs.readFileSync(root + '/books-before.json'));
const manifest = JSON.parse(fs.readFileSync(root + '/jobs.json'));
const corrections = JSON.parse(fs.readFileSync(root + '/corrections.json'));
for (const job of manifest.jobs)
  job.prompt = job.prompt.replace('키키는 기린', '키키는 미어캣, 니아는 기린');
function split(series, ids, variant, keepVariant, lastJob) {
  const old = cards.find((c) => c.series === series && c.word === '꼬리');
  const selected = old.uses.filter((u) => ids.includes(u.bookId));
  const id =
    series +
    '-' +
    crypto
      .createHash('sha256')
      .update('꼬리|' + variant)
      .digest('hex')
      .slice(0, 10);
  if (cards.some((c) => c.id === id)) throw Error('Already refined: ' + id);
  const u = selected[0];
  const context = u.pages
    .map((n) => books[u.bookId].pages.find((p) => p.page_number === n)?.text || '')
    .join(' ');
  cards.push({ ...old, id, variant, context, uses: selected });
  old.uses = old.uses.filter((u) => !ids.includes(u.bookId));
  old.variant = keepVariant;
  manifest.jobs.find((j) => j.id === lastJob).cards.push(id);
  return { old, id, context };
}
const moya = split(
  'moya',
  ['changjak-moya-07', 'changjak-moya-12'],
  'meerkat-tail',
  'warthog-tail',
  'moya-006'
);
const mina = split('mina', ['changjak-mina-36'], 'buffalo-tail', 'goat-tail', 'mina-010');
const minaLast = manifest.jobs.find((j) => j.id === 'mina-010');
minaLast.prompt = minaLast.prompt.replace('나머지 2칸', '나머지 1칸');
minaLast.prompt +=
  '\n칸 5 꼬리: 길을 건너기 전 물소 떼의 마지막 꼬리를 기다리는 본문의 물소 꼬리입니다. 자연스러운 짙은 회색 물소 엉덩이·가는 긴 꼬리·끝 털 술이 보이는 가까운 그림. 코끼리 코/염소 꼬리 아님. ' +
  mina.context;
const minaTailJob = manifest.jobs.find((j) => j.cards.includes(mina.old.id));
minaTailJob.prompt +=
  '\n꼬리 칸은 본문에 등장하는 염소의 짧은 꼬리와 엉덩이가 연결된 그림입니다. 코끼리/물소 꼬리로 바꾸지 않습니다.';
const moyaLast = manifest.jobs.find((j) => j.id === 'moya-006');
moyaLast.prompt = moyaLast.prompt.replace('나머지 3칸', '나머지 2칸');
moyaLast.prompt +=
  '\n칸 4 꼬리: 실제 참조의 황토빛 미어캣 키키의 긴 가는 꼬리와 엉덩이가 연결된 근접 그림. 얼룩말 줄무늬나 멧돼지 꼬리 아님. ' +
  moya.context;
corrections.push({
  id: 'moya-002',
  reason: '첫 본문의 툼바 꼬리를 얼룩말로 생성; 멧돼지 꼬리로 교체',
  prompt:
    '첨부한 현재 3열 2행 카드에서 위 행 가운데(2번) 꼬리 칸만 바꿔 주세요. 두 번째 참조의 황토·주황빛 멧돼지 툼바의 엉덩이와 짧고 가는 꼬리, 끝의 작은 보라색 털 술이 자연스럽게 붙은 근접 그림입니다. 얼룩말 줄무늬를 전부 없애고 멧돼지의 외형을 따릅니다. 다른 다섯 칸, 순서, 정확한 3열 2행 정사각형 칸, 밝은 크림 배경, 투명 수채 질감과 여백은 유지합니다. 글자·숫자·라벨 없음.',
});
corrections.push({
  id: 'moya-006',
  reason: '미어캣 꼬리의 책별 의미를 분리해 빈칸에 추가',
  prompt:
    '첨부한 현재 3열 2행 카드의 첫 세 칸(돌멩이, 씨앗, 개미)은 유지하고, 아래 행 왼쪽(4번) 빈칸에 꼬리 카드를 추가해 주세요. 두 번째 참조 첫 번째 인물인 황토빛 미어캣 키키의 엉덩이와 길고 가는 미어캣 꼬리가 자연스럽게 연결된 근접 그림입니다. 보라 얼룩말 줄무늬나 멧돼지처럼 짧은 꼬리 아님. 아래 행 가운데/오른쪽은 빈 크림색으로 유지합니다. 동일한 3열 2행 정사각형 칸, 밝은 크림 배경, 투명 수채 질감과 여백을 유지합니다. 글자·숫자·라벨 없음.',
});
fs.writeFileSync(root + '/cards.json', JSON.stringify(cards, null, 2));
fs.writeFileSync(root + '/jobs.json', JSON.stringify(manifest, null, 2));
fs.writeFileSync(root + '/corrections.json', JSON.stringify(corrections, null, 2));
const reviews = JSON.parse(fs.readFileSync(root + '/reviews.json'));
delete reviews['moya-002'];
fs.writeFileSync(root + '/reviews.json', JSON.stringify(reviews, null, 2));
console.log(
  cards.length,
  'cards;',
  cards.reduce((n, c) => n + c.uses.length, 0),
  'links'
);
