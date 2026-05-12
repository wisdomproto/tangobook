# 한글 블록 게임 튜토리얼 (호리 시연) — Design

**Date**: 2026-05-12
**Owner**: kil210
**Scope**: 한글 블록 게임 (쉬움 레벨) 에 호리 마스코트가 시연하는 튜토리얼 추가

## 배경 / 문제

쉬움 레벨은 1-2 음절 받침 없는 단어 위주 (예: 가, 구두, 나무). 4-5세 아이가 처음 게임에 진입했을 때:
- 어떤 자모를 골라야 하는지 모름
- 어디에 놓아야 하는지 모름 (가로 vs 세로 배치)
- 자모-음절 결합 규칙 자체를 학습 중

기존 UI 는 자유 placement 만 제공 — 아이가 무작위로 시도하며 실패하면 흥미 잃기 쉬움.

## 목표

쉬움 레벨에서 호리 마스코트가 정답 자모를 패널에서 그리드로 옮기는 과정을 **시연만** 해서, 아이가 보고 따라할 수 있게 한다.

**비목표 (Out of scope)**:
- 자동 placement (호리가 시연하지만 그리드는 빈 상태 유지 — 아이가 직접 드래그)
- 보통/어려움 레벨 — 추후 결정
- 받침 시연 — Easy 에 받침 없으므로 미고려

## 사용자 흐름

1. 쉬움 레벨 게임 진입 → 단어 카드에 "🪄 도와줘" 버튼 보임
2. 아이가 버튼 누름 → 호리가 우하단에 등장, 인사 ("안녕! 같이 만들어 볼까?")
3. 단어 글자 순서대로 시연:
   - 패널의 정답 자모 타일 튀어오름 (호리: "이거!")
   - 자모 타일 → 그리드 셀로 화살표 슬라이드
   - 그리드 셀 빛남 (호리: "여기에!")
4. 마지막 음절 완료 시 — 호리: "잘했어! 완성!"
5. 종료 — 호리: "이제 네 차례야!" → 호리/말풍선/화살표 사라짐, 버튼 다시 활성
6. 아이가 직접 자모를 드래그해서 단어 완성

**재생 중 인터랙션 차단**: 패널/그리드/확인/초기화/버튼 모두 비활성 (아이가 헷갈리지 않도록).

## 디자인 결정

### 1) 노출 / 트리거

| 항목 | 결정 |
|------|------|
| 노출 difficulty | 쉬움 only (보통/어려움 = 버튼 숨김) |
| 트리거 | 사용자 클릭 (자동재생 X) |
| 버튼 위치 | Section 1 (단어 카드 안), 단어 hero 오른쪽 |
| 버튼 라벨 | "🪄 도와줘" |
| 재생 중 버튼 | disabled, 끝나면 다시 활성 |

### 2) 시퀀스 / 타이밍

글자 = cho 또는 jung 단위 (Easy 받침 없음). 음절당 2 글자.

```
INTRO     (1.2s)  호리 등장 + 멘트
─ per 글자 (N회 반복) ─
  POP   (0.5s)   필요 자모 패널 타일: scale 1→1.3→1.1, wiggle, 코랄 글로우 + "이거!"
  ARROW (0.6s)   자모 중심 → 셀 중심 SVG 곡선 + arrowhead, motion path, 무음
  PLACE (0.5s)   그리드 셀: ring-coral, scale 1.1 + "여기에!"
─────────────────
SYLL_DONE (0.6s)  마지막 음절 완성 후 멘트 (한 번)
END       (1.3s)  호리 멘트 + 사라짐
```

**총 소요**:
- 가 (1음절, 2글자) ≈ 6.3s
- 나무 (2음절, 4글자) ≈ 9.5s

### 3) 셀 위치 규칙 (canonical layout)

단어 `decomposeWord` → 음절 배열. 각 음절 jung 이 수직(`ㅗㅛㅜㅠㅡ`) 인지 수평인지로 좌→우 진행.

```ts
const VERT_JUNG = new Set(['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']);

function planLayout(word: string): Array<{
  cho: [row: number, col: number];
  jung: [row: number, col: number];
}> {
  const syllables = decomposeWord(word);
  const plan = [];
  let col = 0;
  for (const syl of syllables) {
    if (VERT_JUNG.has(syl.jung)) {
      plan.push({ cho: [1, col], jung: [2, col] });
      col += 1;
    } else {
      plan.push({ cho: [1, col], jung: [1, col + 1] });
      col += 2;
    }
  }
  return plan;
}
```

