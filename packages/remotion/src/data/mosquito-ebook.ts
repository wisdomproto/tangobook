// 모기 그림책 인터랙티브 이북 — canonical 데이터 (single source of truth)
// 자산(이미지/TTS)은 R2 절대 URL. MOSQUITO_PAGES 는 mosquito-build-data 스크립트가 채운다.
// 스펙: docs/superpowers/specs/2026-06-20-mosquito-ebook-design.md

export const EBOOK_FPS = 30;
// 원본 이미지 다수가 1184x836(비율 1.416). 컴포지션은 그 비율로 두고 이미지는 contain.
export const EBOOK_WIDTH = 1280;
export const EBOOK_HEIGHT = 904;

export type EbookLang = 'ko' | 'ja' | 'fa';
export const EBOOK_LANGS: readonly EbookLang[] = ['ko', 'ja', 'fa'] as const;
export const EBOOK_LANG_LABEL: Record<EbookLang, string> = {
  ko: '한국어',
  ja: '日本語',
  fa: 'فارسی',
};
/** RTL 언어(오른쪽→왼쪽). 자막·오버레이 방향 처리. */
export const RTL_LANGS: readonly EbookLang[] = ['fa'] as const;

/** 샘플 공개 범위 — 앞 N페이지만 노출(전체는 추후). null 이면 전체. */
export const SAMPLE_PAGE_LIMIT: number | null = 10;

export type OverlayAnim = 'drop' | 'pop' | 'shake' | 'fade';
export type OverlayKind = '의성어' | '키워드' | '제목' | '라벨';

export interface EbookOverlay {
  id: string;
  kind: OverlayKind;
  /** 언어별 표시 텍스트. fa 는 샘플(1~10p) 오버레이에만 채움 — 미지정 시 ko 폴백. */
  text: Partial<Record<EbookLang, string>>;
  /** 이미지 박스 기준 중심 위치 (0~1) */
  x: number;
  y: number;
  anim: OverlayAnim;
  /** 등장 지연(초) */
  delaySec: number;
  /** EBOOK_HEIGHT 기준 px */
  fontSize: number;
  color: string;
  /** 기울기(deg) */
  rotate?: number;
  /**
   * 싱크할 나레이션 줄(0-based, \n 분할). 지정 시 그 줄이 낭독될 때 등장(언어별 자동 타이밍).
   * 미지정 시 delaySec(페이지 진입 기준)로 등장 — 표지/요약 키워드 등 장면 고정 오버레이용.
   */
  lineIndex?: number;
  /** true 면 text 를 공백 단위로 쪼개 단어를 하나씩 순차 등장. 키워드 나열 연출용. */
  stagger?: boolean;
  /** stagger 방향: 'row'(가로, 기본) | 'col'(세로 스택). */
  staggerDir?: 'row' | 'col';
}

export interface EbookPage {
  page: number;
  /** 글자 제거한 깨끗한 그림 (R2 절대 URL) */
  imageUrl: string;
  /** 하단 자막 + TTS 대본. 빈 문자열이면 자막/낭독 없음(표지 등) */
  narration: Record<EbookLang, string>;
  /** 생성된 TTS 오디오 (R2 절대 URL) */
  ttsUrl: Partial<Record<EbookLang, string>>;
  /** TTS 오디오 길이(초). 페이지 길이 산출용 (mosquito-tts 스크립트가 probe) */
  ttsDurationSec: Partial<Record<EbookLang, number>>;
  /** 이미지 위 텍스트 오버레이 (의성어/키워드/제목/라벨) */
  overlays: EbookOverlay[];
}

