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
