#!/usr/bin/env node
/**
 * 호리 낱말 카드 연동 때 key_objects.name 을 영어 「구문」으로 넣었던 것을 짧은 명사로 정규화.
 *   name/nameEn = 짧은 명사, keyObjectImages.objectName 도 같이 바꾼다(둘은 매칭 키).
 * 아이 화면엔 korean 만 나오지만, coloring-plan subject·내부 canonical 이 깔끔해진다. 멱등.
 *
 *   node packages/server/scripts/rename-hori-key-object-names.mjs           # dry-run
 *   node packages/server/scripts/rename-hori-key-object-names.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'hori-cards-map.json'), 'utf8'));
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
loadEnv();

const SHORT = {
  '가방':'backpack','가위':'scissors','간식':'snacks','강아지 밥그릇':'dog bowl','개미':'ant','거북이':'turtle',
  '거울':'mirror','거품':'bubbles','계단':'stairs','고구마':'sweet potato','고기':'meat','공':'ball','과자':'biscuit',
  '괴물':'monster','구슬':'marble','그릇':'bowl','기저귀':'diaper','기차':'train','꼬리':'tail','꽃':'flower','나무':'tree',
  '낙엽':'autumn leaves','노래':'music note','놀이터':'swing','누나':'older sister','단추':'button','단풍잎':'maple leaf',
  '달':'moon','당근':'carrot','도서관':'library','도토리':'acorn','돌멩이':'pebble','동생':'little sibling','두부':'puppy',
  '등딱지':'turtle shell','딸랑이':'rattle','뜨거운 냄비':'hot pot','마이크':'microphone','모래':'sand','모래성':'sandcastle',
  '모자':'hat','목줄':'dog leash','몸':'body','무대':'stage','무드등':'night lamp','무지개':'rainbow','문':'door','물':'water',
  '물그릇':'water bowl','물방울':'water drop','물통':'water bottle','미끄럼틀':'slide','바구니':'basket','바다':'wave',
  '바지':'pants','바퀴':'wheel','반딧불이':'firefly','밥':'rice','밥상':'dining table','방석':'cushion','버스':'bus',
  '벤치':'bench','변기':'toilet','별':'star','병원':'hospital','브로콜리':'broccoli','블록':'blocks','블록탑':'block tower',
  '비누':'soap','빨간불':'red light','빵':'bread','사과':'apple','사탕':'lollipop','상자':'box','새':'bird','선반':'shelf',
  '성':'castle','세면대':'sink','소파':'sofa','손':'hand','손가락':'finger','손수건':'handkerchief','손잡이':'door knob',
  '손전등':'flashlight','솜사탕':'cotton candy','수건':'towel','수저':'spoon','스펀지':'sponge','시계':'clock','시장':'market',
  '신호등':'traffic light','아기':'baby','아빠':'dad','아이':'child','알람 시계':'alarm clock','약':'medicine',
  '언니':'elder sister','엄마':'mom','열매':'berries','오리':'duck','옥수수':'corn','옷':'clothes','외투':'coat','욕조':'bathtub',
  '우주':'planet','유치원':'kindergarten','음식':'food','의사':'doctor','의자':'chair','이':'tooth','이불':'blanket',
  '인형':'doll','입술':'lips','자동차':'car','잔디':'grass','잠옷':'pajamas','장난감 상자':'toy box','접시':'plate',
  '젓가락':'chopsticks','주사':'syringe','줄':'rope','줄넘기':'jump rope','집':'house','짝꿍':'friends','창문':'window',
  '채소':'vegetables','책':'book','책상':'desk','체온계':'thermometer','충치벌레':'cavity monster','취침등':'night light',
  '치약':'toothpaste','칫솔':'toothbrush','카드':'card','카트':'shopping cart','커튼':'curtain','컵':'cup','코끼리':'elephant',
  '쿠키':'cookie','킥보드':'scooter','텃밭':'garden','토끼':'rabbit','토마토':'tomato','튜브':'swim ring','티셔츠':'t-shirt',
  '팬티':'underwear','풍선':'balloon','해':'sun','헬멧':'helmet','형':'older brother',
};

const missing = Object.keys(MAP.gloss).filter((w) => !SHORT[w]);
if (missing.length) { console.error('SHORT 누락:', missing.join(', ')); process.exit(1); }

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
let booksChanged = 0, renamed = 0;
for (const [bookId, words] of Object.entries(MAP.bookWords)) {
  if (!words.length) continue;
  let sb;
  try { sb = await getStorybook(bookId); } catch { continue; }
  const koArr = sb.key_objects ?? [];
  const imgArr = sb.keyObjectImages ?? [];
  let changed = 0;
  for (const word of words) {
    const noun = SHORT[word];
    const ko = koArr.find((o) => o.korean === word);
    if (!ko) continue;
    const oldName = ko.name;
    if (oldName !== noun) {
      const img = imgArr.find((i) => i.objectName === oldName);
      if (img) img.objectName = noun;
      ko.name = noun; ko.nameEn = noun;
      renamed++; changed++;
    }
  }
  if (changed) {
    booksChanged++;
    if (APPLY) { sb.updatedAt = new Date().toISOString(); await putStorybook(bookId, sb); }
  }
}
console.log(`책 ${booksChanged}권 · 이름 정규화 ${renamed}건`);
if (!APPLY) console.log('(dry-run — 반영하려면 --apply)');
