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

// 세계 명작 광고 릴스 — 9:16 · 1080×1920 · 30fps.
// 🔴 **씬 배열 구조**(`adreel/timeline.ts`) — `from` 은 자동 누적, 소리는 씬 로컬.
//    파닉스 광고를 한 타임라인에 짰다가 하루에 다섯 번 전체를 밀었다.
//    → memory `ad-reel-scene-based-authoring-2026-07-28`
// 🔴 명작의 축 = **같은 책을 그림체 3종 × 언어 5종으로**. 파닉스에 없던 차별점이 이것이라 여기에 시간을 쓴다.
// 화면은 전부 실촬(`public/classics/`)이고 얹는 것은 자막·오디오·블록·CTA 뿐이다.

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

export const CLS_FPS = 30;
export const CLS_WIDTH = 1080;
export const CLS_HEIGHT = 1920;

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
        세계 명작
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
        48권 · 그림체 3종 · 5개 언어
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
const LANGS = [
  // ko 컷 0→2.753s(쉼 2.673) · en 0.614→3.754s(쉼 3.674) · zh 0.21→4.78s(쉼 4.683)
  { key: 'ko', label: '한국어', still: 'classics/c4-read-ko.png', beat: 83 + 12 },
  { key: 'en', label: 'English', still: 'classics/c4-read-en.png', beat: 95 + 12 },
  // zh 는 첫 어절 경계가 4.68s 라 다른 언어보다 비트가 길다 — 말 중간에서 자르지 않는다는
  // 규칙이 우선이다(균일 비트로 맞췄다가 vi 가 말 중간에 페이드된 적이 있다).
  { key: 'zh', label: '中文', still: 'classics/c4-read-zh.png', beat: 137 + 12 },
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
  { big: '48권', small: '신데렐라 · 인어공주 · 백설공주 …' },
  { big: '그림체 3종', small: '수채 · 페이퍼 3D · 콜라주' },
  { big: '5개 언어', small: '한국어 · English · 中文 · Tiếng Việt · ไทย' },
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
        세계 명작, 한 앱에
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
// 🔴 소리는 **씬 로컬 프레임**이다. 클립을 다시 자르면 그 씬 안에서만 고치면 된다.
const SCENES: Scene[] = [
  { key: 'thumb', durationInFrames: 60, Component: () => <Thumbnail /> },
  {
    // 🔴 진입은 **실제 여정 그대로** — 묶어보기를 접고, 세계 명작까지 내리고, 더 보기를 누르고,
    //    표지 격자에서 신데렐라를 고른다. 곧장 책 화면으로 튀면 어색하다는 지적(2026-07-29).
    key: 'journey',
    // 클립 196 · f36 묶어보기 접힘 · f74 세계 명작 도착 · f121 드릴인 격자 · f177 신데렐라 탭.
    // 탭 뒤 8프레임만 남기고 끊는다(그 뒤는 같은 격자가 서 있을 뿐).
    durationInFrames: 150,
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/k1-journey.mp4" />
        <Subtitle
          lines={[
            { text: '세계 명작 48권', at: 74 },
            { text: '보고 싶은 걸 골라요', at: 121, accent: true },
          ]}
          dur={dur}
        />
      </>
    ),
  },
  {
    key: 'styles',
    // 🔴 **아래로 스크롤한 구도**로 재촬영(2026-07-29 지적) — 예전엔 화면 위 60% 를 가이드 카드
    //    1·2·3 이 먹고 정작 바뀌는 표지는 아래 가장자리에서 잘렸다. 이제 선택 바가 상단,
    //    표지가 화면 한가운데다. 클립 157 · 4상태(페이퍼3D→수채→콜라주→페이퍼3D 복귀).
    durationInFrames: 162,
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/k2-styles.mp4" />
        <Subtitle
          lines={[
            { text: '같은 이야기, 다른 그림체', at: 6 },
            { text: '아이 취향대로 골라요', at: 46, accent: true },
          ]}
          dur={dur}
          scrim={false}
        />
      </>
    ),
  },
  {
    key: 'lang-pick',
    // 🔴 **한국어로 끝나야 한다** — 다음 씬이 한국어 화면부터 시작한다.
    //    영어로 끝내놨더니 「영어를 골랐는데 한글이 나온다」가 됐다(2026-07-29 지적).
    // 🔴 **언어마다 그림체도 함께 바뀐다**(2026-07-29 요청) — 한국어·페이퍼3D → English·수채 →
    //    中文·콜라주 → 한국어·페이퍼3D. 앞 씬이 그림체를, 이 씬이 언어를 따로 팔았더니 언어가
    //    바뀌어도 그림이 그대로라 「5개 언어」가 밋밋했다. 표지를 붙잡은 동안 두 축을 같이 바꿔
    //    공개하므로 한 덩어리 상태 변화로 보인다(탭은 언어 셀렉트에만).
    //    ⚠️ 언어별 표지가 있는 그림체만 가능 — 신데렐라는 화면에 뜨는 3종 전부 갖고 있다.
    // 클립 168 · ko→en→zh→ko(끝까지 한국어+페이퍼3D). 읽어주기 씬이 같은 메시지를 이어받아
    // 152 로 줄였다(뒤 24프레임은 한국어 상태를 붙잡고만 있다).
    durationInFrames: 152,
    bgm: 0.55,
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/k3-lang.mp4" />
        <Subtitle lines={[{ text: '읽어줄 말도 고르고', at: 6 }]} dur={dur} scrim={false} />
      </>
    ),
  },
  {
    key: 'langs',
    durationInFrames: LANGS_DURATION,
    // 🔴 나레이션은 **그 언어 page[0] 음원의 머리**다(`narr-{lang}-head.mp3`, 어절 경계에서 컷).
    //    화면 스틸도 page[0] 첫 문장이라 읽는 글과 들리는 소리가 같다 — 처음엔 page[1] 음원을
    //    붙여 자막과 아예 다른 문장이 흘렀다(2026-07-29 지적). **화면 언어 3종 = 음원 3종**이라
    //    `LANGS.key` 하나로 스틸·라벨·음원을 함께 고른다(따로 적으면 또 어긋난다).
    bgm: 0.32,
    sfx: LANG_BOUNDS.map((l) => ({
      at: l.from,
      src: `classics/audio/narr-${l.key}-head.mp3`,
    })),
    Component: () => <LangShowcase />,
  },
  {
    // 🔴 게임을 **하나만** 넣었다가 지적받았다(2026-07-29). 단어 익히기 게임을 차례로 보여준다.
    //    ⚠️ 한글 블록은 뺐다 — 모바일에서 자모 타일이 7.2×19.2px 라 광고에 나갈 그림이 아니다
    //    (`KoreanBlockPlayer.tsx` `grid-cols-11`, 별도 수정 작업 중).
    key: 'g-match',
    durationInFrames: 110,
    bgm: 0.55,
    sfx: [{ at: 92, src: 'classics/audio/correct.mp3' }], // 실측: 선이 초록으로 확정되는 프레임
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/g1-match.mp4" />
        <Subtitle lines={[{ text: '그림과 낱말을 이어 보고', at: 6 }]} dur={dur} until={80} />
      </>
    ),
  },
  {
    key: 'g-draw',
    // 클립 182(원본 f36~217) · f159 「🎉 구두」 완료 · 뒤 20프레임은 색종이 축하.
    durationInFrames: 182,
    bgm: 0.55,
    sfx: [{ at: 159, src: 'classics/audio/correct.mp3' }], // 실측: 99% 완성 f159
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/g3-draw.mp4" />
        {/* 🔴 이 게임은 단어마다 점잇기/칠하기가 갈린다 — 이 클립은 **칠하기**(구두)라 그렇게 쓴다 */}
        <Subtitle lines={[{ text: '그림도 직접 칠해 보고', at: 6 }]} dur={dur} until={140} />
      </>
    ),
  },
  {
    key: 'g-write',
    durationInFrames: 108,
    bgm: 0.55,
    sfx: [{ at: 101, src: 'classics/audio/correct.mp3' }], // 실측: 글자 완성 f101
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/g5a-write.mp4" />
        <Subtitle lines={[{ text: '손으로 직접 써 보면', at: 6 }]} dur={dur} until={92} />
      </>
    ),
  },
  {
    // 🔴 사용자 요청: **「마지막 게임에서 한 단어 맞추면 동화 장면 나오게」**.
    //    앱의 `SceneReveal` — 방금 쓴 낱말이 나오는 동화 페이지가 열린다. 이 광고의 클라이맥스다.
    // 🔴 나레이션이 있어야 하는 씬이다(2026-07-29 지적) — 앱은 여기서 그 페이지를 읽어주는데
    //    클립은 무음(`-an`)이라 광고에선 장면만 뜨고 조용했다. 책 page[5] 실음원을 얹는다.
    //    자막(카드 안 글)과 들리는 문장이 같아야 하므로 **그 페이지 음원**이고, 「…황금 마차로
    //    변했어요!」 문장 끝(원본 6.02s)에서 끊는다 — 광고에 9초를 다 쓸 수 없다.
    // 소리 순서: 띵동(f4, 0.92s) → **쉼 0.4s** → 나레이션(f46, 5.88s=176f) → 꼬리 9f.
    key: 'g-reveal',
    durationInFrames: 231,
    bgm: 0.3,
    sfx: [
      { at: 4, src: 'classics/audio/clear.mp3' },
      { at: 46, src: 'classics/audio/narr-reveal-head.mp3' },
    ],
    Component: ({ dur }) => (
      <>
        {/* 리빌 화면은 완전 정지라(프레임 차 5e-5) 뒤 3.5초는 마지막 프레임 복제다 — 아주 느린 줌으로 살린다 */}
        <Clip src="classics/clips/g5b-reveal.mp4" zoom={[1, 1.06]} dur={dur} />
        <Subtitle
          lines={[{ text: '그 낱말이 나오는 장면으로', at: 8, accent: true }]}
          dur={dur}
          until={44}
        />
      </>
    ),
  },
  {
    // 🔴 사용자 요청: **「마지막에 동화책 리스트 쫙 한번 보여줘야지」**.
    // 🔴 92 프레임까지만 — 클립 154 는 f96 부터 **푸터(사업자정보)**가 올라온다(실측).
    key: 'g-list',
    durationInFrames: 92,
    Component: ({ dur }) => (
      <>
        <Clip src="classics/clips/g6-list.mp4" />
        <Subtitle lines={[{ text: '이 모든 게 48권에', at: 8 }]} dur={dur} />
      </>
    ),
  },
  { key: 'facts', durationInFrames: 84, Component: ({ dur }) => <FactBlocks dur={dur} /> },
  { key: 'cta', durationInFrames: 94, overlap: 4, Component: () => <Cta /> },
];

const { placed, total } = layout(SCENES);
export const CLS_DURATION = total;

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

export const AdReelClassics: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CREAM }}>
    <Audio src={staticFile('classics/audio/bgm.mp3')} volume={bgmVolume} />
    {TAIL_LEN > 30 && (
      <Sequence from={TAIL_FROM} durationInFrames={TAIL_LEN}>
        <Audio src={staticFile('classics/audio/bgm.mp3')} volume={bgmTailVolume} />
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
