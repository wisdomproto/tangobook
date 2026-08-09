/**
 * 중국어 병음(拼音) 파닉스 학습자 메타 — 한/영 평행 구조.
 *
 * 🔴 **MVP = Level 1**(성조 + 단운모, 3유닛 — 교안 순서). 소리 유닛이라 삽화가 없다 — 활동은 전부
 *    기존 컴포넌트 재사용이다(새 컴포넌트 0):
 *      · 성조 유닛(u01): 듣고 배우기(a 4성 ā á ǎ à) → 성조 듣고 고르기(`word-listen-choose`, 성조 부호 보기)
 *      · 단운모 유닛(u02 a o e · u03 i u ü): 듣고 배우기(각 모음 4성 순서) → 따라쓰기(`vowel-write`) → 글자 사냥(`letter-hunt`)
 *
 * 🔴 **음원 = 원어민 녹음 직행**(`mod_chinese`). 카드의 `sound`(단일)·`sounds`(4성 시퀀스)가 곧 R2 조회 키다:
 *    단운모 배우기는 모음의 **4성을 순서로**(운모 놀이판) 들려주고, 쓰기·사냥은 tone-1 글자, 성조 유닛은 a 4성.
 *    호스트가 `getChineseSyllableUrl(sound)` 로 URL 을 미리 뽑아 활동에 `ttsUrl` 로 넘긴다.
 *    L2~L5(성모 블렌딩·게임)는 후속.
 */
