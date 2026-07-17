import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

/** 삽화를 풀폭 16:9 패널에 **원본 그대로**(크롭 없음) 담고, 컷 사이 크로스페이드 + 완만한 줌.
 *  🔴 예전엔 고정 height(860)라 컨테이너가 ~1.2:1 → 16:9 원본의 좌우가 ~33% 잘렸다.
 *  `aspectRatio:'16/9'` 로 컨테이너를 원본 비율에 맞춰 잘림 제거(책 삽화는 전부 16:9).
 *  원격 R2 URL을 <Img src={url}> 로 로드(staticFile 아님). */
const ImageBox: React.FC<{ imageUrls: string[]; activeIdx: number; local: number }> = ({
  imageUrls,
  activeIdx,
  local,
}) => {
  // 🔴 예전엔 이미지가 자체 타이머(durationInFrames/이미지수)로 돌아서, 문장 수와 이미지 수가
  // 다르면 자막과 그림의 박자가 어긋났다("콩이가 데려가지요" 자막에 이미 도착한 그림 — 리뷰 피드백).
  // 이제 **보이는 문장(activeIdx)에 그림을 1:1로 물린다** — 문장이 넘어갈 때 그림도 같이 넘어간다.
  const idx = Math.min(activeIdx, imageUrls.length - 1);
  const prevIdx = Math.max(0, idx - 1);
  const FADE = 10;
  const fade = interpolate(local, [0, FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(local, [0, 150], [1.0, 1.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 9', // 원본(16:9) 그대로 — 고정 height 쓰면 좌우가 잘린다
        borderRadius: 0, // full-bleed(가로 꽉) — 모서리를 둥글리면 다시 카드처럼 떠 보인다
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(120,60,30,0.22)',
        backgroundColor: '#241a14',
        position: 'relative',
      }}
    >
      {/* 이전 문장의 그림 — 새 그림이 페이드인하는 동안만 밑에 깔려 크로스페이드가 된다. */}
      {idx !== prevIdx && fade < 1 ? (
        <Img
          src={imageUrls[prevIdx]}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : null}
      <Img
        src={imageUrls[idx]}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain', // 컨테이너=16:9 + contain → 원본 잘림 0
          opacity: fade,
          transform: `scale(${zoom})`,
        }}
      />
    </div>
  );
};

interface Props {
  title: string; // 씬 제목(왜 중요할까 / 호리 이야기 …). 빈 문자열이면 숨김(표지에 제목이 박힌 첫 씬)
  body: string; // 하단 내용(문장 단위로 순차 노출)
  imageUrls: string[];
  hero?: boolean; // 첫 씬은 제목 크게
  headerTitle?: string; // 전 씬 공통 헤더에 띄울 책 제목
  /** 그림별 자막 (imageUrls 와 1:1). 주면 body 대신 이걸 쓴다 — 같은 페이지에서 나온 글·그림이라
   *  자막과 삽화가 어긋날 수 없다(이야기 씬 = 실제 책 미리보기). */
  bodies?: string[];
}

