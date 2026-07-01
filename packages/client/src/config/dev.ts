/** 개발자 전용 UI 노출용 이메일 허용목록. */
export const DEV_EMAILS = ['kil210@tangobook.co.kr'];
export const isDevEmail = (email?: string | null): boolean => !!email && DEV_EMAILS.includes(email);
