/**
 * SEO SSR 다국어 문자열 — about/허브 페이지의 UI 라벨을 언어별로.
 * 새 언어 추가 시: 여기에 한 항목 추가 (없으면 en 폴백).
 * 콘텐츠(제목·가이드 본문)는 책의 translations 필드에서 오고, 여기는 뼈대 라벨만.
 */

export interface SeoStrings {
  /** title 템플릿 — {title} 치환 */
  aboutTitle: string;
  /** h1 접미 (예: "동화책") — 비우면 제목만 */
  h1Suffix: string;
  ageLabel: string; // 추천 연령
  pagesLabel: string; // N쪽
  lessonsHeading: string; // {title} 치환
  wordsHeading: string; // {title} 치환
  faqHeading: string;
  tipsHeading: string; // {title} 치환
  readNow: string; // {title} 치환 — CTA
  classicsHubLink: string;
  natureHubLink: string;
  libraryBreadcrumb: string;
  blogListLink: string;
}

const en: SeoStrings = {
  aboutTitle: '{title} Picture Book — Story, Lessons & Reading Tips | Tangobook',
  h1Suffix: 'Picture Book',
  ageLabel: 'Recommended age',
  pagesLabel: 'pages',
  lessonsHeading: 'What {title} teaches',
  wordsHeading: 'Words to learn with {title}',
  faqHeading: 'Frequently asked questions',
  tipsHeading: 'Read-aloud tips for {title} (ages 4–7)',
  readNow: 'Read {title} now on Tangobook',
  classicsHubLink: 'Browse all classic fairy tales',
  natureHubLink: 'Browse all nature picture books',
  libraryBreadcrumb: 'Library',
  blogListLink: 'Read our blog guides',
};

