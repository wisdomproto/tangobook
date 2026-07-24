import type { YouTubeChannel } from '@tangobook/shared';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface StoredChannel {
  channel: YouTubeChannel;
  tokens: StoredTokens;
}

/**
 * OAuth 콜백으로 받은 채널을 목록에 반영한다.
 *
 * 🔴 같은 유튜브 채널을 다시 연동하면 **새로 추가하지 않고 토큰만 교체**하고,
 * 내부 `channel.id` 는 그대로 둔다. 이유:
 *  - 예약된 발행 레코드(mkt_publish_records.metadata.target_id)가 내부 id 를 가리킨다.
 *    새 항목을 push 하면 그 레코드들은 계속 옛 항목(=옛 스코프 토큰)을 쓰게 되어
 *    재연동을 해도 새 스코프(yt-analytics 등)가 적용되지 않는다.
 *  - 중복 항목이 쌓이면 `resolveChannelId` 의 "첫 채널" 기본값도 흔들린다.
 *
 * channelId 를 못 받은 경우(권한 문제 등)에만 새 항목으로 추가한다 — 동일성을 판단할 수 없어서다.
 */
export function upsertChannel(
  channels: StoredChannel[],
  incoming: YouTubeChannel,
  tokens: StoredTokens
): { channels: StoredChannel[]; channel: YouTubeChannel; replaced: boolean } {
  const idx = incoming.channelId
    ? channels.findIndex((c) => c.channel.channelId === incoming.channelId)
    : -1;

  if (idx === -1) {
    const next = [...channels, { channel: incoming, tokens }];
    return { channels: next, channel: incoming, replaced: false };
  }

  const existing = channels[idx];
  // 내부 id·연동시각은 보존(참조 무결성), 표시 정보와 토큰만 갱신.
  const merged: YouTubeChannel = {
    ...existing.channel,
    name: incoming.name || existing.channel.name,
    channelTitle: incoming.channelTitle ?? existing.channel.channelTitle,
  };
  const next = [...channels];
  next[idx] = { channel: merged, tokens };
  return { channels: next, channel: merged, replaced: true };
}

/** 저장된 토큰이 요구 스코프를 전부 갖고 있는지 — 재연동 필요 여부 판단용. */
export function hasScopes(tokens: Pick<StoredTokens, 'scope'>, required: string[]): boolean {
  const granted = new Set((tokens.scope ?? '').split(/\s+/).filter(Boolean));
  return required.every((s) => granted.has(s));
}