import { CHINESE_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { ActivityDef, ActivityPlan } from './korean-phonics-units';

export interface ChineseUnitSummary {
  id: string; // 'zh-l1-u01'
  levelKey: string; // 'level1'
  levelName: string; // 'Level 1: 단운모 + 성조'
  levelIndex: number; // 1
  unitIndexInLevel: number;
  unitTitle: string; // 'Unit 01: a o e'
  phonemes: string[];
  patterns: string[];
  targetWords: string[];
  /** 복습 단원인가 (커리큘럼에 없는 파생 단원). 낱말 유닛만 레벨별로 묶어 만든다. */
  isReview?: boolean;
  /** 복습 단원이 되짚는 낱말 유닛 ID 들 — 호스트가 이걸로 storybook(그림·음원)을 로드한다. */
  coveredUnitIds?: string[];
}

/** 화면에 깔리는 병음 카드 한 장 — `label`=보이는 병음, `sound`=발음(mp3) 조회 키. */
export interface PinyinCard {
  label: string;
  sound: string;
  /**
   * 「배우기」에서 이 카드를 누르면 **순서로** 들려줄 소리들(단운모 4성 ā á ǎ à). 없으면 `sound` 하나만.
   * 🔴 교안 운모 놀이판 = 그 운모의 4성을 순서로 들려줌(성조 비교). `sound` 는 tone-1(warm·라벨용).
   */
  sounds?: string[];
}

/** 단운모 → tone-1(고평조) 부호 — 소릿결을 들려주는 「배우기」의 발음 키. */
const TONE1: Record<string, string> = { a: 'ā', o: 'ō', e: 'ē', i: 'ī', u: 'ū', ü: 'ǖ' };

/**
 * 낱말 유닛 낱말 — 병음 → { 한자, 뜻, 삽화 슬러그 }. (L4 CV + L5/L6 복운모·비운모 구체 낱말 + 단운모/통독 확장.)
 *
 * 🔴 커리큘럼(`sampleWords`)은 소리 목록(병음)만 들고, 한자·뜻·삽화 슬러그는 여기 SSOT 다.
 *    낱말 카드는 **병음 위 / 한자 아래**(가르치는 소리는 병음, 한자는 그 낱말의 글자). 뜻(한국어)은
 *    삽화가 이미 보여주므로 카드엔 안 쓴다(참조·문서용).
 * 🔴 storybook 생성 스크립트(`create-chinese-{l4,word}-storybooks.mjs`)와 **같은 표를 본다** —
 *    스크립트가 `phonics-word-cards/` 삽화와 `mod_chinese` 음원을 이 매핑으로 flashcard 에 물린다.
 * 🔴 중국어는 단음절어라 음절이 곧 낱말이다(māo猫·shān山) — 그림 되는 구체 낱말만 여기 든다(추상 半·分 제외).
 */
export const L4_WORDS: Record<string, { hanzi: string; gloss: string; slug: string }> = {
  // L4 단운모 CV
  mǐ: { hanzi: '米', gloss: '쌀', slug: 'mi_rice' },
  mǎ: { hanzi: '马', gloss: '말', slug: 'ma_horse' },
  mù: { hanzi: '木', gloss: '나무', slug: 'mu_tree' },
  tù: { hanzi: '兔', gloss: '토끼', slug: 'tu_rabbit' },
  lù: { hanzi: '鹿', gloss: '사슴', slug: 'lu_deer' },
  jī: { hanzi: '鸡', gloss: '닭', slug: 'ji_chicken' },
  shī: { hanzi: '狮', gloss: '사자', slug: 'shi_lion' },
  rì: { hanzi: '日', gloss: '해', slug: 'ri_sun' },
  chī: { hanzi: '吃', gloss: '먹다', slug: 'chi_eat' },
  hé: { hanzi: '河', gloss: '강', slug: 'he_river' },
  hǔ: { hanzi: '虎', gloss: '호랑이', slug: 'hu_tiger' },
  gǔ: { hanzi: '鼓', gloss: '북', slug: 'gu_drum' },
  é: { hanzi: '鹅', gloss: '거위', slug: 'e_goose' },
  sì: { hanzi: '四', gloss: '넷', slug: 'si_four' },
  // L4 확장(단운모/통독)
  zhū: { hanzi: '猪', gloss: '돼지', slug: 'zhu_pig' },
  shū: { hanzi: '书', gloss: '책', slug: 'shu_book' },
  yú: { hanzi: '鱼', gloss: '물고기', slug: 'yu_fish' },
  yǔ: { hanzi: '雨', gloss: '비', slug: 'yu_rain' },
  yī: { hanzi: '衣', gloss: '옷', slug: 'yi_clothes' },
  // L5 복운모 낱말
  māo: { hanzi: '猫', gloss: '고양이', slug: 'test_mao_cat' },
  gǒu: { hanzi: '狗', gloss: '개', slug: 'gou_dog' },
  niú: { hanzi: '牛', gloss: '소', slug: 'niu_cow' },
  hǎi: { hanzi: '海', gloss: '바다', slug: 'hai_sea' },
  bāo: { hanzi: '包', gloss: '가방', slug: 'bao_bag' },
  shuǐ: { hanzi: '水', gloss: '물', slug: 'shui_water' },
  bēi: { hanzi: '杯', gloss: '컵', slug: 'beizi_cup' },
  qiú: { hanzi: '球', gloss: '공', slug: 'qiu_ball' },
  nǎi: { hanzi: '奶', gloss: '우유', slug: 'nai_milk' },
  yè: { hanzi: '叶', gloss: '잎', slug: 'ye_leaf' },
  xié: { hanzi: '鞋', gloss: '신발', slug: 'xie_shoe' },
  yuè: { hanzi: '月', gloss: '달', slug: 'yue_moon' },
  xuě: { hanzi: '雪', gloss: '눈', slug: 'xue_snow' },
  // L6 비운모 낱말
  shān: { hanzi: '山', gloss: '산', slug: 'shan_mountain' },
  mén: { hanzi: '门', gloss: '문', slug: 'men_door' },
  yún: { hanzi: '云', gloss: '구름', slug: 'yun_cloud' },
  yáng: { hanzi: '羊', gloss: '양', slug: 'yang_sheep' },
  dēng: { hanzi: '灯', gloss: '등', slug: 'deng_lantern' },
  xīng: { hanzi: '星', gloss: '별', slug: 'xing_star' },
  bīng: { hanzi: '冰', gloss: '얼음', slug: 'bing_ice' },
  píng: { hanzi: '瓶', gloss: '병', slug: 'ping_bottle' },
  xióng: { hanzi: '熊', gloss: '곰', slug: 'xiong_bear' },
  zhōng: { hanzi: '钟', gloss: '시계', slug: 'zhong_clock' },
  chóng: { hanzi: '虫', gloss: '벌레', slug: 'chong_bug' },
  táng: { hanzi: '糖', gloss: '사탕', slug: 'tang_candy' },
  // L8 2음절 낱말(双音节词) — 탱고 8단계, 원어민 녹음(mod_chinese). 그림 되는 구체 낱말만.
  hǎibiān: { hanzi: '海边', gloss: '바닷가', slug: 'haibian' },
  táidēng: { hanzi: '台灯', gloss: '스탠드', slug: 'taideng' },
  wàitào: { hanzi: '外套', gloss: '코트', slug: 'waitao' },
  àixīn: { hanzi: '爱心', gloss: '사랑', slug: 'aixin' },
  bēizi: { hanzi: '杯子', gloss: '컵', slug: 'beizi' },
  hēibǎn: { hanzi: '黑板', gloss: '칠판', slug: 'heiban' },
  léishēng: { hanzi: '雷声', gloss: '천둥소리', slug: 'leisheng' },
  mèimèi: { hanzi: '妹妹', gloss: '여동생', slug: 'meimei' },
  wěiba: { hanzi: '尾巴', gloss: '꼬리', slug: 'weiba' },
  shuǐguǒ: { hanzi: '水果', gloss: '과일', slug: 'shuiguo' },
  huǒtuǐ: { hanzi: '火腿', gloss: '햄', slug: 'huotui' },
  lǎorén: { hanzi: '老人', gloss: '노인', slug: 'laoren' },
  xiǎomāo: { hanzi: '小猫', gloss: '고양이', slug: 'xiaomao' },
  sháozi: { hanzi: '勺子', gloss: '숟가락', slug: 'shaozi' },
  zǎoshàng: { hanzi: '早上', gloss: '아침', slug: 'zaoshang' },
  jīròu: { hanzi: '鸡肉', gloss: '닭고기', slug: 'jirou' },
  liǔshù: { hanzi: '柳树', gloss: '버드나무', slug: 'liushu' },
  nǎiniú: { hanzi: '奶牛', gloss: '젖소', slug: 'nainiu' },
  zúqiú: { hanzi: '足球', gloss: '축구공', slug: 'zuqiu' },
  jiějiě: { hanzi: '姐姐', gloss: '언니', slug: 'jiejie' },
  tiělù: { hanzi: '铁路', gloss: '철도', slug: 'tielu' },
  húdié: { hanzi: '蝴蝶', gloss: '나비', slug: 'hudie' },
  xuěhuā: { hanzi: '雪花', gloss: '눈꽃', slug: 'xuehua' },
  èrhú: { hanzi: '二胡', gloss: '얼후', slug: 'erhu' },
  ěrduǒ: { hanzi: '耳朵', gloss: '귀', slug: 'erduo' },
  jīdàn: { hanzi: '鸡蛋', gloss: '달걀', slug: 'jidan' },
  wǔfàn: { hanzi: '午饭', gloss: '점심 식사', slug: 'wufan' },
  yǔsǎn: { hanzi: '雨伞', gloss: '우산', slug: 'yusan' },
  wǎncān: { hanzi: '晚餐', gloss: '저녁 식사', slug: 'wancan' },
  yǎnjīng: { hanzi: '眼睛', gloss: '눈', slug: 'yanjing' },
  shùgēn: { hanzi: '树根', gloss: '나무뿌리', slug: 'shugen' },
  ménkǒu: { hanzi: '门口', gloss: '입구', slug: 'menkou' },
  zhěntou: { hanzi: '枕头', gloss: '베개', slug: 'zhentou' },
  jīnyú: { hanzi: '金鱼', gloss: '금붕어', slug: 'jinyu' },
  gāngqín: { hanzi: '钢琴', gloss: '피아노', slug: 'gangqin' },
  jiǎngpǐn: { hanzi: '奖品', gloss: '상품', slug: 'jiangpin' },
  lúnchuán: { hanzi: '轮船', gloss: '기선', slug: 'lunchuan' },
  zhúsǔn: { hanzi: '竹笋', gloss: '죽순', slug: 'zhusun' },
  qúnzi: { hanzi: '裙子', gloss: '치마', slug: 'qunzi' },
  jūnrén: { hanzi: '军人', gloss: '군인', slug: 'junren' },
  miányáng: { hanzi: '绵羊', gloss: '면양', slug: 'mianyang' },
  bīngxiāng: { hanzi: '冰箱', gloss: '냉장고', slug: 'bingxiang' },
  jǐngshuǐ: { hanzi: '井水', gloss: '우물물', slug: 'jingshui' },
  huāpíng: { hanzi: '花瓶', gloss: '꽃병', slug: 'huaping' },
  xīngxīng: { hanzi: '星星', gloss: '별', slug: 'xingxing' },
  nóngmín: { hanzi: '农民', gloss: '농민', slug: 'nongmin' },
  piáochóng: { hanzi: '瓢虫', gloss: '무당벌레', slug: 'piaochong' },
  hóngbāo: { hanzi: '红包', gloss: '촌지', slug: 'hongbao' },
};

/** 병음 → 한자(카드 아래 병기). 없으면 undefined(병음만). */
export function hanziFor(pinyin: string): string | undefined {
  return L4_WORDS[pinyin.normalize('NFC')]?.hanzi;
}

/**
 * 성모 citation(L2 결합음) — 병음조합(拼读) 블렌드의 **첫 클립**(bō pō mō fó dē…).
 * 🔴 대부분 1성이지만 fó·tè·né 는 2/4성 — `fō·tē·nē`(1성)는 표준 중국어에 없어 녹음 부재(L2 와 동일).
 */
const INITIAL_CITATION: Record<string, string> = {
  b: 'bō', p: 'pō', m: 'mō', f: 'fó',
  d: 'dē', t: 'tè', n: 'né', l: 'lē',
  g: 'gē', k: 'kē', h: 'hē',
  j: 'jī', q: 'qī', x: 'xī',
}; // prettier-ignore

/** j/q/x 뒤 'u' 표기 → 실제 ü. 운모 클립은 ü 계열(jú 의 운모 = ǘ). 성조부호 그대로 옮긴다. */
const U_TO_UMLAUT: Record<string, string> = { u: 'ü', ū: 'ǖ', ú: 'ǘ', ǔ: 'ǚ', ù: 'ǜ' };

/**
 * 병음조합·복운모 블렌드 클립 = **[성모 citation, 운모, 음절]**(bā → ['bō','ā','bā'], māo → ['mō','āo','māo']).
 * 교안 대본 "bō → ā → bā". 운모 = 음절에서 성모(첫 글자, L3/L5 는 전부 1자 성모)를 뺀 나머지 + 그 음절 성조.
 * 🔴 j/q/x 뒤 **운모 첫 글자 u 는 실제 ü** → ü 계열로 변환(jú→ǘ · xué→üé). 단 iu(jiǔ)는 i 가 첫 글자라
 *    그 u 는 진짜 u — **첫 글자만** 본다(예전 `rime.length===1` 특례를 일반화, L3 결과는 불변).
 * 🔴 세 클립 전부 `mod_chinese` 에 실존(HEAD 200 전수 확인). 소리는 `getChineseSyllableUrl` 로 직행(새 bake 0).
 */
export function blendClips(syllable: string): string[] {
  const s = syllable.normalize('NFC');
  const initial = s[0];
  let rime = s.slice(1);
  if ('jqx'.includes(initial) && U_TO_UMLAUT[rime[0]]) rime = U_TO_UMLAUT[rime[0]] + rime.slice(1);
  return [INITIAL_CITATION[initial] ?? s, rime, s];
}

/** 단운모별 4성 부호 — 「성조 듣고 고르기」의 보기 라벨(소리는 음절, 보기는 성조 부호). */
const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}; // ponytail: L1 성조 유닛(ma)만 씀 — 필요할 때 성모 유닛에서 재사용