export const StoryScene: React.FC<Props> = ({
  title,
  body,
  imageUrls,
  hero,
  headerTitle,
  bodies,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleDown = interpolate(frame, [2, 18], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [2, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 긴 줄거리는 문장 단위로 순차 노출(한 번에 벽처럼 뜨지 않게). 문장 끝(. ! ?) 기준 분할.
  // 짧은 캡션(문장 1개)은 그대로 한 번에 표시.
  // bodies(그림별 자막)가 오면 그대로 세그먼트로 — 그림과 1:1 이라 어긋날 수 없다.
  // 아니면 body 를 문장 단위로 쪼갠다. 🔴 `\s*` 로 쪼개면 공백 없이도 갈라져서 『책 제목!』 처럼
  // 문장부호가 안에 든 인용이 깨진다("『골고루 먹으면 무지개 힘!" / "』의 주인공은…" — 리뷰 피드백).
  // 뒤에 공백이 실제로 있을 때만 = 진짜 문장 끝일 때만 분할한다.
  const segments = bodies?.length
    ? bodies
    : body
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
  // 🔴 예전엔 씬 길이를 문장 수로 균등 분할해서, 긴 문장이 짧은 문장과 같은 시간만 머물러
  // "2줄짜리가 순식간에 넘어가 읽을 시간이 없다"는 피드백. 이제 **글자 수에 비례해** 배분한다.
  const weights = segments.map((s) => Math.max(10, s.replace(/\s/g, '').length));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const starts: number[] = [];
  {
    let acc = 0;
    for (const w of weights) {
      starts.push((acc / weightSum) * durationInFrames);
      acc += w;
    }
  }
  let segIdx = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (frame >= starts[i]) {
      segIdx = i;
      break;
    }
  }
  const segLen =
    (segIdx + 1 < starts.length ? starts[segIdx + 1] : durationInFrames) - starts[segIdx];
  const shownBody = segments[segIdx] ?? body;
  const local = frame - starts[segIdx];
  // 첫 세그먼트는 씬 등장 애니, 이후 세그먼트는 각자 페이드/슬라이드 인.
  const segEnter = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const firstEnter = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bodyOpacity = segIdx === 0 ? Math.min(firstEnter, segEnter) : segEnter;
  const bodyUp = interpolate(bodyOpacity, [0, 1], [40, 0]);
  // 폰트는 현재 보이는 세그먼트 길이에 맞춰 자동 축소.
  // 자막을 키워 빈 공간을 줄인다(16:9 삽화가 세로 화면의 1/3만 차지해 여백이 크다는 피드백).
  const segLenChars = shownBody.replace(/\n/g, '').length;
  const bodyFont = segLenChars > 60 ? 54 : segLenChars > 44 ? 60 : segLenChars > 28 ? 64 : 70;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #FFF3E9 0%, #FFE1CC 100%)',
        flexDirection: 'column',
        alignItems: 'center',
        // 헤더(고정) / 본문(가운데) / 푸터(고정) 3단 — 위아래 빈 공간을 브랜드 프레임으로 채운다.
        // 🔴 삽화는 화면 끝까지(full-bleed) — 16:9 를 안 자르면 세로 화면에서 높이의 ~31% 가 한계라
        //    좌우 여백까지 두면 "그림엽서가 둥둥 떠 있는 느낌"이 된다(리뷰). 가로 패딩 0.
        justifyContent: 'space-between',
        padding: '56px 0 48px',
      }}
    >
      {/* ── 헤더: 전 씬 공통(브랜드 + 책 제목). 스크롤 중간에 들어온 사람도 뭔지 알 수 있게. ── */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 30,
            color: '#fff',
            backgroundColor: '#FF6B5E',
            borderRadius: 999,
            padding: '8px 26px',
            display: 'inline-block',
            letterSpacing: 1,
          }}
        >
          {/* 🔴 "읽어주는" 을 못 박는다 — "읽어주는 건지 내가 읽어줘야 하는 건지가 제일 궁금한데
              아무 데도 안 나온다"는 피드백. 첫 프레임부터 이 앱이 뭘 해주는지 답한다. */}
          탱고북 · 읽어주는 그림책
        </div>
        {headerTitle ? (
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              // 제목 = 이 화의 주제. 전 씬 상시 노출이라 한눈에 읽히게 크게(사용자 피드백).
              fontSize: 56,
              color: '#7A5A48',
              marginTop: 12,
              wordBreak: 'keep-all',
              lineHeight: 1.25,
              paddingLeft: 40,
              paddingRight: 40,
            }}
          >
            {headerTitle}
          </div>
        ) : null}
      </div>

      {/* ── 본문: 씬 제목 + 삽화 + 자막 (한 덩어리로 붙여 시선이 흩어지지 않게) ── */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            transform: `translateY(${titleDown}px)`,
            opacity: titleOpacity,
          }}
        >
          {/* 표지에 제목이 이미 박혀 있는 씬(=첫 씬)은 title 을 빈 문자열로 넘겨 중복을 없앤다.
            (리뷰 피드백: 큰 검은 고딕 제목이 표지의 예쁜 손글씨 제목과 겹쳐 "잘못 만든 화면" 같다) */}
          {title ? (
            <div
              style={{
                fontFamily,
                fontWeight: 800,
                fontSize: hero ? 108 : 92,
                color: '#2B2B2B',
                lineHeight: 1.18,
                wordBreak: 'keep-all',
              }}
            >
              {title}
            </div>
          ) : null}
        </div>

        {/* 이미지 + 자막을 한 덩어리로 (가깝게 붙여 한 화면에 같이 보이게) */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 40,
          }}
        >
          {/* 16:9 삽화 — 지금 보이는 자막 문장(segIdx)에 물려서 같이 넘어간다(박자 어긋남 방지) */}
          <ImageBox imageUrls={imageUrls} activeIdx={segIdx} local={local} />

          {/* 자막: 이미지 바로 아래 */}
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: bodyFont,
              color: '#4A3B33',
              textAlign: 'center',
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              wordBreak: 'keep-all',
              maxWidth: 1000, // 컨테이너 가로 패딩이 0 이라 자막에만 좌우 여유를 준다
              paddingLeft: 40,
              paddingRight: 40,
              transform: `translateY(${bodyUp}px)`,
              opacity: bodyOpacity,
            }}
          >
            {shownBody}
          </div>
        </div>
      </div>

      {/* ── 푸터: 전 씬 공통(로고 + 주소) — 아래 빈 공간을 브랜드로 채운다. ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Img src={staticFile('reels/logo/logo-kr.webp')} style={{ height: 58 }} />
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 34,
            color: '#B08268',
            letterSpacing: 1,
          }}
        >
          tangobook.co.kr
        </div>
      </div>
    </AbsoluteFill>
  );
};
