/**
 * 사업자 정보 단일소스 — 푸터·법적 문서(약관/개인정보/환불)가 모두 여기서 읽는다.
 * 값 출처: (주)다능 사업자등록증(215-81-37321).
 *
 * ⚠️ 남은 TODO — 통신판매업 신고번호(mailOrderNumber)는 정부24 통신판매업 신고 후 발급.
 *   (선행: 구매안전서비스 이용확인증 — 토스페이먼츠 등에서 발급). 토스 가맹 심사가 이 표기를 확인함.
 */
export const BUSINESS_INFO = {
  serviceName: '탱고북',
  serviceNameEn: 'TangoBook',
  siteUrl: 'https://tangobook.co.kr',

  companyName: '(주)다능',
  ceoName: '김용환',
  businessNumber: '215-81-37321',
  mailOrderNumber: 'TODO: 제0000-지역-0000호 (통신판매업 신고 후 발급)',
  address: '서울특별시 송파구 송이로17길 46-23, 103동 6층 601호(가락동, 동성아파트)',

  supportEmail: 'kil210@tangobook.co.kr',
  supportPhone: '1599-0741',
  supportHours: '평일 10:00 ~ 18:00 (주말·공휴일 휴무)',

  /** 개인정보 보호책임자 */
  privacyOfficer: '김길중',

  /** 약관/방침 시행일 */
  effectiveDate: '2026-07-03',
} as const;
