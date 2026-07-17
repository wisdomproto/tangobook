import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../../providers/r2.provider.js';

/**
 * 저작 승인 상태 저장소 — editor2 콘텐츠 현황 모달의 유일한 수동 게이트.
 * R2 `_index/content-approval.json` = { bookId: { approvedAt: ISO } }.
 * 라우트(content-approval.routes)와 감사 서비스가 공용으로 소비한다.
 */
export const APPROVAL_KEY = '_index/content-approval.json';

export type ApprovalMap = Record<string, { approvedAt: string }>;

export async function loadApprovals(): Promise<ApprovalMap> {
  try {
    const res = await axios.get<ApprovalMap>(`${r2PublicUrl}/${APPROVAL_KEY}`, {
      timeout: 5000,
      params: { t: Date.now() },
    });
    return res.data && typeof res.data === 'object' ? res.data : {};
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return {}; // 최초 미존재만 빈 맵
    throw err; // R2 장애 중엔 500 — 기존 맵 보존이 우선 (빈 맵 반환 시 PUT 이 전체 승인 유실)
  }
}

export async function saveApprovals(map: ApprovalMap): Promise<void> {
  await uploadJsonToR2({ ...map }, APPROVAL_KEY);
}
