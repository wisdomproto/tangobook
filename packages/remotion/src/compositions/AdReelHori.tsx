import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { layout, bgmLevelAt, type Scene } from './adreel/timeline';

// 호리 시리즈 광고 릴스 — 9:16 · 1080×1920 · 30fps. 전래판(AdReelHori)의 포크.
// 🔴 **축이 또 다르다.** 명작=그림체 3종 · 자연=분야의 넓이 · 전래=우리 것 ·
//    호리=**한 캐릭터가 아이에게 필요한 걸 다 덮는다**.
//    생활동화 43(습관·안전·마음) · 유치원동화 20(적응·사회정서) · 세상 탐험 15(탈것) = 78편.
// 🔴 게임을 팔 수 없다 — 세 라인 모두 낱말이 사실상 없다(유치원·탐험 0/35, 생활동화도 책당 1~2개).
//    대신 **무엇을 다루는지**를 판다: 표지에 제목이 구워져 있어 격자를 훑는 것만으로
//    「치카치카」 「차 보고 건너」 「화가 나면 후~」 가 지나간다.
// ⚠️ 영어는 **생활동화 43권만 완비**다(유치원·탐험 en 0). 나머지도 번역 예정이라는 사용자
//    결정에 따라 시리즈 축으로 쓴다 — **번역이 붙기 전에 발행하면 그 두 라인은 비어 있다**.
// 화면은 전부 실촬(`public/hori/`)이고 얹는 것은 자막·오디오·블록·CTA 뿐이다.

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

export const HRI_FPS = 30;
export const HRI_WIDTH = 1080;
export const HRI_HEIGHT = 1920;

const CORAL = '#FF5E3A';
const ACCENT = '#FFE08A';
const CREAM = '#FFF6EE';
const BGM_BASE = 0.35;
const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const tail = (frame: number, dur: number) => interpolate(frame, [dur - 7.5, dur - 4.5], [1, 0], C);

type Line = { text: string; at: number; accent?: boolean };

