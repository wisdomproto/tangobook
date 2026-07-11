/**
 * 친구 초대 링크/메시지 빌더 — "카톡에 뭐라고 보내지?"를 앱이 해결.
 * 링크(/invite/:code)는 랜딩에서 자동 적용되고, 수동 입력 폴백도 대소문자 무관.
 */
import i18n from '@/i18n';

export function buildInviteLink(code: string): string {
  return `${window.location.origin}/invite/${code.toLowerCase()}`;
}

export function buildInviteMessage(code: string): string {
  return i18n.t('invite.messageTemplate', {
    ns: 'payment',
    link: buildInviteLink(code),
    code: code.toUpperCase(),
  });
}