/** NFD 성조 결합부호 → 성조 번호(1~4). 경성(무표기)은 없음. 코드포인트로 명시(눈에 안 보이는 결합문자 함정 회피). */
const TONE_COMBINING: Record<string, number> = {
  '̄': 1, // macron ˉ 고평
  '́': 2, // acute ˊ 상승
  '̌': 3, // caron ˇ 하강상승
  '̀': 4, // grave ˋ 하강
};
const COMBINING_DIAERESIS = '̈'; // ü 의 ¨

/**
 * 병음 낱말 → 그 낱말이 실제로 낸 **성조 부호**(māo → 'ā'). 「성조 듣고 고르기」의 정답.
 *
 * NFD 로 풀어 성조 결합부호를 찾고, 그 앞의 모음(nucleus)에 같은 성조를 얹은 부호를 돌려준다.
 * ü(u+¨)는 다이어레시스가 붙은 u 로 감지해 ü 성조표를 쓴다. 성조가 없으면(경성) undefined.
 */
export function toneMarkOf(pinyin: string): string | undefined {
  let nucleus = '';
  let hasDiaeresis = false;
  let tone = 0;
  for (const ch of pinyin.normalize('NFD')) {
    if (/[aeiou]/i.test(ch)) {
      nucleus = ch.toLowerCase();
      hasDiaeresis = false;
    } else if (ch === COMBINING_DIAERESIS) {
      hasDiaeresis = true;
    } else if (TONE_COMBINING[ch]) {
      tone = TONE_COMBINING[ch];
      break;
    }
  }
  if (!nucleus || !tone) return undefined;
  const key = hasDiaeresis && nucleus === 'u' ? 'ü' : nucleus;
  return TONE_MARKS[key]?.[tone - 1];
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * 병음 낱말의 nucleus(성조가 얹히는 모음)에 성조 `n`(1~4)을 얹은 형태 — 「성조 듣고 고르기」의 4형 보기.
 *   withTone('māo', 2) → 'máo' · withTone('niú', 3) → 'niǔ'(iu 는 성조가 u) · withTone('shuǐ', 4) → 'shuì'.
 *
 * NFD 로 풀어 기존 성조부호를 떼고, 성조가 얹혔던 모음(없으면 마지막 모음) 자리에 새 성조를 얹는다.
 * nucleus 판정은 `toneMarkOf` 와 같은 규칙(성조부호가 얹힌 모음 = tone-bearing).
 */
export function withTone(pinyin: string, n: number): string {
  const base: string[] = [];
  const diaeresis = new Set<number>(); // base 인덱스 → ü(u+¨)
  let toneVowel = -1;
  let lastVowel = -1;
  for (const ch of pinyin.normalize('NFD')) {
    if (VOWELS.has(ch.toLowerCase())) {
      base.push(ch);
      lastVowel = base.length - 1;
    } else if (ch === COMBINING_DIAERESIS) {
      if (lastVowel >= 0) diaeresis.add(lastVowel);
    } else if (TONE_COMBINING[ch]) {
      toneVowel = lastVowel; // 기존 성조부호는 버린다(base 에 안 넣는다)
    } else {
      base.push(ch);
    }
  }
  const idx = toneVowel >= 0 ? toneVowel : lastVowel;
  if (idx < 0) return pinyin;
  const key = diaeresis.has(idx) && base[idx].toLowerCase() === 'u' ? 'ü' : base[idx].toLowerCase();
  const toned = TONE_MARKS[key]?.[n - 1];
  if (!toned) return pinyin;
  base[idx] = toned; // TONE_MARKS 는 ü 성조까지 합자(ǖǘǚǜ)라 다이어레시스를 따로 안 붙인다
  return base.join('').normalize('NFC');
}

/**
 * 整体认读(통독) 16음절 × 4성 — L7. 성모+운모로 안 쪼개지는 whole-read 음절이라 blendClips 를 못 쓴다.
 * 배우기가 **4성을 순서로** 들려준다(단운모 운모 놀이판과 같은 리듬). 전 성조 클립 mod_chinese 실존(64/64 확인).
 * 쓰기·사냥은 없다 — 다글자+성조부호라 캔버스 밖(2글자 성모 zh/ch/sh 와 같은 이유). 그래서 plan 은 blend 형(배우기+듣고 고르기).
 */
const WHOLE_READ_TONES: Record<string, string[]> = {
  zhi: ['zhī', 'zhí', 'zhǐ', 'zhì'], chi: ['chī', 'chí', 'chǐ', 'chì'], shi: ['shī', 'shí', 'shǐ', 'shì'], ri: ['rī', 'rí', 'rǐ', 'rì'],
  zi: ['zī', 'zí', 'zǐ', 'zì'], ci: ['cī', 'cí', 'cǐ', 'cì'], si: ['sī', 'sí', 'sǐ', 'sì'],
  yi: ['yī', 'yí', 'yǐ', 'yì'], wu: ['wū', 'wú', 'wǔ', 'wù'], yu: ['yū', 'yú', 'yǔ', 'yù'],
  ye: ['yē', 'yé', 'yě', 'yè'], yue: ['yuē', 'yué', 'yuě', 'yuè'], yuan: ['yuān', 'yuán', 'yuǎn', 'yuàn'],
  yin: ['yīn', 'yín', 'yǐn', 'yìn'], yun: ['yūn', 'yún', 'yǔn', 'yùn'], ying: ['yīng', 'yíng', 'yǐng', 'yìng'],
}; // prettier-ignore

/** 커리큘럼 단원만 (복습 제외) — 복습 묶음을 만드는 원본. */
function getCurriculumUnits(): ChineseUnitSummary[] {
  const out: ChineseUnitSummary[] = [];
  for (const level of CHINESE_PHONICS_CURRICULUM) {
    const levelIndex = Number(String(level.level).replace(/\D/g, '')) || 0;
    for (let i = 0; i < level.units.length; i++) {
      const u = level.units[i];
      out.push({
        id: u.id,
        levelKey: String(level.level),
        levelName: level.name,
        levelIndex,
        unitIndexInLevel: i + 1,
        unitTitle: u.title,
        phonemes: [...u.phonemes],
        patterns: [...(u.patterns ?? [])],
        targetWords: [...(u.sampleWords ?? [])],
      });
    }
  }
  return out;
}

/**
 * 모든 병음 unit + 복습 단원을 학습 순서대로.
 *
 * 🔴 **복습 = 낱말 유닛만 레벨별로 묶는다**(소리 유닛은 그림이 없어 복습 게임 대상이 아니다).
 *    한 레벨의 낱말 유닛(L4 u01~u04 · L5 u04~u06 · L6 u05~u07)을 그 레벨의 **마지막 낱말 유닛 뒤에**
 *    한 복습 단원으로 끼운다(한글과 동일 — 사이드바에서 단원처럼 보인다).
 * 🔴 여기선 `isWordUnit`(=getChineseUnit→getAllChineseUnits 재귀)를 부르지 않는다 — `patterns` 를 직접 본다.
 */
export function getAllChineseUnits(): ChineseUnitSummary[] {
  const base = getCurriculumUnits();
  // 레벨별 마지막 낱말 유닛 id → 그 뒤에 붙일 복습 단원
  const reviewAfter = new Map<string, ChineseUnitSummary>();
  for (const level of CHINESE_PHONICS_CURRICULUM) {
    const levelKey = String(level.level);
    const wordUnits = base.filter((u) => u.levelKey === levelKey && u.patterns.includes('word'));
    if (!wordUnits.length) continue;
    const last = wordUnits[wordUnits.length - 1];
    reviewAfter.set(last.id, {
      id: `zh-l${last.levelIndex}-r1`,
      levelKey,
      levelName: level.name,
      levelIndex: last.levelIndex,
      unitIndexInLevel: last.unitIndexInLevel, // 사이드바는 복습에 🏅 를 쓰므로 번호는 안 보인다
      unitTitle: '복습',
      phonemes: [],
      patterns: ['review'],
      targetWords: wordUnits.flatMap((u) => u.targetWords),
      isReview: true,
      coveredUnitIds: wordUnits.map((u) => u.id),
    });
  }

  const out: ChineseUnitSummary[] = [];
  for (const u of base) {
    out.push(u);
    const review = reviewAfter.get(u.id);
    if (review) out.push(review);
  }
  return out;
}

export function getChineseUnit(unitId: string): ChineseUnitSummary | undefined {
  return getAllChineseUnits().find((u) => u.id === unitId);
}

/** 성조 유닛인가 — 같은 「듣고 고르기」 컴포넌트지만 카드가 4성이고 흐름(성조 고르기)이 하나 더 붙는다. */
export function isToneUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('tones') ?? false;
}