**그리드 사용 검증**:
- 가 (수평): 사용 셀 (1,0)(1,1). 끝나는 col 2. OK
- 구 (수직): (1,0)(2,0). col 1. OK
- 나무 (수평+수직): (1,0)(1,1)(1,2)(2,2). col 3. OK (6 col 안)
- 구두 (수직+수직): (1,0)(2,0)(1,1)(2,1). col 2. OK
- 토끼 (수평 ㅗ는 vert, 수평 ㅣ는 horiz):
  - 토: ㅌ+ㅗ (vert) → (1,0)(2,0)
  - 끼: ㄲ+ㅣ (horiz) → (1,1)(1,2)
  - col 3. OK

기존 `parseSpatialKorean` 가 이 layout 을 합당 음절로 인식 — 좌→우 스캔, 수평 jung 우측 / 수직 jung 아래.

### 4) 호리 + 오디오 + 말풍선

| 항목 | 결정 |
|------|------|
| 호리 위치 | 화면 **우하단 floating** (fixed) |
| 호리 컴포넌트 | 기존 `<Mascot character="hori" state="..." />` (`@/design-system`) |
| 상태 전환 | INTRO `waving` → 시연 중 `pointing` → END `pointing` (cheering 없으므로) |
| 말풍선 | 호리 **좌측** wash 카드, CSS triangle 꼬리 우측 |
| 말풍선 스타일 | `bg-white/95 rounded-3xl shadow-pop px-5 py-3 text-xl font-display font-black text-ink-900` |
| 말풍선 애니 | pop-in `scale 0.8→1 + opacity 0→1` (0.2s) → 다음 멘트 시 즉시 텍스트 교체 + 재pop |
| 종료 시 | END 멘트 끝 → 호리/말풍선/화살표 fade out (0.3s) → 사라짐 |

**멘트 텍스트 + 음성**:

| Clip | 말풍선 텍스트 | 음성 파일 |
|------|------------|---------|
| INTRO | 안녕! 같이 만들어 볼까? | `hori-intro.mp3` |
| POP | 이거! | `hori-pop.mp3` |
| PLACE | 여기에! | `hori-place.mp3` |
| SYLL_DONE | 잘했어! 완성! | `hori-syllable-done.mp3` |
| END | 이제 네 차례야! | `hori-end.mp3` |

**음성 파일 경로**: `packages/client/public/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3`

**텍스트는 코드 상수** (`TUTORIAL_LINES` 상수 객체) — 음성 mp3 없거나 fetch 실패해도 말풍선은 표시 (graceful degradation). 4-5세 못 읽어도 호리가 "말하는" 시각적 단서 제공.

**TTS 가이드 (사용자가 생성)**:
- 4-5세 친구 톤, 활기차고 따뜻
- 어미 부드럽게 (~까? ~야!)
- 명랑한 어린이 보이스

### 5) 화살표 (Arrow)

- 풀스크린 SVG overlay: `<svg className="fixed inset-0 z-[80] pointer-events-none" />`
- 자모 패널 타일과 그리드 셀의 `getBoundingClientRect()` 로 좌표 계산
- `<path>` Quadratic Bézier 곡선 (살짝 위로 볼록) + `<marker>` arrowhead (코랄)
- framer-motion: `strokeDasharray` + `strokeDashoffset` 0→0 으로 그려지는 효과
- 색: `stroke-coral-500 stroke-[4px]`
- ARROW step (0.6s) 동안 그려지고 PLACE step 동안 셀 위에 잔존, 다음 글자 POP 시작 시 fade out (0.15s)

**Edge case**: 모바일 가로 작은 viewport 에서 셀이 작아도 화살표는 좌표 기반이라 자연스럽게 따라감.

### 6) 인터랙션 차단

재생 중 (`isPlaying === true`):
- 자모 타일: `draggable={false}`, `cursor-not-allowed`, `pointer-events-none`
- 그리드 셀: onClick/onDrop 핸들러 no-op (`isPlaying && return`)
- 확인/초기화 버튼: `disabled={isPlaying}`
- 도와줘 버튼: `disabled={isPlaying}`

재생 끝나면 모든 비활성 해제. 그리드는 **빈 상태** 유지 (튜토리얼은 시연만).

### 7) State Machine

```ts
type TutorialPhase =
  | { kind: 'idle' }
  | { kind: 'intro' }
  | { kind: 'playing'; charIdx: number; subStep: 'pop' | 'arrow' | 'place' }
  | { kind: 'syllable-done' }  // 마지막 음절 후 멘트 표시 동안
  | { kind: 'end' };

// 전이:
// idle → intro (버튼 클릭)
// intro → playing(0, 'pop') (1.2s 후)
// playing(i, 'pop') → playing(i, 'arrow') (0.5s)
// playing(i, 'arrow') → playing(i, 'place') (0.6s)
// playing(i, 'place'):
//   if i < N-1: → playing(i+1, 'pop')           (0.5s)
//   else: → syllable-done                       (0.5s)
// syllable-done → end                           (0.6s)
// end → idle                                    (1.3s + 0.3s fade)
```