export const SEO_STRINGS: Record<string, SeoStrings> = {
  ko: {
    aboutTitle: '{title} 동화책 - 줄거리·교훈·읽어주기 팁 | 탱고북',
    h1Suffix: '동화책',
    ageLabel: '추천 연령',
    pagesLabel: '쪽',
    lessonsHeading: '', // ko 는 조사 처리 때문에 seo-ssr 쪽 josa 로직 사용
    wordsHeading: '',
    faqHeading: '자주 묻는 질문',
    tipsHeading: '{title} 읽어주기 팁 (4~7세)',
    readNow: '{title} 지금 읽으러 가기 — 탱고북',
    classicsHubLink: '세계 명작 동화 전집 보기',
    natureHubLink: '자연관찰 그림책 전체 보기',
    libraryBreadcrumb: '라이브러리',
    blogListLink: '블로그 가이드 보기',
  },
  en,
  vi: {
    aboutTitle: 'Truyện tranh {title} — Tóm tắt, bài học & mẹo đọc cùng con | Tangobook',
    h1Suffix: 'Truyện tranh',
    ageLabel: 'Độ tuổi phù hợp',
    pagesLabel: 'trang',
    lessonsHeading: 'Bài học từ {title}',
    wordsHeading: 'Từ vựng học cùng {title}',
    faqHeading: 'Câu hỏi thường gặp',
    tipsHeading: 'Mẹo đọc {title} cho bé (4–7 tuổi)',
    readNow: 'Đọc {title} ngay trên Tangobook',
    classicsHubLink: 'Xem tất cả truyện cổ tích kinh điển',
    natureHubLink: 'Xem tất cả sách tranh thiên nhiên',
    libraryBreadcrumb: 'Thư viện',
    blogListLink: 'Xem bài viết hướng dẫn',
  },
  zh: {
    aboutTitle: '{title} 绘本 — 故事梗概·寓意·亲子共读技巧 | Tangobook',
    h1Suffix: '绘本',
    ageLabel: '适读年龄',
    pagesLabel: '页',
    lessonsHeading: '《{title}》教给孩子什么',
    wordsHeading: '跟着《{title}》学词语',
    faqHeading: '常见问题',
    tipsHeading: '《{title}》亲子共读技巧（4–7岁）',
    readNow: '立即在 Tangobook 阅读《{title}》',
    classicsHubLink: '浏览全部经典童话',
    natureHubLink: '浏览全部自然观察绘本',
    libraryBreadcrumb: '图书馆',
    blogListLink: '查看博客指南',
  },
  th: {
    aboutTitle: 'นิทานภาพ {title} — เรื่องย่อ ข้อคิด และเคล็ดลับอ่านให้ลูกฟัง | Tangobook',
    h1Suffix: 'นิทานภาพ',
    ageLabel: 'ช่วงวัยที่แนะนำ',
    pagesLabel: 'หน้า',
    lessonsHeading: 'ข้อคิดจากเรื่อง {title}',
    wordsHeading: 'คำศัพท์น่ารู้จากเรื่อง {title}',
    faqHeading: 'คำถามที่พบบ่อย',
    tipsHeading: 'เคล็ดลับอ่าน {title} ให้ลูกฟัง (4–7 ปี)',
    readNow: 'อ่าน {title} ได้เลยที่ Tangobook',
    classicsHubLink: 'ดูนิทานคลาสสิกทั้งหมด',
    natureHubLink: 'ดูนิทานภาพธรรมชาติทั้งหมด',
    libraryBreadcrumb: 'ห้องสมุด',
    blogListLink: 'อ่านบทความแนะนำ',
  },
  ja: {
    aboutTitle: '{title} 絵本 — あらすじ・学び・読み聞かせのコツ | Tangobook',
    h1Suffix: '絵本',
    ageLabel: '対象年齢',
    pagesLabel: 'ページ',
    lessonsHeading: '『{title}』が教えてくれること',
    wordsHeading: '『{title}』で学ぶことば',
    faqHeading: 'よくある質問',
    tipsHeading: '『{title}』読み聞かせのコツ（4〜7歳）',
    readNow: 'Tangobook で『{title}』を今すぐ読む',
    classicsHubLink: '世界の名作童話をすべて見る',
    natureHubLink: '自然観察絵本をすべて見る',
    libraryBreadcrumb: 'ライブラリ',
    blogListLink: 'ブログガイドを読む',
  },
  es: {
    aboutTitle: 'Cuento ilustrado {title} — Resumen, moraleja y consejos de lectura | Tangobook',
    h1Suffix: 'Cuento ilustrado',
    ageLabel: 'Edad recomendada',
    pagesLabel: 'páginas',
    lessonsHeading: 'Qué enseña {title}',
    wordsHeading: 'Palabras para aprender con {title}',
    faqHeading: 'Preguntas frecuentes',
    tipsHeading: 'Consejos para leer {title} en voz alta (4–7 años)',
    readNow: 'Lee {title} ahora en Tangobook',
    classicsHubLink: 'Ver todos los cuentos clásicos',
    natureHubLink: 'Ver todos los libros de naturaleza',
    libraryBreadcrumb: 'Biblioteca',
    blogListLink: 'Leer las guías del blog',
  },
  fr: {
    aboutTitle: 'Album {title} — Résumé, morale et conseils de lecture | Tangobook',
    h1Suffix: 'Album illustré',
    ageLabel: 'Âge recommandé',
    pagesLabel: 'pages',
    lessonsHeading: 'Ce que {title} enseigne',
    wordsHeading: 'Mots à apprendre avec {title}',
    faqHeading: 'Questions fréquentes',
    tipsHeading: 'Conseils de lecture pour {title} (4–7 ans)',
    readNow: 'Lire {title} maintenant sur Tangobook',
    classicsHubLink: 'Voir tous les contes classiques',
    natureHubLink: 'Voir tous les albums sur la nature',
    libraryBreadcrumb: 'Bibliothèque',
    blogListLink: 'Lire les guides du blog',
  },
  de: {
    aboutTitle: 'Bilderbuch {title} — Inhalt, Lehre & Vorlesetipps | Tangobook',
    h1Suffix: 'Bilderbuch',
    ageLabel: 'Empfohlenes Alter',
    pagesLabel: 'Seiten',
    lessonsHeading: 'Was {title} lehrt',
    wordsHeading: 'Wörter lernen mit {title}',
    faqHeading: 'Häufige Fragen',
    tipsHeading: 'Vorlesetipps für {title} (4–7 Jahre)',
    readNow: '{title} jetzt auf Tangobook lesen',
    classicsHubLink: 'Alle klassischen Märchen ansehen',
    natureHubLink: 'Alle Natur-Bilderbücher ansehen',
    libraryBreadcrumb: 'Bibliothek',
    blogListLink: 'Blog-Guides lesen',
  },
  ms: {
    aboutTitle: 'Buku bergambar {title} — Sinopsis, pengajaran & tip bacaan | Tangobook',
    h1Suffix: 'Buku bergambar',
    ageLabel: 'Umur disyorkan',
    pagesLabel: 'muka surat',
    lessonsHeading: 'Pengajaran daripada {title}',
    wordsHeading: 'Kosa kata bersama {title}',
    faqHeading: 'Soalan lazim',
    tipsHeading: 'Tip membaca {title} untuk anak (4–7 tahun)',
    readNow: 'Baca {title} sekarang di Tangobook',
    classicsHubLink: 'Lihat semua cerita klasik',
    natureHubLink: 'Lihat semua buku alam semula jadi',
    libraryBreadcrumb: 'Perpustakaan',
    blogListLink: 'Baca panduan blog',
  },
  id: {
    aboutTitle: 'Buku cerita {title} — Ringkasan, pesan moral & tips membaca | Tangobook',
    h1Suffix: 'Buku cerita bergambar',
    ageLabel: 'Usia yang disarankan',
    pagesLabel: 'halaman',
    lessonsHeading: 'Pelajaran dari {title}',
    wordsHeading: 'Kosakata bersama {title}',
    faqHeading: 'Pertanyaan umum',
    tipsHeading: 'Tips membacakan {title} untuk anak (4–7 tahun)',
    readNow: 'Baca {title} sekarang di Tangobook',
    classicsHubLink: 'Lihat semua dongeng klasik',
    natureHubLink: 'Lihat semua buku alam',
    libraryBreadcrumb: 'Perpustakaan',
    blogListLink: 'Baca panduan blog',
  },
};

