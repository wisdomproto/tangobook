import { apiGet, apiPut } from '@/lib/axios';

/**
 * editor2 콘텐츠 현황(저작 관제탑) API 클라이언트.
 * 서버 GET /api/content-pipeline/authoring 은 마케팅 필드를 strip 한 저작 완성도만 반환
 * (직원 화면에 마케팅/발행 정보 비노출 — 서버 보장).
 * 타입은 서버 services/content-pipeline/derive.ts 와 필드 일치 (shared 이동은 추후).
 */

export interface LangDone {
  text: boolean;
  tts: boolean;
  illust: boolean;
  cover: boolean;
}

export type SeriesKey =
  | 'classic'
  | 'nature'
  | 'life'
  | 'kindergarten'
  | 'folk'
  | 'comic'
  | 'original'
  | 'unclassified';

export interface AuthoringStatus {
  series: SeriesKey;
  /** publicByStyleLang 어느 셀이든 공개면 true. 필드 없으면 true. */
  public: boolean;
  /** ko + languages[] 의 각 언어 */
  langs: Record<string, LangDone>;
}

export interface AuthoringRow {
  bookId: string;
  title: string;
  series: SeriesKey;
  approved: boolean;
  authoring: AuthoringStatus;
  /** 책 실카테고리 */
  category?: string;
}

export interface AuthoringPipeline {
  rows: AuthoringRow[];
  generatedAt: string;
  /** 감사에서 풀 JSON 로드 실패한 책 id (+ 소스 단위 마커) */
  fetchFailed: string[];
}

/** 시리즈 key → 표시 라벨 (서버 series-registry.ts SSOT 사본 — 표시 전용) */
export const SERIES_LABELS: Record<SeriesKey, string> = {
  classic: '세계 명작',
  nature: '자연관찰',
  life: '생활동화',
  kindergarten: '유치원동화',
  folk: '전래동화',
  comic: '학습만화',
  original: '창작동화',
  unclassified: '미분류',
};

export const contentPipelineApi = {
  authoring: (refresh = false) =>
    apiGet<AuthoringPipeline>(`/content-pipeline/authoring${refresh ? '?refresh=1' : ''}`),
  setApproval: (bookId: string, approved: boolean) =>
    apiPut<Record<string, { approvedAt: string }>>('/content-approval', { bookId, approved }),
};
