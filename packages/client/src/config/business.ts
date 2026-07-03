/**
 * 사업자 정보 단일소스 — 푸터·법적 문서(약관/개인정보/환불)가 모두 여기서 읽는다.
 *
 * ⚠️ TODO 표시 항목은 실제 값으로 교체 필요 (토스페이먼츠 가맹 심사가 이 표기를 확인함):
 *   - 통신판매업 신고번호는 정부24 신고 후 발급.
 */
export const BUSINESS_INFO = {
  serviceName: '탱고북',
  serviceNameEn: 'TangoBook',
  siteUrl: 'https://tangobook.co.kr',

  companyName: 'TODO: 상호명 (예: 주식회사 OO / OO스튜디오)',
  ceoName: 'TODO: 대표자명',
  businessNumber: 'TODO: 000-00-00000',
  mailOrderNumber: 'TODO: 제0000-지역-0000호 (통신판매업 신고번호)',
  address: 'TODO: 사업장 주소',

  supportEmail: 'kil210@tangobook.co.kr',
  supportHours: '평일 10:00 ~ 18:00 (주말·공휴일 휴무)',

  /** 개인정보 보호책임자 — 대표자와 동일하면 같은 값 */
  privacyOfficer: 'TODO: 개인정보 보호책임자명',

  /** 약관/방침 시행일 */
  effectiveDate: '2026-07-03',
} as const;
