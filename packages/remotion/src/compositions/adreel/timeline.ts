import React from 'react';

/**
 * 광고 릴스 = **씬 배열**. 한 타임라인에 `from` 을 손으로 적지 않는다.
 *
 * 🔴 파닉스 광고를 한 타임라인에 짰다가 하루에 다섯 번 전체를 밀었다(+126 / −40 / −36 / +24 / +36).
 *    클립 하나를 다시 자를 때마다 뒤 씬 `from` 과 **오디오 앵커 수십 개**가 같이 틀어졌고,
 *    매번 몇 프레임씩 어긋나 "보여주는 것과 소리가 안 맞는다"는 지적을 받았다.
 *    → 씬은 **로컬 프레임 0부터**, 소리도 **씬 안에 로컬로**. `from` 은 여기서 누적한다.
 *    → memory `ad-reel-scene-based-authoring-2026-07-28`
 */
export type Sfx = {
  /** 씬 로컬 프레임. 화면에서 그 일이 일어나는 프레임에 건다(픽셀로 재서). */
  at: number;
  /** `phonics/audio/` 등 staticFile 기준 경로 */
  src: string;
  volume?: number;
  /** 길게 늘어지는 음원을 잘라 쓸 때 */
  dur?: number;
};

export type Scene = {
  key: string;
  durationInFrames: number;
  Component: React.FC<{ dur: number }>;
  sfx?: Sfx[];
  /** BGM 레벨(0~1). 앱 소리가 주인공인 씬은 낮춘다. 기본 1. */
  bgm?: number;
  /**
   * 씬 **안에서** BGM 이 움직여야 할 때(패턴 인터럽트 — 클라이맥스 직전에 음악을 걷는다).
   * 로컬 프레임을 받아 레벨을 돌려준다. 있으면 `bgm` 대신 이걸 쓴다(경계 램프도 건너뛴다).
   * 🔴 앵커를 숫자로 박지 말고 그 씬의 sfx 앵커 상수를 같이 쓸 것 — 클립을 다시 자르면 함께 움직인다.
   */
  bgmAt?: (local: number) => number;
  /**
   * 앞 씬과 겹치는 프레임 수 — 디졸브/밀어올림처럼 **씬 경계를 넘는 전환**에 쓴다.
   * 겹친 만큼 전체 길이가 줄어든다.
   */
  overlap?: number;
};

export type PlacedScene = Scene & { from: number };

/**
 * 씬 배열 → 절대 프레임이 박힌 배열 + 총 길이. 사람이 더하지 않는다.
 *
 * 🔴 씬 길이 **밖**의 오디오 앵커는 조용히 사라진다 — Remotion 은 부모 Sequence 밖 자식을
 *    마운트조차 안 해서 에러도, 소리도 없다. 클립을 다시 자른 뒤 `clear.mp3` 가 한 번도
 *    안 울린 채 배포될 뻔했다(2026-07-29). 그래서 여기서 던진다.
 */
export function layout(scenes: Scene[]): { placed: PlacedScene[]; total: number } {
  for (const s of scenes) {
    for (const f of s.sfx ?? []) {
      if (f.at < 0 || f.at >= s.durationInFrames) {
        throw new Error(
          `[adreel] 씬 "${s.key}" 의 오디오 앵커가 씬 밖이다: at=${f.at}, 씬 길이=${s.durationInFrames} (${f.src})`
        );
      }
    }
  }
  let cursor = 0;
  const placed = scenes.map((s) => {
    const from = Math.max(0, cursor - (s.overlap ?? 0));
    cursor = from + s.durationInFrames;
    return { ...s, from };
  });
  return { placed, total: cursor };
}

/** 씬 로컬 오디오 앵커 → 절대 프레임. 씬을 옮겨도 소리가 따라온다. */
export function absoluteSfx(placed: PlacedScene[]): (Sfx & { abs: number; scene: string })[] {
  return placed.flatMap((s) =>
    (s.sfx ?? []).map((f) => ({ ...f, abs: s.from + f.at, scene: s.key }))
  );
}

/**
 * 프레임별 BGM 레벨 — 씬의 `bgm` 을 그대로 따르되 경계에서 `ramp` 프레임 동안 이어 붙인다.
 * 씬을 늘리거나 순서를 바꿔도 여기 숫자를 고칠 일이 없다.
 */
export function bgmLevelAt(placed: PlacedScene[], f: number, ramp = 9): number {
  const idx = placed.findIndex((s) => f >= s.from && f < s.from + s.durationInFrames);
  if (idx < 0) return placed.length ? (placed[placed.length - 1].bgm ?? 1) : 1;
  if (placed[idx].bgmAt) return placed[idx].bgmAt!(f - placed[idx].from);
  const cur = placed[idx].bgm ?? 1;
  const prev = idx > 0 ? (placed[idx - 1].bgm ?? 1) : cur;
  const into = f - placed[idx].from;
  if (into >= ramp || prev === cur) return cur;
  return prev + ((cur - prev) * into) / ramp;
}