/**
 * 성모(声母) 유닛인가 — 카드 = 성모 글자(phonemes), 소리 = 결합 citation 음절(sampleWords, 낱 소리 하나).
 * 🔴 단운모처럼 4성 시퀀스를 붙이지 않는다 — 성모는 한 소리(bō)로만 들려준다.
 */
export function isInitialUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('initial') ?? false;
}

/**
 * 병음조합(拼读) 유닛인가 — 카드 = 음절(sampleWords), 소리 = 블렌드 3클립(`blendClips`)을 순서로.
 * 배우기(탐색=3클립 블렌드)와 듣고 고르기(퀴즈=음절 하나) 두 활동뿐 — 따라쓰기·글자 사냥 없음.
 */
export function isBlendUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('blend') ?? false;
}

/**
 * 단어(单词) 유닛인가 — 카드 = 낱말(병음 위 + 한자 아래) + 삽화. 소리 학습(L1~L3)이 아니라
 * **낱말 놀이**(낱말 연습 + 게임 2종)라 storybook(삽화·keypoints·mod_chinese 음원)을 읽는다.
 * 🔴 L1~L3(성조·단운모·성모·병음조합)과 달리 익히기 카드가 없다 — 활동이 전부 낱말 기반이다.
 */
export function isWordUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('word') ?? false;
}

