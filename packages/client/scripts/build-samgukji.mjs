#!/usr/bin/env node
/**
 * build-samgukji.mjs — 대본 md(SSOT) → 저작도구 회차 HTML
 *
 *   node packages/client/scripts/build-samgukji.mjs            # 전 권
 *   node packages/client/scripts/build-samgukji.mjs --vol=1     # 한 권만
 *
 * SSOT = docs/samgukji/vol-NN.md   산출 = packages/client/public/samgukji-NN.html
 * 🔴 HTML 을 손으로 고치지 마라 — 다음 빌드에 지워진다.
 * 🔴 index.json 도 여기서 굽는다(대본이 있는 권만 올라간다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SRC = path.join(ROOT, 'docs/samgukji');
const OUT = path.join(ROOT, 'packages/client/public');

// 프롬프트 범례용 짧은 설명. 🔴 전체 시트 규격은 docs/art-direction/samgukji-cast.md 가 SSOT.
const CAST = {
  liubei: { token: 'Liubei', name: '유비', desc: '안 칠한 맨 얼굴 · 이 책에서 가장 큰 귀(윤곽을 깬다) · 허리 양옆 칼 두 자루 · 노란 허리끈 · 6두신. 1권 = 짚신·베옷, 수염 없음.', aliases: ['Liubei', '유비'] },
  guanyu: { token: 'Guanyu', name: '관우', desc: '대추빛 붉은 얼굴(이 책의 유일한 붉은 얼굴) · 가슴까지 오는 긴 수염 한 덩이 · 녹색 · 키보다 긴 자루의 언월도 · 7두신. 1권 = 녹색 평복.', aliases: ['Guanyu', '관우'] },
  zhangfei: { token: 'Zhangfei', name: '장비', desc: '검은 얼굴(이 책의 유일한 검은 얼굴) · 수염이 사방으로 뻗어 얼굴 윤곽이 삐죽삐죽 · 동그란 고리눈 · 뱀처럼 굽은 장팔사모 · 6.5두신. 1권 = 거친 베옷.', aliases: ['Zhangfei', '장비'] },
  zhugeliang: { token: 'Zhugeliang', name: '제갈량', desc: '맨 얼굴에 곧게 다듬은 짧은 턱수염 · 흰 깃털부채 · 이 책에서 무기를 안 든 유일한 어른 · 넓은 학창의 · 6.5두신.', aliases: ['Zhugeliang', '제갈량'] },
  zhaoyun: { token: 'Zhaoyun', name: '조운', desc: '맨 얼굴에 수염 0(장년인데 수염이 없는 유일한 사람) · 은빛 갑옷 · 흰 말 · 투구 꼭대기의 술 한 가닥 · 6.5두신.', aliases: ['Zhaoyun', '조운'] },
  caocao: { token: 'Caocao', name: '조조', desc: '분을 바른 흰 얼굴 · 가늘고 눈꼬리가 올라간 눈 · 한쪽만 올라간 입 · 흑청색 옷깃 · 🔴 머리가 몸의 1/5(5두신).', aliases: ['Caocao', '조조'] },
  sunquan: { token: 'Sunquan', name: '손권', desc: '맨 얼굴에 푸른 눈 · 🔴 자줏빛 수염(이 책의 유일한 색 있는 수염) · 붉은 옷 · 허리에 네모난 인장 주머니 · 6두신.', aliases: ['Sunquan', '손권'] },
  lvbu: { token: 'Lvbu', name: '여포', desc: '광이 있는 옥빛 흰 얼굴 · 수염 0 · 🔴 투구에서 길게 솟은 꿩깃 두 가닥(머리 위로 무언가 솟은 유일한 인물) · 붉은 술 · 붉은 말 · 7두신.', aliases: ['Lvbu', '여포'] },
  dongzhuo: { token: 'Dongzhuo', name: '동탁', desc: '분을 바른 흰 얼굴인데 🔴 살진 얼굴(볼이 눈을 밀어 실눈) + 코의 붉은 기 · 짧고 두툼한 검은 수염 · 🔴 어깨에서 어깨가 가장 넓은 낮은 덩이 · 금붙이 5개 이하 · 5.5두신.', aliases: ['Dongzhuo', '동탁'] },
  simayi: { token: 'Simayi', name: '사마의', desc: '회흑색 얼굴(흰 얼굴과 검은 얼굴 사이) · 늘 반쯤 감은 눈 · 좁고 길게 늘어뜨린 수염 · 소매 안에 넣은 두 손 · 악센트 색 없음 · 6두신.', aliases: ['Simayi', '사마의'] },
  // ── 단역 ──
  zhangjue: { token: 'Zhangjue', name: '장각', desc: '노란 두건을 두른 도인 차림 · 손에 든 지팡이 하나 · 따르는 무리와 같은 노란색이고 지팡이만 다르다.', aliases: ['Zhangjue', '장각'] },
  duyou: { token: 'Duyou', name: '독우', desc: '거들먹거리는 감찰 관리 · 값비싼 관복 · 🔴 말 위에서 든 채찍 하나(예를 갖추지 않았다는 것이 이 채찍으로 읽힌다).', aliases: ['Duyou', '독우'] },
  liuyan: { token: 'Liuyan', name: '유언', desc: '유주를 다스리는 관리 · 단정한 관복 · 배경 인물.', aliases: ['Liuyan', '유언'] },
  sushuang: { token: 'Sushuang', name: '소쌍', desc: '말을 사고파는 상인 · 등에 짐 · 웃는 얼굴 · 장세평과 늘 둘이 함께 다닌다.', aliases: ['Sushuang', '소쌍', '장세평'] },
  childemp: { token: 'ChildEmperor', name: '어린 황제', desc: '열 살 남짓 · 🔴 몸에 비해 너무 큰 옷과 관, 옷자락이 바닥에 끌린다 · 겁먹은 표정.', aliases: ['ChildEmperor', '어린 황제'] },
  hejin: { token: 'Hejin', name: '하진', desc: '황제의 외삼촌 · 덩치 큰 장군 · 짧은 수염 · 갑옷 위 붉은 망토.', aliases: ['Hejin', '하진'] },
  yuanshao: { token: 'Yuanshao', name: '원소', desc: '훤칠한 키 · 잘 손질된 수염 · 화려한 갑옷 · 당당하지만 눈매가 우유부단.', aliases: ['Yuanshao', '원소'] },
  dingyuan: { token: 'Dingyuan', name: '정원', desc: '백발 섞인 강직한 노장 · 낡았지만 단정한 갑옷 · 여포의 양아버지.', aliases: ['Dingyuan', '정원'] },
  chengong: { token: 'Chengong', name: '진궁', desc: '젊고 꼿꼿한 고을 관리 · 푸른 문관복 · 곧은 눈매.', aliases: ['Chengong', '진궁'] },
  xiandi: { token: 'Xiandi', name: '헌제', desc: '2권의 진류왕이 자란 모습 · 열여섯 살 남짓 · 🔴 여전히 옷이 몸보다 크다 · 말하기 전에 늘 남의 얼굴을 먼저 살핀다.', aliases: ['Xiandi', '헌제'] },
  gongsunzan: { token: 'Gongsunzan', name: '공손찬', desc: '유비와 한 스승 밑에서 배운 벗 · 흰 말을 타고 흰 갑옷을 입는다 · 우렁찬 목소리.', aliases: ['Gongsunzan', '공손찬'] },
  yuanshu: { token: 'Yuanshu', name: '원술', desc: '원소의 아우 · 형보다 살졌고 턱을 든 채 말한다 · 화려한 비단옷.', aliases: ['Yuanshu', '원술'] },
  sunjian: { token: 'Sunjian', name: '손견', desc: '강동에서 온 장수 · 🔴 붉은 머릿수건(이 사람의 표지) · 다부진 몸 · 짧은 수염.', aliases: ['Sunjian', '손견'] },
  huaxiong: { token: 'Huaxiong', name: '화웅', desc: '동탁의 앞장 장수 · 얼굴이 검붉고 광대가 튀어나왔다 · 긴 칼 하나 · 투구에 짐승 털.', aliases: ['Huaxiong', '화웅'] },
  diaochan: { token: 'Diaochan', name: '초선', desc: '왕윤의 집에서 자란 젊은 여인 · 🔴 이 책에서 얼굴에 화장을 한 유일한 인물(눈가와 입술) · 옅은 옥색 옷 · 손에 둥근 부채.', aliases: ['Diaochan', '초선'] },
  lijue: { token: 'Lijue', name: '이각', desc: '동탁의 남은 장수 · 눈썹이 없다시피 옅다 · 곽사와 늘 둘이 붙어 다닌다.', aliases: ['Lijue', '이각'] },
  guosi: { token: 'Guosi', name: '곽사', desc: '동탁의 남은 장수 · 이각보다 작고 어깨가 굽었다 · 이각과 늘 둘이 붙어 다닌다.', aliases: ['Guosi', '곽사'] },
  sunce: { token: 'Sunce', name: '손책', desc: '손견의 맏아들 · 아버지의 붉은 머릿수건을 물려 썼다 · 웃는 얼굴의 젊은 장수.', aliases: ['Sunce', '손책'] },
  dianwei: { token: 'Dianwei', name: '전위', desc: '조조를 지키는 거구의 호위 · 🔴 짧은 창 두 자루를 양손에 든다 · 팔뚝이 남달리 굵다.', aliases: ['Dianwei', '전위'] },
  simahui: { token: 'Simahui', name: '수경선생', desc: '융중 산속의 늙은 선비 · 흰 학창의 · 🔴 늘 웃고 있어 눈이 반달이다 · 지팡이 대신 소매에 손을 넣고 다닌다.', aliases: ['Simahui', '수경선생'] },
  xushu: { token: 'Xushu', name: '서서', desc: '유비가 처음 얻은 군사(軍師) · 맨 얼굴에 수염 0 · 소매가 넓은 문관 옷 · 늘 무언가를 세는 손짓.', aliases: ['Xushu', '서서'] },
  liubiao: { token: 'Liubiao', name: '유표', desc: '형주를 다스리는 늙은 종친 · 흰 수염 · 늘 앉아 있고 좀처럼 일어서지 않는다.', aliases: ['Liubiao', '유표'] },
  adou: { token: 'Adou', name: '아두', desc: '유비의 어린 아들 · 강보에 싸인 갓난아기 · 🔴 이 책에서 유일하게 얼굴이 다 안 보이는 인물.', aliases: ['Adou', '아두'] },
  zhouyu: { token: 'Zhouyu', name: '주유', desc: '강동의 젊은 도독 · 맨 얼굴, 수염 0, 이 책에서 가장 잘생긴 남자로 그린다 · 허리에 피리 하나.', aliases: ['Zhouyu', '주유'] },
  lusu: { token: 'Lusu', name: '노숙', desc: '주유 곁의 둥근 얼굴 문관 · 늘 두 손을 소매에 넣고 남의 말을 끝까지 듣는다.', aliases: ['Lusu', '노숙'] },
  huanggai: { token: 'Huanggai', name: '황개', desc: '강동의 늙은 장수 · 흰 수염에 검게 탄 얼굴 · 어깨가 넓고 등이 곧다.', aliases: ['Huanggai', '황개'] },
  pangtong: { token: 'Pangtong', name: '방통', desc: '🔴 잘생기지 않은 것이 이 사람의 표지 · 헝클어진 머리, 짧고 뭉툭한 코 · 그러나 눈이 가장 밝다.', aliases: ['Pangtong', '방통'] },
  machao: { token: 'Machao', name: '마초', desc: '서량의 젊은 장수 · 🔴 은빛 투구에 흰 전포, 이 책에서 흰 옷을 입은 둘째(조운이 첫째) · 긴 창.', aliases: ['Machao', '마초'] },
  zhangliao: { token: 'Zhangliao', name: '장료', desc: '위나라 장수 · 눈매가 곧고 표정이 거의 없다 · 갑옷이 늘 단정하다.', aliases: ['Zhangliao', '장료'] },
  ganning: { token: 'Ganning', name: '감녕', desc: '강동의 사나운 장수 · 🔴 허리에 방울을 달아 움직이면 소리가 난다 · 목에 두른 비단.', aliases: ['Ganning', '감녕'] },
  huangzhong: { token: 'Huangzhong', name: '황충', desc: '촉의 노장 · 흰 수염이 가슴까지 · 🔴 이 책에서 활을 든 유일한 어른 · 등이 곧다.', aliases: ['Huangzhong', '황충'] },
  xiahouyuan: { token: 'Xiahouyuan', name: '하후연', desc: '위나라 장수 · 조조의 사촌 · 마르고 빠르게 생겼다 · 짧은 수염.', aliases: ['Xiahouyuan', '하후연'] },
  caopi: { token: 'Caopi', name: '조비', desc: '조조의 맏아들 · 아버지와 같은 흰 얼굴인데 🔴 눈꼬리가 처졌다 · 늘 관복 차림.', aliases: ['Caopi', '조비'] },
  luxun: { token: 'Luxun', name: '육손', desc: '강동의 아주 젊은 장수 · 🔴 이 책에서 갑옷을 입은 가장 어린 얼굴 · 흰 손, 문관 같은 몸.', aliases: ['Luxun', '육손'] },
  liushan: { token: 'Liushan', name: '유선', desc: '아두가 자란 모습 · 유비의 큰 귀를 물려받았으나 눈이 순하고 입이 늘 조금 벌어져 있다.', aliases: ['Liushan', '유선'] },
  menghuo: { token: 'Menghuo', name: '맹획', desc: '남쪽 땅의 우두머리 · 🔴 이 책에서 갑옷 대신 짐승 가죽을 걸친 유일한 인물 · 굵은 팔찌, 붉은 머리띠.', aliases: ['Menghuo', '맹획'] },
  jiangwei: { token: 'Jiangwei', name: '강유', desc: '제갈량이 얻은 젊은 장수 · 맨 얼굴 · 🔴 이 책의 젊은이 중 유일하게 창과 책을 함께 든다.', aliases: ['Jiangwei', '강유'] },
  masu: { token: 'Masu', name: '마속', desc: '촉의 젊은 참모 · 말이 빠르고 턱을 든다 · 새 갑옷이 몸에 아직 익지 않아 보인다.', aliases: ['Masu', '마속'] },
  anliang: { token: 'Anliang', name: '안량', desc: '원소의 앞장 장수 · 어깨가 아주 넓고 목이 짧다 · 큰 칼.', aliases: ['Anliang', '안량'] },
  wenchou: { token: 'Wenchou', name: '문추', desc: '원소의 앞장 장수 · 안량보다 길쭉하고 수염이 억세다 · 긴 창.', aliases: ['Wenchou', '문추'] },
  liuzhang: { token: 'Liuzhang', name: '유장', desc: '서쪽 땅 익주를 다스리는 종친 · 살집이 있고 눈썹이 처졌다 · 겁이 많아 보이는 얼굴.', aliases: ['Liuzhang', '유장'] },
  taoqian: { token: 'Taoqian', name: '도겸', desc: '서주를 다스리는 노인 · 흰 수염, 병색이 있다 · 두 손을 늘 앞으로 모은다.', aliases: ['Taoqian', '도겸'] },
  wangyun: { token: 'Wangyun', name: '왕윤', desc: '조정의 나이 든 대신 · 단정한 관복 · 흰 수염 · 늘 침착하게 자리를 무마한다.', aliases: ['Wangyun', '왕윤'] },
  liuxie: { token: 'Liuxie', name: '진류왕', desc: '어린 황제의 아우 · 아홉 살 남짓인데 형보다 또렷하게 말한다 · 형과 같은 옷을 입되 관이 없다.', aliases: ['Liuxie', '진류왕'] },
  lvbosha: { token: 'Lvbosha', name: '여백사', desc: '인정 많은 시골 노인 · 흰 수염 · 손에 든 술병.', aliases: ['Lvbosha', '여백사'] },
};

// 🔴 시대·복장 — 권 번호가 정한다. SSOT 는 여기 한 곳이고, 두 곳으로 나간다:
//   ① 쪽 발주 프롬프트에는 그 권에 해당하는 «한 줄만» 나간다(예전엔 네 단계가 통째로 나가
//      20권 발주에도 「1 짚신 … 4 왕의 옷」이 붙어 삽화가가 골라야 했다).
//   ② 캐릭터 시트 프롬프트에는 전 단계가 나간다(시트는 한 장에 다 보여야 하므로).
// 🔴 옷은 «지위가 바뀔 때만» 바꾼다 — 날씨·기분·장면으로 바꾸면 같은 사람이 매 쪽 달라진다.
// 🔴 [권번호, 그 권부터 적용되는 나이·옷] · 얼굴색·실루엣·악센트는 여기 적지 않는다(불변이라 desc 소관).
const STAGES = {
  liubei: [
    [1, '스물넷. 짚신에 물들이지 않은 삼베옷 — 이 책에서 가장 가난한 옷. 🔴 수염이 하나도 없다.'],
    [3, '서른. 푸른 겉옷 안에 가죽 갑옷. 🔴 콧수염 한 줄이 생긴다(이 뒤로 열 권 동안 이 얼굴).'],
    [13, '마흔일곱. 넓은 소매의 학창의, 갑옷 없음 — 싸움을 남에게 맡기는 사람이 된 표시다.'],
    [19, '쉰아홉. 한중왕의 옷(붉은 자락에 옥대). 콧수염에 짧은 턱수염이 더해지고 둘 다 희끗하다.'],
    [20, '예순하나. 황제의 검붉은 곤룡포. 🔴 얼굴에 기쁨이 없다 — 이 옷을 입은 쪽마다 그렇다.'],
  ],
  guanyu: [
    [1, '녹색 평복. 수염이 가슴까지.'],
    [3, '갑옷 위에 녹색 전포 — 🔴 이 뒤로 열일곱 권 동안 옷이 안 바뀐다. 수염이 가슴 아래까지.'],
    [18, '같은 녹색 전포. 🔴 수염이 배꼽까지 내려오고 흰 올이 섞인다 — 이 책의 나이 시계다.'],
  ],
  zhangfei: [
    [1, '거친 베옷, 소매를 걷었다. 수염이 검고 억세다.'],
    [3, '검은 쇠비늘 갑옷 — 이 뒤로 안 바뀐다.'],
    [21, '같은 갑옷. 수염에 흰 올이 섞이고 🔴 눈이 붉다(형을 잃은 뒤 우는 쪽이 있다).'],
  ],
  // 🔴 제갈량은 «옷이 안 바뀌는 것»이 이 인물의 표시다 — 시트가 「열세 권 동안 옷 하나」로 못박았고
  //   13권 첫 등장부터 이미 학창의다. 그러니 단계는 나이와 소지품만 움직인다.
  zhugeliang: [
    [13, '스물일곱. 이마에 두른 천 — 🔴 산속 사람이던 표시라 이 권에서만 두른다. 흰 깃부채를 여기서 처음 든다.'],
    [14, '서른둘. 두건이 없어진다. 옷은 그대로. 짧고 곧게 다듬은 검은 턱수염.'],
    [22, '마흔여섯. 옷 그대로, 눈가에 주름. 승상의 검은 띠 하나만 더해진다.'],
    [24, '쉰넷. 옷 그대로. 수염에 흰 올, 손등이 마르고 어깨가 굽었다. 지팡이를 짚는 쪽이 있다.'],
  ],
  zhaoyun: [
    [10, '은빛 갑옷, 흰 술 달린 창, 흰 말. 얼굴이 젊다.'],
    [17, '같은 은빛 갑옷. 얼굴선이 굳었다.'],
    [21, '같은 갑옷인데 은빛이 낡았다. 눈가에 주름. 🔴 수염은 끝까지 없다.'],
  ],
  caocao: [
    [2, '젊은 무관의 가벼운 갑옷. 검은 수염이 짧다.'],
    [6, '승상의 검은 관복 — 🔴 황제 곁에 설 때는 반드시 이 옷.'],
    [18, '위공의 옷(검붉은 자락에 옥). 수염에 흰 올.'],
    [20, '예순여섯. 흰 수염, 얼굴에 병색. 🔴 이 권에서는 앉아 있는 쪽이 서 있는 쪽보다 많다.'],
  ],
  sunquan: [
    [7, '열아홉. 🔴 아직 수염이 없고 턱에 자줏빛 기운만 돈다. 붉은 옷.'],
    [14, '스물일곱. 자줏빛 수염이 짧게 났다. 허리에 네모난 인장 주머니.'],
    [21, '마흔. 자줏빛 수염이 길어졌다. 같은 붉은 옷.'],
  ],
  lvbu: [
    [2, '정원 밑의 젊은 장수 — 🔴 아직 꿩깃이 없다. 맨 투구.'],
    [3, '동탁 밑으로 간 뒤 — 🔴 꿩깃 두 가닥이 솟는다. 붉은 술, 붉은 말.'],
    [8, '같은 꿩깃. 🔴 갑옷이 몸에 헐거워 보인다(하비에 갇힌 뒤).'],
  ],
  // 🔴 1권의 동탁은 «뒷모습뿐이고 얼굴이 안 보인다» — 대본이 그렇게 썼다(다음 권의 그 사람인 줄
  //   나중에 알게 하려고). 옷을 지정하면 그 연출이 깨지므로 여기서는 옷을 말하지 않는다.
  //   2권부터는 시트대로 «네 권 동안 옷 하나»다.
  dongzhuo: [
    [1, '🔴 뒷모습만 — 얼굴도 옷도 그리지 않는다. 어깨에서 어깨까지가 아주 넓은 덩이라는 것만 남긴다.'],
    [2, '재상의 옷 — 🔴 이 뒤로 네 권 동안 안 바뀐다. 금붙이는 다섯 개까지. 몸이 한 단계 더 넓어진다.'],
  ],
  simayi: [
    [23, '위나라 장수의 갑옷. 반쯤 감은 눈, 긴 목.'],
    [24, '같은 갑옷 위에 도독의 검은 망토. 수염이 세었다.'],
  ],
  xiandi: [
    [6, '열여섯. 🔴 옷이 몸보다 크다 — 소매가 손을 덮는다.'],
    [18, '스물다섯. 옷은 이제 맞는데 🔴 어깨가 그 옷을 못 채운다.'],
    [20, '마흔. 관을 벗어 두 손에 들고 있는 쪽이 있다.'],
  ],
  yuanshao: [
    [2, '젊은 귀공자의 화려한 갑옷.'],
    [3, '맹주의 흰 갑옷 — 단 위에 설 때 입는다.'],
    [11, '같은 갑옷이 몸에 헐겁다. 수염이 세었다.'],
  ],
  zhouyu: [
    [7, '스물넷. 평복에 허리의 피리.'],
    [14, '서른넷. 도독의 갑옷. 🔴 피리는 갑옷 위에도 그대로 찬다.'],
    [16, '서른여섯. 같은 갑옷. 얼굴이 창백하다.'],
  ],
  zhangliao: [
    [9, '여포 밑의 장수 — 갑옷이 늘 단정하다.'],
    [18, '위나라 장수. 같은 단정함. 수염이 조금 세었다.'],
  ],
  machao: [
    [17, '은빛 투구에 흰 전포. 얼굴이 젊고 눈이 사납다.'],
    [19, '같은 흰 전포. 얼굴선이 굳고 눈이 가라앉았다.'],
  ],
  luxun: [
    [20, '🔴 갑옷이 몸에 헐렁한 아주 젊은 얼굴. 손에 든 것이 무기가 아니라 붓이다.'],
    [21, '같은 얼굴인데 갑옷이 몸에 맞고, 이번에는 칼을 찼다.'],
  ],
  sunce: [
    [4, '열일곱. 🔴 아직 붉은 머릿수건이 없다 — 아버지가 쓰고 있다.'],
    [7, '스물하나. 아버지의 붉은 머릿수건을 물려 두르고 있다.'],
  ],
  liushan: [
    [21, '열예닐곱. 아버지의 큰 귀를 물려받았으나 눈이 순하다.'],
    [24, '오십 줄. 같은 둥근 얼굴에 🔴 아무 표정이 없다.'],
  ],
  jiangwei: [
    [23, '스물일곱. 수염이 거의 없다. 창과 책을 함께 든다.'],
    [24, '짧은 수염이 났다. 같은 창, 그러나 책이 늘었다.'],
  ],
  chengong: [
    [2, '젊고 꼿꼿한 고을 관리. 푸른 문관복이 새것이다.'],
    [8, '같은 푸른 옷이 낡았다. 그래도 등이 곧다.'],
  ],
  yuanshu: [
    [3, '형보다 살졌고 턱을 든 채 말한다. 화려한 비단옷.'],
    [7, '스스로 황제라 한 뒤 — 🔴 옷이 새것인데 몸에 안 맞는다(소매가 길고 어깨가 뜬다).'],
  ],
  // 🔴 맹획·감녕은 한 권에서만 그려진다 — 단계를 두면 영영 안 쓰이는 글이 된다(빌드 검사가 잡았다).
  //   맹획의 머리띠(높이 맸다 → 낮게 맸다)는 «권»이 아니라 «쪽»에서 바뀌므로 SCENE 이 지시한다.
  menghuo: [[22, '짐승 가죽을 걸치고 굵은 팔찌. 붉은 머리띠 — 일곱 번 잡히는 동안 이것만 조금씩 낮아진다.']],
  ganning: [[18, '허리의 방울, 목에 두른 비단. 갑옷이 가볍다.']],
};


const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function parseVolume(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const vol = { chapters: [], cast: [], places: [], sub: '' };

  let chapter = null;
  let page = null;
  let inScene = false;
  let inMeta = false;

  for (const line of lines) {
    let m;
    if ((m = line.match(/^#\s+(\d+)권\s*·\s*(.+?)\s*$/))) { vol.n = +m[1]; vol.title = m[2]; continue; }
    if (/^meta:\s*$/.test(line)) { inMeta = true; continue; }
    if (inMeta) {
      if ((m = line.match(/^-\s*sub:\s*(.+)$/))) { vol.sub = m[1].trim(); continue; }
      if ((m = line.match(/^-\s*cast:\s*(.+)$/))) { vol.cast = m[1].split(',').map((s) => s.trim()); continue; }
      if ((m = line.match(/^-\s*places:\s*(.+)$/))) { vol.places = m[1].split(',').map((s) => s.trim()); continue; }
      if (line.trim() && !line.startsWith('-')) inMeta = false;
    }
    if ((m = line.match(/^##\s+(\d+)장\s*·\s*(.+?)\s*(⭐)?\s*$/))) {
      chapter = { n: +m[1], name: m[2].trim(), star: !!m[3], pages: [] };
      vol.chapters.push(chapter); page = null; continue;
    }
    if ((m = line.match(/^###\s+p(\d+)\s*·\s*(.+?)\s*$/))) {
      page = { n: +m[1], label: m[2].trim(), text: '', scene: [] };
      if (!chapter) throw new Error(`${path.basename(file)}: p${m[1]} 앞에 장이 없다`);
      chapter.pages.push(page); continue;
    }
    if (/^```scene\s*$/.test(line)) { inScene = true; continue; }
    if (inScene && /^```\s*$/.test(line)) { inScene = false; continue; }
    if (inScene) { if (line.trim()) page.scene.push(line.trim()); continue; }
    if (page && line.trim() && !line.startsWith('>') && !line.startsWith('---')) {
      page.text += (page.text ? ' ' : '') + line.trim();
    }
  }
  return vol;
}

const SCENE_LABELS = ['컷', '장소·시간', '인물', '배경·소품', '톤'];

/**
 * 🔴 고유명사 첫 등장 검사 — 이름이 처음 나오는 자리에 「무엇인지」가 붙어 있어야 한다.
 * 「탁현이라는 고을」·「'독우'라는 벼슬아치」·「스승 노식」처럼 이름 바로 뒤(14자) 또는 바로 앞(12자)에
 * 보통명사가 있으면 통과. 🔴 창을 넓히지 마라 — 넓히면 옆 이름의 소개를 주워 와 조용히 통과한다.
 *
 * 🔴 **시리즈물이므로 「처음」은 권이 아니라 시리즈 전체 기준이다.** 3권에서 관우를 다시 소개하지 않는다.
 * 그래서 전 권을 권 번호 순으로 미리 훑어 이름마다 최초 등장 지점을 구하고, 그 한 곳만 검사한다.
 * 실패시키지 않고 경고만 낸다 — 「그 사람의 이름은 동탁이었어요」처럼 옳은 변형이 있기 때문이다.
 */