export function seoStrings(lang: string): SeoStrings {
  return SEO_STRINGS[lang] ?? en;
}

/** 랜딩/진입(/en·/vi·/zh·/th·/ko) OG·title 카피 — 소셜 공유 미리보기용. 콘텐츠 완비 5개. */
export interface LandingStrings {
  title: string;
  description: string;
}
export const LANDING_STRINGS: Record<string, LandingStrings> = {
  ko: {
    title: '탱고북 — 명작동화·자연관찰로 배우는 4~7세 한글·영어 학습',
    description:
      '세계 명작동화와 자연관찰 그림책으로 4~7세 아이가 읽고 듣고 놀며 배우는 학습 플랫폼. 원어민 나레이션·단어 게임·부모 리포트까지.',
  },
  en: {
    title: 'Tangobook — Kids learn to read with classic fairy tales',
    description:
      'Classic fairy tales and nature picture books for ages 4–7 — native narration, word games and parent guides in English, Vietnamese, Chinese, Thai and Korean.',
  },
  vi: {
    title: 'Tangobook — Bé học đọc qua truyện cổ tích kinh điển',
    description:
      'Truyện cổ tích kinh điển và sách tranh thiên nhiên cho bé 4–7 tuổi — giọng đọc bản xứ, trò chơi từ vựng và hướng dẫn cho cha mẹ.',
  },
  zh: {
    title: 'Tangobook — 用经典童话陪孩子学阅读（4–7岁）',
    description:
      '经典世界童话与自然观察绘本，专为 4–7 岁孩子打造——母语朗读、词语游戏和家长指南，支持中文·英语·越南语·泰语·韩语。',
  },
  th: {
    title: 'Tangobook — เด็กเรียนรู้การอ่านผ่านนิทานคลาสสิก (4–7 ปี)',
    description:
      'นิทานคลาสสิกระดับโลกและนิทานภาพธรรมชาติสำหรับเด็ก 4–7 ปี — เสียงอ่านเจ้าของภาษา เกมคำศัพท์ และคู่มือสำหรับผู้ปกครอง',
  },
};

export function fill(template: string, title: string): string {
  return template.replace(/\{title\}/g, title);
}

/** 허브 페이지 언어별 카피 — 콘텐츠 언어(책 번역이 존재하는 언어)만 작성. */
export interface HubStrings {
  classics: { title: string; h1: string; intro: string };
  nature: { title: string; h1: string; intro: string };
}

