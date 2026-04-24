export const TARGET_AGES = ['4-5', '5-7', '7-8'] as const;
export type TargetAge = (typeof TARGET_AGES)[number];

export const ART_STYLES = [
  { id: 'photographic', label: '실사', prompt: 'Photographic realistic illustration' },
  { id: 'watercolor', label: '수채화', prompt: 'Watercolor' },
  { id: 'cartoon', label: '카툰', prompt: 'Cartoon' },
  { id: 'traditional', label: '전통 동화책', prompt: 'Traditional Storybook' },
  { id: 'animation', label: '애니메이션', prompt: 'Animation' },
  { id: 'modern-illustration', label: '현대 일러스트', prompt: 'Modern Illustration' },
  { id: 'oil-painting', label: '유화', prompt: 'Oil Painting' },
  { id: 'pencil-sketch', label: '연필 스케치', prompt: 'Pencil Sketch' },
] as const;

export const ASPECT_RATIOS = ['16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '1:1'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: '영어' },
  { code: 'ja', label: '일본어' },
  { code: 'zh', label: '중국어' },
  { code: 'es', label: '스페인어' },
  { code: 'fr', label: '프랑스어' },
  { code: 'de', label: '독일어' },
] as const;

export const TTS_PROVIDERS = ['gemini', 'minimax', 'elevenlabs'] as const;
export type TtsProvider = (typeof TTS_PROVIDERS)[number];

export const TTS_VOICES = [
  { id: 'Leda', label: '레다', description: 'Youthful' },
  { id: 'Sulafat', label: '술라파트', description: 'Warm' },
  { id: 'Vindemiatrix', label: '빈데미아트릭스', description: 'Gentle' },
  { id: 'Achird', label: '아키르드', description: 'Friendly' },
  { id: 'Sadachbia', label: '사다크비아', description: 'Lively' },
  { id: 'Puck', label: '퍽', description: 'Upbeat' },
  { id: 'Kore', label: '코레', description: 'Firm' },
  { id: 'Achernar', label: '아케르나르', description: 'Soft' },
  { id: 'Zephyr', label: '제피르', description: 'Bright' },
  { id: 'Aoede', label: '아오에데', description: 'Breezy' },
] as const;

export const IMAGE_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    label: 'Nano Banana',
    description: '빠르고 효율적, 대량 생성에 적합',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    label: 'Nano Banana 2',
    description: '고효율, 빠른 속도 + 고품질',
  },
  {
    id: 'gemini-3-pro-image-preview',
    label: 'Nano Banana Pro',
    description: '최고 품질, 복잡한 지시 이해력 우수',
  },
  {
    id: 'imagen-4.0-fast-generate-001',
    label: 'Imagen 4 Fast',
    description: '텍스트→이미지 특화, 초고속 생성',
  },
  {
    id: 'imagen-4.0-generate-001',
    label: 'Imagen 4',
    description: '텍스트→이미지 특화, 고품질 2K',
  },
  {
    id: 'imagen-4.0-ultra-generate-001',
    label: 'Imagen 4 Ultra',
    description: '최고 품질 2K, 텍스트 렌더링 우수',
  },
] as const;
export type ImageModelId = (typeof IMAGE_MODELS)[number]['id'];

export const DEFAULT_IMAGE_MODEL = 'gemini-3.1-flash-image-preview' satisfies ImageModelId;

export const TEXT_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '빠르고 효율적' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: '고품질, 정교한 추론' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: '차세대 빠른 모델' },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', description: '차세대 고급 추론' },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    description: '최신, 100만 토큰 컨텍스트',
  },
] as const;
export type TextModelId = (typeof TEXT_MODELS)[number]['id'];
export const DEFAULT_TEXT_MODEL = 'gemini-3.1-pro-preview' satisfies TextModelId;

export const MAX_IMAGE_HISTORY = 10;
export const MAX_FILE_SIZE_MB = 5;

// === Phonics 상수 ===

export const PHONICS_LANGUAGES = [
  { id: 'english' as const, label: '영어 파닉스' },
  { id: 'korean' as const, label: '한글 파닉스' },
] as const;