const ROLE_WORDS = /(라는|이라는|이름은|스승|고을|마을|고장|나라|도읍|성|산|장수|벼슬아치|땅|상인|장사꾼|호걸|청년|사내|황제|관리|사람|아우|형|아들|아내|어머니|아버지|누이)/;

/** 그 권에 적용되는 나이·복장 한 줄. 없으면 ''. 🔴 「그 권 이하의 마지막 단계」가 이긴다. */
function stageFor(key, volN) {
  const list = STAGES[key];
  if (!list) return '';
  let hit = '';
  for (const [from, text] of list) if (volN >= from) hit = text;
  return hit;
}

/**
 * 시트 프롬프트용 나이·복장 블록.
 *
 * 🔴 **한 장에 다 담지 않는다.** 단계가 셋을 넘으면 한 이미지 안에 인물이 스무 명 가까이 들어가고
 *   (단계 × 3뷰 + 얼굴 + 표정 4 + 실루엣), 4등신이라 얼굴이 작아 줄마다 다른 사람이 된다.
 *   그래서 단계 수로 갈라 지시를 달리 준다:
 *     ≤2 단계 → 한 장에 두 줄. 얼굴이 두 번뿐이라 버틴다.
 *     3+ 단계 → **대표 단계 한 장을 먼저 굽고 승인**한 뒤, 나머지는 그 승인본을 레퍼런스로 물려
 *               «정면 + 얼굴» 만 있는 작은 장으로 따로 굽는다. 얼굴을 새로 만들지 않게 하는 것이 요점.
 *   대표 단계 = 그 인물이 가장 많은 권에 걸쳐 입고 있는 단계(대개 두 번째).
 */