/**
 * 整体认读(통독) 유닛인가 — 카드 = whole-read 음절(phonemes: zhi·yi·yue…), 배우기 소리 = 그 음절 4성 시퀀스.
 * blend 처럼 배우기 + 듣고 고르기 두 활동(쓰기·사냥 없음 — 다글자+성조부호라 캔버스 밖).
 */
export function isWholeUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.patterns.includes('whole') ?? false;
}

/** 성모 유닛 카드 — label=성모 글자, sound=결합 음절(bō). 배우기·쓰기·사냥이 같은 모양을 쓴다. */
function initialCards(u: ChineseUnitSummary): PinyinCard[] {
  return u.phonemes.map((p, i) => ({ label: p, sound: u.targetWords[i] ?? p }));
}

/**
 * 「듣고 배우기」 카드. 단운모 유닛은 낱 모음(a·o·e, 소리=tone-1 ā·ō·ē), 성조 유닛은 4성 음절(mā·má·mǎ·mà).
 */
export function getChineseUnitCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  if (isToneUnit(unitId)) {
    // 성조 유닛 — sampleWords 가 곧 4성 음절이고 라벨·소리가 같다.
    return u.targetWords.map((w) => ({ label: w, sound: w }));
  }
  if (isInitialUnit(unitId)) return initialCards(u);
  // 通读(整体认读) — 카드 = whole-read 음절 라벨(방어용: 쓰기·사냥 없어 실제로는 안 불린다). 소리는 tone-1.
  if (isWholeUnit(unitId))
    return u.phonemes.map((p) => ({ label: p, sound: WHOLE_READ_TONES[p]?.[0] ?? p }));
  // 병음조합 — 카드 = 음절(방어용: 쓰기·사냥 없어 실제로는 안 불린다). 소리는 음절 하나.
  if (isBlendUnit(unitId))
    return u.targetWords.map((w) => ({ label: w, sound: w.normalize('NFC') }));
  // 단운모 — 보이는 건 낱 모음, 소리는 tone-1(소릿결).
  return u.phonemes.map((p) => ({ label: p, sound: TONE1[p] ?? p }));
}

