/** 개발자 전용 UI 노출용 이메일 허용목록. */
export const DEV_EMAILS = ['kil210@tangobook.co.kr'];
export const isDevEmail = (email?: string | null): boolean => !!email && DEV_EMAILS.includes(email);

/**
 * 내부/테스트 계정 — GA4·Meta 픽셀 트래킹에서 제외(우리 팀 접속이 방문/유입 데이터를 오염시키지 않게).
 * 로그인 시 이 목록이면 localStorage `tb_internal` 세팅 → index.html 이 다음 로드부터 GA4/픽셀 미발화.
 */
export const INTERNAL_EMAILS = [
  ...DEV_EMAILS,
  'kil210@gmail.com',
  'kil211@gmail.com',
  'notfun@naver.com',
  'bobae4146@gmail.com',
  'dangdang4146@gmail.com',
  'test@test.com',
];
export const isInternalEmail = (email?: string | null): boolean =>
  !!email && INTERNAL_EMAILS.includes(email.toLowerCase());