export const ENGLISH_PHONICS_CURRICULUM = [
  // === 1권: Single Letter Sounds — 알파벳 개별 음가 ===
  {
    level: 'book1',
    name: 'Book 1: Single Letter Sounds',
    description: '알파벳 Aa~Zz 개별 음가 (initial sounds)',
    units: [
      {
        id: 'en-b1-u1',
        title: 'Unit 1: Aa Bb Cc',
        phonemes: ['a', 'b', 'c'],
        patterns: ['initial sounds'],
        sampleWords: ['alligator', 'ant', 'apple', 'bag', 'bat', 'book', 'cap', 'cat', 'cup'],
      },
      {
        id: 'en-b1-u2',
        title: 'Unit 2: Dd Ee Ff',
        phonemes: ['d', 'e', 'f'],
        patterns: ['initial sounds'],
        sampleWords: ['desk', 'dog', 'duck', 'egg', 'elbow', 'elephant', 'fan', 'fish', 'fork'],
      },
      {
        id: 'en-b1-u3',
        title: 'Unit 3: Gg Hh Ii',
        phonemes: ['g', 'h', 'i'],
        patterns: ['initial sounds'],
        sampleWords: ['game', 'gift', 'gorilla', 'hand', 'hat', 'hippo', 'igloo', 'iguana', 'ink'],
      },
      {
        id: 'en-b1-u4',
        title: 'Unit 4: Jj Kk Ll',
        phonemes: ['j', 'k', 'l'],
        patterns: ['initial sounds'],
        sampleWords: ['jacket', 'jam', 'jet', 'key', 'king', 'kiwi', 'lamp', 'lemon', 'lion'],
      },
      {
        id: 'en-b1-u5',
        title: 'Unit 5: Mm Nn Oo',
        phonemes: ['m', 'n', 'o'],
        patterns: ['initial sounds'],
        sampleWords: ['map', 'melon', 'mouse', 'nest', 'net', 'nut', 'octopus', 'ostrich', 'ox'],
      },
      {
        id: 'en-b1-u6',
        title: 'Unit 6: Pp Qq Rr',
        phonemes: ['p', 'q', 'r'],
        patterns: ['initial sounds'],
        sampleWords: [
          'panda',
          'pen',
          'piano',
          'queen',
          'question',
          'quiet',
          'rabbit',
          'ring',
          'robot',
        ],
      },
      {
        id: 'en-b1-u7',
        title: 'Unit 7: Ss Tt Uu Vv',
        phonemes: ['s', 't', 'u', 'v'],
        patterns: ['initial sounds'],
        sampleWords: [
          'sand',
          'sock',
          'sun',
          'ten',
          'tiger',
          'top',
          'umbrella',
          'under',
          'up',
          'vase',
          'vest',
          'violin',
        ],
      },
      {
        id: 'en-b1-u8',
        title: 'Unit 8: Ww Xx Yy Zz',
        phonemes: ['w', 'x', 'y', 'z'],
        patterns: ['initial sounds'],
        sampleWords: [
          'watch',
          'watermelon',
          'window',
          'box',
          'fox',
          'six',
          'yacht',
          'yellow',
          'yo-yo',
          'zebra',
          'zero',
          'zoo',
        ],
      },
    ],
  },
  // === 2권: Short Vowels — 단모음 CVC ===
  {
    level: 'book2',
    name: 'Book 2: Short Vowels',
    description: '단모음 CVC 단어 (word families)',
    units: [
      {
        id: 'en-b2-u1',
        title: 'Unit 1: Short Vowel a (1)',
        phonemes: ['short-a'],
        patterns: ['_an', '_at'],
        sampleWords: ['can', 'fan', 'man', 'pan', 'bat', 'cat', 'hat', 'mat'],
      },
      {
        id: 'en-b2-u2',
        title: 'Unit 2: Short Vowel a (2)',
        phonemes: ['short-a'],
        patterns: ['_ap', '_ad', '_am'],
        sampleWords: ['cap', 'lap', 'map', 'tap', 'dad', 'sad', 'dam', 'jam'],
      },
      {
        id: 'en-b2-u3',
        title: 'Unit 3: Short Vowel i (1)',
        phonemes: ['short-i'],
        patterns: ['_ip', '_it', '_ix'],
        sampleWords: ['dip', 'hip', 'lip', 'rip', 'hit', 'sit', 'mix', 'six'],
      },
      {
        id: 'en-b2-u4',
        title: 'Unit 4: Short Vowel i (2)',
        phonemes: ['short-i'],
        patterns: ['_ib', '_id', '_ig', '_in'],
        sampleWords: ['bib', 'rib', 'kid', 'lid', 'dig', 'wig', 'fin', 'pin'],
      },
      {
        id: 'en-b2-u5',
        title: 'Unit 5: Short Vowel e',
        phonemes: ['short-e'],
        patterns: ['_et', '_ed', '_en'],
        sampleWords: ['jet', 'net', 'vet', 'wet', 'bed', 'red', 'hen', 'pen'],
      },
      {
        id: 'en-b2-u6',
        title: 'Unit 6: Short Vowel o',
        phonemes: ['short-o'],
        patterns: ['_og', '_op', '_ot', '_ox'],
        sampleWords: ['dog', 'log', 'hop', 'mop', 'hot', 'pot', 'box', 'fox'],
      },
      {
        id: 'en-b2-u7',
        title: 'Unit 7: Short Vowel u (1)',
        phonemes: ['short-u'],
        patterns: ['_ug', '_ub', '_up'],
        sampleWords: ['bug', 'hug', 'mug', 'rug', 'rub', 'tub', 'cup', 'pup'],
      },
      {
        id: 'en-b2-u8',
        title: 'Unit 8: Short Vowel u (2)',
        phonemes: ['short-u'],
        patterns: ['_un', '_ud', '_ut'],
        sampleWords: ['bun', 'fun', 'run', 'sun', 'bud', 'mud', 'cut', 'nut'],
      },
    ],
  },
  // === 3권: Long Vowels — 장모음 Magic e ===
  {
    level: 'book3',
    name: 'Book 3: Long Vowels (Magic e)',
    description: 'Magic e 장모음 CVCe 단어',
    units: [
      {
        id: 'en-b3-u1',
        title: 'Unit 1: Long Vowel a (1)',
        phonemes: ['long-a'],
        patterns: ['_ake', '_ape', '_ave'],
        sampleWords: ['bake', 'cake', 'lake', 'rake', 'cape', 'tape', 'cave', 'wave'],
      },
      {
        id: 'en-b3-u2',
        title: 'Unit 2: Long Vowel a (2)',
        phonemes: ['long-a'],
        patterns: ['_ame', '_ane', '_ase', '_ate'],
        sampleWords: ['game', 'name', 'came', 'lane', 'case', 'vase', 'date', 'gate'],
      },
      {
        id: 'en-b3-u3',
        title: 'Unit 3: Long Vowel i (1)',
        phonemes: ['long-i'],
        patterns: ['_ine', '_ike', '_ime'],
        sampleWords: ['line', 'nine', 'pine', 'vine', 'bike', 'hike', 'lime', 'time'],
      },
      {
        id: 'en-b3-u4',
        title: 'Unit 4: Long Vowel i (2)',
        phonemes: ['long-i'],
        patterns: ['_ide', '_ipe', '_ite', '_ive'],
        sampleWords: ['hide', 'ride', 'pipe', 'wipe', 'bite', 'kite', 'dive', 'five'],
      },
      {
        id: 'en-b3-u5',
        title: 'Unit 5: Long Vowel o (1)',
        phonemes: ['long-o'],
        patterns: ['_ose', '_ope', '_ote'],
        sampleWords: ['hose', 'nose', 'pose', 'rose', 'hope', 'rope', 'note', 'vote'],
      },
      {
        id: 'en-b3-u6',
        title: 'Unit 6: Long Vowel o (2)',
        phonemes: ['long-o'],
        patterns: ['_ole', '_ome', '_one'],
        sampleWords: ['hole', 'mole', 'pole', 'sole', 'dome', 'home', 'bone', 'cone'],
      },
      {
        id: 'en-b3-u7',
        title: 'Unit 7: Long Vowel u',
        phonemes: ['long-u'],
        patterns: ['_ube', '_ute', '_une', '_ule'],
        sampleWords: ['cube', 'tube', 'cute', 'mute', 'dune', 'June', 'tune', 'mule'],
      },
    ],
  },
  // === 4권: Consonant Blends & Digraphs ===
  {
    level: 'book4',
    name: 'Book 4: Consonant Blends & Digraphs',
    description: '자음군(bl, cr, st...) + 이중자음(ch, sh, th, ph, wh)',
    units: [
      {
        id: 'en-b4-u1',
        title: 'Unit 1: bl cl fl',
        phonemes: ['bl', 'cl', 'fl'],
        patterns: ['bl_', 'cl_', 'fl_'],
        sampleWords: [
          'black',
          'blade',
          'block',
          'blue',
          'clam',
          'clap',
          'cliff',
          'clock',
          'flag',
          'flame',
          'flap',
          'flute',
        ],
      },
      {
        id: 'en-b4-u2',
        title: 'Unit 2: br cr fr',
        phonemes: ['br', 'cr', 'fr'],
        patterns: ['br_', 'cr_', 'fr_'],
        sampleWords: [
          'brake',
          'brave',
          'brick',
          'bride',
          'crab',
          'crack',
          'crane',
          'crib',
          'frame',
          'frog',
          'front',
          'frost',
        ],
      },
      {
        id: 'en-b4-u3',
        title: 'Unit 3: gl pl sl',
        phonemes: ['gl', 'pl', 'sl'],
        patterns: ['gl_', 'pl_', 'sl_'],
        sampleWords: [
          'glass',
          'globe',
          'glove',
          'glue',
          'plane',
          'plant',
          'plate',
          'plum',
          'sled',
          'slice',
          'slide',
          'slim',
        ],
      },
      {
        id: 'en-b4-u4',
        title: 'Unit 4: dr pr tr',
        phonemes: ['dr', 'pr', 'tr'],
        patterns: ['dr_', 'pr_', 'tr_'],
        sampleWords: [
          'dragon',
          'dress',
          'drive',
          'drum',
          'press',
          'price',
          'print',
          'prize',
          'trace',
          'track',
          'truck',
          'tree',
        ],
      },
      {
        id: 'en-b4-u5',
        title: 'Unit 5: sm sn st sw',
        phonemes: ['sm', 'sn', 'st', 'sw'],
        patterns: ['sm_', 'sn_', 'st_', 'sw_'],
        sampleWords: [
          'smell',
          'smile',
          'smoke',
          'snack',
          'snake',
          'snore',
          'stone',
          'stop',
          'stove',
          'swan',
          'sweet',
          'swim',
        ],
      },
      {
        id: 'en-b4-u6',
        title: 'Unit 6: ng nk',
        phonemes: ['ng', 'nk'],
        patterns: ['_ng', '_nk'],
        sampleWords: [
          'bang',
          'fang',
          'king',
          'ring',
          'long',
          'song',
          'bank',
          'rank',
          'pink',
          'wink',
          'dunk',
          'junk',
        ],
      },
      {
        id: 'en-b4-u7',
        title: 'Unit 7: ch sh',
        phonemes: ['ch', 'sh'],
        patterns: ['ch_', '_ch', 'sh_', '_sh'],
        sampleWords: [
          'cherry',
          'chin',
          'bench',
          'branch',
          'catch',
          'shape',
          'ship',
          'shop',
          'brush',
          'fish',
          'wash',
        ],
      },
      {
        id: 'en-b4-u8',
        title: 'Unit 8: ph th wh',
        phonemes: ['ph', 'th', 'wh'],
        patterns: ['ph_', 'th_', 'wh_'],
        sampleWords: [
          'phone',
          'photo',
          'dolphin',
          'elephant',
          'thick',
          'thin',
          'bath',
          'teeth',
          'whale',
          'wheel',
          'whisper',
          'white',
        ],
      },
    ],
  },
  // === 5권: Double Letter Vowels & R-Controlled Vowels ===
  {
    level: 'book5',
    name: 'Book 5: Double Letter Vowels & R-Controlled',
    description: '이중모음(ee, ea, ai, ay, oi, oy, ow, ou) + R-통제 모음(ar, or, ir, er, ur)',
    units: [
      {
        id: 'en-b5-u1',
        title: 'Unit 1: ee ea (/iː/)',
        phonemes: ['ee', 'ea'],
        patterns: ['ee', 'ea'],
        sampleWords: [
          'bee',
          'feet',
          'green',
          'peel',
          'seed',
          'tree',
          'leaf',
          'meat',
          'peanut',
          'sea',
          'seal',
          'tea',
        ],
      },
      {
        id: 'en-b5-u2',
        title: 'Unit 2: oa ow (/oʊ/)',
        phonemes: ['oa', 'ow'],
        patterns: ['oa', 'ow'],
        sampleWords: [
          'boat',
          'coat',
          'goat',
          'road',
          'soap',
          'toast',
          'blow',
          'bowl',
          'pillow',
          'snow',
          'window',
        ],
      },
      {
        id: 'en-b5-u3',
        title: 'Unit 3: ai ay (/eɪ/)',
        phonemes: ['ai', 'ay'],
        patterns: ['ai', 'ay'],
        sampleWords: [
          'mail',
          'nail',
          'rail',
          'rain',
          'tail',
          'train',
          'clay',
          'gray',
          'hay',
          'play',
          'pray',
          'tray',
        ],
      },
      {
        id: 'en-b5-u4',
        title: 'Unit 4: oi oy (/ɔɪ/)',
        phonemes: ['oi', 'oy'],
        patterns: ['oi', 'oy'],
        sampleWords: [
          'boil',
          'coil',
          'coin',
          'foil',
          'oil',
          'point',
          'soil',
          'toilet',
          'boy',
          'joy',
          'soybean',
          'toy',
        ],
      },
      {
        id: 'en-b5-u5',
        title: 'Unit 5: ow ou (/aʊ/)',
        phonemes: ['ow', 'ou'],
        patterns: ['ow', 'ou'],
        sampleWords: [
          'brown',
          'clown',
          'cow',
          'crown',
          'gown',
          'owl',
          'blouse',
          'cloud',
          'count',
          'house',
          'mouse',
          'mouth',
        ],
      },
      {
        id: 'en-b5-u6',
        title: 'Unit 6: ir er ur (/ɜːr/)',
        phonemes: ['ir', 'er', 'ur'],
        patterns: ['ir', 'er', 'ur'],
        sampleWords: [
          'bird',
          'girl',
          'shirt',
          'skirt',
          'letter',
          'singer',
          'soccer',
          'teacher',
          'nurse',
          'purple',
          'purse',
          'turtle',
        ],
      },
      {
        id: 'en-b5-u7',
        title: 'Unit 7: ar or',
        phonemes: ['ar', 'or'],
        patterns: ['ar', 'or'],
        sampleWords: [
          'arm',
          'car',
          'card',
          'farmer',
          'park',
          'star',
          'cork',
          'corn',
          'fork',
          'horse',
          'north',
          'store',
        ],
      },
      {
        id: 'en-b5-u8',
        title: 'Unit 8: oo (/ʊ/ & /uː/)',
        phonemes: ['oo'],
        patterns: ['oo'],
        sampleWords: [
          'book',
          'cook',
          'foot',
          'hook',
          'look',
          'wood',
          'food',
          'goose',
          'moon',
          'pool',
          'spoon',
          'zoo',
        ],
      },
    ],
  },
] as const;