**구현 노트**: 단일 `phase` state + `useEffect` setTimeout 체인. 각 step 마다 cleanup 이 cancel.

### 8) 컴포넌트 / 파일 구조

새 파일:
- `packages/client/src/features/games/components/players/KoreanBlockTutorial.tsx` — 호리 마스코트 + 말풍선 + 화살표 SVG + state machine. KoreanBlockPlayer 에서 prop 으로 `gameItem.word` 받음.
- `packages/client/public/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3` — 음성 파일 (사용자 제공 예정)

수정:
- `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`:
  - 도와줘 버튼 추가 (단어 카드 안, 쉬움 difficulty 일 때만)
  - `isPlaying` state — KoreanBlockTutorial 의 콜백으로 갱신
  - 패널/그리드/확인/초기화 disabled 조건에 `isPlaying` 추가
  - 라운드 진입 시 `isPlaying = false` 자동 리셋

- `packages/client/src/pages/RandomBlockGamePage.tsx`:
  - 현재 `difficulty` 정보를 KoreanBlockPlayer 에 prop 으로 전달 (현재는 단어 풀만 전달)
  - 또는 `gameData` 타입에 `difficulty` 필드 추가

타입 확장:
- `KoreanBlockData` (in `@tangobook/shared`) 에 `difficulty?: 'easy' | 'medium' | 'hard'` 추가 (optional, 하위호환)

### 9) 그리드/패널 좌표 측정

화살표가 좌표 계산하려면 자모 패널 타일 위치 + 그리드 셀 위치 알아야 함.

**접근**:
- 자모 패널 타일: `BlockTile` 에 `data-jamo={char}` 추가 → `querySelector('[data-jamo="ㄱ"]')`
- 그리드 셀: 이미 `data-row data-col` 없으면 추가 (또는 ref array 활용)

`KoreanBlockTutorial` 내부 `useLayoutEffect` 에서 ref 로 좌표 측정 후 SVG path 좌표 계산.

### 10) 접근성 / 디그레이드

- 음성 mp3 없으면: 말풍선만 표시 (텍스트로 시각 단서 제공)
- `prefers-reduced-motion`: pop/wiggle 애니메이션 단순화 (scale 만)
- 키보드 사용자: 도와줘 버튼 Enter/Space 지원 (button 기본)

### 11) 테스트 시나리오

수동 검증:
1. 쉬움 진입 → 도와줘 버튼 보임
2. 보통/어려움 진입 → 도와줘 버튼 안 보임
3. 1음절 가로 (가) — 화살표 1개 (cho), 1개 (jung) 표시, 셀 (1,0)(1,1)
4. 1음절 세로 (구) — 셀 (1,0)(2,0)
5. 2음절 (나무) — 4 step, 셀 (1,0)(1,1)(1,2)(2,2)
6. 2음절 세로/수평 혼합 (토끼) — (1,0)(2,0)(1,1)(1,2)
7. 재생 중 모든 인터랙션 차단 확인
8. 재생 끝 → 버튼 활성, 그리드 빈 상태, 사용자 직접 드래그 가능
9. 음성 mp3 미존재 시 말풍선만 표시되는지
10. 라운드 전환 시 튜토리얼 state 자동 reset

자동 테스트 (선택): vitest + react-testing-library 로 `KoreanBlockTutorial` 의 state machine 검증.

### 12) 추후 확장 (이번 scope X)

- 받침 시연 (보통 레벨) — 받침 셀 위치 규칙 추가 필요
- 호리 음성 variation (POP/PLACE 여러 버전 랜덤)
- 단어별 맞춤 멘트 ("이 단어는 '나무' 야!")
- 보통/어려움 도 활성화 후 단어별 노출 빈도 조정

## 위험 / Open Questions

- **호리 위치 우하단**: 자모 패널과 시각적 겹침 가능. 패널 위로 floating z-index 처리 필요. 실 화면에서 확인.
- **화살표 곡선**: 자모 패널 (하단) → 그리드 (중단) 으로 위쪽으로 가는 화살표. 곡선 control point 조정 필요 — 실 측정 후 결정.
- **mp3 없을 때 graceful**: 현재 디자인은 OK 가정. 실 mp3 등록 전이라도 말풍선 + 시각 시퀀스로 동작.