// mosquito-build-data 스크립트가 생성/주입한다 (수동 편집 가능; Chunk 2 까지만 재실행).
export const MOSQUITO_PAGES: EbookPage[] = [
  {
    page: 1,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v3/page-01.webp',
    narration: {
      ko: '',
      ja: '',
      fa: 'پاسخِ پشه',
    },
    ttsUrl: {},
    ttsDurationSec: {},
    overlays: [
      {
        id: 'p01-0',
        kind: '제목',
        text: {
          ko: '모기의 항변',
          ja: '蚊のいいぶん',
          fa: 'پاسخِ پشه',
        },
        x: 0.5,
        y: 0.16,
        anim: 'fade',
        delaySec: 0.3,
        fontSize: 104,
        color: '#1b5e20',
      },
    ],
  },
  {
    page: 2,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-02.webp',
    narration: {
      ko: '나는 동물을 먹지 않아.\n고기도, 생선도, 달걀도, 전부 먹지 않지.\n왜냐고? 알고 싶어?\n그럼 이야기해 줄게. 들어 줄래?',
      ja: 'おいらは動物を食べないんだ。\nお肉も、お魚も、卵も、全部食べないんだ。\nどうしてかって? 知りたいかい。\nじゃあ話してあげよう。聞いてくれるかい。',
      fa: 'من حیوانات را نمی‌خورم.\nنه گوشت، نه ماهی، نه تخم‌مرغ، هیچ‌کدام را نمی‌خورم.\nمی‌پرسی چرا؟ می‌خواهی بدانی؟\nپس برایت تعریف می‌کنم. گوش می‌دهی؟',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-02.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-02.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-02.mp3',
    },
    ttsDurationSec: {
      ko: 11.26,
      ja: 8.86,
      fa: 11.81,
    },
    overlays: [
      {
        id: 'p02-0',
        kind: '키워드',
        text: {
          ko: '계살 인과 자비 시독 건강',
          ja: '戒殺 因果 慈悲 屍毒 健康',
          fa: 'منعِ کشتار، علت و معلول، شفقت، سَمِّ مردار، سلامتی',
        },
        x: 0.5,
        y: 0.1,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 36,
        color: '#6b4423',
        rotate: -2,
        stagger: true,
      },
    ],
  },
  {
    page: 3,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-03.webp',
    narration: {
      ko: '어느 여름밤의 일이었어.\n내가 자고 있는데, 모기 한 마리가\n"앵—" 하고 소리를 내며 날아와서,\n내 목에 앉아 물었지.\n나는 손으로 탁 때리려고 했지만\n조금 망설였어.',
      ja: '夏のある夜のことなんだ。\nおいらが寝ていると、蚊が1匹、\nプーンと音を立てて飛んできて、\nおいらの首にとまって刺したんだ。\nおいらは手でたたこうと思ったんだけど\nちょっと迷ったんだ。',
      fa: 'ماجرا مربوط به یک شبِ تابستانی بود.\nوقتی خوابیده بودم، یک پشه\nبا صدای «وِز—» پرواز‌کنان آمد،\nروی گردنم نشست و نیشم زد.\nخواستم با دست محکم بزنمش،\nاما کمی تردید کردم.',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-03.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-03.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-03.mp3',
    },
    ttsDurationSec: {
      ko: 14.95,
      ja: 11.38,
      fa: 15.07,
    },
    overlays: [
      {
        id: 'p03-0',
        lineIndex: 2,
        kind: '의성어',
        text: {
          ko: '앵―',
          ja: 'プ~ン',
          fa: 'وِز—',
        },
        x: 0.68,
        y: 0.18,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 64,
        color: '#1f2937',
        rotate: -6,
      },
      {
        id: 'p03-1',
        lineIndex: 4,
        kind: '의성어',
        text: {
          ko: '탁!',
          ja: 'ピシッ',
          fa: 'تَق!',
        },
        x: 0.32,
        y: 0.6,
        anim: 'drop',
        delaySec: 1,
        fontSize: 72,
        color: '#c0392b',
        rotate: 8,
      },
    ],
  },
  {
    page: 4,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v2/page-04.webp',
    narration: {
      ko: '왜냐하면, 나는 어째서 모기가 싫은 걸까 하고\n갑자기 머릿속으로 생각했기 때문이야.\n저렇게 날아올 때 나는 소리도 싫지만,\n더 싫은 이유도 있거든.\n그래서 모기에게 한번 물어봤어.',
      ja: 'なぜかというと、おいらはどうして蚊が嫌いなのかと\n急に頭の中で思ったからなんだ。\nあの飛んでくる音も嫌いけど、\nもっと嫌いな理由もあるんだ。\nだからちょっと蚊に聞いてみたんだ。',
      fa: 'چون ناگهان در ذهنم فکر کردم\nکه چرا اصلاً از پشه بدم می‌آید.\nاز صدای پروازش که این‌طور می‌آید هم بدم می‌آید،\nولی دلیلِ بدترِ دیگری هم هست.\nبرای همین یک بار از پشه پرسیدم.',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-04.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-04.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-04.mp3',
    },
    ttsDurationSec: {
      ko: 12.65,
      ja: 10.1,
      fa: 12.5,
    },
    overlays: [
      {
        id: 'p04-0',
        lineIndex: 0,
        kind: '의성어',
        text: {
          ko: '갸웃',
          ja: 'う~ん',
          fa: 'هوم؟',
        },
        x: 0.5,
        y: 0.16,
        anim: 'shake',
        delaySec: 0.3,
        fontSize: 56,
        color: '#6b4423',
        rotate: -4,
      },
    ],
  },
  {
    page: 5,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-05.webp',
    narration: {
      ko: '"모기야! 너는 어째서 우리 인간의 피를 빠는 거야?\n조금쯤은 빨게 해 줘도 괜찮지만,\n가려움을 남기고 가는 건 그만둘 수 없겠니?"\n그러자 모기가 말했지.',
      ja: '「蚊君！君はどうしておいらたち人間の血を吸うの？\n少しくらいは吸わせてやってもいいけど、\n痒みを残していくのはやめてくれないかな。」\nすると蚊が言ったんだ',
      fa: '«آهای پشه! تو چرا خونِ ما انسان‌ها را می‌مکی؟\nکمی مکیدن اشکالی ندارد،\nاما نمی‌شود این خارش را به جا نگذاری و بروی؟»\nآن وقت پشه گفت:',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-05.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-05.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-05.mp3',
    },
    ttsDurationSec: {
      ko: 11.59,
      ja: 10.18,
      fa: 9.72,
    },
    overlays: [],
  },
  {
    page: 6,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-06.webp',
    narration: {
      ko: '"무슨 말을 하는 거야, 우리 모기는\n자기 의지로 가려움을 남기는 게 아니야.\n그렇게 신께서 만드신 거라고.\n다른 동물의 피를 빨아 가려움을 남기는 것 말고는\n우리가 살아갈 방법이 없는걸."',
      ja: '「何を言うんだ、ボクたち蚊は\n自分の意志で痒みを残しているじゃないよ。\nそのように神様が創ったんだよ。\n他の動物の血を吸って痒みを残すしか\nボクたちの生きる方法はないんだよ。」',
      fa: '«چه می‌گویی، ما پشه‌ها\nبه ارادهٔ خودمان خارش به جا نمی‌گذاریم.\nخدا ما را این‌طور آفریده است.\nجز اینکه خونِ حیوانات دیگر را بمکیم و خارش به جا بگذاریم،\nراهی برای زندگی کردن نداریم.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-06.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-06.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-06.mp3',
    },
    ttsDurationSec: {
      ko: 13.85,
      ja: 10.87,
      fa: 14.3,
    },
    overlays: [
      {
        id: 'p06-0',
        lineIndex: 4,
        kind: '키워드',
        text: {
          ko: '어쩔 수 없는걸',
          ja: 'しかたないんだ',
          fa: 'چاره‌ای نیست',
        },
        x: 0.5,
        y: 0.17,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 40,
        color: '#6b4423',
        rotate: -2,
      },
    ],
  },
  {
    page: 7,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-07.webp',
    narration: {
      ko: '"흐음, 그랬구나. 하지만 그렇다고 한다면,\n신은 어째서 그런 식으로 만든 걸까."',
      ja: '「ふーん、そうだったのか。でもそうだとすると、\n神様はどうしてそんなふうに創ったんだろうね。」',
      fa: '«هوم، که این‌طور. اما اگر این‌طور است،\nپس خدا چرا ما را این‌گونه آفریده؟»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-07.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-07.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-07.mp3',
    },
    ttsDurationSec: {
      ko: 6.74,
      ja: 5.21,
      fa: 4.99,
    },
    overlays: [
      {
        id: 'p07-0',
        lineIndex: 0,
        kind: '의성어',
        text: {
          ko: '흐음…',
          ja: 'ふ~ん…',
          fa: 'هوم…',
        },
        x: 0.5,
        y: 0.18,
        anim: 'shake',
        delaySec: 0.3,
        fontSize: 56,
        color: '#374151',
      },
    ],
  },
  {
    page: 8,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-08.webp',
    narration: {
      ko: '"나는 모르겠어.\n신의 마음은 신만이 아는 거야."',
      ja: '「ボクにはわからないよ。\n神様の心は神様しかわからない。」',
      fa: '«من نمی‌دانم.\nدلِ خدا را فقط خدا می‌داند.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-08.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-08.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-08.mp3',
    },
    ttsDurationSec: {
      ko: 5.18,
      ja: 4.34,
      fa: 3.72,
    },
    overlays: [
      {
        id: 'p08-0',
        lineIndex: 0,
        kind: '의성어',
        text: {
          ko: '글쎄…',
          ja: 'さあ…',
          fa: 'خب…',
        },
        x: 0.5,
        y: 0.18,
        anim: 'shake',
        delaySec: 0.3,
        fontSize: 52,
        color: '#374151',
        rotate: -3,
      },
    ],
  },
  {
    page: 9,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-09.webp',
    narration: {
      ko: '"그것보다 너희 인간이야말로, 모처럼 신께서\n다른 동물을 먹지 않아도 살 수 있도록\n만들어 주셨는데,\n어째서 동물을 먹는 거야?"',
      ja: '「それより君達人間こそ、せっかく神様が\n他の動物を食べなくても生きられるように\n創ってくれたというのに、\nどうして動物を食べるの？」',
      fa: '«اما مهم‌تر از آن، شما انسان‌ها هستید که،\nبا اینکه خدا به‌زحمت شما را طوری آفرید\nکه بدون خوردنِ حیواناتِ دیگر هم بتوانید زنده بمانید،\nچرا حیوانات را می‌خورید؟»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-09.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-09.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-09.mp3',
    },
    ttsDurationSec: {
      ko: 8.02,
      ja: 8.14,
      fa: 10.58,
    },
    overlays: [
      {
        id: 'p09-0',
        lineIndex: 3,
        kind: '의성어',
        text: {
          ko: '뜨끔',
          ja: 'ギクリ',
          fa: 'یکّه خوردن!',
        },
        x: 0.15,
        y: 0.42,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 66,
        color: '#c0392b',
        rotate: -8,
      },
    ],
  },
  {
    page: 10,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-10.webp',
    narration: {
      ko: '"두근! 으, 어, 아니,\n그건…\n그렇게 신께서 만드신 거야.\n응. 어려운 말로 하자면\n먹이사슬이라고 하는데,"',
      ja: '「ドキッ！うっ、い、いや、\nそれは…\nそのように神様が創ったんだよ。\nうん。むずかしい言葉でいうと\n食物連鎖といってね、」',
      fa: '«تاپ‌تاپِ قلب! اِ، خُ، نه،\nآن…\nخدا ما را این‌طور آفریده.\nآره. اگر بخواهم با کلمه‌ای سخت بگویم\nبه آن می‌گویند زنجیرهٔ غذایی،»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-10.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-10.mp3',
      fa: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/fa/page-10.mp3',
    },
    ttsDurationSec: {
      ko: 8.74,
      ja: 10.13,
      fa: 9.77,
    },
    overlays: [
      {
        id: 'p10-0',
        kind: '의성어',
        text: {
          ko: '캭—! 날카롭잖아!',
          ja: 'かーっ するどい！',
          fa: 'تیز و کوبنده‌ست!',
        },
        x: 0.4,
        y: 0.15,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 54,
        color: '#c0392b',
        rotate: -4,
      },
      {
        id: 'p10-1',
        lineIndex: 0,
        kind: '의성어',
        text: {
          ko: '두근!',
          ja: 'ドキッ！',
          fa: 'تُپ!',
        },
        x: 0.72,
        y: 0.5,
        anim: 'drop',
        delaySec: 0.9,
        fontSize: 58,
        color: '#c0392b',
        rotate: 6,
      },
    ],
  },
  {
    page: 11,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-11.webp',
    narration: {
      ko: '먼저, 풀을 토끼가 먹어.\n그 토끼를 사자가 먹지.\n사자가 죽어서 흙의 영양분이 돼.\n그리고 그 흙에서 풀이 자라고,\n다시 토끼가 먹어.\n이렇게 생물은,\n서로 다른 생물을 먹으며\n살아갈 수 있게 되어 있는 거야.\n인간은 딱\n사자와 같은 위치에 있는 거지.',
      ja: 'まず、草をうさぎが食べる。\nそのうさぎをライオンが食べる。\nライオンが死んで土の栄養になる。\nそしてその土で草が育ち、\nまたうさぎが食べる。\nこのように生き物は、\nお互いに他の生き物を食べて\n生きていくように出来ているんだよ。\n人間はちょうど\nライオンと同じ位置にいるんだ。',
      fa: '【زنجیرهٔ غذایی】\nاول، علف را خرگوش می‌خورد.\nآن خرگوش را شیر می‌خورد.\nشیر که می‌میرد، به مادهٔ مغذیِ خاک تبدیل می‌شود.\nو در آن خاک علف می‌روید،\nو دوباره خرگوش آن را می‌خورد.\nبه این شکل موجودات،\nبا خوردنِ یکدیگر زنده می‌مانند.\nانسان درست\nدر همان جایگاهِ شیر قرار دارد.',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-11.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-11.mp3',
    },
    ttsDurationSec: {
      ko: 20.42,
      ja: 16.3,
    },
    overlays: [
      {
        id: 'p11-0',
        kind: '제목',
        text: {
          ko: '먹이사슬',
          ja: '食物連鎖',
        },
        x: 0.47,
        y: 0.46,
        anim: 'fade',
        delaySec: 0.3,
        fontSize: 56,
        color: '#1b5e20',
      },
      {
        id: 'p11-1',
        kind: '라벨',
        text: {
          ko: '풀',
          ja: '草',
        },
        x: 0.49,
        y: 0.28,
        anim: 'fade',
        delaySec: 0.7,
        fontSize: 34,
        color: '#3a3a3a',
      },
      {
        id: 'p11-2',
        kind: '라벨',
        text: {
          ko: '토끼',
          ja: 'うさぎ',
        },
        x: 0.69,
        y: 0.61,
        anim: 'fade',
        delaySec: 1,
        fontSize: 34,
        color: '#3a3a3a',
      },
      {
        id: 'p11-3',
        kind: '라벨',
        text: {
          ko: '사자',
          ja: 'ライオン',
        },
        x: 0.34,
        y: 0.72,
        anim: 'fade',
        delaySec: 1.3,
        fontSize: 34,
        color: '#3a3a3a',
      },
      {
        id: 'p11-4',
        kind: '라벨',
        text: {
          ko: '사체',
          ja: '死体',
        },
        x: 0.15,
        y: 0.63,
        anim: 'fade',
        delaySec: 1.6,
        fontSize: 34,
        color: '#3a3a3a',
      },
      {
        id: 'p11-5',
        kind: '라벨',
        text: {
          ko: '흙',
          ja: '土',
        },
        x: 0.24,
        y: 0.33,
        anim: 'fade',
        delaySec: 1.9,
        fontSize: 34,
        color: '#3a3a3a',
      },
    ],
  },
  {
    page: 12,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-12.webp',
    narration: {
      ko: '"잠깐 기다려 봐.\n사자는 토끼나 얼룩말을 먹지만,\n걔들은 원래 육식동물이야.\n살아가기 위해 필요해서\n먹이를 잡아서 먹는 거지,\n필요 이상으로 죽이거나 하지는 않아."',
      ja: '「ちょっと待ってよ。\nライオンはうさぎやシマウマを食べるけど、\n彼らは本来肉食動物だよ。\n生きるために必要だから\n獲物を捕って食べてるんだよ。\nだから余分に殺したりしない。」',
      fa: '«یک لحظه صبر کن.\nشیر خرگوش و گورخر می‌خورد،\nاما آن‌ها ذاتاً حیوانات گوشت‌خوارند.\nبرای زنده ماندن نیاز دارند و\nشکار را می‌گیرند و می‌خورند،\nپس بیش از نیازشان نمی‌کشند.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-12.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-12.mp3',
    },
    ttsDurationSec: {
      ko: 11.26,
      ja: 10.01,
    },
    overlays: [
      {
        id: 'p12-0',
        lineIndex: 0,
        kind: '키워드',
        text: {
          ko: '잠깐!',
          ja: 'ちょっと待って！',
        },
        x: 0.5,
        y: 0.15,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 48,
        color: '#1b5e20',
        rotate: -2,
      },
    ],
  },
  {
    page: 13,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-13.webp',
    narration: {
      ko: '"인간도 그냥 먹기만 하는 게 아니잖아.\n낭비하지 않으려고 가죽으로 벨트나 가방,\n가죽 점퍼, 가죽 구두까지 만들고 있어."',
      ja: '「人間だってただ食べてるだけじゃないよ。\n無駄にしないように皮のベルトやカバン、\n皮ジャンパー、革靴だって作ってるよ」',
      fa: '«انسان هم فقط نمی‌خورد که.\nبرای اینکه چیزی هدر نرود، از چرم کمربند و کیف،\nژاکتِ چرمی و حتی کفشِ چرمی می‌سازد.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-13.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-13.mp3',
    },
    ttsDurationSec: {
      ko: 8.93,
      ja: 7.32,
    },
    overlays: [
      {
        id: 'p13-0',
        lineIndex: 1,
        kind: '키워드',
        text: {
          ko: '낭비 안 해!',
          ja: '無駄にしない！',
        },
        x: 0.5,
        y: 0.16,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 42,
        color: '#6b4423',
      },
    ],
  },
  {
    page: 14,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-14.webp',
    narration: {
      ko: '"내가 말하고 싶은 건\n그런 게 아니야.\n입을 한번 벌려 봐.\n봐, 너의 이빨과 사자의 이빨은 달라.\n너의 이빨은 곡물을 먹기 좋게\n평평한 이빨이지만, 사자의 이빨은\n고기를 찢기 쉽도록 뾰족한 이빨이야.\n즉 너희 인간은\n원래 육식동물이 아닌 거야."',
      ja: '「ボクが言いたいのは\nそういうことじゃない。\nちょっと口を開けてみて。\nホラ、君の歯とライオンの歯は違う。\n君の歯は穀物を食べやすいように\n平らな歯だけど、ライオンの歯は\n肉をちぎりやすいように尖った歯だ。\nつまり君たち人間は\n本来肉食動物ではないんだよ。」',
      fa: '【شکلِ دندان】\n«منظورِ من\nاین چیزها نیست.\nکمی دهانت را باز کن.\nببین، دندان‌های تو با دندان‌های شیر فرق دارند.\nدندان‌های تو برای خوردنِ غلات\nصاف‌اند، اما دندان‌های شیر\nبرای پاره کردنِ گوشت تیزند.\nیعنی شما انسان‌ها\nذاتاً حیوانِ گوشت‌خوار نیستید.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-14.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-14.mp3',
    },
    ttsDurationSec: {
      ko: 21.02,
      ja: 16.32,
    },
    overlays: [
      {
        id: 'p14-0',
        lineIndex: 3,
        kind: '제목',
        text: {
          ko: '이빨 모양',
          ja: '歯型',
        },
        x: 0.5,
        y: 0.09,
        anim: 'fade',
        delaySec: 0.3,
        fontSize: 56,
        color: '#1b5e20',
      },
      {
        id: 'p14-1',
        lineIndex: 5,
        kind: '라벨',
        text: {
          ko: '채식',
          ja: '菜食',
        },
        x: 0.27,
        y: 0.55,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 42,
        color: '#1b5e20',
      },
      {
        id: 'p14-3',
        lineIndex: 6,
        kind: '라벨',
        text: {
          ko: '육식',
          ja: '肉食',
        },
        x: 0.62,
        y: 0.82,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 42,
        color: '#c0392b',
      },
      {
        id: 'p14-2',
        lineIndex: 2,
        kind: '의성어',
        text: {
          ko: '아—앙',
          ja: 'あ~ん',
        },
        x: 0.15,
        y: 0.29,
        anim: 'pop',
        delaySec: 0.9,
        fontSize: 48,
        color: '#c0392b',
        rotate: -4,
      },
    ],
  },
  {
    page: 15,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-15.webp',
    narration: {
      ko: '"그 너희 인간이 어째서 그렇게 고기를 먹고 싶어 하는지,\n먹을 필요가 없잖아, 라는 거야."\n"그건 다시 말해서, 영양의 균형이야.\n건강을 위해 여러 가지를 먹지 않으면\n영양실조가 되어 병에 걸리게 되니까."',
      ja: '「その君達人間が何故そんなに肉を食べたがるのか、\n食べる必要がないじゃないか、ということだよ。」\n「それはつまり、栄養のバランスだよ。\n健康のためにいろいろ食べないと\n栄養失調になって病気になってしまうからさ。」',
      fa: '«حالا چرا شما انسان‌ها این‌قدر دلتان می‌خواهد گوشت بخورید،\nدر حالی که لازم نیست بخورید، حرفِ من این است.»\n«آن یعنی، تعادلِ تغذیه.\nاگر برای سلامتی چیزهای مختلف نخوریم\nدچار سوءتغذیه می‌شویم و بیمار می‌شویم.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-15.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-15.mp3',
    },
    ttsDurationSec: {
      ko: 15.91,
      ja: 13.9,
    },
    overlays: [
      {
        id: 'p15-0',
        lineIndex: 2,
        kind: '키워드',
        text: {
          ko: '영양 균형',
          ja: '栄養バランス',
        },
        x: 0.5,
        y: 0.15,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 44,
        color: '#1b5e20',
      },
    ],
  },
  {
    page: 16,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-16.webp',
    narration: {
      ko: '"엇, 뭐, 영양의 균형이란 게 뭐야.\n누구한테서 그런 걸 배운 거야?\n판다를 봐. 매일 조릿대만 먹는데\n저렇게 큰 몸을 하고 있어.\n판다는 영양의 균형이 나쁜 거니?"',
      ja: '「えっ、なに、栄養のバランスって何なの。\n誰からそんなこと教わったの？\nパンダを見てよ。毎日笹ばかり食べてるけど\nあんな大きな体をしているよ。\nパンダは栄養のバランスが悪いのかい。」',
      fa: '«اِ، چی، تعادلِ تغذیه دیگر چیست؟\nچه کسی این را به تو یاد داده؟\nبه پاندا نگاه کن. هر روز فقط برگِ خیزران می‌خورد\nولی بدنی به آن بزرگی دارد.\nیعنی تعادلِ تغذیهٔ پاندا بد است؟»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-16.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-16.mp3',
    },
    ttsDurationSec: {
      ko: 9.72,
      ja: 10.44,
    },
    overlays: [
      {
        id: 'p16-0',
        lineIndex: 2,
        kind: '키워드',
        text: {
          ko: '판다!',
          ja: 'パンダ！',
        },
        x: 0.3,
        y: 0.15,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 48,
        color: '#1b5e20',
      },
      {
        id: 'p16-1',
        lineIndex: 3,
        kind: '의성어',
        text: {
          ko: '오물오물',
          ja: 'もぐもぐ',
        },
        x: 0.66,
        y: 0.58,
        anim: 'shake',
        delaySec: 1,
        fontSize: 44,
        color: '#6b4423',
        rotate: 3,
      },
    ],
  },
  {
    page: 17,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-17.webp',
    narration: {
      ko: '"너희는 원래 자기에게 필요 없는 것을\n영양이 있다고 믿어 버려서,\n게다가 동물을 먹기 위해 키워서,\n맛있다느니 뭐니 이유를 붙여서,\n그러고는 죽여서 먹는 거야."\n"먹히는 동물의 마음을 알겠어?\n어제까지 가족처럼 믿고 있던 주인에게,\n오늘은 죽임을 당해 먹혀 버리는 거야.\n죽임을 당할 때 동물의 비명을\n너는 모르겠지."\n"그 슬픔을 알겠어?"\n"그 아픔을 알겠어?"\n"안다고 해도, 좀 무리지."\n"좋아! 그럼 만약 너와 죽임을 당하는 동물의\n입장이 반대였다면 어떻게 할 거야?"\n"아니, 그건 곤란해."',
      ja: '「君達は本来自分に必要のないものを\n栄養があると思いこんで、\nしかも動物を食べるために育てて、\nおいしいとか何とか理由をつけて、\nそれから殺して食べてるんだよ。」\n「食べられる動物の気持ちがわかるかい。\n昨日まで家族のように信頼していた主人に、\n今日は殺されて食べられちゃうんだ。\n殺される時の動物の叫びを\n君は知らないだろう。」\n「その悲しみがわかるかい？」\n「その痛みがわかるかい？」\n「わかるかいといわれても、ちょっと無理だよ」\n「よし！じゃあもし君と殺される動物の立場が\n逆だったらどうする？」\n「いや、それはこまる。」',
      fa: '«شما ذاتاً چیزی را که در واقع لازم ندارید\nباور می‌کنید که مغذی است،\nو حیوانات را برای خوردن پرورش می‌دهید،\nو با بهانه‌هایی مثل خوشمزه بودن،\nبعد می‌کشیدشان و می‌خوریدشان.»\n«احساسِ حیوانی را که خورده می‌شود می‌فهمی؟\nصاحبی که تا دیروز مثل خانواده به او اعتماد داشت،\nامروز او را می‌کشد و می‌خورد.\nصدای فریادِ حیوان هنگامِ کشته شدن را\nتو نمی‌دانی، مگر نه؟»\n«آن اندوه را می‌فهمی؟»\n«آن درد را می‌فهمی؟»\n«حتی اگر بفهمم هم، کمی سخت است.»\n«خیلی خب! اگر جایِ تو و حیوانی که کشته می‌شود\nعوض می‌شد چه کار می‌کردی؟»\n«نه، آن یکی برایم دردسر می‌شود.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-17.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-17.mp3',
    },
    ttsDurationSec: {
      ko: 35.38,
      ja: 33.38,
    },
    overlays: [
      {
        id: 'p17-0',
        lineIndex: 8,
        kind: '키워드',
        text: {
          ko: '비명…',
          ja: '叫び…',
        },
        x: 0.5,
        y: 0.13,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 54,
        color: '#8b1a1a',
      },
      {
        id: 'p17-1',
        lineIndex: 10,
        kind: '키워드',
        text: {
          ko: '슬픔',
          ja: '悲しみ',
        },
        x: 0.26,
        y: 0.52,
        anim: 'shake',
        delaySec: 1,
        fontSize: 46,
        color: '#374151',
        rotate: -3,
      },
      {
        id: 'p17-2',
        lineIndex: 11,
        kind: '키워드',
        text: {
          ko: '아픔',
          ja: '痛み',
        },
        x: 0.74,
        y: 0.58,
        anim: 'shake',
        delaySec: 1.6,
        fontSize: 46,
        color: '#374151',
        rotate: 3,
      },
    ],
  },
  {
    page: 18,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-18.webp',
    narration: {
      ko: '"너희 인간은 그 곤란한 일을 하고 있는 거야.\n마치 인간만이 가장 잘나서,\n동물은 전부 인간을 위해 있다고\n말하는 것 같아.\n하물며 너희 몸은 고기를 필요로 하지 않아.\n그러기는커녕, 고기를 너무 많이 먹어서\n오히려 병에 걸리거나 하잖아."',
      ja: '「君達人間はそのこまることをやっているんだよ。\nまるで人間だけが一番えらくて、\n動物はすべて人間のためにあるといっているみたい。\nまして君達の体は肉を必要としないんだよ。\nそれどころか、肉を食べ過ぎて\nかえって病気になったりしてるじゃないか。」',
      fa: '«شما انسان‌ها دارید همان کارِ دردسرساز را می‌کنید.\nانگار که فقط انسان از همه برتر است،\nو همهٔ حیوانات برای انسان وجود دارند.\nوانگهی بدنِ شما به گوشت نیازی ندارد.\nچه بسا، با زیاده‌روی در خوردنِ گوشت\nبرعکس بیمار هم می‌شوید.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-18.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-18.mp3',
    },
    ttsDurationSec: {
      ko: 17.3,
      ja: 15.86,
    },
    overlays: [
      {
        id: 'p18-0',
        lineIndex: 6,
        kind: '키워드',
        text: {
          ko: '병들어…',
          ja: '病気に…',
        },
        x: 0.5,
        y: 0.16,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 44,
        color: '#8b1a1a',
      },
    ],
  },
  {
    page: 19,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-19.webp',
    narration: {
      ko: '"인간 중에도 이누이트처럼\n육식을 필요로 하는 사람들도 있어."\n"분하다고 반론해 봐도 소용없어.\n걔들도 원래는 채식동물이야.\n하지만 오랫동안 추운 곳에 살았기 때문에,\n고기를 먹을 수 있는 체질로 변해 버린 거야.\n그렇지만 원래 육식동물이 아니니까\n수명은 다른 사람들에 비해 짧아.\n걔들도 또한 사자와 마찬가지로\n필요 없는 동물은 죽이거나 하지 않아."',
      ja: '「人間の中にもイヌイットのように\n肉食を必要とする人たちもあるよ。」\n「くやしまぎれに反論しても無駄だよ。\n彼らだって本来は菜食動物だよ。\nでも長い間寒いところに住んでいたので、\n肉を食べれるような体質に変わってしまったんだ。\nだけど本来、肉食動物ではないから\n寿命は他に比べて短いんだ。\n彼らもまた、ライオンと同じように\n必要のない動物も殺したりしない。」',
      fa: '«در میانِ انسان‌ها هم کسانی مثلِ اینوئیت‌ها هستند\nکه به گوشت‌خواری نیاز دارند.»\n«هرچقدر هم از روی دلخوری اعتراض کنی فایده‌ای ندارد.\nآن‌ها هم در اصل حیواناتِ گیاه‌خوارند.\nاما چون مدت‌ها در جای سرد زندگی کردند،\nبدنشان به سرشتی که گوشت بخورد تغییر کرد.\nاما چون ذاتاً گوشت‌خوار نیستند\nعمرشان کوتاه‌تر است.\nآن‌ها هم مثلِ شیر\nحیواناتِ غیرلازم را نمی‌کشند.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-19.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-19.mp3',
    },
    ttsDurationSec: {
      ko: 21.96,
      ja: 24.29,
    },
    overlays: [],
  },
  {
    page: 20,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-20.webp',
    narration: {
      ko: '"게다가 너희들의 사치는 대체 뭐야.\n미식이라며 자기 나라에 없는 것까지\n일부러 외국에서 가져와서 먹어.\n그리고 일부러 남겨서 버려. 유통기한이라며,\n웃기지도 않아. 먹을 것에 대한 결례야.\n애초에 너희들은 무엇을 위해 일하고 있는 거야.\n왜 사치를 하기 위해 일하는 거지.\n일해서 육식이라는 사치를 하고,\n병이 들어 죽어 가고,\n시시한 인생이라고 생각하지 않아?\n그런데도 성실하게 살고 있는 우리 모기에게\n조금 가려움을 남겼다고 불평하지 마."',
      ja: '「それに比べ君達のぜいたくさかげんは一体なんだよ。\nグルメとかいって自分の国にない物まで\nわざわざ外国からもってきて食べる。\nそして食べ残して捨てる。賞味期限だって、\n笑わせるなよ。食べ物に失礼だ。\nそもそも君達は何のために働いているんだい。\nどうぜいたくをするためだろう。\n働いて肉食というぜいたくをして、\n病気になって死んでいく、\nつまらない人生だと思わないかい。\nそれなのにまじめに生きているボク達蚊に\nちょっと痒みを残されたくらいで文句をつけるなよ。',
      fa: '«وانگهی این ولخرجیِ شما دیگر چیست؟\nبه اسمِ خوش‌خوراکی، حتی چیزهایی را که در کشورتان نیست\nعمداً از خارج می‌آورید و می‌خورید.\nو عمداً پس‌مانده می‌گذارید و دور می‌ریزید. به بهانهٔ تاریخِ انقضا،\nخنده‌دار است. این بی‌احترامی به غذاست.\nاصلاً شما برای چه کار می‌کنید؟\nچرا برای ولخرجی کردن کار می‌کنید؟\nکار می‌کنید تا ولخرجیِ گوشت‌خواری کنید،\nبیمار می‌شوید و می‌میرید،\nفکر نمی‌کنی این یک زندگیِ بیهوده است؟\nبا این حال به ما پشه‌ها که صادقانه زندگی می‌کنیم،\nبه خاطرِ کمی خارش خرده نگیر.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-20.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-20.mp3',
    },
    ttsDurationSec: {
      ko: 31.49,
      ja: 31.94,
    },
    overlays: [
      {
        id: 'p20-0',
        lineIndex: 0,
        kind: '키워드',
        text: {
          ko: '사치!',
          ja: 'ぜいたく！',
        },
        x: 0.46,
        y: 0.21,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 50,
        color: '#c0392b',
        rotate: -6,
      },
      {
        id: 'p20-1',
        lineIndex: 3,
        kind: '키워드',
        text: {
          ko: '낭비…',
          ja: 'むだ…',
        },
        x: 0.84,
        y: 0.42,
        anim: 'shake',
        delaySec: 1,
        fontSize: 44,
        color: '#8b1a1a',
        rotate: 4,
      },
    ],
  },
  {
    page: 21,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-21.webp',
    narration: {
      ko: '"그것과 이것은 이야기가 다른 것 같은…"\n"아직 모르는 모양이네.\n그럼 다른 이야기를 해 보자.\n소는 그냥 풀만 먹여서 키우는 게 아니야.\n인간이 먹는 것과 동시에\n곡물도 먹이로 주고 있는 거야.\n동물에게 곡물을 먹여서\n고기로 만드는 것을\n\'우회 생산\'이라고 하는 거야."',
      ja: '「それとこれとは話が違うような…」\n「まだわからないようだね。\nじゃあ違う話をしよう。\n牛はただ草だけ食べさせて育てているわけではない。\n人間が食べるのと同時に\n穀物も餌として与えているんだ。\n動物に穀物を食べさせて\n食肉にすることを\n『う回生産』というんだ。」',
      fa: '«این یکی با آن یکی انگار فرق دارد…»\n«مثلِ اینکه هنوز نفهمیدی.\nپس بگذار حرفِ دیگری بزنم.\nگاو را فقط با علف پرورش نمی‌دهند.\nهم‌زمان با چیزی که انسان می‌خورد\nغلات را هم به‌عنوانِ خوراک به آن می‌دهند.\nبه اینکه به حیوان غلات بدهند\nو به گوشت تبدیلش کنند،\nمی‌گویند «تولیدِ غیرمستقیم».»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-21.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-21.mp3',
    },
    ttsDurationSec: {
      ko: 19.66,
      ja: 19.27,
    },
    overlays: [
      {
        id: 'p21-0',
        lineIndex: 8,
        kind: '제목',
        text: {
          ko: '우회 생산',
          ja: 'う回生産',
        },
        x: 0.5,
        y: 0.14,
        anim: 'fade',
        delaySec: 0.3,
        fontSize: 52,
        color: '#1b5e20',
      },
    ],
  },
  {
    page: 22,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-22.webp',
    narration: {
      ko: '예를 들어 소고기 1킬로를 만드는 데, 7킬로의 곡물이 필요해.\n1킬로의 고기는 6인분 한 끼밖에 안 되지만,\n곡물을 그대로 먹으면 7배 이상인 46인분이 돼.\n즉 소고기를 1인분 먹는다는 것은,\n곡물을 7인분 먹는 것과 같다는 거야.\n마찬가지로 돼지고기 1킬로 만드는 데 4킬로,\n닭은 2킬로의 곡물이 필요해.\n곡물을 그대로 인간이 먹는 편이,\n더 많은 사람이 먹을 수 있다는 것을 알 수 있겠지.',
      ja: '例えば牛肉一キロ作るのに、七キロの穀物が必要だ。\n一キロの肉では六人の一食分にしかならないが、\n穀物をそのまま食べれば七倍以上の四十六人分になる。\nつまり牛肉を一人分食べるということは、\n穀物を七人分食べていることと同じことになるんだよ。\n同様に豚肉一キロつくるのに四キロ、\nニワトリは二キロの穀物が必要なんだ。\n穀物をそのまま人間が食べたほうが、\n多くの人が食べられるということがわかるだろう。',
      fa: 'مثلاً برای ساختنِ یک کیلو گوشتِ گاو، هفت کیلو غلات لازم است.\nیک کیلو گوشت فقط یک وعدهٔ غذای شش نفر می‌شود،\nاما اگر غلات را همان‌طور بخوری بیش از هفت برابر، یعنی ۴۶ نفر می‌شود.\nیعنی خوردنِ یک وعده گوشتِ گاو،\nبرابر است با خوردنِ هفت وعده غلات.\nبه همین ترتیب برای یک کیلو گوشتِ خوک چهار کیلو،\nو برای مرغ دو کیلو غلات لازم است.\nاگر انسان غلات را همان‌طور بخورد،\nافرادِ بیشتری می‌توانند بخورند.',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-22.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-22.mp3',
    },
    ttsDurationSec: {
      ko: 28.18,
      ja: 27.86,
    },
    overlays: [
      {
        id: 'p22-0',
        lineIndex: 0,
        kind: '라벨',
        text: {
          ko: '소 1kg = 곡물 7kg',
          ja: '牛1kg = 穀物7kg',
        },
        x: 0.29,
        y: 0.41,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 32,
        color: '#2f3a2f',
      },
      {
        id: 'p22-1',
        lineIndex: 5,
        kind: '라벨',
        text: {
          ko: '돼지 1kg = 곡물 4kg',
          ja: '豚1kg = 穀物4kg',
        },
        x: 0.29,
        y: 0.68,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 32,
        color: '#2f3a2f',
      },
      {
        id: 'p22-2',
        lineIndex: 6,
        kind: '라벨',
        text: {
          ko: '닭 1kg = 곡물 2kg',
          ja: '鶏1kg = 穀物2kg',
        },
        x: 0.7,
        y: 0.9,
        anim: 'pop',
        delaySec: 0.3,
        fontSize: 32,
        color: '#2f3a2f',
      },
    ],
  },
  {
    page: 23,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-23.webp',
    narration: {
      ko: '"이 지구상에는 먹을 것이 없어서\n죽어 가는 사람이 많이 있다는 걸 알고 있어?\n너는 그 사람들에 대해 아무것도 느끼지 않는 거야?"\n"그런 말을 들어도 우리 책임은 아니잖아."\n"그럼, 너의 책임을 분명히 하면 되잖아.\n각오해."',
      ja: '「この地球上には食べ物がなくて死んでいく人が\nたくさんいるのを知っているかい。\n君はその人達に対して何も感じないのかい。」\n「そんなこと言われてもおいらの責任じゃないし。」\n「じゃ、君の責任を明らかにしようじゃないか。\n覚悟しろよ。」',
      fa: '«می‌دانی که روی این کرهٔ زمین آدم‌های زیادی هستند\nکه به خاطرِ نبودِ غذا می‌میرند؟\nتو نسبت به آن آدم‌ها هیچ احساسی نداری؟»\n«حتی اگر این‌ها را بگویی هم تقصیرِ ما نیست که.»\n«پس، بیا تقصیرِ خودت را روشن کن.\nآماده شو.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-23.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-23.mp3',
    },
    ttsDurationSec: {
      ko: 15,
      ja: 15.7,
    },
    overlays: [
      {
        id: 'p23-0',
        lineIndex: 5,
        kind: '키워드',
        text: {
          ko: '각오해!',
          ja: '覚悟しろ！',
        },
        x: 0.5,
        y: 0.16,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 52,
        color: '#c0392b',
        rotate: -3,
      },
    ],
  },
  {
    page: 24,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-24.webp',
    narration: {
      ko: '"잘 들어?\n동물을 죽여서 먹은 너의 위는, 동물의 무덤이야.\n먹은 고기는 뱃속의 무덤 안에서 점점 썩어 가.\n당연히 너의 피도 점점 더러워지는 거야."',
      ja: '「いいかい？\n動物を殺して食べた君の胃は、動物のお墓だ。\n食べた肉はお腹の墓の中でどんどん腐っていく。\n当然君の血もどんどん汚れていくんだ。」',
      fa: '«خوب گوش کن.\nمعدهٔ تو که حیوان را کشته و خورده‌ای، گورِ حیوان است.\nگوشتی که خورده‌ای در گورِ داخلِ شکمت کم‌کم می‌گندد.\nطبیعتاً خونِ تو هم رفته‌رفته آلوده‌تر می‌شود.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-24.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-24.mp3',
    },
    ttsDurationSec: {
      ko: 11.18,
      ja: 9.55,
    },
    overlays: [
      {
        id: 'p24-0',
        lineIndex: 2,
        kind: '의성어',
        text: {
          ko: '부글부글',
          ja: 'ドロドロ',
        },
        x: 0.5,
        y: 0.5,
        anim: 'shake',
        delaySec: 0.3,
        fontSize: 50,
        color: '#6b4423',
        rotate: 2,
      },
    ],
  },
  {
    page: 25,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-25.webp',
    narration: {
      ko: '"그리고 그 더러워진 너의 피를 빤 나는,\n다시 다른 인간의 피를 빨러 가."',
      ja: '「そしてその汚れた君の血を吸ったボクは、\nまた別の人間の血を吸いに行く。」',
      fa: '«و من که آن خونِ آلودهٔ تو را مکیده‌ام،\nبعد می‌روم خونِ انسانِ دیگری را بمکم.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-25.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-25.mp3',
    },
    ttsDurationSec: {
      ko: 5.09,
      ja: 4.85,
    },
    overlays: [
      {
        id: 'p25-0',
        lineIndex: 1,
        kind: '의성어',
        text: {
          ko: '앵―',
          ja: 'プ~ン',
        },
        x: 0.6,
        y: 0.2,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 60,
        color: '#1f2937',
        rotate: -6,
      },
    ],
  },
  {
    page: 26,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-26.webp',
    narration: {
      ko: '"그렇다는 것은, 너에게 무슨 병이 있으면,\n그 피를 빤 나뿐만 아니라,\n다른 인간까지 병에 걸리게 돼 버려.\n즉 병을 퍼뜨리는 원인은 너에게 있는 거야.\n그래도 너는 자기에게 책임이 없다고 할 수 있어?"\n"그런 억지가 어디 있어. 갖다 붙인 거잖아.\n애초에 너한테 물린 우리는 원래\n피해자라고."',
      ja: '「ということは、君に何か病気があれば、\nその血を吸ったボクばかりか、\n別の人間までが病気になってしまう。\nつまり病気をまきちらす原因は君にあるんだ。\nこれでも君は自分に責任がないといえるかい。」\n「そんな無茶な。こじつけだよ。\nだいいち本来おいらは\n君に刺された被害者なんだよ。」',
      fa: '«این یعنی، اگر تو بیماری‌ای داشته باشی،\nنه‌تنها من که خونت را مکیده‌ام،\nبلکه انسان‌های دیگر هم بیمار می‌شوند.\nیعنی عاملِ پخش‌شدنِ بیماری در تو نهفته است.\nبا این حال تو می‌توانی بگویی تقصیری نداری؟»\n«این چه زورگویی‌ای است. این بهانه‌تراشی است.\nاصلاً ما که توسطِ تو نیش خورده‌ایم در اصل\nقربانی هستیم.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-26.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-26.mp3',
    },
    ttsDurationSec: {
      ko: 18.48,
      ja: 19.1,
    },
    overlays: [
      {
        id: 'p26-0',
        lineIndex: 3,
        kind: '의성어',
        text: {
          ko: '죽음',
          ja: '死',
        },
        x: 0.3,
        y: 0.22,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 76,
        color: '#c0392b',
      },
    ],
  },
  {
    page: 27,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-27.webp',
    narration: {
      ko: '"이렇게까지 말했는데도 아직 모르겠어?\n좋아! 그럼 나와 너 둘 중 어느 쪽에 도리가 있는지,\n신께 흑백을 가려 달라고 할까."\n"아, 아니, 거기까지 안 해도."\n"안 돼요. 이런 건 확실하게 하지 않으면\n모기로서의 내 체면이 서질 않아요."\n"알았어, 알았어, 너의 말이 맞아.\n여기는 너의 체면을 세워 주지."',
      ja: '「これだけ言ってもまだわからないのかい。\nよし！じゃあボクと君のどちらに道理があるのか、\n神様に白黒つけてもらおうか。」\n「あ、いや、なにもそこまでしなくても。」\n「ダメです。こういうことははっきりしないと\nボクの蚊としての面子が立ちません。」\n「わかった、わかった、君の言うとおりだ。\nここは君の面子を立てよう。」',
      fa: '«با اینکه تا این حد گفتم باز هم نمی‌فهمی؟\nخیلی خب! پس بگذار از خدا بخواهیم حق را بین من و تو،\nکه کدام‌مان بر حق است، روشن کند.»\n«آ، نه، لازم نیست تا آنجا برویم.»\n«نمی‌شود. این‌جور چیزها را اگر روشن نکنیم\nآبروی من به‌عنوانِ یک پشه نمی‌ماند.»\n«باشد، باشد، حقّ با توست.\nاین دفعه آبرویت را نگه می‌دارم.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-27.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-27.mp3',
    },
    ttsDurationSec: {
      ko: 22.3,
      ja: 16.32,
    },
    overlays: [],
  },
  {
    page: 28,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-28.webp',
    narration: {
      ko: '"이해해 주셨나요?"\n"응, 화해의 표시로 한 잔 하자.\n내 피라도 괜찮다면\n사양 말고 빨아 줘."\n"친구를 불러도 될까요?"\n"좋고말고."',
      ja: '「わかってくれましたか。」\n「うん、仲直りのしるしに一杯やろう。\nおいらの血でよかったら\n遠慮しないで吸ってくれ。」\n「友達を呼んでもいい？」\n「いいとも。」',
      fa: '«پس فهمیدی؟»\n«آره، به نشانهٔ آشتی بیا یک جام بزنیم.\nاگر خونِ من هم اشکالی ندارد\nبدونِ تعارف بمک.»\n«می‌توانم دوستانم را هم صدا بزنم؟»\n«البته که می‌شود.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-28.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-28.mp3',
    },
    ttsDurationSec: {
      ko: 11.57,
      ja: 9.77,
    },
    overlays: [
      {
        id: 'p28-0',
        lineIndex: 4,
        kind: '의성어',
        text: {
          ko: '앵앵―',
          ja: 'プ~ンプ~ン',
        },
        x: 0.68,
        y: 0.2,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 52,
        color: '#1f2937',
        rotate: -4,
      },
      {
        id: 'p28-1',
        lineIndex: 1,
        kind: '키워드',
        text: {
          ko: '건배!',
          ja: 'かんぱい！',
        },
        x: 0.3,
        y: 0.55,
        anim: 'pop',
        delaySec: 1,
        fontSize: 48,
        color: '#c0392b',
      },
    ],
  },
  {
    page: 29,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-29.webp',
    narration: {
      ko: '"이렇게 해서 나는,\n모기에게 자연의 섭리를 배워서,\n동물을 먹는 것을 그만뒀어.\n모기 중에 저렇게 머리 좋은 녀석이\n있을 줄은 생각도 못 했지."',
      ja: '「こうしておいらは、\n蚊に自然の摂理を教わり、\n動物を食べるのをやめたんだ。\n蚊の中にあんな頭のいい奴がいるとは思わなかったよ。」',
      fa: '«این‌طور شد که من،\nاز پشه قانونِ طبیعت را آموختم،\nو خوردنِ حیوانات را کنار گذاشتم.\nهرگز فکر نمی‌کردم در میانِ پشه‌ها\nچنین موجودِ باهوشی وجود داشته باشد.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-29.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-29.mp3',
    },
    ttsDurationSec: {
      ko: 10.82,
      ja: 9.05,
    },
    overlays: [
      {
        id: 'p29-0',
        kind: '키워드',
        text: {
          ko: '자연 조화 공생 나눔 행복',
          ja: '自然 調和 共生 わかちあい しあわせ',
        },
        x: 0.22,
        y: 0.17,
        anim: 'pop',
        delaySec: 0.5,
        fontSize: 42,
        color: '#1b5e20',
        stagger: true,
        staggerDir: 'col',
      },
    ],
  },
  {
    page: 30,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-30.webp',
    narration: {
      ko: '"그 후로 나는,\n함부로 생물을 죽이지 않겠다고 맹세했지만,\n한밤중에 모기 소리를 들으면,\n나도 모르게 모기를 때려 버려.\n아아, 역시 나는 모기가 싫어.\n아아 신이시여, 죄 많은 저를 용서해 주세요."',
      ja: '「あれからおいらは、\nむやみに生き物を殺さないと誓ったんだけど、\n夜中に蚊の音を聞くと、\n自然に蚊をたたいてしまう。\nやっぱりおいらは蚊が嫌いだ。\nああ神様、罪深いおいらをお許しください。」',
      fa: '«از آن پس من،\nسوگند خوردم که بیهوده موجودی را نکشم،\nاما نیمه‌شب وقتی صدای پشه را می‌شنوم،\nبی‌اختیار پشه را می‌زنم.\nآه، باز هم من از پشه بدم می‌آید.\nآه ای خدا، منِ پُرگناه را ببخش.»',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-30.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-30.mp3',
    },
    ttsDurationSec: {
      ko: 13.42,
      ja: 12.24,
    },
    overlays: [
      {
        id: 'p30-1',
        lineIndex: 3,
        kind: '의성어',
        text: {
          ko: '탁!',
          ja: 'ピシャッ',
        },
        x: 0.41,
        y: 0.18,
        anim: 'drop',
        delaySec: 0.3,
        fontSize: 64,
        color: '#c0392b',
        rotate: 8,
      },
      {
        id: 'p30-0',
        lineIndex: 3,
        kind: '의성어',
        text: {
          ko: '죽음',
          ja: '死',
        },
        x: 0.16,
        y: 0.15,
        anim: 'drop',
        delaySec: 0.9,
        fontSize: 60,
        color: '#c0392b',
      },
    ],
  },
  {
    page: 31,
    imageUrl:
      'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/img/v1/page-31.webp',
    narration: {
      ko: "원래 모기는, 사람의 피를 빨지 않아도 살아갈 수 있는 거야.\n평소에는 꽃의 꿀 같은 걸 빨고 있지만,\n엄마 모기는 아기가 생겼을 때,\n영양 부족이 되기 때문에 다른 동물의 피를 빠는 것 같아.\n그러니까 인간이 영양 부족일 때,\n동물을 먹는 것과 같은 것일지도 모르지.\n그리고 모기는, 인간이 내뱉는 숨을 아주 좋아하고,\n어두운 곳도 좋아해. 좋아하는 소리는 도레미파의 '라' 음.\n이건 날고 있는 모기 날개 소리와 같으니까.\n좋아하는 혈액형은 A형. A형인 사람은 모기를 조심하자.\n좋아하는 색은 검정. 그리고 좋아하는 과일은 수박이야.\n어떻다, 이제 모기가 조금은 좋아졌나?\n엇 싫어? 그래, 나도 역시 모기는 정말 싫어.",
      ja: '本来蚊は、人の血を吸わなくても生きていけるんだよ。\n普段は花の蜜とか吸ってるんだけど、\nお母さん蚊は赤ちゃんが出来た時、\n栄養不足になるのでほかの動物の血を吸うらしいんだ。\nだから人間が栄養不足のとき、\n動物をたべるのと同じことかもね。\nそれから蚊は、人間の吐き出す息が大好きで、\n暗いところも好き。好きな音はドレミファのラの音。\nこれは飛んでる蚊の羽の音と同じだからって。\n好きな血液型はA型。A型の人は蚊に気をつけよう。\n好きな色は黒。そして好きな果物は西瓜だよ。\nどうたい。少しは蚊が好きになったかな。\nえっ嫌い。そう、おいらもやっぱり蚊は大っ嫌いさ。',
      fa: '【پایان】\nدر اصل پشه می‌تواند بدونِ مکیدنِ خونِ انسان هم زنده بماند.\nمعمولاً چیزهایی مثلِ شهدِ گل را می‌مکد،\nاما مادر‌پشه وقتی بچه‌دار می‌شود،\nچون دچارِ کمبودِ تغذیه می‌شود خونِ حیواناتِ دیگر را می‌مکد.\nپس شاید این مثلِ همان وقتی است که انسان\nهنگامِ کمبودِ تغذیه، حیوانات را می‌خورد.\nو پشه، نَفَسی را که انسان بیرون می‌دهد خیلی دوست دارد،\nو جای تاریک را هم دوست دارد. صدای موردِ علاقه‌اش نُتِ «لا» است.\nچون این همان صدای بالِ پشهٔ در حالِ پرواز است.\nگروهِ خونیِ موردِ علاقه‌اش A است. آدم‌های گروه A مراقب باشند.\nرنگِ موردِ علاقه‌اش سیاه است. و میوهٔ موردِ علاقه‌اش هندوانه است.\nخب چطور بود، حالا کمی از پشه خوشت آمد؟\nاِ بدت می‌آید؟ آره، من هم بالاخره از پشه واقعاً بدم می‌آید.',
    },
    ttsUrl: {
      ko: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ko/page-31.mp3',
      ja: 'https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/ebook/mosquito/tts/v1/ja/page-31.mp3',
    },
    ttsDurationSec: {
      ko: 41.16,
      ja: 37.99,
    },
    overlays: [
      {
        id: 'p31-0',
        lineIndex: 12,
        kind: '제목',
        text: {
          ko: '끝',
          ja: 'おしまい',
        },
        x: 0.5,
        y: 0.13,
        anim: 'fade',
        delaySec: 0.3,
        fontSize: 80,
        color: '#1b5e20',
      },
    ],
  },
];

export const EBOOK_PAGES: EbookPage[] =
  SAMPLE_PAGE_LIMIT != null ? MOSQUITO_PAGES.slice(0, SAMPLE_PAGE_LIMIT) : MOSQUITO_PAGES;
