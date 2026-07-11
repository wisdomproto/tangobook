// 카테고리 라벨 다국어 — 카테고리명은 R2 데이터(자유문자열)라 i18next 키가 아니라
// 여기 고정 딕셔너리로 매핑한다. 학습자 화면(라이브러리 칩·섹션·BookDetail 칩)에서
// UI 언어에 맞는 라벨을 보여줄 때 사용. 매핑 없는 카테고리는 원본(ko) 그대로 폴백.
import { useTranslation } from 'react-i18next';

type LangMap = Record<string, string>;

// key = 표준 한국어 카테고리명(R2 데이터 값). ko 는 원본이라 별도 불필요(폴백).
const CATEGORY_LABELS: Record<string, LangMap> = {
  '세계 명작': {
    en: 'World Classics',
    vi: 'Truyện cổ tích kinh điển',
    zh: '世界名作',
    th: 'วรรณกรรมคลาสสิก',
  },
  '공룡 친구들': {
    en: 'Dinosaur Friends',
    vi: 'Những người bạn khủng long',
    zh: '恐龙朋友',
    th: 'เพื่อนไดโนเสาร์',
  },
  '곤충 친구들': {
    en: 'Insect Friends',
    vi: 'Những người bạn côn trùng',
    zh: '昆虫朋友',
    th: 'เพื่อนแมลง',
  },
  '육지 동물 친구들': {
    en: 'Land Animal Friends',
    vi: 'Những người bạn động vật trên cạn',
    zh: '陆地动物朋友',
    th: 'เพื่อนสัตว์บก',
  },
  '바다 동물 친구들': {
    en: 'Sea Animal Friends',
    vi: 'Những người bạn động vật biển',
    zh: '海洋动物朋友',
    th: 'เพื่อนสัตว์ทะเล',
  },
  '하늘 동물 친구들': {
    en: 'Sky Animal Friends',
    vi: 'Những người bạn động vật trên trời',
    zh: '天空动物朋友',
    th: 'เพื่อนสัตว์บนท้องฟ้า',
  },
  '식물 친구들': {
    en: 'Plant Friends',
    vi: 'Những người bạn thực vật',
    zh: '植物朋友',
    th: 'เพื่อนพืช',
  },
  '우주와 자연': {
    en: 'Space & Nature',
    vi: 'Vũ trụ và thiên nhiên',
    zh: '宇宙与自然',
    th: 'อวกาศและธรรมชาติ',
  },
  '우리 몸 이야기': {
    en: 'Our Body Story',
    vi: 'Câu chuyện cơ thể chúng ta',
    zh: '我们的身体故事',
    th: 'เรื่องราวร่างกายของเรา',
  },
  생활동화: {
    en: 'Everyday Stories',
    vi: 'Truyện đời sống',
    zh: '生活故事',
    th: 'นิทานชีวิตประจำวัน',
  },
  // 별칭(구 카테고리/그룹핑명) — 폴백 안전용
  '자연 관찰': {
    en: 'Nature Observation',
    vi: 'Quan sát thiên nhiên',
    zh: '自然观察',
    th: 'การสังเกตธรรมชาติ',
  },
  자연관찰: {
    en: 'Nature Observation',
    vi: 'Quan sát thiên nhiên',
    zh: '自然观察',
    th: 'การสังเกตธรรมชาติ',
  },
  '전래 동화': { en: 'Folk Tales', vi: 'Truyện cổ dân gian', zh: '传统童话', th: 'นิทานพื้นบ้าน' },
  전래동화: { en: 'Folk Tales', vi: 'Truyện cổ dân gian', zh: '传统童话', th: 'นิทานพื้นบ้าน' },
  기타: { en: 'Others', vi: 'Khác', zh: '其他', th: 'อื่นๆ' },
};

/** 카테고리 한국어명 → 현재 UI 언어 라벨 (매핑/언어 없으면 원본 그대로). */
export function categoryLabel(category: string, lang: string): string {
  if (!category || lang === 'ko') return category;
  return CATEGORY_LABELS[category]?.[lang] ?? category;
}

/** 컴포넌트용 훅 — `const catLabel = useCategoryLabel(); catLabel('세계 명작')`. */
export function useCategoryLabel(): (category: string) => string {
  const { i18n } = useTranslation();
  return (category: string) => categoryLabel(category, i18n.language);
}
