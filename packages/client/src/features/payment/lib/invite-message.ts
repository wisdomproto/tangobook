/**
 * 친구 초대 링크/메시지 빌더 — "카톡에 뭐라고 보내지?"를 앱이 해결.
 * 링크(/invite/:code)는 랜딩에서 자동 적용되고, 수동 입력 폴백도 대소문자 무관.
 */

export function buildInviteLink(code: string): string {
  return `${window.location.origin}/invite/${code.toLowerCase()}`;
}

export function buildInviteMessage(code: string): string {
  return [
    '🐯 탱고북에서 아이랑 동화책 읽어요!',
    '아래 링크로 가입하면 우리 둘 다 무료 기간이 7일씩 늘어나요 🎁',
    buildInviteLink(code),
    '',
    `초대 코드: ${code.toUpperCase()} (링크가 안 열리면 가입 후 직접 입력해요)`,
  ].join('\n');
}