function stageBlock(key) {
  const list = STAGES[key];
  if (!list) return '';
  const rows = list.map(([from, text]) => `  from book ${from}: ${text}`).join('\n');
  if (list.length <= 2) {
    return `AGES & COSTUMES - ${list.length} stage(s), draw them as ${list.length} row(s) in THIS SAME sheet,
oldest last. 🔴 The face colour, the outline and the accent colour are identical in every row; only
age and clothing move.
${rows}`;
  }
  const [, prime] = list[1];
  return `AGES & COSTUMES - ${list.length} stages. 🔴 DO NOT DRAW THEM ALL IN THIS IMAGE. At four heads
tall the faces come out small, and a sheet with ${list.length} rows of them will drift into ${list.length} different people.
🔴 BAKE THIS SHEET WITH ONE STAGE ONLY - the one marked PRIMARY below. Approve it. Then generate each
remaining stage as its own small sheet, feeding the APPROVED image back in as the reference, and asking
only for FRONT VIEW + HEAD CLOSE-UP. The face is never generated twice from text.
${rows.replace(`  from book ${list[1][0]}: ${prime}`, `  from book ${list[1][0]}: [PRIMARY - bake this one] ${prime}`)}`;
}

function firstMentionReport(allVols) {
  const seen = new Map(); // name → { volN, page, text, index }
  for (const vol of [...allVols].sort((a, b) => a.n - b.n)) {
    const names = [
      ...vol.cast.map((k) => CAST[k] && CAST[k].name).filter(Boolean),
      ...(vol.places || []),
    ];
    for (const name of names) {
      if (seen.has(name)) continue;
      for (const p of vol.chapters.flatMap((c) => c.pages)) {
        const i = p.text.indexOf(name);
        if (i >= 0) { seen.set(name, { volN: vol.n, page: p.n, text: p.text, index: i }); break; }
      }
    }
  }
  const warnByVol = new Map();
  for (const [name, at] of seen) {
    // 🔴 이름 자체가 보통명사를 품고 있으면(「어린 황제」·「진류왕」) 그것이 이미 설명이다.
    if (ROLE_WORDS.test(name)) continue;
    // 🔴 이름 뒤 따옴표 하나는 이름의 것이고, 그 다음 따옴표부터는 다른 이름의 소개다 — 거기서 자른다.
    const after = at.text
      .slice(at.index + name.length, at.index + name.length + 14)
      .replace(/^['"’”]/, '')
      .split(/['"‘“’”]/)[0];
    const before = at.text.slice(Math.max(0, at.index - 12), at.index);
    const ok = /^\s*(이)?라는/.test(after) || ROLE_WORDS.test(after) || ROLE_WORDS.test(before);
    if (!ok) {
      if (!warnByVol.has(at.volN)) warnByVol.set(at.volN, []);
      warnByVol.get(at.volN).push(`${name}(p${at.page})`);
    }
  }
  return { total: seen.size, warnByVol };
}

function sceneHtml(scene) {
  return scene
    .map((l) => {
      const hit = SCENE_LABELS.find((lab) => l.startsWith(lab + ' '));
      if (!hit) return esc(l);
      return `<b>${esc(hit)}</b> ${esc(l.slice(hit.length + 1))}`;
    })
    .join('<br/>');
}

function render(vol, styleCss) {
  const nn = String(vol.n).padStart(2, '0');
  const pages = vol.chapters.flatMap((c) => c.pages);
  // 🔴 「이 화 등장」과 SG_EPISODE.cast 는 meta 를 그대로 믿지 않고 SCENE 에서 파생한다.
  // meta 의 cast 는 손으로 적는 목록이라 실제 그림에 안 나오는 이름이 섞인다(17개 권에서 실제로 그랬다).
  // meta 는 첫 등장 검사의 이름 풀로만 남기고, 화면·발주에 쓰는 캐스트는 SCENE 에 실제로 나온 것만.
  const sceneText = pages.map((p) => p.scene).join('\n');
  const cast = vol.cast
    .map((k) => {
      if (!CAST[k]) throw new Error(`vol-${nn}: 모르는 캐스트 키 "${k}"`);
      // 🔴 발주 프롬프트에는 «이 권의» 나이·복장만 붙인다. 전 단계를 다 붙이면 삽화가가 고르게 된다.
      const st = stageFor(k, vol.n);
      return { ...CAST[k], desc: st ? `${CAST[k].desc}  【${nn}권】 ${st}` : CAST[k].desc };
    })
    .filter((c) => c.token && sceneText.includes(c.token));

  const body = vol.chapters
    .map((ch) => {
      const cards = ch.pages
        .map((p) => {
          const star = ch.star ? ' <span class="tag">⭐ 하이라이트</span>' : '';
          return [
            `<div class="page-card" data-page="p${p.n}">`,
            `  <div class="page-head"><span class="pnum">P${p.n}</span><b>${esc(p.label)}</b> <span class="tag beat">${ch.n}장</span>${star} <button class="copy-btn">🎨 이미지 프롬프트 복사</button></div>`,
            `  <p class="ko">${esc(p.text)}</p>`,
            `  <details class="scene-d"><summary>SCENE 프롬프트 보기</summary><pre class="scene">${sceneHtml(p.scene)}</pre></details>`,
            `</div>`,
          ].join('\n');
        })
        .join('\n');
      return `<h2 class="chap">${ch.n}장 · ${esc(ch.name)}${ch.star ? ' ⭐' : ''}</h2>\n${cards}`;
    })
    .join('\n\n');

  const strip = cast.map((c) => `<span class="who">${c.name}<i>${c.token}</i></span>`).join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>탱고북 삼국지 ${vol.n}권 — ${vol.title}</title>
<style>${styleCss}
  h2.chap { font-size:19px; font-weight:900; color:var(--jade-dark); margin:34px 0 6px; padding-bottom:6px; border-bottom:2px solid var(--line); }
  .whos { display:flex; flex-wrap:wrap; gap:8px; margin:6px 0 10px; }
  .whos .who { background:var(--paper); border:1px solid var(--line); border-radius:999px; padding:5px 13px; font-size:13px; font-weight:800; }
  .whos .who i { font-style:normal; color:var(--ink-soft); font-weight:600; font-size:11px; margin-left:6px; }
  .refnote { font-size:13px; color:var(--ink-soft); margin:0 0 22px; }
  .notice { background:#F0DCCF; border:1px solid #D6B5A5; border-radius:12px; padding:12px 16px; font-size:13px; font-weight:700; color:var(--vermilion); margin:14px 0 24px; line-height:1.7; }
</style>
</head>
<body>
<div class="wrap">
<header class="hero">
  <div class="kicker">탱고북 삼국지 · 제 ${vol.n} 권</div>
  <h1>${esc(vol.title)}</h1>
  <div class="sub">${esc(vol.sub)}</div>
</header>

<div class="refrain">${vol.chapters.length}장 · ${pages.length}장면 &nbsp;·&nbsp; 저학년 존댓말 동화체 &nbsp;·&nbsp; 유혈 직접묘사 없음</div>

<div class="notice">⚠ <b>SCENE 의 매체 어휘는 아직 비어 있습니다.</b> 컷·장소·인물·배경·톤 다섯은 확정이고, 「무엇으로 그리는가」(획·판·워시)는 그림체가 정해지면 앵커가 채웁니다. 그때까지 프롬프트 복사 버튼은 잠겨 있습니다.</div>

<h2 class="chap">🎬 이 권 등장</h2>
<div class="whos">${strip}</div>
<p class="refnote">대본 SSOT = <code>docs/samgukji/vol-${nn}.md</code> · 레퍼런스 시트는 <a href="/samgukji-plan.html">📕 기획서</a>에서 한 번만 관리합니다.</p>

${body}
</div>

<script>
// 회차 데이터 — samgukji-core.js 가 읽어 전체/쪽별 프롬프트·붙여넣기를 자동 생성
window.SG_EPISODE = {
  // 그림체 미확정 — art-director 가 스타일 앵커를 확정하면 여기에 넣는다.
  // 비어 있으면 core 가 프롬프트 도구를 만들지 않고 복사 버튼을 잠근다(빈 발주 방지).
  style: '',
  cast: ${JSON.stringify(cast.map((c) => ({ token: c.token, name: c.name, desc: c.desc, aliases: c.aliases })), null, 2).replace(/\n/g, '\n  ')}
};
</script>
<script src="/samgukji-core.js"></script>
</body>
</html>
`;
}

// ── 실행 ──
const only = (process.argv.find((a) => a.startsWith('--vol=')) || '').split('=')[1];
const styleCss = fs
  .readFileSync(path.join(OUT, 'jeonrae-geumdokki.html'), 'utf8')
  .match(/<style>([\s\S]*?)<\/style>/)[1]
  .replace(
    '--jade:#1f7a6d; --jade-dark:#145c52; --vermilion:#cf4b34; --gold:#c79a3e;',
    '--jade:#8A2B1E; --jade-dark:#6E2117; --vermilion:#AE3325; --gold:#9C7620;'
  )
  .replace(
    '--hanji:#f6efe0; --paper:#fffdf7; --ink:#2a2620; --ink-soft:#6d645a;',
    '--hanji:#EAE3D3; --paper:#F5F0E4; --ink:#221F18; --ink-soft:#726A56;'
  )
  .replace('--line:#e7dcc6; --mint:#2fa38f; --sky:#eaf3ef;', '--line:#D6CCB4; --mint:#3E7C51; --sky:#EDE6D5;');

const files = fs
  .readdirSync(SRC)
  .filter((f) => /^vol-\d+\.md$/.test(f))
  .filter((f) => !only || +f.match(/\d+/)[0] === +only)
  .sort();

if (!files.length) { console.error('대본 md 가 없다:', SRC); process.exit(1); }

const built = [];
for (const f of files) {
  const vol = parseVolume(path.join(SRC, f));
  const pages = vol.chapters.flatMap((c) => c.pages);
  const noScene = pages.filter((p) => !p.scene.length).map((p) => 'p' + p.n);
  const gaps = pages.filter((p, i) => p.n !== i + 1).map((p) => 'p' + p.n);
  if (noScene.length) throw new Error(`vol-${vol.n}: SCENE 없는 쪽 ${noScene.join(',')}`);
  if (gaps.length) throw new Error(`vol-${vol.n}: 쪽 번호가 1부터 연속이 아니다 (${gaps.join(',')})`);
  const html = render(vol, styleCss);
  fs.writeFileSync(path.join(OUT, `samgukji-${String(vol.n).padStart(2, '0')}.html`), html);
  built.push(vol);
  // 🔴 meta 의 cast 수가 아니라 실제로 실린 캐스트 수를 센다 — 둘은 다르다(render 가 SCENE 으로 거른다).
  const shown = (html.match(/<span class="who">/g) || []).length;
  const dropped = vol.cast.length - shown;
  console.log(
    `samgukji-${String(vol.n).padStart(2, '0')}.html — ${vol.chapters.length}장 ${pages.length}장면 · 캐스트 ${shown}` +
      (dropped ? ` (meta 에만 있고 SCENE 엔 없어 뺀 ${dropped})` : ''),
  );
}

// 🔴 고유명사 첫 등장 검사는 전 권을 다 읽은 뒤에 한 번 — 「처음」은 시리즈 기준이기 때문이다.
{
  const allVols = fs
    .readdirSync(SRC)
    .filter((f) => /^vol-\d+\.md$/.test(f))
    .map((f) => parseVolume(path.join(SRC, f)));
  const { total, warnByVol } = firstMentionReport(allVols);
  if (warnByVol.size) {
    for (const [n, list] of [...warnByVol].sort((a, b) => a[0] - b[0])) {
      console.log(`  ⚠ vol-${n}: 첫 등장에 「무엇인지」가 안 붙은 이름 — ${list.join(', ')}`);
    }
  } else {
    console.log(`  ✓ 고유명사 ${total}개 전부 시리즈 첫 등장에 설명이 붙었다`);
  }

  // 🔴 나이·복장 단계 검사 — 단계는 「그 인물이 그려지는 권」 안에서만 뜻이 있다.
  //   ① 등장하지 않는 인물의 단계 = 죽은 글. ② 마지막 등장보다 뒤에서 시작하는 단계 = 영영 안 쓰인다.
  //   ③ 첫 등장보다 늦게 시작하는 첫 단계 = 그 앞 권들이 옷을 못 받는다(가장 조용히 새는 구멍).
  const seenIn = {};
  for (const v of allVols) {
    const sc = v.chapters.flatMap((c) => c.pages).map((p) => p.scene.join('\n')).join('\n');
    for (const [k, c] of Object.entries(CAST)) {
      if (c.token && sc.includes(c.token)) (seenIn[k] ||= []).push(v.n);
    }
  }
  const stageWarn = [];
  for (const [k, list] of Object.entries(STAGES)) {
    const vs = seenIn[k];
    const nm = CAST[k] ? CAST[k].name : k;
    if (!vs) { stageWarn.push(`${nm}: 단계는 있는데 그려지는 권이 없다`); continue; }
    const first = vs[0], last = vs[vs.length - 1];
    if (list[0][0] > first) stageWarn.push(`${nm}: 첫 등장 ${first}권인데 첫 단계가 ${list[0][0]}권부터다`);
    for (const [from] of list) if (from > last) stageWarn.push(`${nm}: ${from}권 단계는 마지막 등장(${last}권) 뒤라 안 쓰인다`);
  }
  // 🔴 그려지는 인물에 시트가 있는가 — 시트 없는 인물은 발주 프롬프트에 한 줄짜리 설명만 붙는다.
  {
    const have = new Set(parseCastSheets().map((s) => s.token));
    const missing = Object.keys(seenIn).filter((k) => !have.has(CAST[k].token)).map((k) => CAST[k].name);
    if (missing.length) console.log(`  ⚠ 시트 없는 인물 ${missing.length}명 — ${missing.join(', ')}`);
    else console.log(`  ✓ 그려지는 인물 ${Object.keys(seenIn).length}명 전부 시트가 있다`);
  }

  if (stageWarn.length) stageWarn.forEach((w) => console.log(`  ⚠ 나이·복장 — ${w}`));
  else {
    const n = Object.values(STAGES).reduce((a, b) => a + b.length, 0);
    console.log(`  ✓ 나이·복장 ${Object.keys(STAGES).length}명 ${n}단계 전부 등장 권 안에서 쓰인다`);
  }
}

// index.json — 대본이 있는 권만 (전 권 빌드일 때만 다시 굽는다)
if (!only) {
  const index = [
    { file: 'samgukji-plan.html', label: '📕 기획서' },
    ...built.map((v) => ({
      file: `samgukji-${String(v.n).padStart(2, '0')}.html`,
      label: `${v.n} · ${v.title}`,
      title: `${v.n}권 ${v.title}`,
    })),
  ];
  fs.writeFileSync(path.join(OUT, 'samgukji-index.json'), JSON.stringify(index, null, 2) + '\n');
  console.log(`samgukji-index.json — ${index.length} entries`);
  buildPlan(built);
}

// ─────────────────────────────────────────────────────────────
// 기획서 — docs/samgukji/_outline.md(24권) + docs/art-direction/samgukji-cast.md(시트) 에서 굽는다.
// 🔴 어느 것도 여기 손으로 옮겨 적지 않는다.
// ─────────────────────────────────────────────────────────────
function parseOutline() {
  const md = fs.readFileSync(path.join(SRC, '_outline.md'), 'utf8');
  const vols = [];
  for (const line of md.split(/\r?\n/)) {
    let m = line.match(/^##\s*(\d+)권\s*·\s*(.+?)\s*\((원본[^)]*)\)\s*$/);
    if (m) { vols.push({ n: +m[1], title: m[2], src: m[3], chapters: [] }); continue; }
    m = line.match(/^(\d+)\.\s*(.+?)\s*—\s*(.+?)\s*$/);
    if (m && vols.length) {
      vols[vols.length - 1].chapters.push({
        n: +m[1], name: m[2], note: m[3].replace(/\s*⭐\s*$/, ''), star: /⭐/.test(m[3]),
      });
    }
  }
  if (vols.length !== 24) throw new Error(`_outline.md: 권 수가 24가 아니다 (${vols.length})`);
  return vols;
}

function parseCastSheets() {
  // 🔴 줄바꿈 종류를 먼저 없앤다 — CRLF 파일에서 `\n` 을 기대한 정규식이 조용히 0장을 읽는다.
  //   (실제로 새 시트 44장이 CRLF 로 들어오자 파서가 옛 10장만 읽고 아무 말도 안 했다.)
  const md = fs.readFileSync(path.join(ROOT, 'docs/art-direction/samgukji-cast.md'), 'utf8').replace(/\r\n/g, '\n');
  const out = [];
  const re = /^##\s+([A-Z][A-Za-z]+)\s*$\n+```\n([\s\S]*?)```/gm;
  let m;
  while ((m = re.exec(md))) out.push({ token: m[1], sheet: m[2].trimEnd() });
  // 🔴 「10장」 같은 숫자로 지키지 않는다 — 인물이 늘면 그 숫자가 먼저 낡는다.
  //   지킬 것은 둘이다: 시트 토큰이 캐스트에 있을 것(아래 castCards 가 throw), 그리고
  //   «실제로 그려지는» 인물에 시트가 있을 것(대본을 다 읽어야 아므로 빌드 끝에서 검사).
  if (!out.length) throw new Error('samgukji-cast.md: 시트를 하나도 못 읽었다');
  return out;
}

function parseAnchor() {
  const f = path.join(ROOT, 'docs/art-direction/samgukji-anchor.md');
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, 'utf8').match(/```[\r\n]+(STYLE ANCHOR[\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

function buildPlan(builtVols) {
  const vols = parseOutline();
  const sheets = parseCastSheets();
  const anchor = parseAnchor();
  if (anchor && (anchor.length < 3200 || anchor.length > 3700)) {
    console.log(`  ⚠ 앵커 ${anchor.length}자 — 규격(3,200~3,700) 밖이다`);
  }
  const byToken = Object.fromEntries(Object.values(CAST).map((c) => [c.token, c]));
  const keyByToken = Object.fromEntries(Object.entries(CAST).map(([k, c]) => [c.token, k]));
  const written = new Set(builtVols.map((v) => v.n));
  const totalCh = vols.reduce((a, v) => a + v.chapters.length, 0);
  const stars = vols.reduce((a, v) => a + v.chapters.filter((c) => c.star).length, 0);

  // 🔴 진영은 기획서 카드의 색띠와 정렬에만 쓴다. 여기 없는 토큰은 「군웅」이 되므로,
  //   새 인물을 넣으면 여기도 채운다 — 안 채우면 주유·장료가 군웅 칸에 가서 조용히 섞인다.
  const FAC = {
    Liubei: '촉', Guanyu: '촉', Zhangfei: '촉', Zhugeliang: '촉', Zhaoyun: '촉',
    Simahui: '촉', Xushu: '촉', Pangtong: '촉', Machao: '촉', Huangzhong: '촉',
    Jiangwei: '촉', Masu: '촉', Liushan: '촉', Adou: '촉',
    Caocao: '위', Simayi: '위', Dianwei: '위', Zhangliao: '위', Xiahouyuan: '위',
    Caopi: '위', Anliang: '군웅', Wenchou: '군웅',
    Sunquan: '오', Sunjian: '오', Sunce: '오', Zhouyu: '오', Lusu: '오',
    Huanggai: '오', Ganning: '오', Luxun: '오',
    Lvbu: '군웅', Dongzhuo: '군웅', Yuanshao: '군웅', Yuanshu: '군웅', Gongsunzan: '군웅',
    Huaxiong: '군웅', Zhangjue: '군웅', Duyou: '군웅', Sushuang: '군웅', Hejin: '군웅',
    Dingyuan: '군웅', Chengong: '군웅', Lvbosha: '군웅', Wangyun: '군웅', Diaochan: '군웅',
    Lijue: '군웅', Guosi: '군웅', Taoqian: '군웅', Liubiao: '군웅', Liuzhang: '군웅',
    Menghuo: '군웅', ChildEmperor: '한', Liuxie: '한', Xiandi: '한',
  };
  const FACC = { 촉: '#3E7C51', 위: '#3A5C86', 오: '#B0473A', 한: '#C9A227', 군웅: '#6E5A86' };

  const castCards = sheets.map(({ token, sheet }) => {
    const c = byToken[token];
    if (!c) throw new Error(`시트 "${token}" 에 해당하는 캐스트가 빌더에 없다`);
    const fac = FAC[token] || '군웅';
    return `
  <div class="char-prompt" data-key="char-${token.toLowerCase()}" style="border-left:4px solid ${FACC[fac]}">
    <div class="head"><b>${c.name}</b> <span class="rom">${token}</span> <span class="tag" style="background:${FACC[fac]}22;color:${FACC[fac]}">${fac}</span> <button class="copy-btn">📋 시트 프롬프트 복사</button></div>
    <details><summary>캐릭터 시트 프롬프트 보기</summary><pre>${esc(anchor || '[공통 스타일 앵커 — samgukji-anchor.md 없음]')}

CHARACTER SHEET - ${token}   (bake this FIRST)
${esc(sheet)}
${
  stageBlock(keyByToken[token])
    ? `
${esc(stageBlock(keyByToken[token]))}
`
    : ''
}
SHEET LAYOUT: front / three-quarter / profile, full figure; plus one head close-up and one row of
four expressions. 🔴 At the foot of the sheet, one strip of the SAME figure filled in solid black -
the silhouette must read as this person and no other.</pre></details>
  </div>`;
  }).join('\n');

  const volRows = vols.map((v) => {
    const nn = String(v.n).padStart(2, '0');
    const done = written.has(v.n);
    const chips = v.chapters.map((c) => `<span class="ch${c.star ? ' star' : ''}">${c.n}. ${esc(c.name)}${c.star ? ' ⭐' : ''}<i>${esc(c.note)}</i></span>`).join('');
    return `
  <div class="vol${done ? ' has' : ''}">
    <div class="vhead"><span class="vnum">${nn}</span><b>${esc(v.title)}</b>
      <span class="rom">${esc(v.src)} · ${v.chapters.length}장</span>
      ${done ? `<a class="go" href="/samgukji-${nn}.html">대본 열기 →</a>` : '<span class="todo">대본 미집필</span>'}
    </div>
    <div class="chs">${chips}</div>
  </div>`;
  }).join('\n');

  const planScript = (() => {
    const src = fs.readFileSync(path.join(OUT, 'jeonrae-plan.html'), 'utf8');
    const block = (src.match(/<script>[\s\S]*?<\/script>/g) || []).find((s) => s.includes('comic-assets/jeonrae-plan'));
    if (!block) throw new Error('jeonrae-plan.html 에서 붙여넣기 스크립트를 못 찾음');
    return block.replace(/comic-assets\/jeonrae-plan/g, 'comic-assets/samgukji-plan');
  })();

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>탱고북 삼국지 시리즈 기획서</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root {
    --jade:#8A2B1E; --jade-dark:#6E2117; --vermilion:#AE3325; --gold:#9C7620;
    --hanji:#EAE3D3; --paper:#F5F0E4; --ink:#221F18; --ink-soft:#726A56;
    --line:#D6CCB4; --mint:#3E7C51; --sky:#EDE6D5;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Pretendard Variable', Pretendard, -apple-system, sans-serif; background:var(--hanji); color:var(--ink); line-height:1.75; }
  .wrap { max-width:1080px; margin:0 auto; padding:24px 24px 120px; }
  header.hero { text-align:center; padding:38px 0; border-bottom:3px solid var(--jade); margin-bottom:28px; }
  .hero .kicker { color:var(--vermilion); font-weight:800; letter-spacing:.18em; font-size:12.5px; }
  .hero h1 { font-size:40px; font-weight:900; margin:10px 0 6px; }
  .hero .sub { color:var(--ink-soft); font-size:15px; font-weight:600; }
  h2 { font-size:21px; font-weight:900; color:var(--jade-dark); margin:40px 0 10px; padding-bottom:7px; border-bottom:2px solid var(--line); }
  p, li { font-size:14.5px; }
  ul { padding-left:20px; } li { margin:4px 0; }
  code { background:var(--sky); border-radius:5px; padding:1px 6px; font-size:13px; }
  .stats { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0 8px; }
  .stat { background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:10px 16px; }
  .stat b { display:block; font-size:22px; font-weight:900; color:var(--jade); }
  .stat span { font-size:12px; color:var(--ink-soft); font-weight:700; }
  .open { background:#F0DCCF; border:1px solid #D6B5A5; border-left:5px solid var(--vermilion); border-radius:12px; padding:14px 18px; margin:14px 0; }
  .open b { color:var(--vermilion); }
  .card { background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 20px; margin:12px 0; }
  .cand { background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:15px 18px; margin:10px 0; }
  .cand.pick { border:2px solid var(--mint); }
  .cand h3 { font-size:16.5px; font-weight:900; margin-bottom:3px; }
  .cand .one { font-size:13.5px; color:var(--ink-soft); font-weight:700; margin-bottom:7px; }
  .vol { background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:13px 16px; margin:9px 0; }
  .vol.has { border-color:var(--mint); }
  .vhead { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .vhead b { font-size:16.5px; }
  .vnum { flex:0 0 auto; width:32px; height:32px; border-radius:9px; background:var(--jade); color:#fff; font-weight:900; display:flex; align-items:center; justify-content:center; font-size:13px; }
  .vol.has .vnum { background:var(--mint); }
  .rom { font-size:12px; color:var(--ink-soft); font-weight:700; }
  .go { margin-left:auto; color:var(--mint); font-weight:800; font-size:13px; text-decoration:none; }
  .go:hover { text-decoration:underline; }
  .todo { margin-left:auto; font-size:12px; font-weight:800; color:var(--ink-soft); }
  .chs { display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
  .ch { background:var(--sky); border-radius:8px; padding:5px 10px; font-size:12.5px; font-weight:700; }
  .ch.star { background:#F0DCCF; color:var(--vermilion); }
  .ch i { font-style:normal; display:block; font-weight:600; color:var(--ink-soft); font-size:11px; }
  .cast-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(330px, 1fr)); gap:10px; align-items:start; }
  .char-prompt { border:1px solid var(--line); border-radius:14px; padding:13px 15px; background:var(--paper); }
  .char-prompt .head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .char-prompt .head b { font-size:15px; }
  .char-prompt details { margin-top:7px; }
  .char-prompt summary { cursor:pointer; font-size:12.5px; font-weight:700; color:var(--ink-soft); }
  .char-prompt pre { white-space:pre-wrap; background:var(--sky); border:1px solid var(--line); border-radius:10px; padding:11px 13px; font-family:inherit; font-size:12px; line-height:1.65; margin-top:6px; }
  .tag { display:inline-block; border-radius:999px; padding:2px 10px; font-size:11.5px; font-weight:800; }
  .paste-box { position:relative; border:2px dashed var(--line); border-radius:10px; min-height:52px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:11.5px; color:var(--ink-soft); font-weight:700; cursor:pointer; outline:none; padding:8px; background:#FBF7EC; margin-top:9px; }
  .paste-box:focus { border-color:var(--jade); color:var(--jade-dark); }
  .paste-box.has-img { padding:0; min-height:0; border-style:solid; border-color:var(--mint); }
  .paste-box img { width:100%; border-radius:8px; display:block; }
  .paste-box.busy { opacity:.5; }
  .paste-del { position:absolute; top:5px; right:5px; border:0; background:rgba(0,0,0,.55); color:#fff; border-radius:6px; width:22px; height:22px; cursor:pointer; font-size:12px; }
  .copy-btn { background:var(--paper); color:var(--mint); border:1.5px solid var(--mint); border-radius:999px; padding:3px 12px; font-weight:800; font-size:11.5px; cursor:pointer; margin-left:auto; }
  .copy-btn:hover, .copy-btn.done { background:var(--mint); color:#fff; }
</style>
</head>
<body>
<div class="wrap">
<header class="hero">
  <div class="kicker">탱고북 오리지널 · 시리즈물</div>
  <h1>탱고북 삼국지</h1>
  <div class="sub">도원결의에서 오장원까지 50년을 24권으로 · 초등 저학년 그림책</div>
</header>

<div class="stats">
  <div class="stat"><b>24</b><span>권 (시리즈 완결)</span></div>
  <div class="stat"><b>${totalCh}</b><span>장</span></div>
  <div class="stat"><b>${stars}</b><span>⭐ 하이라이트</span></div>
  <div class="stat"><b>${written.size}</b><span>권 대본 완성</span></div>
  <div class="stat"><b>약 ${Math.round((totalCh * 6.5) / 10) * 10}~${Math.round((totalCh * 8) / 10) * 10}</b><span>컷 (1권 실측 장당 6.4장면)</span></div>
</div>

<h2>1 · 이 라인은 무엇인가</h2>
<p><b>시리즈물이다.</b> 호리 3라인·전래동화가 「한 권이 한 이야기」인 것과 달리, 삼국지는 <b>1권부터 24권까지 인물이 늙어 가며 이어지는 한 편</b>이다. 그래서 다른 라인에 없는 제약이 셋 붙는다.</p>
<ul>
  <li><b>읽는 순서가 있다</b> — 라이브러리에서 권 번호 순으로 배열하고 표지에도 번호를 넣는다.</li>
  <li><b>인물이 늙는다</b> — 같은 얼굴을 50년에 걸쳐 그린다. 그 해법이 <code>samgukji-cast.md</code> 다.</li>
  <li><b>한 그림체로 끝까지 간다</b> — 창작동화처럼 권마다 바꿀 수 없다.</li>
</ul>
<p>대상은 <b>초등 저학년</b>이다. 탱고북 본진(4~7세)보다 위이고 「타임 티코」와 같은 자리다.</p>

<h2>2 · 그림체 — 수묵 산수 위의 4등신</h2>
<p>🔴 <b>출처는 우리 자산이다</b> — <code>C:/projects/threekingdoms</code>(영걸전형 SRPG)에서 <b>이미 렌더까지 나온</b> 하우스 스타일을 그림책으로 옮겼다.
앞서 만들었던 후보 셋(그림자극·연환화·형지염색)은 <b>렌더가 하나도 없는 설계도</b>여서 폐기했다.
분석 전문 = <code>docs/art-direction/samgukji-anchor.md</code>.</p>
<div class="cand pick">
  <h3>정체 — 두 층으로 되어 있다</h3>
  <div class="one">배경은 젖은 수묵 산수, 인물은 그 위에 얹은 굵은 먹 윤곽의 4등신 세미SD.</div>
  <ul>
    <li>🔴 <b>두 층의 마감이 달라서</b> 「눈은 가장 마감된 것으로 간다」가 저절로 성립한다 — 인물이 늘 그 쪽에서 가장 마감된 것이다.</li>
    <li>🔴 <b>관우의 얼굴이 실제로 붉다</b>(SD 시트 실측 <code>#6C4836</code> 계열) — 얼굴색 축이 이 그림체에서 성립하는 것을 렌더로 확인했다.</li>
    <li>🔴 <b>전원 4등신</b>이라 키로는 아무도 못 가른다 → 개체는 <b>어깨 폭(머리 폭의 몇 배)</b>으로 가른다. 동탁 2.6 ↔ 조조 1.5.</li>
    <li>팔레트는 렌더에서 뽑았다 — 종이 <code>#F0E2C0</code>·먹 <code>#2B2B2B</code>·올리브 <code>#485A48</code>·황토 <code>#D8B46C</code>·가죽 <code>#5A4836</code>.</li>
    <li>⚠️ 법적 라인 상속 — 코에이 그래픽·일러스트 스타일 모방 금지, 「영걸전」 명칭 금지(NOT 절에 박아 두었다).</li>
  </ul>
  <div class="char-prompt" data-key="style-anchor" style="margin-top:12px">
    <div class="head"><b>🎨 STYLE ANCHOR</b> <span class="rom">samgukji-inkwash-sd</span> <button class="copy-btn">📋 앵커만 복사</button></div>
    <details><summary>앵커 전문 보기</summary><pre>${esc(anchor || '(samgukji-anchor.md 없음)')}</pre></details>
  </div>
</div>
<div class="card">
  <b>첫 시험 — 쪽 컷을 뽑기 전에 이 셋을 먼저 굽고 승인받는다.</b>
  <ul>
    <li><b>관우</b> — 붉은 얼굴이 4등신에서도 성립하는가</li>
    <li><b>장비</b> — 삐죽삐죽한 수염 윤곽이 큰 머리에서 뭉개지지 않는가</li>
    <li><b>유비</b> — 🔴 큰 귀가 4등신 큰 머리에 묻히지 않는가(가장 위험한 조합)</li>
  </ul>
  <p>아래 §4 캐스트 카드의 「📋 시트 프롬프트 복사」가 <b>앵커까지 붙은 완성본</b>을 내놓는다 — 그대로 붙여넣으면 된다.</p>
</div>

<h2>3 · 지금 열려 있는 결정</h2>
<div class="open">
  <b>🎨 그림체 — 위 셋 중 하나를 골라야 다음이 굴러간다.</b><br />
  SCENE 의 매체 어휘(획·판·워시)가 그림체에서 나오므로, <b>정해지기 전에 쓴 콘티는 그 부분만 비워 둔다</b>.
  1권 대본이 그렇게 쓰여 있다 — 컷·장소·인물·배경·톤 다섯은 확정이고 매체 한 줄만 비었다.
</div>
<div class="open">
  <b>🩸 후반부 순화 기준.</b><br />
  1권에서 쓴 방식은 <b>결과만 보여 주기</b>다(쓰러진 사람 대신 주인 없는 말과 떨어진 투구, 매질 대신 닫힌 문).
  다만 <b>관우의 최후(20권)·장비의 죽음(21권)·백제성(21권)</b>은 주인공이 죽는 장면이라 같은 처리로 덮이지 않는다.
  🔴 <b>20권에 닿아서 정하면 늦다.</b> (A안을 고르면 「퇴장」이 그 답이 된다.)
</div>
<div class="open">
  <b>📚 파닉스 연동은 하지 않는다.</b> 핵심단어가 「청룡언월도」·「연환계」라 파닉스 단원과 안 맞는다. 읽기 전용 라인으로 둔다.
</div>

<h2>4 · 캐릭터 — 얼굴색이 배역을, 수염 길이가 나이를 말한다</h2>
<div class="card">
  <p><b>원칙 1 · 시그니처는 절대 고정</b> — 색·소품·외모는 나이와 옷이 바뀌어도 그대로.</p>
  <p><b>원칙 2 · 노화는 3단계 점프</b> — 청년 → 장년 → 노년으로 수염·흰머리·주름만 전환.</p>
  <p><b>원칙 3 · 의상은 신분이 오를 때만</b> — 평복 → 갑옷 → 관복 → 왕복.</p>
  <p style="margin-top:8px">🔴 <b>개체 규격 SSOT = <code>docs/art-direction/samgukji-cast.md</code></b> — 얼굴색·수염·실루엣·키·악센트 다섯 축과
  검사 조항이 거기 있다. 아래 카드는 그 파일에서 굽는다.</p>
</div>
<p class="rom">시트는 여기 한 곳에만 붙여넣고, 회차 대본은 이름으로만 참조한다(24권마다 같은 시트를 다시 붙이지 않는다).
🔴 <code>[공통 스타일 앵커]</code> 자리는 그림체가 확정되면 실제 앵커로 치환된다.</p>
<div class="cast-grid">
${castCards}
</div>

<h2>5 · 전 24권 구성</h2>
${volRows}

<h2>6 · 남은 일</h2>
<div class="card">
  <ul>
    <li><b>그림체 확정</b> — 위 A·B·C 중 하나. <b>다른 모든 일의 선행 조건.</b></li>
    <li><b>앵커 저작 + 캐스트 시트 54장</b> — 유비·관우·장비 세 장을 먼저 구워 승인받는다.</li>
    <li><b>2권~24권 집필</b> — <code>docs/samgukji/vol-NN.md</code> 에 쓰고 <code>build-samgukji.mjs</code> 로 굽는다.</li>
    <li><b>후반부 순화 기준 확정</b> — 20·21권.</li>
    <li><b>editor2 연동</b> — <code>link-samgukji-illustrations.mjs</code>(전래 링커 포크). 삽화가 붙은 뒤.</li>
  </ul>
</div>
</div>
${planScript}
<script src="/samgukji-core.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'samgukji-plan.html'), html);
  console.log(`samgukji-plan.html — 24권 ${totalCh}장 ⭐${stars} · 시트 ${sheets.length}장 · 대본 ${written.size}권`);
}
