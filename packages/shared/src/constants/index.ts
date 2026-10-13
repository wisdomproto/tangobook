export const TARGET_AGES = ['4-5', '5-7', '7-8'] as const;
export type TargetAge = (typeof TARGET_AGES)[number];

// ⚠️ 라벨은 저작도구 내부 전용 표기다. 학습자/부모 화면엔 항상 "그림체 N" 으로만 노출
// (그림체 실명 비노출 정책 — 저작권 예방). id 는 book 데이터의 styleId 참조이므로 변경 금지, label 만 수정 가능.
// 대표 3종(세계명작 기준) = 수채동화풍 / 페이퍼 3D 아트 / 콜라주.
export const ART_STYLES = [
  { id: 'photographic', label: '실사', prompt: 'Photographic realistic illustration' },
  { id: 'watercolor', label: '수채동화풍', prompt: 'Watercolor' },
  { id: 'cartoon', label: '카툰', prompt: 'Cartoon' },
  { id: 'traditional', label: '전통 동화책', prompt: 'Traditional Storybook' },
  { id: 'animation', label: '애니메이션', prompt: 'Animation' },
  { id: 'modern-illustration', label: '현대 일러스트', prompt: 'Modern Illustration' },
  { id: 'oil-painting', label: '유화', prompt: 'Oil Painting' },
  { id: 'pencil-sketch', label: '연필 스케치', prompt: 'Pencil Sketch' },
  {
    id: 'paper-craft',
    label: '페이퍼 3D 아트',
    prompt:
      'Paper craft, layered cut paper sculpture style with kraft paper textures and visible 3D depth',
  },
  {
    id: 'collage',
    label: '콜라주',
    prompt:
      'Collage illustration, torn and cut textured paper layered together, hand-painted paper collage in the style of Eric Carle, bold vibrant colors, visible brush and paint texture on paper',
  },
  {
    id: 'pixar-3d',
    label: '3D 픽사',
    prompt:
      '3D Pixar animation style, cinematic CG, soft volumetric lighting, expressive characters, vibrant colors, photorealistic textures',
  },
] as const;