export const HUB_STRINGS: Record<string, HubStrings> = {
  en: {
    classics: {
      title: 'Classic Fairy Tales for Kids (Ages 4–7) | Tangobook',
      h1: 'Classic Fairy Tales for Kids (Ages 4–7)',
      intro:
        'From Cinderella, Snow White and The Little Mermaid to The Little Prince and The Wizard of Oz — timeless classics retold as beautiful picture books for young children, with English and Korean narration, word learning and parent guides. Explore each story, its lessons and read-aloud tips.',
    },
    nature: {
      title: 'Nature Picture Books — Animals, Insects, Dinosaurs & Plants | Tangobook',
      h1: 'Nature Picture Books (Animals · Insects · Dinosaurs · Plants)',
      intro:
        'Dinosaurs, insects, sea and land animals, plants and space — nature observation books for ages 4–7, illustrated as warm picture books instead of photos. Every book comes with key vocabulary and a parent guide.',
    },
  },
  vi: {
    classics: {
      title: 'Truyện cổ tích kinh điển cho bé (4–7 tuổi) | Tangobook',
      h1: 'Truyện cổ tích kinh điển cho bé (4–7 tuổi)',
      intro:
        'Từ Cô bé Lọ Lem, Bạch Tuyết, Nàng tiên cá đến Hoàng tử bé và Phù thủy xứ Oz — những kiệt tác vượt thời gian được kể lại thành truyện tranh đẹp dành cho trẻ nhỏ, kèm giọng đọc tiếng Việt, học từ vựng và hướng dẫn cho cha mẹ.',
    },
    nature: {
      title: 'Sách tranh thiên nhiên — Động vật, côn trùng, khủng long & thực vật | Tangobook',
      h1: 'Sách tranh thiên nhiên (Động vật · Côn trùng · Khủng long · Thực vật)',
      intro:
        'Khủng long, côn trùng, động vật biển và đất liền, thực vật và vũ trụ — sách quan sát thiên nhiên cho bé 4–7 tuổi, minh họa bằng tranh vẽ ấm áp. Mỗi cuốn đều có từ vựng chính và hướng dẫn cho cha mẹ.',
    },
  },
  zh: {
    classics: {
      title: '经典童话绘本合集（4–7岁）| Tangobook',
      h1: '经典童话绘本合集（4–7岁）',
      intro:
        '从灰姑娘、白雪公主、小美人鱼到小王子和绿野仙踪——把永恒的世界名作改编成适合幼儿的精美绘本，配有词语学习和家长指南。点击每本书查看故事梗概、寓意和亲子共读技巧。',
    },
    nature: {
      title: '自然观察绘本 — 动物·昆虫·恐龙·植物 | Tangobook',
      h1: '自然观察绘本（动物 · 昆虫 · 恐龙 · 植物）',
      intro:
        '恐龙、昆虫、海洋和陆地动物、植物和宇宙——为 4–7 岁孩子打造的自然观察绘本，用温暖的插画代替照片。每本书都包含核心词汇和家长指南。',
    },
  },
  th: {
    classics: {
      title: 'นิทานคลาสสิกสำหรับเด็ก (4–7 ปี) | Tangobook',
      h1: 'นิทานคลาสสิกสำหรับเด็ก (4–7 ปี)',
      intro:
        'จากซินเดอเรลลา สโนว์ไวท์ เงือกน้อย ไปจนถึงเจ้าชายน้อยและพ่อมดแห่งออซ — วรรณกรรมคลาสสิกระดับโลกถูกเล่าใหม่เป็นนิทานภาพแสนสวยสำหรับเด็กเล็ก พร้อมคำศัพท์น่ารู้และคู่มือสำหรับผู้ปกครอง',
    },
    nature: {
      title: 'นิทานภาพธรรมชาติ — สัตว์ แมลง ไดโนเสาร์ และพืช | Tangobook',
      h1: 'นิทานภาพธรรมชาติ (สัตว์ · แมลง · ไดโนเสาร์ · พืช)',
      intro:
        'ไดโนเสาร์ แมลง สัตว์ทะเลและสัตว์บก พืชและอวกาศ — หนังสือสังเกตธรรมชาติสำหรับเด็ก 4–7 ปี วาดด้วยภาพประกอบอบอุ่นแทนภาพถ่าย ทุกเล่มมีคำศัพท์สำคัญและคู่มือผู้ปกครอง',
    },
  },
};