// 🔴 하단 여백 300 = **최소값**. 인스타 릴스가 아래 ~13% 를 캡션·버튼으로 덮는다(132 면 가려진다).
//    앱 UI 를 덮는 씬은 `bottom` 을 **키워서**(더 위로) 빈 띠에 앉히거나, `until` 로 먼저 걷는다.
// scrim: 자막 뒤 어두운 그라데이션. 앱 화면 위에선 자연스럽지만 **표지만 남긴 크림 배경**
// 위에선 아래쪽이 얼룩처럼 탁해진다 — 그런 씬은 끄고 글자 자체의 어두운 칩에 맡긴다.
const Subtitle: React.FC<{
  lines: Line[];
  dur: number;
  bottom?: number;
  until?: number;
  scrim?: boolean;
}> = ({ lines, dur, bottom = 300, until, scrim = true }) => {
  const frame = useCurrentFrame();
  const out = until == null ? tail(frame, dur) : interpolate(frame, [until, until + 9], [1, 0], C);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
      {scrim && (
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0) 66%, rgba(0,0,0,0.28) 86%, rgba(0,0,0,0.4) 100%)',
            opacity: interpolate(frame, [lines[0].at, lines[0].at + 6], [0, 1], C) * out,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          paddingBottom: bottom,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {lines.map((l) => (
          <div
            key={l.text}
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 64,
              color: l.accent ? ACCENT : '#fff',
              textAlign: 'center',
              lineHeight: 1.28,
              wordBreak: 'keep-all',
              maxWidth: 920,
              backgroundColor: 'rgba(18,14,12,0.62)',
              borderRadius: 28,
              padding: '12px 34px',
              textShadow: '0 4px 18px rgba(0,0,0,0.55)',
              opacity: interpolate(frame, [l.at, l.at + 6], [0, 1], C) * out,
              transform: `translateY(${interpolate(frame, [l.at, l.at + 6], [26, 0], C)}px)`,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// zoom: 정지 화면을 오래 붙잡는 씬에서만(리빌). 안 주면 화면이 통째로 멎어 보인다.
const Clip: React.FC<{ src: string; zoom?: [number, number]; dur?: number }> = ({
  src,
  zoom,
  dur = 0,
}) => {
  const frame = useCurrentFrame();
  const scale = zoom ? interpolate(frame, [0, dur], zoom, C) : 1;
  return (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
    />
  );
};

const Still: React.FC<{ src: string; dur: number; zoomTo?: number }> = ({
  src,
  dur,
  zoomTo = 1.05,
}) => {
  const frame = useCurrentFrame();
  return (
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${interpolate(frame, [0, dur], [1, zoomTo], C)})`,
      }}
    />
  );
};

// ── 썸네일 ─────────────────────────────────────────────────────────────────
// 🔴 인스타·유튜브가 첫 프레임을 커버로 쓴다 — f0 부터 완성 상태(페이드인 없음).
const Thumbnail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill
      style={{ backgroundColor: CORAL, justifyContent: 'center', alignItems: 'center', gap: 38 }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 44,
          padding: '30px 46px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          transform: `scale(${0.94 + 0.06 * pop})`,
        }}
      >
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ width: 560 }} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 128,
          color: '#fff',
          lineHeight: 1.1,
          textAlign: 'center',
          wordBreak: 'keep-all',
          textShadow: '0 8px 26px rgba(0,0,0,0.22)',
        }}
      >
        호리 시리즈
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 54,
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.16)',
          borderRadius: 999,
          padding: '18px 46px',
          wordBreak: 'keep-all',
        }}
      >
        78편 · 습관 · 유치원 · 세상
      </div>
      <div
        style={{ fontFamily, fontWeight: 800, fontSize: 46, color: ACCENT, wordBreak: 'keep-all' }}
      >
        지금 베타기간 회원가입만 하면 1년 무료
      </div>
    </AbsoluteFill>
  );
};

// ── 5개 언어 — 같은 페이지, 다른 말 ─────────────────────────────────────────
// 🔴 뷰어는 삽화·자막이 안 움직여 **녹화하면 프레임이 0개**다(repaint 기반). 그래서 스틸로 찍어
//    언어별로 이어 붙인다 — 정지 화면이라는 제약을 그대로 소재로 쓴 것.
// 🔴 **언어마다 그림체가 다르다**(2026-07-29 요청) — 앞의 언어 선택 장면과 **같은 짝**이다:
//    한국어=페이퍼3D · English=수채 · 中文=콜라주. 언어만 바뀌고 그림이 그대로면 「5개 언어」가
//    밋밋해서, 같은 이야기가 말도 그림도 달라지는 걸 한 화면에서 보여준다.
// ✅ **中文 복귀** — 앱 자막이 `break-keep`(word-break: keep-all)이라 띄어쓰기 없는 중국어는
//    한 덩어리 단어로 취급돼 줄바꿈이 아예 안 되고 화면 밖으로 잘렸다. 공백이 없으면 브라우저
//    기본 규칙에 맡기도록 `PageSubtitle` 을 고쳤고(브라우저 실측: scrollWidth==clientWidth),
//    그래서 vi 대신 zh 를 되살렸다.
// 🔴 **비트는 언어마다 다르다.** 균일 비트(78f)로 맞췄더니 음원을 2.5초에서 일괄로 잘라
//    vi 가 말 중간에서 페이드됐다(2026-07-29). 컷은 **어절 경계**(silencedetect 로 잰 쉼)에
//    떨어뜨리고 비트가 거기 맞춰 늘어난다 — 소리가 자연스럽게 끝나는 쪽이 우선이다.
//    `beat` = 음원 프레임 + **12(0.4초 쉼)**. 소리 사이 쉼 400~450ms 는 프로젝트 공통 규칙이고,
//    크로스페이드가 비트 끝 9프레임에 걸리므로 그 여유 안에서 앞 소리가 이미 끝나 있어야 한다.
// ko 컷 0.20→3.90s(쉼 3.834) · en 0.27→3.45s(쉼 3.388) — 둘 다 첫 문장 끝에서 자른다.
// ko 0→2.30s · en 0→1.98s — 둘 다 **첫 마디**(「옛날 옛날 아주 먼 옛날에」 / 「Long, long ago」)
// 에서 끊는다. 같은 첫 마디를 두 말로 듣는 게 이 씬의 전부라 길 필요가 없다.
// ko 0.32→2.42s · en 0.22→2.38s — 둘 다 첫 마디(「으앙— 축축해!」 / 「Waaah — I'm all wet!」)
// 에서 끊는다. 같은 첫 마디를 두 말로 듣는 게 이 씬의 전부다.
const LANGS = [
  { key: 'ko', label: '한국어', still: 'hori/n4-read-ko.png', beat: 63 + 12 },
  { key: 'en', label: 'English', still: 'hori/n4-read-en.png', beat: 65 + 12 },
];
const LANG_BOUNDS = LANGS.map((l, i) => ({
  ...l,
  from: LANGS.slice(0, i).reduce((s, x) => s + x.beat, 0),
}));
export const LANGS_DURATION = LANGS.reduce((s, l) => s + l.beat, 0);
/** 그림·알약이 소리보다 앞서는 프레임 수 — 비트 시작에 그 언어 나레이션이 붙는다. */
const LANG_LEAD = 9;

// 🔴 스틸이라 가만히 두면 7초가 통째로 멈춘다 — 느린 확대(Ken Burns) + 크로스페이드.
//    이전엔 배경이 `#000` 이고 새 언어가 opacity 0 부터 떠서 **1프레임 새까맣게** 깜빡였다.
//    → 앞 스틸을 아래에 깔아 둔 채 위에서 페이드인(겹치므로 검정이 드러날 틈이 없다).
const LangShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const bounds = LANG_BOUNDS;
  // 알약도 그림과 같은 프레임만큼 앞서 바뀐다 — 안 그러면 화면은 영어인데 「한국어」 알약이 남는다.
  const idx = Math.max(0, bounds.filter((l) => frame >= l.from - LANG_LEAD).length - 1);
  const cur = bounds[idx];
  const into = frame - Math.max(0, cur.from - LANG_LEAD);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {bounds.map((l, i) => (
        <AbsoluteFill
          key={l.key}
          // 🔴 크로스페이드는 비트 **앞에서** 끝난다 — 비트 시작 프레임에 그 언어 나레이션이 붙으므로
          //    `[l.from, l.from+9]` 이면 영어 소리가 나는 동안 0.3초 한글 화면이 남는다(실측).
          //    앞 소리는 비트 끝 12프레임 전에 이미 끝나 있어 겹칠 말이 없다.
          style={{
            opacity: i === 0 ? 1 : interpolate(frame, [l.from - LANG_LEAD, l.from], [0, 1], C),
          }}
        >
          <Img
            src={staticFile(l.still)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${interpolate(frame, [l.from, l.from + l.beat], [1.02, 1.09], C)})`,
            }}
          />
        </AbsoluteFill>
      ))}
      {/* 언어 알약 — 지금 무슨 말인지 한눈에 */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 52,
            color: CORAL,
            backgroundColor: '#fff',
            borderRadius: 999,
            padding: '18px 46px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
            transform: `translateY(${interpolate(into, [0, 8], [-18, 0], C)}px)`,
            opacity: interpolate(into, [0, 8], [0, 1], C),
          }}
        >
          {cur.label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 규모 블록 ──────────────────────────────────────────────────────────────
const FACTS = [
  { big: '생활동화 43편', small: '양치 · 배변 · 차 조심 · 화날 때 · 미안할 때' },
  { big: '유치원동화 20편', small: '처음 가는 유치원 · 친구 사귀는 법' },
  { big: '세상 탐험 15편', small: '소방차 · 기차 · 우주선 · 우체국' },
];

const FactBlocks: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        padding: '0 56px',
      }}
    >
      {FACTS.map((f, i) => {
        const pop = spring({ frame: frame - i * 8, fps, config: { damping: 13 } });
        return (
          <div
            key={f.big}
            style={{
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: 40,
              borderLeft: `18px solid ${CORAL}`,
              padding: '34px 44px',
              boxShadow: '0 14px 34px rgba(0,0,0,0.09)',
              transform: `scale(${pop})`,
              opacity: pop,
            }}
          >
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: 88,
                color: '#241a16',
                lineHeight: 1.1,
                wordBreak: 'keep-all',
              }}
            >
              {f.big}
            </div>
            <div
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: 36,
                color: '#8a7a72',
                marginTop: 8,
                wordBreak: 'keep-all',
              }}
            >
              {f.small}
            </div>
          </div>
        );
      })}
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 52,
          color: CORAL,
          marginTop: 10,
          opacity: interpolate(frame, [dur - 46, dur - 34], [0, 1], C),
          wordBreak: 'keep-all',
        }}
      >
        호리와 함께, 한 앱에
      </div>
    </AbsoluteFill>
  );
};

// ── CTA ────────────────────────────────────────────────────────────────────
const Cta: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = raw - 4;
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const pillPop = spring({ frame: frame - 26, fps, config: { damping: 11 } });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CORAL,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: interpolate(raw, [0, 4], [0, 1], C),
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 44,
          padding: '40px 56px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          transform: `scale(${pop})`,
        }}
      >
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ width: 640 }} />
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 84,
          color: '#fff',
          marginTop: 48,
          textAlign: 'center',
          lineHeight: 1.2,
          whiteSpace: 'pre-line',
          wordBreak: 'keep-all',
          transform: `translateY(${interpolate(frame, [10, 22], [40, 0], C)}px)`,
          opacity: interpolate(frame, [10, 22], [0, 1], C),
        }}
      >
        {'지금 베타기간\n회원가입만 하면\n1년 무료'}
      </div>
      <div
        style={{
          marginTop: 44,
          backgroundColor: '#fff',
          borderRadius: 999,
          padding: '20px 56px',
          fontFamily,
          fontWeight: 800,
          fontSize: 56,
          color: CORAL,
          transform: `scale(${pillPop})`,
        }}
      >
        tangobook.co.kr
      </div>
      <div
        style={{
          marginTop: 34,
          fontFamily,
          fontWeight: 700,
          fontSize: 36,
          color: 'rgba(255,255,255,0.92)',
          opacity: interpolate(frame, [38, 48], [0, 1], C),
          wordBreak: 'keep-all',
        }}
      >
        결제 정보 없이
      </div>
    </AbsoluteFill>
  );
};

// ── 씬 배열 ────────────────────────────────────────────────────────────────
// 🔴 **1차본을 갈아엎었다.** 34.8초 중 **10.0초가 픽셀 단위로 완전 정지**였고, 화면의 70~76%가
//    빈 크림이었으며, 사람 목소리가 **23.9초(69% 지점)에야** 처음 나왔다(검수 실측).
//    원인은 「나열만 했다」는 것 — 가로 캐러셀 세 개를 연달아 틀고 표지를 4.7초 들여다봤다.
//    → ①나열을 **움직이는 구간만** 남겨 잘랐다(각 144f → 61f. 뒤 2.3초는 얼음이었다)
//      ②**뷰어 페이지 넘김 실촬**을 넣었다 — 이 편에 없던 「제품이 일하는 순간」이다
//      ③페이지마다 **그 쪽 실제 나레이션**을 물려 목소리가 1초부터 흐른다
//      ④나열 → 페이지 → 나열 로 **엇갈리게** 배치해 같은 리듬이 이어지지 않게 했다
//      ⑤팩트 블록 삭제(격자 자막과 문구가 글자 그대로 겹쳤다)
// 🔴 나레이션은 **f72** 에 건다 — 페이지 넘김이 끝나고 새 쪽이 자리잡는 프레임이다(프레임 차분
//    실측: f34~40 이전 쪽 퇴장 · f55~70 새 쪽 진입). 앞에 걸면 **아직 이전 쪽이 보이는데 다음 쪽
//    글이 들린다**. 게다가 앱 자막은 TTS 진행에 맞춰 하이라이트가 쓸려가므로, 소리를 여기 맞춰야
//    글자와 목소리가 같이 간다.
const SCENES: Scene[] = [
  // 🔴 20프레임 — 인스타 커버는 **f0 한 장**이면 되고, 2초를 붙잡을 이유가 없었다.
  { key: 'thumb', durationInFrames: 20, Component: () => <Thumbnail /> },
  {
    // ① 생활동화 — 「화가 나면」 5쪽. 아이가 씩씩대는 그 순간에 쓰는 방법이 그대로 나온다.
    //    이 컷이 훅이다: 로고가 아니라 **상황**으로 시작한다.
    key: 'p-life',
    durationInFrames: 226,
    bgm: 0.34,
    sfx: [{ at: 72, src: 'hori/audio/narr-life.mp3' }],
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/p-life.mp4" />
        <Subtitle lines={[{ text: '화가 나면, 후~ 하고 크게 숨', at: 6 }]} dur={dur} until={64} />
      </>
    ),
  },
  {
    // ② 생활동화 43편 — 표지에 제목이 구워져 있어 흘리는 것만으로 읽힌다.
    key: 'g-life',
    durationInFrames: 61,
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/g-life.mp4" />
        <Subtitle
          lines={[{ text: '양치 · 배변 · 차 조심 — 43편', at: 4, accent: true }]}
          dur={dur}
          scrim={false}
        />
      </>
    ),
  },
  {
    // ③ 유치원동화 — 「깜빡 도깨비」. 잃어버리고 찾는, 유치원에서 매일 있는 일.
    key: 'p-kinder',
    durationInFrames: 184,
    bgm: 0.34,
    sfx: [{ at: 72, src: 'hori/audio/narr-kinder.mp3' }],
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/p-kinder.mp4" />
        <Subtitle lines={[{ text: '또 잃어버렸어…', at: 6 }]} dur={dur} until={64} />
      </>
    ),
  },
  {
    key: 'g-kinder',
    durationInFrames: 61,
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/g-kinder.mp4" />
        <Subtitle
          lines={[{ text: '처음 가는 유치원 — 20편', at: 4, accent: true }]}
          dur={dur}
          scrim={false}
        />
      </>
    ),
  },
  {
    // ④ 세상 탐험 — 「우주로 슝」 카운트다운. 세 갈래 중 가장 신나는 장면.
    key: 'p-explore',
    durationInFrames: 207,
    bgm: 0.34,
    sfx: [{ at: 72, src: 'hori/audio/narr-explore.mp3' }],
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/p-explore.mp4" />
        <Subtitle lines={[{ text: '열, 아홉, 여덟…', at: 6 }]} dur={dur} until={64} />
      </>
    ),
  },
  {
    key: 'g-explore',
    durationInFrames: 61,
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/g-explore.mp4" />
        <Subtitle
          lines={[{ text: '소방차 · 기차 · 우주선 — 15편', at: 4, accent: true }]}
          dur={dur}
          scrim={false}
        />
      </>
    ),
  },
  {
    // ⑤ 고르는 순간 — 유일하게 화면을 꽉 채우는 컷이다(2열 격자). 얼어붙은 꼬리 39프레임은 버렸다.
    key: 'n2-pick',
    durationInFrames: 44,
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/n2-pick.mp4" />
        <Subtitle lines={[{ text: '오늘 필요한 걸 골라요', at: 4 }]} dur={dur} />
      </>
    ),
  },
  {
    // ⑥ 표지 한/영 — 141f 중 **변하는 프레임이 둘뿐**이라 70f 로 압축했다.
    //    ⚠️ 영어는 지금 생활동화 43권만 완비다(유치원·탐험 en 0, 번역 예정).
    key: 'n3-cover',
    durationInFrames: 90,
    bgm: 0.7,
    Component: ({ dur }) => (
      <>
        <Clip src="hori/clips/n3-cover.mp4" />
        <Subtitle lines={[{ text: '한국어로도, 영어로도', at: 4 }]} dur={dur} scrim={false} />
      </>
    ),
  },
  { key: 'cta', durationInFrames: 94, overlap: 4, Component: () => <Cta /> },
];

const { placed, total } = layout(SCENES);
export const HRI_DURATION = total;

// BGM — 씬의 `bgm` 을 따라간다. 씬을 늘리거나 순서를 바꿔도 여기 숫자를 고칠 일이 없다.
// 🔴 bgm.mp3 는 29.99초(f899)에 곡이 끝난다 — 그 앞에서 같은 곡 앞부분을 겹쳐 잇는다.
// 🔴 곡이 29.99초(f899)라 꼬리 트랙이 커버하는 끝은 `TAIL_FROM + 899` 다 — 릴스가 길어질 때
//    이 값을 안 올리면 **끝에 무음이 남는다**(실측: 59.1초 릴스에서 마지막 1.07초가 죽었다).
//    릴스 끝을 덮도록 역산한다(단, 앞 씬 소리와 겹치지 않게 상한을 둔다).
const TAIL_FROM = Math.min(900, Math.max(0, total - 899));
const TAIL_LEN = Math.max(0, total - TAIL_FROM);
const bgmVolume = (f: number) =>
  BGM_BASE * bgmLevelAt(placed, f) * interpolate(f, [TAIL_FROM, TAIL_FROM + 18], [1, 0], C);
const bgmTailVolume = (l: number) =>
  BGM_BASE *
  bgmLevelAt(placed, l + TAIL_FROM) *
  interpolate(l, [0, 18], [0, 1], C) *
  interpolate(l, [TAIL_LEN - 14, TAIL_LEN - 2], [1, 0], C);

export const AdReelHori: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Audio src={staticFile('hori/audio/bgm.mp3')} volume={bgmVolume} />
    {TAIL_LEN > 30 && (
      <Sequence from={TAIL_FROM} durationInFrames={TAIL_LEN}>
        <Audio src={staticFile('hori/audio/bgm.mp3')} volume={bgmTailVolume} />
      </Sequence>
    )}

    {placed.map((s) => (
      <Sequence key={s.key} from={s.from} durationInFrames={s.durationInFrames}>
        <s.Component dur={s.durationInFrames} />
        {(s.sfx ?? []).map((f, i) => (
          <Sequence key={`${s.key}-${i}`} from={f.at} durationInFrames={f.dur ?? 9999}>
            <Audio src={staticFile(f.src)} volume={f.volume ?? 1} />
          </Sequence>
        ))}
      </Sequence>
    ))}
  </AbsoluteFill>
);