export const ASPECT_RATIOS = ['16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '1:1'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

// 지원 언어 단일 소스. label=한국어 표기(저작도구용), nativeName=현지 표기(학습자 UI용), flag=국기 이모지.
// 새 언어 추가 = 여기 한 줄. 클라 언어 토글/라벨이 여기서 자동 derive 된다.
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en', label: '영어', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '일본어', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '중국어(간체)', nativeName: '中文(简体)', flag: '🇨🇳' },
  { code: 'es', label: '스페인어', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: '프랑스어', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', label: '독일어', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'vi', label: '베트남어', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', label: '태국어', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ms', label: '말레이어', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', label: '인도네시아어', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
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
        id: 'en-b1-u01',
        title: 'Unit 01: Aa Bb Cc',
        phonemes: ['a', 'b', 'c'],
        patterns: ['initial sounds'],
        sampleWords: ['alligator', 'ant', 'apple', 'bag', 'bat', 'book', 'cap', 'cat', 'cup'],
      },
      {
        id: 'en-b1-u02',
        title: 'Unit 02: Dd Ee Ff',
        phonemes: ['d', 'e', 'f'],
        patterns: ['initial sounds'],
        sampleWords: ['desk', 'dog', 'duck', 'egg', 'elbow', 'elephant', 'fan', 'fish', 'fork'],
      },
      {
        id: 'en-b1-u03',
        title: 'Unit 03: Gg Hh Ii',
        phonemes: ['g', 'h', 'i'],
        patterns: ['initial sounds'],
        sampleWords: ['game', 'gift', 'gorilla', 'hand', 'hat', 'hippo', 'igloo', 'iguana', 'ink'],
      },
      {
        id: 'en-b1-u04',
        title: 'Unit 04: Jj Kk Ll',
        phonemes: ['j', 'k', 'l'],
        patterns: ['initial sounds'],
        sampleWords: ['jacket', 'jam', 'jet', 'key', 'king', 'kiwi', 'lamp', 'lemon', 'lion'],
      },
      {
        id: 'en-b1-u05',
        title: 'Unit 05: Mm Nn Oo',
        phonemes: ['m', 'n', 'o'],
        patterns: ['initial sounds'],
        sampleWords: ['map', 'melon', 'mouse', 'nest', 'net', 'nut', 'octopus', 'ostrich', 'ox'],
      },
      {
        id: 'en-b1-u06',
        title: 'Unit 06: Pp Qq Rr',
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
        id: 'en-b1-u07',
        title: 'Unit 07: Ss Tt Uu Vv',
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
        id: 'en-b1-u08',
        title: 'Unit 08: Ww Xx Yy Zz',
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
        id: 'en-b2-u01',
        title: 'Unit 01: Short Vowel a (1)',
        phonemes: ['short-a'],
        patterns: ['_an', '_at'],
        sampleWords: ['can', 'fan', 'man', 'pan', 'bat', 'cat', 'hat', 'mat'],
      },
      {
        id: 'en-b2-u02',
        title: 'Unit 02: Short Vowel a (2)',
        phonemes: ['short-a'],
        patterns: ['_ap', '_ad', '_am'],
        sampleWords: ['cap', 'lap', 'map', 'tap', 'dad', 'sad', 'dam', 'jam'],
      },
      {
        id: 'en-b2-u03',
        title: 'Unit 03: Short Vowel i (1)',
        phonemes: ['short-i'],
        patterns: ['_ip', '_it', '_ix'],
        sampleWords: ['dip', 'hip', 'lip', 'rip', 'hit', 'sit', 'mix', 'six'],
      },
      {
        id: 'en-b2-u04',
        title: 'Unit 04: Short Vowel i (2)',
        phonemes: ['short-i'],
        patterns: ['_ib', '_id', '_ig', '_in'],
        sampleWords: ['bib', 'rib', 'kid', 'lid', 'dig', 'wig', 'fin', 'pin'],
      },
      {
        id: 'en-b2-u05',
        title: 'Unit 05: Short Vowel e',
        phonemes: ['short-e'],
        patterns: ['_et', '_ed', '_en'],
        sampleWords: ['jet', 'net', 'vet', 'wet', 'bed', 'red', 'hen', 'pen'],
      },
      {
        id: 'en-b2-u06',
        title: 'Unit 06: Short Vowel o',
        phonemes: ['short-o'],
        patterns: ['_og', '_op', '_ot', '_ox'],
        sampleWords: ['dog', 'log', 'hop', 'mop', 'hot', 'pot', 'box', 'fox'],
      },
      {
        id: 'en-b2-u07',
        title: 'Unit 07: Short Vowel u (1)',
        phonemes: ['short-u'],
        patterns: ['_ug', '_ub', '_up'],
        sampleWords: ['bug', 'hug', 'mug', 'rug', 'rub', 'tub', 'cup', 'pup'],
      },
      {
        id: 'en-b2-u08',
        title: 'Unit 08: Short Vowel u (2)',
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
        id: 'en-b3-u01',
        title: 'Unit 01: Long Vowel a (1)',
        phonemes: ['long-a'],
        patterns: ['_ake', '_ape', '_ave'],
        sampleWords: ['bake', 'cake', 'lake', 'rake', 'cape', 'tape', 'cave', 'wave'],
      },
      {
        id: 'en-b3-u02',
        title: 'Unit 02: Long Vowel a (2)',
        phonemes: ['long-a'],
        patterns: ['_ame', '_ane', '_ase', '_ate'],
        sampleWords: ['game', 'name', 'came', 'lane', 'case', 'vase', 'date', 'gate'],
      },
      {
        id: 'en-b3-u03',
        title: 'Unit 03: Long Vowel i (1)',
        phonemes: ['long-i'],
        patterns: ['_ine', '_ike', '_ime'],
        sampleWords: ['line', 'nine', 'pine', 'vine', 'bike', 'hike', 'lime', 'time'],
      },
      {
        id: 'en-b3-u04',
        title: 'Unit 04: Long Vowel i (2)',
        phonemes: ['long-i'],
        patterns: ['_ide', '_ipe', '_ite', '_ive'],
        sampleWords: ['hide', 'ride', 'pipe', 'wipe', 'bite', 'kite', 'dive', 'five'],
      },
      {
        id: 'en-b3-u05',
        title: 'Unit 05: Long Vowel o (1)',
        phonemes: ['long-o'],
        patterns: ['_ose', '_ope', '_ote'],
        sampleWords: ['hose', 'nose', 'pose', 'rose', 'hope', 'rope', 'note', 'vote'],
      },
      {
        id: 'en-b3-u06',
        title: 'Unit 06: Long Vowel o (2)',
        phonemes: ['long-o'],
        patterns: ['_ole', '_ome', '_one'],
        sampleWords: ['hole', 'mole', 'pole', 'sole', 'dome', 'home', 'bone', 'cone'],
      },
      {
        id: 'en-b3-u07',
        title: 'Unit 07: Long Vowel u',
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
        id: 'en-b4-u01',
        title: 'Unit 01: bl cl fl',
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
        id: 'en-b4-u02',
        title: 'Unit 02: br cr fr',
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
        id: 'en-b4-u03',
        title: 'Unit 03: gl pl sl',
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
        id: 'en-b4-u04',
        title: 'Unit 04: dr pr tr',
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
        id: 'en-b4-u05',
        title: 'Unit 05: sm sn st sw',
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
        id: 'en-b4-u06',
        title: 'Unit 06: ng nk',
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
        id: 'en-b4-u07',
        title: 'Unit 07: ch sh',
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
        id: 'en-b4-u08',
        title: 'Unit 08: ph th wh',
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
        id: 'en-b5-u01',
        title: 'Unit 01: ee ea',
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
        id: 'en-b5-u02',
        title: 'Unit 02: oa ow',
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
        id: 'en-b5-u03',
        title: 'Unit 03: ai ay',
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
        id: 'en-b5-u04',
        title: 'Unit 04: oi oy',
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
        id: 'en-b5-u05',
        title: 'Unit 05: ow ou',
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
        id: 'en-b5-u06',
        title: 'Unit 06: ir er ur',
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
        id: 'en-b5-u07',
        title: 'Unit 07: ar or',
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
        id: 'en-b5-u08',
        title: 'Unit 08: oo',
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
        id: 'kr-h1-u01',
        title: 'unit 01: 모음 배우기',
        phonemes: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'],
        patterns: ['모음'],
        sampleWords: [],
        blending: [],
      },
      {
        id: 'kr-h1-u02',
        title: 'unit 02: ㄱ 배우기',
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
        id: 'kr-h1-u03',
        title: 'unit 03: ㄴ 배우기',
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
        id: 'kr-h1-u04',
        title: 'unit 04: ㄷ 배우기',
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
        id: 'kr-h1-u05',
        title: 'unit 05: ㄹ 배우기',
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
        id: 'kr-h1-u06',
        title: 'unit 06: ㅁ 배우기',
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
        id: 'kr-h1-u07',
        title: 'unit 07: ㅂ 배우기',
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
        id: 'kr-h1-u08',
        title: 'unit 08: ㅅ 배우기',
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
        id: 'kr-h1-u09',
        title: 'unit 09: ㅇ 배우기',
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
        id: 'kr-h2-u01',
        title: 'unit 01: ㅇ 받침 배우기',
        phonemes: ['받침ㅇ'],
        patterns: ['받침'],
        sampleWords: ['형', '풍덩', '농구', '시장'],
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
        id: 'kr-h2-u02',
        title: 'unit 02: ㄱ 받침 배우기',
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
        id: 'kr-h2-u03',
        title: 'unit 03: ㄴ 받침 배우기',
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
        id: 'kr-h2-u04',
        title: 'unit 04: ㄹ 받침 배우기',
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
        id: 'kr-h2-u05',
        title: 'unit 05: ㅅ 받침 배우기',
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
        id: 'kr-h2-u06',
        title: 'unit 06: ㅁ 받침 배우기',
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
        id: 'kr-h2-u07',
        title: 'unit 07: ㅂ 받침 배우기',
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
        id: 'kr-h3-u01',
        title: 'unit 01: ㄲ 배우기',
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
        id: 'kr-h3-u02',
        title: 'unit 02: ㄸ 배우기',
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
        id: 'kr-h3-u03',
        title: 'unit 03: ㅃ 배우기',
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
        id: 'kr-h3-u04',
        title: 'unit 04: ㅆ 배우기',
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
        id: 'kr-h3-u05',
        title: 'unit 05: ㅉ 배우기',
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
        id: 'kr-h4-u01',
        title: 'unit 01: ㅐ, ㅔ 배우기',
        phonemes: ['ㅐ', 'ㅔ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['고래', '동생', '레몬', '베개'],
        blending: [],
      },
      {
        id: 'kr-h4-u02',
        title: 'unit 02: ㅖ, ㅚ 배우기',
        phonemes: ['ㅖ', 'ㅚ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['계란', '예절', '시계', '얘기'],
        blending: [],
      },
      {
        id: 'kr-h4-u03',
        title: 'unit 03: ㅟ, ㅢ 배우기',
        phonemes: ['ㅟ', 'ㅢ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['참외', '열쇠', '생쥐', '가위'],
        blending: [],
      },
      {
        id: 'kr-h4-u04',
        title: 'unit 04: ㅘ, ㅙ 배우기',
        phonemes: ['ㅘ', 'ㅙ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['과자', '사과', '화가', '횃불'],
        blending: [],
      },
      {
        id: 'kr-h4-u05',
        title: 'unit 05: ㅝ, ㅞ, ㅢ 배우기',
        phonemes: ['ㅝ', 'ㅞ', 'ㅢ'],
        patterns: ['복잡한 모음'],
        sampleWords: ['권투', '스웨터', '의자', '의사'],
        blending: [],
      },
    ],
  },
] as const;

/**
 * 중국어 병음(拼音) 파닉스 커리큘럼 — 탱고 교안 기반(docs/phonics-chinese/curriculum-from-gyoan.md §3).
 *
 * 🔴 **순서 = 성조 → 단운모**(교안: "중국어 학습의 첫 시작으로, 성조 발음을 듣고 구분"). 가장 쉬운 운모
 *    `a` 로 4성(ā á ǎ à)을 먼저 익힌 뒤 단운모로 간다.
 * 🔴 **단운모는 tone-1 만이 아니라 각 4성** — 운모 놀이판이 그 운모의 4성을 순서로 들려준다(성조 비교).
 *    음원은 `mod_chinese` 에 ā á ǎ à / ō ó ǒ ò … 전체 업로드 완료.
 * 🔴 **MVP = Level 1 만**. L2~(성모·拼读·단어·복운모·비운모·整体认读)는 후속이며 같은 스키마로 이어붙인다.
 *    소리 학습 구간은 **병음만**(한자 없음) — 한자 병기는 낱말 활동에서만(L1 엔 낱말 활동 없음).
 * 🔴 성조 순서 = 1→2→3→4(숫자 순, 결정 잠금 2026-08-06). `sampleWords` = **표시용 병음**(성조부호 포함).
 */
export const CHINESE_PHONICS_CURRICULUM = [
  {
    level: 'level1',
    name: 'Level 1: 성조 + 단운모',
    description: '병음 4성 과 단운모 a o e i u ü',
    units: [
      {
        id: 'zh-l1-u01',
        // 성조 认识声调 — 중국어 학습의 첫 시작. 가장 쉬운 운모 a 로 4성: ā á ǎ à(啊 · 4성)
        title: 'Unit 01: 성조 ā á ǎ à',
        phonemes: ['a'],
        patterns: ['tones'],
        sampleWords: ['ā', 'á', 'ǎ', 'à'],
      },
      {
        id: 'zh-l1-u02',
        // 단운모 — 각 모음을 4성 전부로 들려준다(ā á ǎ à / ō ó ǒ ò / ē é ě è)
        title: 'Unit 02: a o e',
        phonemes: ['a', 'o', 'e'],
        patterns: ['single final'],
        sampleWords: ['a', 'o', 'e'],
      },
      {
        id: 'zh-l1-u03',
        // 단운모 — 각 모음을 4성 전부로(ī í ǐ ì / ū ú ǔ ù / ǖ ǘ ǚ ǜ)
        title: 'Unit 03: i u ü',
        phonemes: ['i', 'u', 'ü'],
        patterns: ['single final'],
        sampleWords: ['i', 'u', 'ü'],
      },
    ],
  },
  {
    // 🔴 Level 2 성모(声母) — 성모 글자를 기본운모와 결합한 citation 소리로 익힌다(bō pō mō…). 카드 =
    //    성모 글자(phonemes), 소리 = 결합 음절(sampleWords). 성조 4성 시퀀스가 아니라 **낱 소리 하나**다.
    //    🔴 대부분 1성이지만 **fó·tè·né 는 2/4성** — `fō·tē·nē`(1성)는 표준 중국어에 없는 음절이라
    //    원어민 녹음 라이브러리에도 없다(fó 2성·tè 4성·né 2성만 실존). 카드는 성모 글자만 보이므로
    //    성조 차이는 화면에 안 드러나고 /f/·/t/·/n/ 초성은 그대로 들린다. 음원은 `mod_chinese` 에 전부 있다.
    level: 'level2',
    name: 'Level 2: 성모',
    description: '성모 b p m f … zh ch sh r — 기본운모 결합음(bō pō dē jī zhī)',
    units: [
      {
        id: 'zh-l2-u01',
        title: 'Unit 01: b p m f',
        phonemes: ['b', 'p', 'm', 'f'],
        patterns: ['initial'],
        sampleWords: ['bō', 'pō', 'mō', 'fó'],
      },
      {
        id: 'zh-l2-u02',
        title: 'Unit 02: d t n l',
        phonemes: ['d', 't', 'n', 'l'],
        patterns: ['initial'],
        sampleWords: ['dē', 'tè', 'né', 'lē'],
      },
      {
        id: 'zh-l2-u03',
        title: 'Unit 03: g k h',
        phonemes: ['g', 'k', 'h'],
        patterns: ['initial'],
        sampleWords: ['gē', 'kē', 'hē'],
      },
      {
        id: 'zh-l2-u04',
        title: 'Unit 04: j q x',
        phonemes: ['j', 'q', 'x'],
        patterns: ['initial'],
        sampleWords: ['jī', 'qī', 'xī'],
      },
      {
        id: 'zh-l2-u05',
        title: 'Unit 05: z c s',
        phonemes: ['z', 'c', 's'],
        patterns: ['initial'],
        sampleWords: ['zī', 'cī', 'sī'],
      },
      {
        id: 'zh-l2-u06',
        // 권설음 — zh/ch/sh 는 2글자라 LetterFillCanvas(한 글자 캔버스)에 안 맞아 따라쓰기 생략.
        title: 'Unit 06: zh ch sh r',
        phonemes: ['zh', 'ch', 'sh', 'r'],
        patterns: ['initial'],
        sampleWords: ['zhī', 'chī', 'shī', 'rì'],
      },
    ],
  },
  {
    // 🔴 Level 3 병음조합(拼读) — **성모 그룹별**(L2 와 같은 그룹)로 각 성모를 **붙는 모음 전부**와 결합해
    //    4성으로 배운다(拼读 놀이판). 화면 한 줄 = `b + a` → [bā][bá][bǎ][bà], 줄이 성모×모음마다 하나.
    //    축이 "성모 그룹 고정 · 성모 순회 · 모음 순회 · 각 4성"이라, pattern 은 blend(L5/L6 복운모)와 구분되는 `combine`.
    //    🔴 **모음을 하나로 고정하지 않는다**(2026-08-10 사용자: "왜 b p m f 는 a 블렌딩만 해?") — 대표 모음
    //    하나만 배우면 그 성모가 내는 소리의 1/4 만 겪는다. 그래서 title 에도 모음을 안 적는다(여러 개다).
    //    🔴 성조가 이 레벨의 새 축. 🔴 4성이 다 실존하지 않는 조합이 있다(p+a = pā pá pà, pǎ 없음 / k+a =
    //    kā kǎ) → 학습자 `COMBINE_SYLLABLES` 표(72줄 257음절, 전부 mod_chinese 실존)가 실존 음절만 담는다.
    //    한자·그림 없이 병음 음절만(한자·낱말은 L4). 6 성모 그룹 유닛.
    level: 'level3',
    name: 'Level 3: 병음조합',
    description: '성모 × 붙는 모음 전부 × 4성 拼读 (b + a → bā bá bǎ bà · b + o → bō bó bǒ bò)',
    units: [
      {
        id: 'zh-l3-u01',
        title: 'Unit 01: b p m f',
        phonemes: ['b', 'p', 'm', 'f'],
        patterns: ['combine'],
        sampleWords: ['b', 'p', 'm', 'f'],
      },
      {
        id: 'zh-l3-u02',
        title: 'Unit 02: d t n l',
        phonemes: ['d', 't', 'n', 'l'],
        patterns: ['combine'],
        sampleWords: ['d', 't', 'n', 'l'],
      },
      {
        id: 'zh-l3-u03',
        title: 'Unit 03: g k h',
        phonemes: ['g', 'k', 'h'],
        patterns: ['combine'],
        sampleWords: ['g', 'k', 'h'],
      },
      {
        id: 'zh-l3-u04',
        title: 'Unit 04: j q x',
        phonemes: ['j', 'q', 'x'],
        patterns: ['combine'],
        sampleWords: ['j', 'q', 'x'],
      },
      {
        id: 'zh-l3-u05',
        // z c s + a/e/i/u (zi ci si 는 舌尖前 whole-read 계열이지만 여기선 성모+운모 조합으로 배운다).
        title: 'Unit 05: z c s',
        phonemes: ['z', 'c', 's'],
        patterns: ['combine'],
        sampleWords: ['z', 'c', 's'],
      },
      {
        id: 'zh-l3-u06',
        // zh ch sh r + a/e/i/u(舌尖後). r 은 a 와 안 붙어 e/i/u 3줄.
        title: 'Unit 06: zh ch sh r',
        phonemes: ['zh', 'ch', 'sh', 'r'],
        patterns: ['combine'],
        sampleWords: ['zh', 'ch', 'sh', 'r'],
      },
    ],
  },
  {
    // 🔴 Level 4 단어(单词) — 1음절 CV 낱말(병음 + 한자 병기). L3(병음조합 CV) 뒤라 아이가 읽는 건 CV
    //    뿐이다(복운모·비운모 낱말은 L5/L6). 🔴 소리 학습 구간(L1~L3)엔 한자가 0 이고, **한자는 여기
    //    낱말에서만** 병기한다(병음 위 / 한자 아래). `sampleWords` = 표시용 병음(성조부호), 한자·뜻·삽화
    //    슬러그는 학습자 `chinese-phonics-units.ts` 의 `L4_WORDS` 가 든다(커리큘럼은 소리 목록만).
    //    🔴 음원 = `mod_chinese/{병음}.mp3` 직행(mǐ·tù·jī… 전부 실존). 삽화·keypoints 는 storybook
    //    (`zh-l4-u0N`)에 붙는다. 유닛은 성모 결로 느슨히 묶은 4~5낱말씩 3유닛.
    level: 'level4',
    name: 'Level 4: 단어',
    description: '1음절 CV 낱말 — 병음 + 한자 (mǐ 米 · tù 兔 · jī 鸡)',
    units: [
      {
        id: 'zh-l4-u01',
        title: 'Unit 01: mǐ mǎ mù tù lù',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['mǐ', 'mǎ', 'mù', 'tù', 'lù'],
      },
      {
        id: 'zh-l4-u02',
        title: 'Unit 02: jī shī rì chī',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['jī', 'shī', 'rì', 'chī'],
      },
      {
        id: 'zh-l4-u03',
        title: 'Unit 03: hé hǔ gǔ é sì',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['hé', 'hǔ', 'gǔ', 'é', 'sì'],
      },
      {
        // 단운모/통독 확장 낱말 — zhū 猪 · shū 书 · yú 鱼 · yǔ 雨 · yī 衣 (삽화·mod_chinese 음원 실존).
        id: 'zh-l4-u04',
        title: 'Unit 04: zhū shū yú yǔ yī',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['zhū', 'shū', 'yú', 'yǔ', 'yī'],
      },
    ],
  },
  {
    // 🔴 Level 5 복운모(复韵母) — 성모 + 복운모 블렌딩. **L3(병음조합)과 100% 같은 메커니즘**:
    //    카드 = 음절(sampleWords), 소리 = 원어민 블렌드 3클립(성모 citation → 복운모 → 음절). patterns
    //    'blend' 를 공유하므로 plan·isBlendUnit·getChineseListenCards 가 L3 와 똑같이 처리한다(유닛 데이터만 추가).
    //    한자·그림·게임 없이 병음 소리만(복운모 낱말은 후속). 교안 3묶음: ai ei ui / ao ou iu / ie üe (er).
    //    🔴 **성모 붙은 진짜 블렌드만** — y/w 로 시작하는 整体认读(yè·yuè·yóu·wěi…)와 er(儿·성모 결합 불가)은
    //    제외한다(성모가 없어 블렌드가 성립 안 함 → L7 통독). 🔴 전 음절·복운모 final 클립이 `mod_chinese`
    //    (1394)에 실존(HEAD 200 전수 확인). 성모는 blendClips 가 s.slice(1) 로 운모를 떼므로 **1글자 성모만**
    //    (b p m f d t n l g k h j q x) — shuǐ·chuī 같은 2글자 성모(sh·ch)는 못 쪼개니 넣지 않는다.
    level: 'level5',
    name: 'Level 5: 복운모',
    description: '성모 + 복운모 → 음절 (māo · gǒu · niú · mǎi)',
    units: [
      {
        id: 'zh-l5-u01',
        // ai ei ui — mǎi 买 · bái 白 · bēi 杯 · fēi 飞 · guì 贵 · duì 对 (shuǐ 는 sh 2글자라 제외)
        title: 'Unit 01: ai ei ui 조합',
        phonemes: ['ai', 'ei', 'ui'],
        patterns: ['blend'],
        sampleWords: ['mǎi', 'bái', 'bēi', 'fēi', 'guì', 'duì'],
      },
      {
        id: 'zh-l5-u02',
        // ao ou iu — māo 猫 · hǎo 好 · gǒu 狗 · tóu 头 · niú 牛 · liù 六
        title: 'Unit 02: ao ou iu 조합',
        phonemes: ['ao', 'ou', 'iu'],
        patterns: ['blend'],
        sampleWords: ['māo', 'hǎo', 'gǒu', 'tóu', 'niú', 'liù'],
      },
      {
        id: 'zh-l5-u03',
        // ie üe — xiě 写 · jiě 姐 · xué 学 · xuě 雪. er(儿)은 성모 결합이 없는 整体认读 운모라 제외(L7).
        // 🔴 xué·xuě 는 j/q/x 뒤 u=ü — blendClips 가 운모 첫 글자를 ü 로 바꿔 클립 üé·üě 를 찾는다.
        title: 'Unit 03: ie üe 조합',
        phonemes: ['ie', 'üe'],
        patterns: ['blend'],
        sampleWords: ['xiě', 'jiě', 'xué', 'xuě'],
      },
      // 🔴 복운모 낱말 유닛 — 배운 복운모가 든 구체 낱말(삽화·mod_chinese 음원). 「낱말 놀이」 게임 + 복습 substrate.
      {
        id: 'zh-l5-u04',
        title: 'Unit 04: 동물 (māo gǒu niú hǎi bāo)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['māo', 'gǒu', 'niú', 'hǎi', 'bāo'],
      },
      {
        id: 'zh-l5-u05',
        title: 'Unit 05: 사물 (shuǐ bēi qiú nǎi)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['shuǐ', 'bēi', 'qiú', 'nǎi'],
      },
      {
        id: 'zh-l5-u06',
        title: 'Unit 06: 자연 (yè xié yuè xuě)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['yè', 'xié', 'yuè', 'xuě'],
      },
    ],
  },
  {
    // 🔴 Level 6 비운모(鼻韵母) — 성모 + 비운모 블렌딩. L3/L5 와 **같은 메커니즘**(patterns 'blend').
    //    코드 변경 0 — blendClips 가 [성모 citation, 비운모, 음절] 3클립을 뽑고 전 클립이 mod_chinese 에
    //    실존(HEAD 200 전수 확인, 18/18 OK). 🔴 **성모 단자음 + 순수 비운모만** — blendClips 는 s.slice(1)
    //    을 운모로 떼므로, jiāng·guān 처럼 개운모(iang·uan)가 낀 음절은 bare rime 클립(iāng·uān)이 없어
    //    제외한다(an en in un ün / ang eng ing ong 9종만 bare 클립 존재). jūn·qún 은 jqx+u=ü → blendClips
    //    가 운모 첫 글자를 ü 로 바꿔 ǖn·ǘn 클립을 찾는다(L3 와 동일). 前鼻(-n) 2유닛 · 後鼻(-ng) 2유닛으로
    //    나눠 -n↔-ng 변별을 돕는다. 한자·그림·게임 없이 병음 소리만(비운모 낱말은 후속).
    level: 'level6',
    name: 'Level 6: 비운모',
    description: '성모 + 비운모 → 음절 (fàn · mén · fēng · dōng)',
    units: [
      {
        id: 'zh-l6-u01',
        // 前鼻 an en — bàn 半 · fàn 饭 · mén 门 · fēn 分
        title: 'Unit 01: an en 조합',
        phonemes: ['an', 'en'],
        patterns: ['blend'],
        sampleWords: ['bàn', 'fàn', 'mén', 'fēn'],
      },
      {
        id: 'zh-l6-u02',
        // 前鼻 in un ün — xīn 心 · jīn 金 · kūn 昆 · dūn 蹲 · jūn 军 · qún 裙
        title: 'Unit 02: in un ün 조합',
        phonemes: ['in', 'un', 'ün'],
        patterns: ['blend'],
        sampleWords: ['xīn', 'jīn', 'kūn', 'dūn', 'jūn', 'qún'],
      },
      {
        id: 'zh-l6-u03',
        // 後鼻 ang eng — fáng 房 · tāng 汤 · dēng 灯 · fēng 风
        title: 'Unit 03: ang eng 조합',
        phonemes: ['ang', 'eng'],
        patterns: ['blend'],
        sampleWords: ['fáng', 'tāng', 'dēng', 'fēng'],
      },
      {
        id: 'zh-l6-u04',
        // 後鼻 ing ong — xīng 星 · bīng 冰 · hóng 红 · lóng 龙
        title: 'Unit 04: ing ong 조합',
        phonemes: ['ing', 'ong'],
        patterns: ['blend'],
        sampleWords: ['xīng', 'bīng', 'hóng', 'lóng'],
      },
      // 🔴 비운모 낱말 유닛 — 배운 비운모가 든 구체 낱말(삽화·mod_chinese 음원). 「낱말 놀이」 게임 + 복습 substrate.
      {
        id: 'zh-l6-u05',
        title: 'Unit 05: 자연 (shān mén yún yáng)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['shān', 'mén', 'yún', 'yáng'],
      },
      {
        id: 'zh-l6-u06',
        title: 'Unit 06: 사물 (dēng xīng bīng píng)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['dēng', 'xīng', 'bīng', 'píng'],
      },
      {
        id: 'zh-l6-u07',
        title: 'Unit 07: 사물 (xióng zhōng chóng táng)',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['xióng', 'zhōng', 'chóng', 'táng'],
      },
    ],
  },
  {
    // 🔴 Level 7 整体认读(통독 음절) — 성모+운모로 안 쪼개지는 whole-read 16음절. blend 가 아니라 새 pattern
    //    'whole': 배우기가 그 음절의 4성을 순서로 들려주고(단운모 운모 놀이판과 같은 리듬) 듣고 고르기로 변별한다.
    //    쓰기·사냥 없음(다글자+성조부호라 캔버스 밖 — zh/ch/sh 성모와 같은 이유). 전 성조 클립 mod_chinese 실존
    //    (64/64 HEAD 200 확인). 교재 표준 5묶음: zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan / yin yun ying.
    //    phonemes = whole 음절(카드/소리 키), sampleWords = tone-1 참조용. 🔴 복습(게임형)은 후속 — 한글 복습 호스트
    //    포팅이 필요한 별개 작업이라 여기 통독까지만 넣는다.
    level: 'level7',
    name: 'Level 7: 통독 음절',
    description: '整体认读 whole-read 음절 (zhi · yi · yue · ying)',
    units: [
      {
        id: 'zh-l7-u01',
        title: 'Unit 01: zhi chi shi ri',
        phonemes: ['zhi', 'chi', 'shi', 'ri'],
        patterns: ['whole'],
        sampleWords: ['zhī', 'chī', 'shī', 'rī'],
      },
      {
        id: 'zh-l7-u02',
        title: 'Unit 02: zi ci si',
        phonemes: ['zi', 'ci', 'si'],
        patterns: ['whole'],
        sampleWords: ['zī', 'cī', 'sī'],
      },
      {
        id: 'zh-l7-u03',
        title: 'Unit 03: yi wu yu',
        phonemes: ['yi', 'wu', 'yu'],
        patterns: ['whole'],
        sampleWords: ['yī', 'wū', 'yū'],
      },
      {
        id: 'zh-l7-u04',
        title: 'Unit 04: ye yue yuan',
        phonemes: ['ye', 'yue', 'yuan'],
        patterns: ['whole'],
        sampleWords: ['yē', 'yuē', 'yuān'],
      },
      {
        id: 'zh-l7-u05',
        title: 'Unit 05: yin yun ying',
        phonemes: ['yin', 'yun', 'ying'],
        patterns: ['whole'],
        sampleWords: ['yīn', 'yūn', 'yīng'],
      },
    ],
  },
  {
    // 🔴 Level 8 2음절 낱말(双音节词) — 탱고 시나리오 8단계 "단어 놀이판"(1음절→2음절 명시 진행). 현대 중국어
    //    낱말 대부분이 2음절이라 실용성이 크다. 🔴 **원어민 녹음 직행**(`/tangoch/word2/` → mod_chinese,
    //    경성까지 정확 — `upload-chinese-word2-audio.mjs`). 그림 되는 구체 낱말 48개만(추상어 重要·迅速 제외).
    //    낱말 유닛(pattern 'word')이라 「낱말 놀이」(연습+그리기+짝) + 복습이 자동으로 붙는다.
    level: 'level8',
    name: 'Level 8: 2음절 낱말',
    description: '双音节词 — 원어민 녹음 (hǎibiān 海边 · xīngxīng 星星 · húdié 蝴蝶)',
    units: [
      {
        id: 'zh-l8-u01',
        title: 'Unit 01: 海边台灯外套爱心杯子黑板',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['hǎibiān', 'táidēng', 'wàitào', 'àixīn', 'bēizi', 'hēibǎn'],
      },
      {
        id: 'zh-l8-u02',
        title: 'Unit 02: 雷声妹妹尾巴水果火腿老人',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['léishēng', 'mèimèi', 'wěiba', 'shuǐguǒ', 'huǒtuǐ', 'lǎorén'],
      },
      {
        id: 'zh-l8-u03',
        title: 'Unit 03: 小猫勺子早上鸡肉柳树奶牛',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['xiǎomāo', 'sháozi', 'zǎoshàng', 'jīròu', 'liǔshù', 'nǎiniú'],
      },
      {
        id: 'zh-l8-u04',
        title: 'Unit 04: 足球姐姐铁路蝴蝶雪花二胡',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['zúqiú', 'jiějiě', 'tiělù', 'húdié', 'xuěhuā', 'èrhú'],
      },
      {
        id: 'zh-l8-u05',
        title: 'Unit 05: 耳朵鸡蛋午饭雨伞晚餐眼睛',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['ěrduǒ', 'jīdàn', 'wǔfàn', 'yǔsǎn', 'wǎncān', 'yǎnjīng'],
      },
      {
        id: 'zh-l8-u06',
        title: 'Unit 06: 树根门口枕头金鱼钢琴奖品',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['shùgēn', 'ménkǒu', 'zhěntou', 'jīnyú', 'gāngqín', 'jiǎngpǐn'],
      },
      {
        id: 'zh-l8-u07',
        title: 'Unit 07: 轮船竹笋裙子军人绵羊冰箱',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['lúnchuán', 'zhúsǔn', 'qúnzi', 'jūnrén', 'miányáng', 'bīngxiāng'],
      },
      {
        id: 'zh-l8-u08',
        title: 'Unit 08: 井水花瓶星星农民瓢虫红包',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['jǐngshuǐ', 'huāpíng', 'xīngxīng', 'nóngmín', 'piáochóng', 'hóngbāo'],
      },
      // 🔴 추상·동작 2음절 낱말(u09~u14) — 동작·장면·관습 상징으로 삽화(开心=웃는 아이·迅速=달리는 토끼·正确=체크).
      {
        id: 'zh-l8-u09',
        title: 'Unit 09: 开心吹风灰尘宝贵拥抱口袋',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['kāixīn', 'chuīfēng', 'huīchén', 'bǎoguì', 'yōngbào', 'kǒudài'],
      },
      {
        id: 'zh-l8-u10',
        title: 'Unit 10: 洗手头发走路喝酒休息排列',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['xǐshǒu', 'tóufà', 'zǒulù', 'hējiǔ', 'xiūxī', 'páiliè'],
      },
      {
        id: 'zh-l8-u11',
        title: 'Unit 11: 写字忽略感觉正确儿歌问题',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['xiězì', 'hūlüè', 'gǎnjué', 'zhèngquè', 'érgē', 'wèntí'],
      },
      {
        id: 'zh-l8-u12',
        title: 'Unit 12: 身体心情乡村春天困难迅速',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['shēntǐ', 'xīnqíng', 'xiāngcūn', 'chūntiān', 'kùnnán', 'xùnsù'],
      },
      {
        id: 'zh-l8-u13',
        title: 'Unit 13: 唱歌房间朗读上学乘车寒冷',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['chànggē', 'fángjiān', 'lǎngdú', 'shàngxué', 'chéngchē', 'hánlěng'],
      },
      {
        id: 'zh-l8-u14',
        title: 'Unit 14: 朋友跳绳改正听话重要通过',
        phonemes: [],
        patterns: ['word'],
        sampleWords: ['péngyǒu', 'tiàoshéng', 'gǎizhèng', 'tīnghuà', 'zhòngyào', 'tōngguò'],
      },
    ],
  },
] as const;

export type PhonicsLanguage = 'english' | 'korean' | 'chinese';
export type EnglishPhonicsLevel = (typeof ENGLISH_PHONICS_CURRICULUM)[number]['level'];
export type KoreanPhonicsLevel = (typeof KOREAN_PHONICS_CURRICULUM)[number]['level'];
export type ChinesePhonicsLevel = (typeof CHINESE_PHONICS_CURRICULUM)[number]['level'];

/** Current Hori story defaults; retired zodiac themes must not be offered again. */
export const KOREAN_UNIT_STORY_DEFAULTS: Record<
  string,
  { storyTheme: string; characterNames: string[] }
> = Object.fromEntries(
  KOREAN_PHONICS_CURRICULUM.flatMap((level) =>
    level.units.map((unit) => [
      unit.id,
      {
        storyTheme: `호리와 친구들이 한글 나무에서 ${unit.title}의 글자와 낱말을 발견합니다.`,
        characterNames: ['호리', '토토', '보리', '콩이', '두부'],
      },
    ])
  )
);

/** English lessons retain their curriculum; the retired zodiac story has no default. */
export const ENGLISH_UNIT_STORY_DEFAULTS: Record<
  string,
  { storyTheme: string; characterNames: string[] }
> = {};

/** Approved Hori cast, used by the existing character-library naming action. */
export const HANGUL_FOREST_CHARACTER_NAMES: Record<string, string> = {
  호리: 'Hori',
  '호리 엄마': 'Hori Mom',
  '호리 아빠': 'Hori Dad',
  호야: 'Hoya',
  토토: 'Toto',
  보리: 'Bori',
  콩이: 'Kongi',
  두부: 'Dubu',
};
export const HANGUL_FOREST_CHARACTER_PROFILES: Record<
  string,
  { animal: string; animalEn: string; trait: string }
> = {
  Hori: {
    animal: '호랑이',
    animalEn: 'Tiger',
    trait: '승인된 호리 캐릭터 레퍼런스의 외모와 의상을 유지',
  },
  'Hori Mom': { animal: '호랑이', animalEn: 'Tiger', trait: '승인된 호리 엄마 레퍼런스 유지' },
  'Hori Dad': { animal: '호랑이', animalEn: 'Tiger', trait: '승인된 호리 아빠 레퍼런스 유지' },
  Hoya: {
    animal: '아기 호랑이',
    animalEn: 'Tiger cub',
    trait: '노란 턱받이, 승인된 호야 레퍼런스 유지',
  },
  Toto: { animal: '토끼', animalEn: 'Rabbit', trait: '흰 털, 긴 귀, 빨간 목수건' },
  Bori: { animal: '곰', animalEn: 'Bear', trait: '연갈색 털, 파란 멜빵바지' },
  Kongi: { animal: '다람쥐', animalEn: 'Squirrel', trait: '밤색 털, 큰 폭신한 꼬리' },
  Dubu: { animal: '강아지', animalEn: 'Puppy', trait: '크림빛 흰 털, 빨간 목줄' },
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

// === Cover-title fonts ===
export * from './cover-fonts.js';

// === Speaking Games ===
import type { SpeakingDifficulty, SpeakingDifficultyPreset } from '../types/storybook.js';

export const SPEAKING_PRESETS: Record<SpeakingDifficulty, SpeakingDifficultyPreset> = {
  easy: { showWord: true, autoPlayTts: true, showPromptLine: true, repeatCycles: 1 },
  medium: { showWord: true, autoPlayTts: false, showPromptLine: false, repeatCycles: 1 },
  hard: { showWord: false, autoPlayTts: false, showPromptLine: false, repeatCycles: 2 },
};