/**
 * 「배우기」(듣고 배우기) 카드 — write/hunt(`getChineseUnitCards`)와 **갈린다**.
 *
 * 🔴 성조 유닛(u01) = 4성 카드(ā á ǎ à, label=sound). 🔴 단운모 유닛(u02·u03) = 낱 모음 카드지만
 *    누르면 **그 모음의 4성을 순서로**(`sounds`) 들려준다 — 운모 놀이판(성조 비교). 쓰기·사냥은
 *    낱 모음 글자 하나가 목표라 `getChineseUnitCards`(4성 안 붙음)를 그대로 쓴다.
 */
export function getChineseListenCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u) return [];
  if (isToneUnit(unitId)) {
    return u.targetWords.map((w) => ({ label: w, sound: w }));
  }
  // 병음조합 배우기 — 음절 카드. 누르면 블렌드 3클립(성모 citation → 운모 → 음절)을 순서로.
  // 🔴 sound = 음절(NFC, sounds[2]) — 호스트가 ttsBySound[sound] 로 퀴즈 음절 URL 을 찾으므로 clips 와 같은 정규화.
  if (isBlendUnit(unitId)) {
    return u.targetWords.map((w) => {
      const clips = blendClips(w);
      return { label: w, sound: clips[2], sounds: clips };
    });
  }
  // 通读(整体认读) 배우기 — 카드 = whole-read 음절(zhi·yi…), 누르면 그 음절 4성을 순서로(운모 놀이판과 같은 리듬).
  if (isWholeUnit(unitId)) {
    return u.phonemes.map((p) => {
      const tones = WHOLE_READ_TONES[p];
      return { label: p, sound: tones?.[0] ?? p, ...(tones ? { sounds: tones } : {}) };
    });
  }
  // 성모 = 낱 소리 하나(bō). 4성 시퀀스는 단운모(운모 놀이판)에서만.
  if (isInitialUnit(unitId)) return initialCards(u);
  return u.phonemes.map((p) => {
    const marks = TONE_MARKS[p];
    return {
      label: p,
      sound: marks?.[0] ?? TONE1[p] ?? p, // tone-1 — warm·라벨·폴백용
      ...(marks ? { sounds: marks } : {}),
    };
  });
}

/**
 * 「성조 듣고 고르기」 카드(성조 유닛 전용) — 소리는 음절 4성(u01 은 ā á ǎ à), 보기는 **성조 부호**.
 * 들은 성조를 부호에 짝지어 "성조가 뜻을 가른다"를 익힌다.
 */