export const KOREAN_PHONICS_CURRICULUM = [
  {
    level: 'hangul1',
    name: '한글1: 기본음절',
    description: '모음과 자음(ㄱ~ㅎ) 기본 음절 학습',
    units: [
      {
        id: 'kr-h1-u1',
        title: 'unit 1: 모음 배우기',
        phonemes: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
        patterns: ['모음'],
        sampleWords: [],
        blending: [],
      },
      {
        id: 'kr-h1-u2',
        title: 'unit 2: ㄱ 배우기',
        phonemes: ['ㄱ'],
        patterns: ['자음+모음'],
        sampleWords: ['고기', '가구', '아기', '야구'],
        blending: [
          ['ㄱ', 'ㅏ', '가'],
          ['ㄱ', 'ㅑ', '갸'],
          ['ㄱ', 'ㅓ', '거'],
          ['ㄱ', 'ㅕ', '겨'],
          ['ㄱ', 'ㅗ', '고'],
          ['ㄱ', 'ㅛ', '교'],
          ['ㄱ', 'ㅜ', '구'],
          ['ㄱ', 'ㅠ', '규'],
          ['ㄱ', 'ㅡ', '그'],
          ['ㄱ', 'ㅣ', '기'],
        ],
      },
      {
        id: 'kr-h1-u3',
        title: 'unit 3: ㄴ 배우기',
        phonemes: ['ㄴ'],
        patterns: ['자음+모음'],
        sampleWords: ['나', '너', '누나', '누구야'],
        blending: [
          ['ㄴ', 'ㅏ', '나'],
          ['ㄴ', 'ㅑ', '냐'],
          ['ㄴ', 'ㅓ', '너'],
          ['ㄴ', 'ㅕ', '녀'],
          ['ㄴ', 'ㅗ', '노'],
          ['ㄴ', 'ㅛ', '뇨'],
          ['ㄴ', 'ㅜ', '누'],
          ['ㄴ', 'ㅠ', '뉴'],
          ['ㄴ', 'ㅡ', '느'],
          ['ㄴ', 'ㅣ', '니'],
        ],
      },
      {
        id: 'kr-h1-u4',
        title: 'unit 4: ㄷ 배우기',
        phonemes: ['ㄷ'],
        patterns: ['자음+모음'],
        sampleWords: ['두유', '도마', '기도', '구두'],
        blending: [
          ['ㄷ', 'ㅏ', '다'],
          ['ㄷ', 'ㅑ', '댜'],
          ['ㄷ', 'ㅓ', '더'],
          ['ㄷ', 'ㅕ', '뎌'],
          ['ㄷ', 'ㅗ', '도'],
          ['ㄷ', 'ㅛ', '됴'],
          ['ㄷ', 'ㅜ', '두'],
          ['ㄷ', 'ㅠ', '듀'],
          ['ㄷ', 'ㅡ', '드'],
          ['ㄷ', 'ㅣ', '디'],
        ],
      },
      {
        id: 'kr-h1-u5',
        title: 'unit 5: ㄹ 배우기',
        phonemes: ['ㄹ'],
        patterns: ['자음+모음'],
        sampleWords: ['오리', '너구리', '다리', '노루'],
        blending: [
          ['ㄹ', 'ㅏ', '라'],
          ['ㄹ', 'ㅑ', '랴'],
          ['ㄹ', 'ㅓ', '러'],
          ['ㄹ', 'ㅕ', '려'],
          ['ㄹ', 'ㅗ', '로'],
          ['ㄹ', 'ㅛ', '료'],
          ['ㄹ', 'ㅜ', '루'],
          ['ㄹ', 'ㅠ', '류'],
          ['ㄹ', 'ㅡ', '르'],
          ['ㄹ', 'ㅣ', '리'],
        ],
      },
      {
        id: 'kr-h1-u6',
        title: 'unit 6: ㅁ 배우기',
        phonemes: ['ㅁ'],
        patterns: ['자음+모음'],
        sampleWords: ['머리', '모두', '모기', '거미'],
        blending: [
          ['ㅁ', 'ㅏ', '마'],
          ['ㅁ', 'ㅑ', '먀'],
          ['ㅁ', 'ㅓ', '머'],
          ['ㅁ', 'ㅕ', '며'],
          ['ㅁ', 'ㅗ', '모'],
          ['ㅁ', 'ㅛ', '묘'],
          ['ㅁ', 'ㅜ', '무'],
          ['ㅁ', 'ㅠ', '뮤'],
          ['ㅁ', 'ㅡ', '므'],
          ['ㅁ', 'ㅣ', '미'],
        ],
      },
      {
        id: 'kr-h1-u7',
        title: 'unit 7: ㅂ 배우기',
        phonemes: ['ㅂ'],
        patterns: ['자음+모음'],
        sampleWords: ['바다', '비누', '나비', '두부'],
        blending: [
          ['ㅂ', 'ㅏ', '바'],
          ['ㅂ', 'ㅑ', '뱌'],
          ['ㅂ', 'ㅓ', '버'],
          ['ㅂ', 'ㅕ', '벼'],
          ['ㅂ', 'ㅗ', '보'],
          ['ㅂ', 'ㅛ', '뵤'],
          ['ㅂ', 'ㅜ', '부'],
          ['ㅂ', 'ㅠ', '뷰'],
          ['ㅂ', 'ㅡ', '브'],
          ['ㅂ', 'ㅣ', '비'],
        ],
      },
      {
        id: 'kr-h1-u8',
        title: 'unit 8: ㅅ 배우기',
        phonemes: ['ㅅ'],
        patterns: ['자음+모음'],
        sampleWords: ['사자', '버스', '가수', '미소'],
        blending: [
          ['ㅅ', 'ㅏ', '사'],
          ['ㅅ', 'ㅑ', '샤'],
          ['ㅅ', 'ㅓ', '서'],
          ['ㅅ', 'ㅕ', '셔'],
          ['ㅅ', 'ㅗ', '소'],
          ['ㅅ', 'ㅛ', '쇼'],
          ['ㅅ', 'ㅜ', '수'],
          ['ㅅ', 'ㅠ', '슈'],
          ['ㅅ', 'ㅡ', '스'],
          ['ㅅ', 'ㅣ', '시'],
        ],
      },
      {
        id: 'kr-h1-u9',
        title: 'unit 9: ㅇ 배우기',
        phonemes: ['ㅇ'],
        patterns: ['자음+모음'],
        sampleWords: ['우주', '여우', '우유', '어부'],
        blending: [
          ['ㅇ', 'ㅏ', '아'],
          ['ㅇ', 'ㅑ', '야'],
          ['ㅇ', 'ㅓ', '어'],
          ['ㅇ', 'ㅕ', '여'],
          ['ㅇ', 'ㅗ', '오'],
          ['ㅇ', 'ㅛ', '요'],
          ['ㅇ', 'ㅜ', '우'],
          ['ㅇ', 'ㅠ', '유'],
          ['ㅇ', 'ㅡ', '으'],
          ['ㅇ', 'ㅣ', '이'],
        ],
      },
      {
        id: 'kr-h1-u10',
        title: 'unit 10: ㅈ 배우기',
        phonemes: ['ㅈ'],
        patterns: ['자음+모음'],
        sampleWords: ['지구', '지도', '자두', '모자'],
        blending: [
          ['ㅈ', 'ㅏ', '자'],
          ['ㅈ', 'ㅑ', '쟈'],
          ['ㅈ', 'ㅓ', '저'],
          ['ㅈ', 'ㅕ', '져'],
          ['ㅈ', 'ㅗ', '조'],
          ['ㅈ', 'ㅛ', '죠'],
          ['ㅈ', 'ㅜ', '주'],
          ['ㅈ', 'ㅠ', '쥬'],
          ['ㅈ', 'ㅡ', '즈'],
          ['ㅈ', 'ㅣ', '지'],
        ],
      },
      {
        id: 'kr-h1-u11',
        title: 'unit 11: ㅊ 배우기',
        phonemes: ['ㅊ'],
        patterns: ['자음+모음'],
        sampleWords: ['치마', '치즈', '마차', '기차'],
        blending: [
          ['ㅊ', 'ㅏ', '차'],
          ['ㅊ', 'ㅑ', '챠'],
          ['ㅊ', 'ㅓ', '처'],
          ['ㅊ', 'ㅕ', '쳐'],
          ['ㅊ', 'ㅗ', '초'],
          ['ㅊ', 'ㅛ', '쵸'],
          ['ㅊ', 'ㅜ', '추'],
          ['ㅊ', 'ㅠ', '츄'],
          ['ㅊ', 'ㅡ', '츠'],
          ['ㅊ', 'ㅣ', '치'],
        ],
      },
      {
        id: 'kr-h1-u12',
        title: 'unit 12: ㅋ 배우기',
        phonemes: ['ㅋ'],
        patterns: ['자음+모음'],
        sampleWords: ['쿠키', '코코아', '마이크', '카드'],
        blending: [
          ['ㅋ', 'ㅏ', '카'],
          ['ㅋ', 'ㅑ', '캬'],
          ['ㅋ', 'ㅓ', '커'],
          ['ㅋ', 'ㅕ', '켜'],
          ['ㅋ', 'ㅗ', '코'],
          ['ㅋ', 'ㅛ', '쿄'],
          ['ㅋ', 'ㅜ', '쿠'],
          ['ㅋ', 'ㅠ', '큐'],
          ['ㅋ', 'ㅡ', '크'],
          ['ㅋ', 'ㅣ', '키'],
        ],
      },
      {
        id: 'kr-h1-u13',
        title: 'unit 13: ㅌ 배우기',
        phonemes: ['ㅌ'],
        patterns: ['자음+모음'],
        sampleWords: ['타조', '하트', '기타', '치타'],
        blending: [
          ['ㅌ', 'ㅏ', '타'],
          ['ㅌ', 'ㅑ', '탸'],
          ['ㅌ', 'ㅓ', '터'],
          ['ㅌ', 'ㅕ', '텨'],
          ['ㅌ', 'ㅗ', '토'],
          ['ㅌ', 'ㅛ', '툐'],
          ['ㅌ', 'ㅜ', '투'],
          ['ㅌ', 'ㅠ', '튜'],
          ['ㅌ', 'ㅡ', '트'],
          ['ㅌ', 'ㅣ', '티'],
        ],
      },
      {
        id: 'kr-h1-u14',
        title: 'unit 14: ㅍ 배우기',
        phonemes: ['ㅍ'],
        patterns: ['자음+모음'],
        sampleWords: ['피자', '파리', '포도', '소파'],
        blending: [
          ['ㅍ', 'ㅏ', '파'],
          ['ㅍ', 'ㅑ', '퍄'],
          ['ㅍ', 'ㅓ', '퍼'],
          ['ㅍ', 'ㅕ', '펴'],
          ['ㅍ', 'ㅗ', '포'],
          ['ㅍ', 'ㅛ', '표'],
          ['ㅍ', 'ㅜ', '푸'],
          ['ㅍ', 'ㅠ', '퓨'],
          ['ㅍ', 'ㅡ', '프'],
          ['ㅍ', 'ㅣ', '피'],
        ],
      },
      {
        id: 'kr-h1-u15',
        title: 'unit 15: ㅎ 배우기',
        phonemes: ['ㅎ'],
        patterns: ['자음+모음'],
        sampleWords: ['하마', '호두', '휴지', '호수'],
        blending: [
          ['ㅎ', 'ㅏ', '하'],
          ['ㅎ', 'ㅑ', '햐'],
          ['ㅎ', 'ㅓ', '허'],
          ['ㅎ', 'ㅕ', '혀'],
          ['ㅎ', 'ㅗ', '호'],
          ['ㅎ', 'ㅛ', '효'],
          ['ㅎ', 'ㅜ', '후'],
          ['ㅎ', 'ㅠ', '휴'],
          ['ㅎ', 'ㅡ', '흐'],
          ['ㅎ', 'ㅣ', '히'],
        ],
      },
    ],
  },
  {
    level: 'hangul2',
    name: '한글2: 받침',
    description: 'ㅇ, ㄱ, ㄴ, ㄹ, ㅅ, ㅁ, ㅂ 받침 학습',
    units: [
      {
        id: 'kr-h2-u1',
        title: 'unit 1: ㅇ 받침 배우기',
        phonemes: ['받침ㅇ'],
        patterns: ['받침'],
        sampleWords: ['형', '풍당', '농구', '시장'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㅇ', '강'],
          ['ㄴ', 'ㅏ', 'ㅇ', '낭'],
          ['ㄷ', 'ㅏ', 'ㅇ', '당'],
          ['ㄹ', 'ㅏ', 'ㅇ', '랑'],
          ['ㅁ', 'ㅏ', 'ㅇ', '망'],
          ['ㅂ', 'ㅏ', 'ㅇ', '방'],
          ['ㅅ', 'ㅏ', 'ㅇ', '상'],
          ['ㅇ', 'ㅏ', 'ㅇ', '앙'],
          ['ㅈ', 'ㅏ', 'ㅇ', '장'],
          ['ㅊ', 'ㅏ', 'ㅇ', '창'],
          ['ㅋ', 'ㅏ', 'ㅇ', '캉'],
          ['ㅌ', 'ㅏ', 'ㅇ', '탕'],
          ['ㅍ', 'ㅏ', 'ㅇ', '팡'],
          ['ㅎ', 'ㅏ', 'ㅇ', '항'],
        ],
      },
      {
        id: 'kr-h2-u2',
        title: 'unit 2: ㄱ 받침 배우기',
        phonemes: ['받침ㄱ'],
        patterns: ['받침'],
        sampleWords: ['학교', '축구', '악어', '탁구'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㄱ', '각'],
          ['ㄴ', 'ㅏ', 'ㄱ', '낙'],
          ['ㄷ', 'ㅏ', 'ㄱ', '닥'],
          ['ㄹ', 'ㅏ', 'ㄱ', '락'],
          ['ㅁ', 'ㅏ', 'ㄱ', '막'],
          ['ㅂ', 'ㅏ', 'ㄱ', '박'],
          ['ㅅ', 'ㅏ', 'ㄱ', '삭'],
          ['ㅇ', 'ㅏ', 'ㄱ', '악'],
          ['ㅈ', 'ㅏ', 'ㄱ', '작'],
          ['ㅊ', 'ㅏ', 'ㄱ', '착'],
          ['ㅋ', 'ㅏ', 'ㄱ', '칵'],
          ['ㅌ', 'ㅏ', 'ㄱ', '탁'],
          ['ㅍ', 'ㅏ', 'ㄱ', '팍'],
          ['ㅎ', 'ㅏ', 'ㄱ', '학'],
        ],
      },
      {
        id: 'kr-h2-u3',
        title: 'unit 3: ㄴ 받침 배우기',
        phonemes: ['받침ㄴ'],
        patterns: ['받침'],
        sampleWords: ['손', '눈', '언니', '잔디'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㄴ', '간'],
          ['ㄴ', 'ㅏ', 'ㄴ', '난'],
          ['ㄷ', 'ㅏ', 'ㄴ', '단'],
          ['ㄹ', 'ㅏ', 'ㄴ', '란'],
          ['ㅁ', 'ㅏ', 'ㄴ', '만'],
          ['ㅂ', 'ㅏ', 'ㄴ', '반'],
          ['ㅅ', 'ㅏ', 'ㄴ', '산'],
          ['ㅇ', 'ㅏ', 'ㄴ', '안'],
          ['ㅈ', 'ㅏ', 'ㄴ', '잔'],
          ['ㅊ', 'ㅏ', 'ㄴ', '찬'],
          ['ㅋ', 'ㅏ', 'ㄴ', '칸'],
          ['ㅌ', 'ㅏ', 'ㄴ', '탄'],
          ['ㅍ', 'ㅏ', 'ㄴ', '판'],
          ['ㅎ', 'ㅏ', 'ㄴ', '한'],
        ],
      },
      {
        id: 'kr-h2-u4',
        title: 'unit 4: ㄹ 받침 배우기',
        phonemes: ['받침ㄹ'],
        patterns: ['받침'],
        sampleWords: ['별', '달', '하늘', '가을'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㄹ', '갈'],
          ['ㄴ', 'ㅏ', 'ㄹ', '날'],
          ['ㄷ', 'ㅏ', 'ㄹ', '달'],
          ['ㄹ', 'ㅏ', 'ㄹ', '랄'],
          ['ㅁ', 'ㅏ', 'ㄹ', '말'],
          ['ㅂ', 'ㅏ', 'ㄹ', '발'],
          ['ㅅ', 'ㅏ', 'ㄹ', '살'],
          ['ㅇ', 'ㅏ', 'ㄹ', '알'],
          ['ㅈ', 'ㅏ', 'ㄹ', '잘'],
          ['ㅊ', 'ㅏ', 'ㄹ', '찰'],
          ['ㅋ', 'ㅏ', 'ㄹ', '칼'],
          ['ㅌ', 'ㅏ', 'ㄹ', '탈'],
          ['ㅍ', 'ㅏ', 'ㄹ', '팔'],
          ['ㅎ', 'ㅏ', 'ㄹ', '할'],
        ],
      },
      {
        id: 'kr-h2-u5',
        title: 'unit 5: ㅅ 받침 배우기',
        phonemes: ['받침ㅅ'],
        patterns: ['받침'],
        sampleWords: ['옷', '로봇', '비옷', '그릇'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㅅ', '갓'],
          ['ㄴ', 'ㅏ', 'ㅅ', '낫'],
          ['ㄷ', 'ㅏ', 'ㅅ', '닷'],
          ['ㄹ', 'ㅏ', 'ㅅ', '랏'],
          ['ㅁ', 'ㅏ', 'ㅅ', '맛'],
          ['ㅂ', 'ㅏ', 'ㅅ', '밧'],
          ['ㅅ', 'ㅏ', 'ㅅ', '삿'],
          ['ㅇ', 'ㅏ', 'ㅅ', '앗'],
          ['ㅈ', 'ㅏ', 'ㅅ', '잣'],
          ['ㅊ', 'ㅏ', 'ㅅ', '찻'],
          ['ㅋ', 'ㅏ', 'ㅅ', '캇'],
          ['ㅌ', 'ㅏ', 'ㅅ', '탓'],
          ['ㅍ', 'ㅏ', 'ㅅ', '팟'],
          ['ㅎ', 'ㅏ', 'ㅅ', '핫'],
        ],
      },
      {
        id: 'kr-h2-u6',
        title: 'unit 6: ㅁ 받침 배우기',
        phonemes: ['받침ㅁ'],
        patterns: ['받침'],
        sampleWords: ['몸', '엄마', '염소', '구름'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㅁ', '감'],
          ['ㄴ', 'ㅏ', 'ㅁ', '남'],
          ['ㄷ', 'ㅏ', 'ㅁ', '담'],
          ['ㄹ', 'ㅏ', 'ㅁ', '람'],
          ['ㅁ', 'ㅏ', 'ㅁ', '맘'],
          ['ㅂ', 'ㅏ', 'ㅁ', '밤'],
          ['ㅅ', 'ㅏ', 'ㅁ', '삼'],
          ['ㅇ', 'ㅏ', 'ㅁ', '암'],
          ['ㅈ', 'ㅏ', 'ㅁ', '잠'],
          ['ㅊ', 'ㅏ', 'ㅁ', '참'],
          ['ㅋ', 'ㅏ', 'ㅁ', '캄'],
          ['ㅌ', 'ㅏ', 'ㅁ', '탐'],
          ['ㅍ', 'ㅏ', 'ㅁ', '팜'],
          ['ㅎ', 'ㅏ', 'ㅁ', '함'],
        ],
      },
      {
        id: 'kr-h2-u7',
        title: 'unit 7: ㅂ 받침 배우기',
        phonemes: ['받침ㅂ'],
        patterns: ['받침'],
        sampleWords: ['집', '컵', '입술', '김밥'],
        blending: [
          ['ㄱ', 'ㅏ', 'ㅂ', '갑'],
          ['ㄴ', 'ㅏ', 'ㅂ', '납'],
          ['ㄷ', 'ㅏ', 'ㅂ', '답'],
          ['ㄹ', 'ㅏ', 'ㅂ', '랍'],
          ['ㅁ', 'ㅏ', 'ㅂ', '맙'],
          ['ㅂ', 'ㅏ', 'ㅂ', '밥'],
          ['ㅅ', 'ㅏ', 'ㅂ', '삽'],
          ['ㅇ', 'ㅏ', 'ㅂ', '압'],
          ['ㅈ', 'ㅏ', 'ㅂ', '잡'],
          ['ㅊ', 'ㅏ', 'ㅂ', '찹'],
          ['ㅋ', 'ㅏ', 'ㅂ', '캅'],
          ['ㅌ', 'ㅏ', 'ㅂ', '탑'],
          ['ㅍ', 'ㅏ', 'ㅂ', '팝'],
          ['ㅎ', 'ㅏ', 'ㅂ', '합'],
        ],
      },
    ],
  },
  {
    level: 'hangul3',
    name: '한글3: 쌍자음',
    description: 'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ 쌍자음 학습',
    units: [
      {
        id: 'kr-h3-u1',
        title: 'unit 1: ㄲ 배우기',
        phonemes: ['ㄲ'],
        patterns: ['쌍자음'],
        sampleWords: ['꿀벌', '꼬끼오', '토끼', '코끼리'],
        blending: [
          ['ㄲ', 'ㅏ', '까'],
          ['ㄲ', 'ㅑ', '꺄'],
          ['ㄲ', 'ㅓ', '꺼'],
          ['ㄲ', 'ㅕ', '껴'],
          ['ㄲ', 'ㅗ', '꼬'],
          ['ㄲ', 'ㅛ', '꾜'],
          ['ㄲ', 'ㅜ', '꾸'],
          ['ㄲ', 'ㅠ', '뀨'],
          ['ㄲ', 'ㅡ', '끄'],
          ['ㄲ', 'ㅣ', '끼'],
        ],
      },
      {
        id: 'kr-h3-u2',
        title: 'unit 2: ㄸ 배우기',
        phonemes: ['ㄸ'],
        patterns: ['쌍자음'],
        sampleWords: ['떡국', '똑딱', '땅콩', '딸기'],
        blending: [
          ['ㄸ', 'ㅏ', '따'],
          ['ㄸ', 'ㅑ', '땨'],
          ['ㄸ', 'ㅓ', '떠'],
          ['ㄸ', 'ㅕ', '뗘'],
          ['ㄸ', 'ㅗ', '또'],
          ['ㄸ', 'ㅛ', '뚀'],
          ['ㄸ', 'ㅜ', '뚜'],
          ['ㄸ', 'ㅠ', '뜌'],
          ['ㄸ', 'ㅡ', '뜨'],
          ['ㄸ', 'ㅣ', '띠'],
        ],
      },
      {
        id: 'kr-h3-u3',
        title: 'unit 3: ㅃ 배우기',
        phonemes: ['ㅃ'],
        patterns: ['쌍자음'],
        sampleWords: ['오빠', '뽀뽀', '빨래', '아빠'],
        blending: [
          ['ㅃ', 'ㅏ', '빠'],
          ['ㅃ', 'ㅑ', '뺘'],
          ['ㅃ', 'ㅓ', '뻐'],
          ['ㅃ', 'ㅕ', '뼈'],
          ['ㅃ', 'ㅗ', '뽀'],
          ['ㅃ', 'ㅛ', '뾰'],
          ['ㅃ', 'ㅜ', '뿌'],
          ['ㅃ', 'ㅠ', '쀼'],
          ['ㅃ', 'ㅡ', '쁘'],
          ['ㅃ', 'ㅣ', '삐'],
        ],
      },
      {
        id: 'kr-h3-u4',
        title: 'unit 4: ㅆ 배우기',
        phonemes: ['ㅆ'],
        patterns: ['쌍자음'],
        sampleWords: ['씨앗', '새싹', '쓱싹', '썰매'],
        blending: [
          ['ㅆ', 'ㅏ', '싸'],
          ['ㅆ', 'ㅑ', '쌰'],
          ['ㅆ', 'ㅓ', '써'],
          ['ㅆ', 'ㅕ', '쎠'],
          ['ㅆ', 'ㅗ', '쏘'],
          ['ㅆ', 'ㅛ', '쑈'],
          ['ㅆ', 'ㅜ', '쑤'],
          ['ㅆ', 'ㅠ', '쓔'],
          ['ㅆ', 'ㅡ', '쓰'],
          ['ㅆ', 'ㅣ', '씨'],
        ],
      },
      {
        id: 'kr-h3-u5',
        title: 'unit 5: ㅉ 배우기',
        phonemes: ['ㅉ'],
        patterns: ['쌍자음'],
        sampleWords: ['찐빵', '짝꿍', '쫑긋', '쪽지'],
        blending: [
          ['ㅉ', 'ㅏ', '짜'],
          ['ㅉ', 'ㅑ', '쨔'],
          ['ㅉ', 'ㅓ', '쩌'],
          ['ㅉ', 'ㅕ', '쪄'],
          ['ㅉ', 'ㅗ', '쪼'],
          ['ㅉ', 'ㅛ', '쬬'],
          ['ㅉ', 'ㅜ', '쭈'],
          ['ㅉ', 'ㅠ', '쮸'],
          ['ㅉ', 'ㅡ', '쯔'],
          ['ㅉ', 'ㅣ', '찌'],
        ],
      },
    ],
  },
  {
    level: 'hangul4',
    name: '한글4: 복잡한 모음',
    description: 'ㅐ, ㅔ, ㅖ, ㅟ, ㅚ, ㅘ, ㅙ, ㅝ, ㅞ, ㅢ 복잡한 모음 학습',
    units: [
      {
        id: 'kr-h4-u1',
        title: 'unit 1: ㅐ, ㅔ 배우기',
        phonemes: ['ㅐ', 'ㅔ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['고래', '동생', '레몬', '베개'],
        blending: [],
      },
      {
        id: 'kr-h4-u2',
        title: 'unit 2: ㅖ, ㅚ 배우기',
        phonemes: ['ㅖ', 'ㅚ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['계란', '예절', '시계', '얘기'],
        blending: [],
      },
      {
        id: 'kr-h4-u3',
        title: 'unit 3: ㅟ, ㅢ 배우기',
        phonemes: ['ㅟ', 'ㅢ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['참의', '열쇠', '생쥐', '가위'],
        blending: [],
      },
      {
        id: 'kr-h4-u4',
        title: 'unit 4: ㅘ, ㅙ 배우기',
        phonemes: ['ㅘ', 'ㅙ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['과자', '사과', '화가', '횃불'],
        blending: [],
      },
      {
        id: 'kr-h4-u5',
        title: 'unit 5: ㅝ, ㅞ, ㅢ 배우기',
        phonemes: ['ㅝ', 'ㅞ', 'ㅢ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['권투', '스웨터', '의자', '의사'],
        blending: [],
      },
    ],
  },
] as const;

export type PhonicsLanguage = 'english' | 'korean';
export type EnglishPhonicsLevel = (typeof ENGLISH_PHONICS_CURRICULUM)[number]['level'];
export type KoreanPhonicsLevel = (typeof KOREAN_PHONICS_CURRICULUM)[number]['level'];

/** 한글 숲 친구들 — 유닛별 기본 스토리 테마 + 등장 캐릭터 (12지신) */
export const KOREAN_UNIT_STORY_DEFAULTS: Record<
  string,
  { storyTheme: string; characterNames: string[] }
> = {
  // ── 한글1: 기본음절 ──
  'kr-h1-u1': {
    storyTheme:
      '글자 초원의 꽃잎 편지 — 장소: 글자 초원(Letter Meadow). 봄의 글자 초원에서 호돌이, 몽실이, 깡충이가 소풍을 갔어요. 봄바람이 불더니 다섯 색깔의 꽃잎이 날아왔어요. 꽃잎마다 모음이 새겨져 있어요! "ㅏ!" "ㅓ!" 소리를 치니 꽃잎들이 빛나기 시작했어요. 10개의 기본 모음을 모두 모으면 숲이 무지개가 됩니다.',
    characterNames: ['호돌이', '몽실이', '깡충이'],
  },
  'kr-h1-u2': {
    storyTheme:
      '속삭임 나무의 ㄱ 비밀 — 장소: 속삭임 나무(Whisper Tree). 호돌이와 재재이가 숲에서 가장 오래된 속삭임 나무를 발견했어요. 나무껍질에 이상한 글자가 있어서 귀를 대니까 "그~" 소리가 들렸어요! "ㄱ!" 하며 소리를 따라하니 나무가 빛나며 "고기", "가구", "아기", "야구" 단어를 발견했어요!',
    characterNames: ['호돌이', '재재이'],
  },
  'kr-h1-u3': {
    storyTheme:
      '글자 다리의 나무 계단 — 장소: 글자 다리(Letter Bridge). 호돌이와 멍멍이가 시냇물을 건너려고 글자 다리를 찾았어요. 다리 위 돌멩이에 "ㄴ"이 빛나며 소리가 났어요! 돌을 밟을 때마다 나~니 소리가 울리며 "나", "너", "누나", "누구야" 단어를 발견하여 다리를 건넜어요.',
    characterNames: ['호돌이', '멍멍이'],
  },
  'kr-h1-u4': {
    storyTheme:
      '바람 언덕의 달리기 대회 — 장소: 바람 언덕(Wind Hill). 달리기를 좋아하는 꼬꼬가 바람 언덕에서 달리기 대회를 열었어요. 달달이가 "히히힝!" 하면서 언덕을 달릴 때마다 발자국에서 ㄷ 글자가 나타나요! "두유", "도마", "기도", "구두" 단어로 오늘 학습 완성!',
    characterNames: ['달달이', '꼬꼬'],
  },
  'kr-h1-u5': {
    storyTheme:
      '별빛 연못의 물결 글자 — 장소: 별빛 연못(Starlight Pond). 달밤에 음메가 별빛 연못가에서 쉬고 있었어요. 깡충이가 연못에 돌을 "퐁!" 하며 던지니 물결에서 ㄹ 모양의 빛나는 글자가 나타났어요! "오리", "너구리", "다리", "노루" 단어를 물결 위에서 발견했어요.',
    characterNames: ['깡충이', '음메'],
  },
  'kr-h1-u6': {
    storyTheme:
      '꿀 폭포에서 찾은 ㅁ — 장소: 꿀 폭포(Honey Falls). 음메와 꿀꿀이가 꿀 폭포로 놀러 갔어요. 폭포에서 "뚝!" 물방울이 흘러와서 "ㅁ"이 나타나요! "머리", "모두", "모기", "거미" 단어를 폭포 소리로 익혔어요.',
    characterNames: ['음메', '꿀꿀이'],
  },
  'kr-h1-u7': {
    storyTheme:
      '구름 언덕의 바람 글자 — 장소: 구름 언덕(Cloud Hill). 구름을 좋아하는 몽실이가 구름 언덕에 올라갔어요. 구름들이 "ㅂ" 모양으로 변하기 시작했어요! 꿀꿀이와 함께 "바다", "비누", "나비", "두부"를 구름으로 그리며 배웠어요.',
    characterNames: ['꿀꿀이', '몽실이'],
  },
  'kr-h1-u8': {
    storyTheme:
      '속삭임 나무의 스르르 선생님 — 장소: 속삭임 나무(Whisper Tree). 조용한 스르르가 오늘은 선생님이에요! 나뭇잎이 바람에 스치는 소리 "스~" 에서 ㅅ을 발견했어요. "사자", "버스", "가수", "미소" — 스르르가 나뭇잎 글자를 새겨주었어요.',
    characterNames: ['스르르', '호돌이'],
  },
  'kr-h1-u9': {
    storyTheme:
      '메아리 동굴의 울림 소리 — 장소: 메아리 동굴(Echo Cave). 용용이가 호돌이를 데리고 메아리 동굴로 들어갔어요. "오~" 소리를 내자 동굴 벽에서 빛나는 ㅇ 글자가 나타났어요! "우주", "여우", "우유", "어부" 단어를 메아리로 배웠어요.',
    characterNames: ['용용이', '호돌이'],
  },
  'kr-h1-u10': {
    storyTheme:
      '글자 다리의 찍찍이 탐정 — 장소: 글자 다리(Letter Bridge). 찍찍이가 탐정 모자를 쓰고 글자 다리를 탐험했어요! 돌멩이 사이에 "ㅈ"이 숨어있었어요. 깡충이와 함께 "지구", "지도", "자두", "모자"를 찾았어요.',
    characterNames: ['찍찍이', '깡충이'],
  },
  'kr-h1-u11': {
    storyTheme:
      '햇살 언덕의 아침 탐험 — 장소: 햇살 언덕(Sunshine Hill). 꼬꼬가 "꼬끼오!" 하고 아침 해가 뜨자 호돌이를 깨웠어요. 이른 아침 햇살이 나무에 "ㅊ" 그림자를 그렸어요! "치마", "치즈", "마차", "기차" — 그림자를 따라 글자를 배웠어요.',
    characterNames: ['꼬꼬', '호돌이'],
  },
  'kr-h1-u12': {
    storyTheme:
      '나무 꼭대기의 재재이 보물 — 장소: 속삭임 나무 꼭대기(Whisper Tree). 재재이가 나무 꼭대기에서 잎사귀에 "ㅋ" 글자가 새겨져 있음을 발견! 달달이와 함께 잎을 흔들 때마다 "쿠키", "코코아", "마이크", "카드" 단어가 나타났어요.',
    characterNames: ['재재이', '달달이'],
  },
  'kr-h1-u13': {
    storyTheme:
      '바람 언덕의 깡충이와 달달이 — 장소: 바람 언덕(Wind Hill). 깡충이와 달리기를 하러 바람 언덕에 갔어요. 달달이가 "히히힝!" 하며 달리면서 모래에 "ㅌ" 글자가 나타나요! "타조", "하트", "기타", "치타" — 달리면서 단어를 익혔어요.',
    characterNames: ['깡충이', '달달이'],
  },
  'kr-h1-u14': {
    storyTheme:
      '꿀 폭포의 퐁당 글자 — 장소: 꿀 폭포(Honey Falls). 꿀꿀이와 찍찍이가 꿀 폭포에서 물놀이 중! 물방울이 "퐁!" 소리를 내자 "ㅍ"이 나타나요! "피자", "파리", "포도", "소파" — 물놀이 글자로 단어를 완성했어요.',
    characterNames: ['꿀꿀이', '찍찍이'],
  },
  'kr-h1-u15': {
    storyTheme:
      '별빛 연못의 호흡의 마지막 — 장소: 별빛 연못(Starlight Pond). 드디어 마지막 자음 "ㅎ"을 배울 날! 호돌이와 전체 친구들이 모두 별빛 연못에 모였어요. 별빛이 연못에 비추는 "ㅎ"이 나타나요! "하마", "호두", "휴지", "호수" — 모두가 함께 한글1을 완성했어요!',
    characterNames: ['호돌이', '스르르', '몽실이'],
  },
  // ── 한글2: 받침 ──
  'kr-h2-u1': {
    storyTheme:
      '글자 초원의 울림 받침 — 장소: 글자 초원(Letter Meadow). 가을 글자 초원에서 이상한 소리가 들렸어요. 꽃을 잡으면 "강, 능, 당…" 소리가 나요! "형!", "당!", "봉!" — ㅇ받침이 만들어지는 소리를 발견하며 "형", "풍당", "농구", "시장" 단어를 완성했어요.',
    characterNames: ['호돌이', '깡충이', '찍찍이'],
  },
  'kr-h2-u2': {
    storyTheme:
      '속삭임 나무의 딱 소리 — 장소: 속삭임 나무(Whisper Tree). 나무를 두드리니 "딱!" 소리와 함께 ㄱ받침이 나타났어요! 재재이와 꼬꼬가 나무 구멍에서 "학교", "축구", "악어", "탁구" 단어를 찾아냈어요.',
    characterNames: ['재재이', '꼬꼬'],
  },
  'kr-h2-u3': {
    storyTheme:
      '글자 다리의 건너기 도전 — 장소: 글자 다리(Letter Bridge). 멍멍이가 ㄴ받침 돌들이 놓여진 다리를 건너는 도전을 열었어요! 돌을 밟을 때마다 "손, 눈, 건너…" 소리가 울리며 "손", "눈", "언니", "잔디" 단어를 완성했어요.',
    characterNames: ['멍멍이', '음메'],
  },
  'kr-h2-u4': {
    storyTheme:
      '별빛 연못의 달빛 글자 — 장소: 별빛 연못(Starlight Pond). 달달이와 스르르가 연못가를 걸었어요. 물결이 ㄹ받침 모양으로 변하며 빛났어요! "별", "달", "하늘", "가을" — 달빛으로 그린 글자를 배웠어요.',
    characterNames: ['달달이', '스르르'],
  },
  'kr-h2-u5': {
    storyTheme:
      '메아리 동굴의 굴소리 — 장소: 메아리 동굴(Echo Cave). 스르르와 음메가 동굴 깊은 곳을 탐험했어요. 동굴 끝에서 ㅅ받침 소리가 메아리로 울렸어요! "옷", "로봇", "비옷", "그릇" — 동굴 소리로 받침을 익혔어요.',
    characterNames: ['스르르', '음메'],
  },
  'kr-h2-u6': {
    storyTheme:
      '꿀 폭포의 달콤한 마무리 — 장소: 꿀 폭포(Honey Falls). 꿀꿀이가 "꿀꿀~" 하니까 폭포 밑에서 ㅁ받침이 나타났어요! "봄", "가람", "어름", "마음" — 모두 함께 달콤하게 한글2를 완성했어요! ★',
    characterNames: ['꿀꿀이', '음메', '호돌이'],
  },
  'kr-h2-u7': {
    storyTheme:
      '멍멍이의 김밥 가게 — 장소: 글자 초원(Letter Meadow). 멍멍이가 글자 초원에 김밥 가게를 열었어요! 입술 모양으로 "ㅂ" 소리를 내며 ㅂ받침이 들어간 단어를 배워요. 꿀꿀이와 호돌이가 함께 김밥 재료를 찾으며 한글2 받침 학습을 마무리합니다.',
    characterNames: ['호돌이', '멍멍이', '꿀꿀이'],
  },
};

/** 한글 숲 친구들 — 한글 이름 → 영어 이름 매핑 (캐릭터 라이브러리 연동용) */
export const HANGUL_FOREST_CHARACTER_NAMES: Record<string, string> = {
  호돌이: 'Stripes',
  찍찍이: 'Squeak',
  음메: 'Moomoo',
  깡충이: 'Hoppy',
  용용이: 'Drako',
  스르르: 'Slither',
  달달이: 'Gallop',
  몽실이: 'Fluffy',
  재재이: 'Chimp',
  꼬꼬: 'Kokko',
  멍멍이: 'Woof',
  꿀꿀이: 'Oink',
};

/** 캐릭터 프로필 — AI 프롬프트에 동물/특징 정보를 제공하여 혼동 방지 */
export const HANGUL_FOREST_CHARACTER_PROFILES: Record<
  string,
  { animal: string; animalEn: string; trait: string }
> = {
  Stripes: { animal: '호랑이', animalEn: 'Tiger', trait: '리더, 용감하고 친절, 주황 줄무늬' },
  Squeak: { animal: '쥐', animalEn: 'Mouse', trait: '빠르고 똑똑, 미니 안경, 작은 체구' },
  Moomoo: { animal: '소', animalEn: 'Cow', trait: '느긋하고 성실, 초록색 스카프, 큰 체구' },
  Hoppy: { animal: '토끼', animalEn: 'Rabbit', trait: '활발, 깡충깡충, 당근 사랑, 긴 귀' },
  Drako: { animal: '용', animalEn: 'Dragon', trait: '상상력, 마법 능력, 작은 날개' },
  Slither: { animal: '뱀', animalEn: 'Snake', trait: '차분, 글자 모양으로 변신, 긴 몸' },
  Gallop: { animal: '말', animalEn: 'Horse', trait: '활동적, 달리기, 무지개 갈기' },
  Fluffy: { animal: '양', animalEn: 'Sheep', trait: '온화, 구름 같은 하얀 털, 꿈꾸는 성격' },
  Chimp: { animal: '원숭이', animalEn: 'Monkey', trait: '장난꾸러기, 똑똑, 긴 꼬리' },
  Kokko: { animal: '닭', animalEn: 'Chicken', trait: '부지런, 아침형, 빨간 볏' },
  Woof: { animal: '개', animalEn: 'Dog', trait: '충직, 격려, 꼬리 흔들기' },
  Oink: { animal: '돼지', animalEn: 'Pig', trait: '낙천적, 간식 사랑, 동그란 배' },
};

/** 영어 파닉스 — 유닛별 기본 스토리 테마 + 등장 캐릭터 (12지신, 한글 이름 = 라이브러리 조회용) */
export const ENGLISH_UNIT_STORY_DEFAULTS: Record<
  string,
  { storyTheme: string; characterNames: string[] }
> = {
  // ── Book 1: Single Letter Sounds ──
  'en-b1-u1': {
    storyTheme:
      'The Apple Party at Letter Meadow — 장소: 글자 초원(Letter Meadow). 한글 숲 글자 초원에서 Stripes가 친구들을 모아 파닉스 파티를 열었어요. Hoppy가 사과(apple)를 가져오고, Squeak는 책(book)과 가방(bag)을 들고 깡총 뛰어왔어요. 친구들은 A, B, C 소리를 노래하며 달콤한 사과를 함께 먹었답니다.',
    characterNames: ['호돌이', '깡충이', '찍찍이'],
  },
  'en-b1-u2': {
    storyTheme:
      'A Hot Day at Echo Cave — 장소: 메아리 동굴(Echo Cave). 더운 여름날, Gallop이 메아리 동굴로 달려왔어요. Woof는 부채(fan)를 흔들고, Kokko는 오리(duck)와 코끼리(elephant) 그림카드를 보여주었어요. 동굴에서 D, E, F 소리를 외치면 메아리가 되어 돌아왔어요.',
    characterNames: ['달달이', '멍멍이', '꼬꼬'],
  },
  'en-b1-u3': {
    storyTheme:
      'The Magic Gift at Starlight Pond — 장소: 별빛 연못(Starlight Pond). 별빛 연못 근처에서 Chimp가 선물 상자를 발견했어요. Drako가 마법을 써서 상자를 열자 고릴라(gorilla) 인형, 하마(hippo) 장난감, 이구아나(iguana) 스티커가 나왔어요. Moomoo는 느긋하게 G, H, I 소리를 하나씩 알려주었어요.',
    characterNames: ['재재이', '용용이', '음메'],
  },
  'en-b1-u4': {
    storyTheme:
      "The King's Lemon at Wind Hill — 장소: 바람 언덕(Wind Hill). 바람 언덕에 왕관(king)을 쓴 Oink가 레몬(lemon) 주스를 만들고 있었어요. Slither가 S자로 몸을 구부려 J, K, L 글자 모양을 만들어 보여주었어요. Stripes가 재킷(jacket)을 입고 나타나 모두 함께 J, K, L 소리를 연습했답니다.",
    characterNames: ['꿀꿀이', '스르르', '호돌이'],
  },
  'en-b1-u5': {
    storyTheme:
      'The Map to the Nutty Nest — 장소: 글자 다리(Letter Bridge). Moomoo가 글자 다리에서 지도(map)를 발견했어요. Fluffy와 Hoppy가 함께 새 둥지(nest)를 찾아 지도를 따라 걸었는데, 문어(octopus) 조각상 옆에 숨겨져 있었어요. 셋이서 M, N, O 소리를 노래하며 신나게 걸었답니다.',
    characterNames: ['음메', '몽실이', '깡충이'],
  },
  'en-b1-u6': {
    storyTheme:
      "The Robot Queen's Ring — 장소: 구름 언덕(Cloud Hill). Drako가 마법 구름 언덕에 로봇(robot) 여왕(queen)을 상상으로 만들었어요. Chimp가 반지(ring)를 훔치려다가 팬더(panda) 경비원에게 걸렸어요! Slither가 차분하게 P, Q, R 글자를 하나씩 설명해주었답니다.",
    characterNames: ['용용이', '재재이', '스르르'],
  },
  'en-b1-u7': {
    storyTheme:
      'The Violin in the Sun — 장소: 햇살 언덕(Sunshine Hill). 햇살 언덕에서 Oink가 우산(umbrella) 아래 앉아 바이올린(violin)을 켜고 있었어요. Gallop이 신나게 달리며 노래에 맞춰 춤을 추었어요. Slither가 S자 포즈로 모래(sand)를 그리며 S, T, U, V 소리를 멋지게 가르쳐주었답니다.',
    characterNames: ['스르르', '달달이', '꿀꿀이'],
  },
  'en-b1-u8': {
    storyTheme:
      "The Zebra's Zoo at the Waterfall — 장소: 꿀 폭포(Honey Waterfall). 꿀 폭포 근처 동물원(zoo)에서 얼룩말(zebra)이 요요(yo-yo)로 놀고 있었어요. Squeak가 망원경으로 여우(fox)와 상자(box)를 발견하고, Kokko는 시계(watch)를 보며 시간을 외쳤어요. Woof가 'Great! You know all the letters!' 하며 모두를 축하했답니다.",
    characterNames: ['찍찍이', '꼬꼬', '멍멍이'],
  },
  // ── Book 2: Short Vowels ──
  'en-b2-u1': {
    storyTheme:
      "The Cat on the Mat at Letter Meadow — 장소: 글자 초원(Letter Meadow). 글자 초원에서 Hoppy가 깡충 뛰다가 고양이(cat)를 발견했어요. 고양이는 부채(fan) 옆 매트(mat) 위에서 낮잠을 자고 있었답니다. Moomoo가 '_at, _an' 단어들을 느릿느릿 하나씩 알려주니 Hoppy가 금세 따라했어요.",
    characterNames: ['깡충이', '음메', '호돌이'],
  },
  'en-b2-u2': {
    storyTheme:
      "Dad's Cap and Jam under the Tap — 장소: 꿀 폭포(Honey Waterfall). Oink의 아빠(dad)가 모자(cap)를 쓰고 수도꼭지(tap) 아래서 잼(jam)을 만들고 있었어요. Gallop이 빠르게 달려와 지도(map)를 펼치며 '꿀 폭포로 가자!' 했어요. Squeak가 빠르게 _ap, _ad, _am 단어 카드를 정리해주었답니다.",
    characterNames: ['꿀꿀이', '달달이', '찍찍이'],
  },
  'en-b2-u3': {
    storyTheme:
      'Hip Hip! Sit and Mix at Echo Cave — 장소: 메아리 동굴(Echo Cave). 메아리 동굴에서 Chimp가 장난을 치며 Hoppy의 입술(lip)을 간질였어요! Hoppy가 매트에 앉아(sit) 여섯(six) 가지 재료를 섞어(mix) 마법 주스를 만들었어요. Slither가 차분하게 _ip, _it, _ix 패턴을 몸으로 표현하며 가르쳐주었답니다.',
    characterNames: ['깡충이', '재재이', '스르르'],
  },
  'en-b2-u4': {
    storyTheme:
      "The Kid with the Wig and Pin — 장소: 속삭임 나무(Whispering Tree). Squeak(kid 역할)가 재미있는 가발(wig)을 쓰고 핀(pin)으로 고정했어요. Woof가 '잘했어! Great wig!' 하며 응원하고, Kokko가 아침 일찍 손잡이(lid) 있는 상자를 가져왔어요. 셋이서 _ib, _id, _ig, _in 패턴 단어를 신나게 배웠답니다.",
    characterNames: ['찍찍이', '멍멍이', '꼬꼬'],
  },
  'en-b2-u5': {
    storyTheme:
      "The Wet Hen's Red Pen — 장소: 글자 초원(Letter Meadow). 비가 온 뒤 Kokko(hen)가 젖어(wet) 빨간색(red) 펜(pen)을 찾고 있었어요. Moomoo가 침대(bed)에서 느긋하게 일어나 수의사(vet)한테 가자고 했어요. Gallop이 빨리 달려 그물(net)을 가져와 셋이서 _et, _ed, _en 단어를 함께 정리했답니다.",
    characterNames: ['꼬꼬', '음메', '달달이'],
  },
  'en-b2-u6': {
    storyTheme:
      'The Dog on the Log and Fox in the Box — 장소: 메아리 동굴(Echo Cave). 통나무(log) 위에 Woof가 올라가 여우(fox)가 상자(box) 속에 숨는 걸 봤어요! Chimp가 대걸레(mop)로 장난을 치다 뜨거운 냄비(pot)를 건드릴 뻔 했어요. Stripes가 _og, _op, _ot, _ox 단어들을 크게 외치며 모두를 안전하게 도왔답니다.',
    characterNames: ['멍멍이', '재재이', '호돌이'],
  },
  'en-b2-u7': {
    storyTheme:
      'The Bug in the Mug at the Tub — 장소: 별빛 연못(Starlight Pond). Oink가 욕조(tub) 옆 컵(mug)에 벌레(bug)가 들어 있는 것을 발견했어요! Hoppy가 깡충 뛰며 강아지(pup)를 데리고 와서 함께 살펴보았어요. Slither가 차분하게 _ug, _ub, _up 단어들을 미끄러지듯 설명해주었답니다.',
    characterNames: ['꿀꿀이', '깡충이', '스르르'],
  },
  'en-b2-u8': {
    storyTheme:
      "The Bun in the Sun and Nut in the Mud — 장소: 햇살 언덕(Sunshine Hill). 햇살 언덕에서 Gallop이 빵(bun)을 태양(sun) 아래 두었더니 따뜻해졌어요. Kokko가 아침 일찍 진흙(mud) 속 견과류(nut)를 캐다가 뒹굴었어요! Moomoo가 느긋하게 '재미있다~' 하며 _un, _ud, _ut 단어들을 하나씩 가르쳐주었답니다.",
    characterNames: ['달달이', '꼬꼬', '음메'],
  },
  // ── Book 3: Long Vowels (Magic e) ──
  'en-b3-u1': {
    storyTheme:
      "The Magic Cake at the Cave — 장소: 메아리 동굴(Echo Cave). Drako가 마법 e를 흔들자 동굴(cave) 앞에 케이크(cake)가 뚝 나타났어요! Oink가 망토(cape)를 두르고 달려와 케이크에 테이프(tape)로 장식을 붙였어요. Hoppy가 갈퀴(rake)로 낙엽을 치우며 'Magic e makes the vowel say its name!' 했답니다.",
    characterNames: ['용용이', '꿀꿀이', '깡충이'],
  },
  'en-b3-u2': {
    storyTheme:
      'The Gate at the Lane of Names — 장소: 바람 언덕(Wind Hill). Stripes가 이름(name) 게임을 하며 작은 길(lane)을 달렸어요. Gallop이 게이트(gate) 앞에서 꽃병(vase)을 들고 기다리고 있었어요. Slither가 글자 모양으로 _ame, _ane, _ase, _ate 패턴을 몸으로 표현해주었답니다.',
    characterNames: ['호돌이', '달달이', '스르르'],
  },
  'en-b3-u3': {
    storyTheme:
      "Nine on a Vine: Bike Ride Time! — 장소: 글자 초원(Letter Meadow) 포도밭. Chimp가 포도나무(vine)에 매달려 아홉(nine) 개의 레몬(lime)을 따고 있었어요! Squeak가 자전거(bike)를 타고 빠르게 도착해서 함께 수확했어요. Kokko가 '시간(time)이 됐다! 챈트 하자!' 하며 _ine, _ike, _ime 패턴을 알려주었답니다.",
    characterNames: ['찍찍이', '재재이', '꼬꼬'],
  },
  'en-b3-u4': {
    storyTheme:
      "A Kite Ride: Hide and Drive! — 장소: 바람 언덕(Wind Hill). Gallop이 연(kite)을 들고 언덕을 달리다가 동굴에 숨어(hide) 버렸어요! Drako가 파이프(pipe)로 마법 바람을 불어 연을 하늘로 날렸어요. Woof가 '잘했어! Five stars!' 하며 다섯(five) 개 별을 주었답니다.",
    characterNames: ['달달이', '용용이', '멍멍이'],
  },
  'en-b3-u5': {
    storyTheme:
      'The Rose, the Rope, and a Note — 장소: 구름 언덕(Cloud Hill). 구름 언덕에서 Fluffy가 장미(rose)를 발견하고 쪽지(note)를 붙여 두었어요. Slither가 밧줄(rope) 모양으로 구불구불 기어와 긴 o 소리를 설명해 주었어요. Moomoo가 코(nose)를 킁킁거리며 장미 향기를 맡고는 함께 연습했답니다.',
    characterNames: ['몽실이', '스르르', '음메'],
  },
  'en-b3-u6': {
    storyTheme:
      "Mole's Home by the Cone Pole — 장소: 글자 다리(Letter Bridge). Oink가 원뿔(cone) 옆 기둥(pole) 근처에 두더지(mole) 집을 발견했어요! Chimp가 집(home) 안을 기웃거리다 뼈(bone)를 발견하고 깜짝 놀랐어요. Gallop이 신나게 달리며 _ole, _ome, _one 단어들을 노래로 불렀답니다.",
    characterNames: ['꿀꿀이', '재재이', '달달이'],
  },
  'en-b3-u7': {
    storyTheme:
      "The Cute Mule Plays a June Tune — 장소: 별빛 연못(Starlight Pond). Drako가 6월(June)에 귀여운 노새(mule)를 마법으로 불러냈어요! Squeak가 큐브(cube)와 튜브(tube)로 악기를 만들어 멜로디(tune)를 연주했어요. Fluffy가 부드러운 목소리로 '참 귀엽다(cute)~' 하며 _ube, _ute, _une, _ule을 가르쳐주었답니다.",
    characterNames: ['용용이', '찍찍이', '몽실이'],
  },
  // ── Book 4: Consonant Blends & Digraphs ──
  'en-b4-u1': {
    storyTheme:
      'Blue Flag and the Clapping Clam — 장소: 글자 다리(Letter Bridge). Gallop이 파란(blue) 깃발(flag)을 들고 글자 다리를 신나게 달렸어요! Chimp가 조개(clam)를 발견하고 손뼉(clap)을 치며 좋아했어요. Slither가 bl, cl, fl 자음군을 차근차근 연결하며 가르쳐주었답니다.',
    characterNames: ['달달이', '재재이', '스르르'],
  },
  'en-b4-u2': {
    storyTheme:
      "The Brave Crab Crosses the Bridge — 장소: 글자 다리(Letter Bridge). Stripes가 용감하게(brave) 다리(bridge)를 건너다 게(crab)를 발견했어요! Moomoo가 느긋하게 크레인(crane)을 보며 br, cr, fr 소리를 하나씩 연습했어요. Kokko가 '개구리(frog) 앞으로!' 하며 신나게 외쳤답니다.",
    characterNames: ['호돌이', '음메', '꼬꼬'],
  },
  'en-b4-u3': {
    storyTheme:
      'The Globe and Sled Glide — 장소: 구름 언덕(Cloud Hill). Drako가 지구본(globe)을 들고 빛나는 별빛 연못 위를 날았어요! Fluffy가 썰매(sled)를 타고 구름 언덕을 미끄러져 내려왔어요. Squeak가 식물(plant)을 관찰하며 gl, pl, sl 단어들을 빠르게 정리했답니다.',
    characterNames: ['용용이', '몽실이', '찍찍이'],
  },
  'en-b4-u4': {
    storyTheme:
      "Dragon's Drum and the Prize Truck — 장소: 바람 언덕(Wind Hill). Gallop이 용(dragon)이 트럭(truck)에 북(drum)을 싣고 달리는 꿈을 꾸었어요! Chimp가 상(prize)을 받으러 달려가다 Oink와 부딪혔어요. 셋이서 dr, pr, tr 소리를 북 리듬에 맞추어 신나게 연습했답니다.",
    characterNames: ['달달이', '재재이', '꿀꿀이'],
  },
  'en-b4-u5': {
    storyTheme:
      'The Swan Swims by the Smoking Stone — 장소: 별빛 연못(Starlight Pond). 백조(swan)가 별빛 연못에서 수영(swim)하다 연기 나는 돌(stone) 옆을 지났어요! Slither가 뱀(snake) 모양으로 냄새(smell)를 맡으며 sm, sn, st, sw를 설명했어요. Woof가 미소(smile) 지으며 응원하고, Hoppy가 깡충 뛰며 단어를 외쳤답니다.',
    characterNames: ['스르르', '멍멍이', '깡충이'],
  },
  'en-b4-u6': {
    storyTheme:
      "The King Sings by the Pink Bank — 장소: 글자 초원(Letter Meadow). 왕(king)이 된 Chimp가 분홍색(pink) 은행(bank) 앞에서 노래(sing)를 불렀어요! Moomoo가 쿵(dunk) 하고 넘어지자 Kokko가 달려와 '괜찮아?' 하며 도왔어요. 셋이서 _ng, _nk 단어들을 노래에 맞추어 신나게 연습했답니다.",
    characterNames: ['재재이', '음메', '꼬꼬'],
  },
  'en-b4-u7': {
    storyTheme:
      "The Cherry Ship and Chin Chase — 장소: 꿀 폭포(Honey Waterfall). Chimp가 체리(cherry)를 든 채 배(ship)에 올라탔어요! Gallop이 가게(shop)를 향해 달리다 Squeak의 턱(chin)에 부딪힐 뻔 했어요. Squeak가 빠르게 ch, sh 카드를 정리하며 '두 글자지만 한 소리야!' 설명했답니다.",
    characterNames: ['재재이', '달달이', '찍찍이'],
  },
  'en-b4-u8': {
    storyTheme:
      'The Whale Whispers by the Phone — 장소: 속삭임 나무(Whispering Tree). 고래(whale)가 속삭임 나무 옆에서 속삭이며(whisper) 전화(phone) 소리를 들었어요! Drako가 마법으로 사진(photo)과 돌고래(dolphin)를 불러냈어요. Fluffy가 부드럽게 ph, th, wh 소리를 설명하며 치아(teeth)를 보여주었답니다.',
    characterNames: ['찍찍이', '용용이', '몽실이'],
  },
  // ── Book 5: Double Letter Vowels & R-Controlled ──
  'en-b5-u1': {
    storyTheme:
      'Green Tree Bees by the Sea — 장소: 속삭임 나무(Whispering Tree). Kokko가 초록(green) 나무(tree) 위의 꿀벌(bee)을 발견했어요! Fluffy가 바다(sea) 옆에서 봉인된(seal) 조개와 찻잎(tea)을 찾았어요. Hoppy가 나뭇잎(leaf) 위를 깡충 뛰며 ee, ea 소리를 신나게 연습했답니다.',
    characterNames: ['꼬꼬', '몽실이', '깡충이'],
  },
  'en-b5-u2': {
    storyTheme:
      "The Goat's Boat in the Yellow Snow — 장소: 구름 언덕(Cloud Hill). 염소(goat)가 배(boat)를 타고 노란(yellow) 눈(snow) 언덕으로 갔어요! Gallop이 창문(window) 옆에서 바람(blow)에 갈기를 날리며 노래했어요. Oink가 비누(soap)로 배를 닦으며 oa, ow 단어들을 배웠답니다.",
    characterNames: ['음메', '달달이', '꿀꿀이'],
  },
  'en-b5-u3': {
    storyTheme:
      "The Mail Train on a Rainy Day — 장소: 바람 언덕(Wind Hill). Squeak가 비(rain) 오는 날 기차(train)로 우편(mail)을 배달하고 있었어요! Stripes가 쟁반(tray)에 점토(clay)를 들고 '같이 만들자!' 했어요. Chimp가 '놀자(play)! 회색(gray) 진흙으로!' 하며 ai, ay 단어들을 외쳤답니다.",
    characterNames: ['찍찍이', '호돌이', '재재이'],
  },
  'en-b5-u4': {
    storyTheme:
      "The Boy's Joy: Oil Point Coins! — 장소: 별빛 연못(Starlight Pond). Drako가 마법으로 금화(coin)를 꼬임(coil) 모양 보물 지도에 숨겼어요! Chimp(boy)가 기름(oil) 웅덩이를 피해 포인트(point)를 찍으며 보물을 찾아갔어요. Oink가 '기뻐(joy)! 나도!' 하며 oi, oy 소리를 즐겁게 배웠답니다.",
    characterNames: ['재재이', '용용이', '꿀꿀이'],
  },
  'en-b5-u5': {
    storyTheme:
      'The Crown Owl and the Cloud House — 장소: 구름 언덕(Cloud Hill). 왕관(crown)을 쓴 부엉이(owl)가 구름(cloud) 집(house)에 살고 있었어요! Gallop이 달려오다 갈색(brown) 소(cow)와 가운(gown)을 발견했어요. Slither가 차분하게 ow, ou 소리를 구름처럼 천천히 설명해주었답니다.',
    characterNames: ['달달이', '깡충이', '스르르'],
  },
  'en-b5-u6': {
    storyTheme:
      "The Bird's Shirt and the Turtle Nurse — 장소: 햇살 언덕(Sunshine Hill). Kokko(bird)가 새 셔츠(shirt)를 입고 아침 일찍 나타났어요! 거북이 간호사(turtle nurse)가 치마(skirt)를 입은 소녀(girl)를 돌보고 있었어요. Slither가 er, ir, ur 소리가 모두 같은 소리라고 차분하게 설명해주었답니다.",
    characterNames: ['꼬꼬', '스르르', '몽실이'],
  },
  'en-b5-u7': {
    storyTheme:
      "The Star Farm: Car Park at the Store — 장소: 글자 초원(Letter Meadow) 별 농장. Gallop이 별(star) 농장(farm)으로 달려가 주차장(park)에 차(car)를 세웠어요! Moomoo가 가게(store) 옆 옥수수(corn) 밭에서 포크(fork)로 음식을 먹고 있었어요. Stripes가 'ar은 /ɑːr/, or은 /ɔːr/ - 다른 소리야!' 하며 명확하게 알려주었답니다.",
    characterNames: ['달달이', '음메', '호돌이'],
  },
  'en-b5-u8': {
    storyTheme:
      "The Goose at the Moon Pool Zoo — 장소: 꿀 폭포(Honey Waterfall). Oink가 동물원(zoo)의 달빛(moon) 연못(pool)에서 거위(goose)를 만났어요! Drako가 마법 숟가락(spoon)으로 연못 물을 젓자 별빛 음식(food)이 나타났어요. Squeak가 빠르게 요리책(book)을 열어 'oo는 두 가지 소리야!' 하며 가르쳐주었답니다.",
    characterNames: ['꿀꿀이', '용용이', '찍찍이'],
  },
};

/** 한글 자모 → 발음 텍스트 매핑 (자음: 자음+ㅡ, 모음: ㅇ+모음) */
export const KOREAN_PHONEME_MAP: Record<string, string> = {
  // 기본 자음 (14)
  ㄱ: '그',
  ㄴ: '느',
  ㄷ: '드',
  ㄹ: '르',
  ㅁ: '므',
  ㅂ: '브',
  ㅅ: '스',
  ㅇ: '으',
  ㅈ: '즈',
  ㅊ: '츠',
  ㅋ: '크',
  ㅌ: '트',
  ㅍ: '프',
  ㅎ: '흐',
  // 쌍자음 (5)
  ㄲ: '끄',
  ㄸ: '뜨',
  ㅃ: '쁘',
  ㅆ: '쓰',
  ㅉ: '쯔',
  // 모음 (21)
  ㅏ: '아',
  ㅐ: '애',
  ㅑ: '야',
  ㅒ: '얘',
  ㅓ: '어',
  ㅔ: '에',
  ㅕ: '여',
  ㅖ: '예',
  ㅗ: '오',
  ㅘ: '와',
  ㅙ: '왜',
  ㅚ: '외',
  ㅛ: '요',
  ㅜ: '우',
  ㅝ: '워',
  ㅞ: '웨',
  ㅟ: '위',
  ㅠ: '유',
  ㅡ: '으',
  ㅢ: '의',
  ㅣ: '이',
};

/** 한글 자모 텍스트를 TTS용 발음 텍스트로 변환 (예: "ㄱ ㅏ 가" → "그 아 가") */
export function mapKoreanPhonemeText(text: string): string {
  return text
    .split(/( +)/)
    .map((part) => KOREAN_PHONEME_MAP[part] ?? part)
    .join('');
}

export const WORKSHEET_TYPES = [
  { id: 'matching' as const, label: '매칭 (단어-그림)' },
  { id: 'fill-blank' as const, label: '빈칸 채우기' },
  { id: 'tracing' as const, label: '따라 쓰기' },
  { id: 'circle-sound' as const, label: '소리 찾기' },
] as const;

export const CHANT_TONES = [
  { id: 'cheerful' as const, label: '신나는' },
  { id: 'calm' as const, label: '잔잔한' },
  { id: 'hiphop' as const, label: '힙합' },
  { id: 'lullaby' as const, label: '자장가' },
] as const;

// === 카드뉴스 테마 프리셋 ===

export const CARD_NEWS_THEMES = [
  { id: 'warm', label: '따뜻한', bg: '#FFF8F0', text: '#4A2C0A', accent: '#FF9F43' },
  { id: 'cool', label: '시원한', bg: '#F0F4FF', text: '#1A2744', accent: '#4A90D9' },
  { id: 'nature', label: '자연', bg: '#F0FFF4', text: '#1A3A2A', accent: '#48BB78' },
  { id: 'pastel', label: '파스텔', bg: '#FFF0F6', text: '#4A1A3A', accent: '#ED64A6' },
  { id: 'modern', label: '모던', bg: '#F7FAFC', text: '#2D3748', accent: '#5A67D8' },
] as const;
export type CardNewsThemeId = (typeof CARD_NEWS_THEMES)[number]['id'];

// === 카테고리 ===
export const STORYBOOK_CATEGORIES = ['자연 관찰', '세계 명작', '전래 동화', '기타'] as const;
export const PHONICS_CATEGORIES = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'] as const;

// === YouTube ===
export { YOUTUBE_CATEGORIES, YOUTUBE_PRIVACY_OPTIONS } from './youtube.js';

// === Speaking Games ===
import type { SpeakingDifficulty, SpeakingDifficultyPreset } from '../types/storybook.js';

export const SPEAKING_PRESETS: Record<SpeakingDifficulty, SpeakingDifficultyPreset> = {
  easy: { showWord: true, autoPlayTts: true, showPromptLine: true, repeatCycles: 1 },
  medium: { showWord: true, autoPlayTts: false, showPromptLine: false, repeatCycles: 1 },
  hard: { showWord: false, autoPlayTts: false, showPromptLine: false, repeatCycles: 2 },
};