/**
 * 공개 블로그 SSR 문자열 — 본문·메타는 DB 번역본에서 오고, 여기는 페이지 뼈대만.
 * HUB_STRINGS 와 동일하게 **콘텐츠가 있는 언어만** 넣는다(없으면 ko 폴백).
 */
export interface BlogStrings {
  /** 목록 페이지 title */
  listTitle: string;
  /** 목록 페이지 description */
  listDescription: string;
  /** 글 title 접미 — `{글 제목} | {suffix}` */
  titleSuffix: string;
  /** 글 하단 "동화책으로 읽기" 링크 */
  readBookLink: string;
  /** 글 하단 "블로그 전체 보기" 링크 */
  allPostsLink: string;
  /** breadcrumb 라벨 */
  breadcrumb: string;
}

export const BLOG_STRINGS: Record<string, BlogStrings> = {
  ko: {
    listTitle: '탱고북 블로그 — 유아 동화·자연관찰 그림책 가이드',
    listDescription:
      '세계 명작 동화 줄거리와 교훈, 동물·곤충·공룡·식물 자연관찰 이야기까지 — 4~7세 아이와 함께 읽는 그림책 가이드.',
    titleSuffix: '탱고북 블로그',
    readBookLink: '이 이야기를 그림책으로 — 탱고북에서 읽기',
    allPostsLink: '탱고북 블로그 전체 보기',
    breadcrumb: '블로그',
  },
  en: {
    listTitle: 'Tangobook Blog — Fairy Tale & Nature Picture Book Guides for Ages 4–7',
    listDescription:
      'Classic fairy tale summaries and lessons, plus nature stories about animals, insects, dinosaurs and plants — picture book guides to read with your 4–7 year old.',
    titleSuffix: 'Tangobook Blog',
    readBookLink: 'Read this story as a picture book on Tangobook',
    allPostsLink: 'Browse all Tangobook blog posts',
    breadcrumb: 'Blog',
  },
  vi: {
    listTitle: 'Blog Tangobook — Hướng dẫn truyện cổ tích & sách tranh thiên nhiên cho bé 4–7 tuổi',
    listDescription:
      'Tóm tắt và bài học từ truyện cổ tích kinh điển, cùng những câu chuyện thiên nhiên về động vật, côn trùng, khủng long và thực vật — hướng dẫn đọc sách tranh cùng bé 4–7 tuổi.',
    titleSuffix: 'Blog Tangobook',
    readBookLink: 'Đọc câu chuyện này dưới dạng sách tranh trên Tangobook',
    allPostsLink: 'Xem tất cả bài viết trên blog Tangobook',
    breadcrumb: 'Blog',
  },
  zh: {
    listTitle: 'Tangobook 博客 — 4–7 岁童话与自然观察绘本指南',
    listDescription:
      '经典童话的故事梗概与寓意，以及动物、昆虫、恐龙和植物的自然观察故事 — 陪 4–7 岁孩子共读的绘本指南。',
    titleSuffix: 'Tangobook 博客',
    readBookLink: '在 Tangobook 上以绘本形式阅读这个故事',
    allPostsLink: '浏览 Tangobook 博客全部文章',
    breadcrumb: '博客',
  },
  th: {
    listTitle: 'บล็อก Tangobook — คู่มือนิทานและหนังสือภาพธรรมชาติสำหรับเด็ก 4–7 ปี',
    listDescription:
      'เรื่องย่อและข้อคิดจากนิทานคลาสสิก พร้อมเรื่องราวธรรมชาติเกี่ยวกับสัตว์ แมลง ไดโนเสาร์ และพืช — คู่มือหนังสือภาพสำหรับอ่านกับลูกวัย 4–7 ปี',
    titleSuffix: 'บล็อก Tangobook',
    readBookLink: 'อ่านเรื่องนี้เป็นหนังสือภาพบน Tangobook',
    allPostsLink: 'ดูบทความทั้งหมดในบล็อก Tangobook',
    breadcrumb: 'บล็อก',
  },
};

export function blogStrings(lang: string): BlogStrings {
  return BLOG_STRINGS[lang] ?? BLOG_STRINGS.ko;
}