export function getChineseToneChoiceCards(unitId: string): PinyinCard[] {
  const u = getChineseUnit(unitId);
  if (!u || !isToneUnit(unitId)) return [];
  const nucleus = [...(u.phonemes[0] ?? '')].find((ch) => TONE_MARKS[ch]) ?? 'a';
  const marks = TONE_MARKS[nucleus] ?? TONE_MARKS.a;
  return u.targetWords.map((w, i) => ({ label: marks[i] ?? w, sound: w }));
}

// ── 활동 plan ─────────────────────────────────────────────────────────────────
// 🔴 plan 에 없으면 라우트로 도달해도 죽은 코드다(한/영 반복 함정). 유닛 종류로 갈린다.
const LISTEN_FIRST = {
  key: 'listen-choose',
  order: 1,
  kind: 'word-listen-choose',
  section: 'learn',
  title: '듣고 배우기',
  emoji: '🔊',
  required: true,
} as const;

function makeSingleFinalPlan(): ActivityPlan {
  return {
    activities: [
      LISTEN_FIRST,
      {
        key: 'write',
        order: 2,
        kind: 'vowel-write',
        section: 'learn',
        title: '따라쓰기',
        emoji: '✏️',
        required: true,
      },
      {
        key: 'hunt',
        order: 3,
        kind: 'letter-hunt',
        section: 'learn',
        title: '글자 사냥',
        emoji: '🔎',
        required: false,
      },
    ],
  };
}

const HUNT = {
  key: 'hunt',
  order: 3,
  kind: 'letter-hunt',
  section: 'learn',
  title: '글자 사냥',
  emoji: '🔎',
  required: false,
} as const;

/**
 * 따라쓰기를 뺀 성모 plan(zh/ch/sh 처럼 2글자 성모) — 배우기 + 글자 사냥.
 * `LetterFillCanvas` 는 한 글자 캔버스라 2글자 성모를 못 쓴다(배우기·사냥은 글자 수와 무관).
 */
function makeNoWritePlan(): ActivityPlan {
  return { activities: [LISTEN_FIRST, { ...HUNT, order: 2 }] };
}

function makeTonePlan(): ActivityPlan {
  return {
    activities: [
      LISTEN_FIRST,
      {
        key: 'tone-choose',
        order: 2,
        kind: 'word-listen-choose',
        section: 'learn',
        title: '성조 듣고 고르기',
        emoji: '🎵',
        required: true,
      },
    ],
  };
}

/**
 * 병음조합(拼读) plan = 배우기(블렌드 탐색) + 듣고 고르기(음절 퀴즈). 둘 다 word-listen-choose.
 * 🔴 `listen-choose` 만 `exploreFirst`(호스트가 key 로 가름) — 배우기는 눌러 블렌드를 듣고, 듣고 고르기는 바로 퀴즈.
 */
function makeBlendPlan(): ActivityPlan {
  return {
    activities: [
      LISTEN_FIRST,
      {
        key: 'listen-quiz',
        order: 2,
        kind: 'word-listen-choose',
        section: 'learn',
        title: '듣고 고르기',
        emoji: '🎧',
        required: true,
      },
    ],
  };
}

/**
 * 단어(L4) plan = 「낱말 놀이」(section play) = 낱말 연습 + 낱말 그리기 + 그림 짝 찾기.
 * 🔴 익히기(learn) 활동이 없다 — 소리는 L1~L3 에서 배웠고 여기선 낱말을 논다.
 * 🔴 게임 kind 는 한/영과 같은 수집기 게임 id 로 매핑된다(`game-connect-dots`·`game-line-matching`).
 *    낱말 쓰기·블록은 뺀다 — 병음은 다글자+성조부호라 `LetterFillCanvas` 밖이고, 블록은 병음에 안 맞는다.
 */
function makeWordPlan(): ActivityPlan {
  return {
    activities: [
      {
        key: 'word-practice',
        order: 1,
        kind: 'word-listen-choose',
        section: 'play',
        title: '낱말 연습',
        emoji: '🔊',
        required: true,
      },
      {
        key: 'draw',
        order: 2,
        kind: 'game-connect-dots',
        section: 'play',
        title: '낱말 그리기',
        emoji: '🎨',
        required: false,
      },
      {
        key: 'match',
        order: 3,
        kind: 'game-line-matching',
        section: 'play',
        title: '그림 짝 찾기',
        emoji: '🃏',
        required: false,
      },
    ],
  };
}

/** 복습 단원인가 — 낱말 유닛만 레벨별로 묶은 파생 단원(그림·음원이 있어야 게임이 성립). */
export function isReviewUnit(unitId: string): boolean {
  return getChineseUnit(unitId)?.isReview ?? false;
}

