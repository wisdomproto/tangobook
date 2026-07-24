import { describe, it, expect } from 'vitest';
import {
  upsertChannel,
  hasScopes,
  type StoredChannel,
  type StoredTokens,
} from './youtube-channels.js';

const tokens = (access: string, scope = 'a b'): StoredTokens => ({
  access_token: access,
  refresh_token: `r-${access}`,
  scope,
  token_type: 'Bearer',
  expiry_date: 0,
});

const stored = (internalId: string, ytId: string, name = '탱고북스'): StoredChannel => ({
  channel: {
    id: internalId,
    name,
    channelId: ytId,
    channelTitle: name,
    connectedAt: '2026-01-01T00:00:00.000Z',
  },
  tokens: tokens('old'),
});

describe('upsertChannel', () => {
  it('처음 보는 채널은 추가한다', () => {
    const r = upsertChannel(
      [],
      { id: 'new-1', name: '탱고북스', channelId: 'UC1', connectedAt: 'x' },
      tokens('t')
    );
    expect(r.replaced).toBe(false);
    expect(r.channels).toHaveLength(1);
  });

  // 🔴 예약 레코드의 target_id 가 내부 id 를 가리키므로 재연동해도 그 id 가 바뀌면 안 된다.
  it('같은 유튜브 채널 재연동 → 추가하지 않고 내부 id 를 유지한 채 토큰만 교체', () => {
    const before = [stored('internal-A', 'UC1')];
    const r = upsertChannel(
      before,
      { id: 'brand-new-id', name: '탱고북스', channelId: 'UC1', connectedAt: 'now' },
      tokens('fresh', 'a b yt-analytics')
    );
    expect(r.replaced).toBe(true);
    expect(r.channels).toHaveLength(1);
    expect(r.channels[0].channel.id).toBe('internal-A'); // 내부 id 보존
    expect(r.channels[0].tokens.access_token).toBe('fresh'); // 토큰만 교체
    expect(r.channels[0].tokens.scope).toContain('yt-analytics');
    expect(r.channel.id).toBe('internal-A');
  });

  it('연동 시각은 보존한다', () => {
    const r = upsertChannel(
      [stored('internal-A', 'UC1')],
      { id: 'x', name: '탱고북스', channelId: 'UC1', connectedAt: '2026-07-24T00:00:00.000Z' },
      tokens('fresh')
    );
    expect(r.channels[0].channel.connectedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('표시 이름은 새 값으로 갱신한다', () => {
    const r = upsertChannel(
      [stored('internal-A', 'UC1', '옛이름')],
      { id: 'x', name: '새이름', channelId: 'UC1', channelTitle: '새타이틀', connectedAt: 'now' },
      tokens('fresh')
    );
    expect(r.channels[0].channel.name).toBe('새이름');
    expect(r.channels[0].channel.channelTitle).toBe('새타이틀');
  });

  it('다른 채널은 건드리지 않는다', () => {
    const before = [
      stored('internal-A', 'UC1', '탱고북스'),
      stored('internal-B', 'UC2', 'tango books'),
    ];
    const r = upsertChannel(
      before,
      { id: 'x', name: '탱고북스', channelId: 'UC1', connectedAt: 'now' },
      tokens('fresh')
    );
    expect(r.channels).toHaveLength(2);
    expect(r.channels[1].channel.id).toBe('internal-B');
    expect(r.channels[1].tokens.access_token).toBe('old');
  });

  it('channelId 를 못 받으면 동일성 판단이 불가하므로 새로 추가한다', () => {
    const r = upsertChannel(
      [stored('internal-A', 'UC1')],
      { id: 'x', name: '알수없음', connectedAt: 'now' },
      tokens('fresh')
    );
    expect(r.replaced).toBe(false);
    expect(r.channels).toHaveLength(2);
  });
});

describe('hasScopes', () => {
  it('요구 스코프를 전부 가지면 true', () => {
    expect(hasScopes({ scope: 'a b c' }, ['a', 'c'])).toBe(true);
  });

  it('하나라도 없으면 false', () => {
    expect(hasScopes({ scope: 'a b' }, ['a', 'yt-analytics'])).toBe(false);
  });

  it('scope 가 비어도 안전하게 false', () => {
    expect(hasScopes({ scope: '' }, ['a'])).toBe(false);
  });
});