/**
 * 복습 단원 plan — 🔴 **게임만 넣는다**(한글 복습과 동일 규칙). 낱말 유닛의 그림·병음·mod_chinese
 * 음원을 되짚어, 형식이 다른 다섯 활동으로 논다:
 *  ① 글자 사냥 — 헷갈리는 병음(같은 음절 다른 성조·혼동 운모) 사이에서 목표 병음 찾기 (모양·성조 변별)
 *  ② 뒤집기 짝 맞추기 — 병음 ↔ 그림 기억 인출
 *  ③ 듣고 낱말 맞추기 — 낱말 소리를 듣고 병음 4개 중 고르기 (소리→글자)
 *  ④ 그림 짝 찾기 — 병음 ↔ 그림 잇기
 *  ⑤ 성조 듣고 고르기 — 낱말 소리를 듣고 그 성조 부호 고르기 (한글엔 없는 병음 고유 축)
 * 🔴 듣기(③·⑤)를 붙여 두지 않는다 — 사이에 눈으로 보는 ④를 끼운다(한글 복습과 같은 배치 규칙).
 */
/**
 * 병음 음절 수 — 모음 덩어리(연속 모음)의 개수. 단음절=1, 2음절 낱말=2.
 * 🔴 성모·코다(n·ng)가 음절을 가르고, 우리 낱말엔 모음-모음 음절 경계가 없어(海鸥 류 없음) 이 계수가 정확하다.
 *    NFD 로 풀어 성조·다이어레시스 결합부호를 지운 뒤 base 모음의 연속 덩어리를 센다.
 */
export function syllableCount(pinyin: string): number {
  const base = pinyin.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let count = 0;
  let inV = false;
  for (const ch of base) {
    const isV = 'aeiouüv'.includes(ch);
    if (isV && !inV) count++;
    inV = isV;
  }
  return count || 1;
}

/**
 * 복습 plan. 🔴 `monosyllabic` = 낱말이 **단음절**일 때만 「글자 사냥」·「성조 듣고 고르기」를 넣는다.
 * 둘 다 **낱글자/짧은 토큰 + 단일 성조** 전용이라 2음절 낱말(L8)엔 안 맞는다:
 *  · 글자 사냥 = 7~8자 병음이 타일에 안 들어가 넘치고, 성조 변이 방해꾼은 mod_chinese 에 녹음이 없어 무음.
 *  · 성조 고르기 = 2음절은 성조가 하나가 아니라 `withTone` 이 첫 성조를 지워 깨진다.
 * 그래서 2음절 복습 = 뒤집기 + 듣고 낱말 + 그림 짝(그림 기반 3종)만.
 */
function makeChineseReviewPlan(monosyllabic: boolean): ActivityPlan {
  const activities: ActivityDef[] = [];
  let order = 0;
  const play = (key: string, kind: ActivityDef['kind'], title: string, emoji: string) =>
    activities.push({ order: ++order, key, kind, section: 'play', title, emoji, required: true });
  if (monosyllabic) play('letter-hunt', 'letter-hunt', '글자 사냥', '🔎');
  play('review-flip', 'review-flip', '뒤집기 짝 맞추기', '🎴');
  play('review-word-listen', 'review-word-listen', '듣고 낱말 맞추기', '🔊');
  play('review-match', 'review-match', '그림 짝 찾기', '🔗');
  if (monosyllabic) play('tone-choice', 'tone-choice-review', '성조 듣고 고르기', '🎵');
  return { activities };
}

/**
 * 유닛 → plan. 복습 = 게임 5종 / 성조 유닛 = 배우기 + 성조 고르기 / 병음조합 = 배우기 + 듣고 고르기 /
 * 단어(L4) = 낱말 놀이(연습+게임 2) / 그 외(단운모·성모) = 배우기 + 따라쓰기 + 사냥.
 * 🔴 성모에 2글자(zh/ch/sh)가 섞이면 따라쓰기를 빼고 배우기·사냥만 둔다(위 `makeNoWritePlan`).
 */
function planForUnit(u: ChineseUnitSummary): ActivityPlan {
  // 🔴 복습 성조 활동은 단음절 낱말일 때만 — 2음절(L8)은 성조가 하나가 아니라 뺀다.
  if (u.isReview)
    return makeChineseReviewPlan(
      u.targetWords.length > 0 && u.targetWords.every((w) => syllableCount(w) === 1)
    );
  if (u.patterns.includes('tones')) return makeTonePlan();
  if (u.patterns.includes('word')) return makeWordPlan();
  // 通读(整体认读) = blend 와 같은 배우기 + 듣고 고르기(쓰기·사냥 없음).
  if (u.patterns.includes('whole') || u.patterns.includes('blend')) return makeBlendPlan();
  if (u.phonemes.some((p) => p.length > 1)) return makeNoWritePlan();
  return makeSingleFinalPlan();
}

export const CHINESE_UNIT_ACTIVITY_PLAN: Record<string, ActivityPlan> = Object.fromEntries(
  getAllChineseUnits().map((u) => [u.id, planForUnit(u)])
);

export function getChineseActivityPlan(unitId: string): ActivityPlan {
  return CHINESE_UNIT_ACTIVITY_PLAN[unitId] ?? { activities: [] };
}

export function getChineseRequiredActivities(unitId: string): readonly string[] {
  return getChineseActivityPlan(unitId)
    .activities.filter((a) => a.required)
    .map((a) => a.key);
}
