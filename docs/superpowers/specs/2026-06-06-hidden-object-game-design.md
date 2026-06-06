# 숨은그림 찾기 게임 설계 (Hidden Object — find-all)

작성일: 2026-06-06

## 1. 개요 / 목적

동화책마다 그 책의 **어휘 사물(keyObject)** 이 한 장면에 숨어 있는 AI 생성 씬을 만들고,
학습자가 **찾을 단어 체크리스트**(키오브젝트 썸네일 + 단어 라벨)를 보며 장면에서 하나씩 탭해
모두 찾으면 보상받는 "전부 찾기형(I Spy)" 게임을 추가한다.

- **씬 생성 방식**: AI 통짜 씬 (Nano Banana Pro). 책의 키오브젝트 PNG 를 레퍼런스로 투입해
  그림체·정체성을 고정한 한 장의 cohesive scene 을 생성.
- **정답 위치**: 저작자가 **수동 마킹**(생성된 씬 위에 박스 드래그).
- **플레이**: 전부 찾기형. 단어 제시형(quiz) 아님.
- **저작 위치**: `/editor2` 통합 (그림체별 자산 흐름과 일치).

### 비결정성 우회 (A 방식의 약점 해소)
AI 통짜 씬은 사물을 빼먹거나 중복·오묘하게 그릴 수 있다. 이를
**"체크리스트 = 저작자가 실제로 마킹한 것"** 으로 우회한다. AI 가 요청한 목록 중 일부만
제대로 그렸다면 저작자는 잘 그려진 것만 박스를 친다. 누락/오류가 게임 플레이에 영향 0.
재생성은 저작자 판단(품질 나쁘면 다시 생성).

## 2. 데이터 모델 (`packages/shared/src/types/storybook.ts`)

```ts
interface HiddenObjectHotspot {
  objectName: string;   // keyObjectImages[].objectName 과 매칭 → 썸네일/번역 재활용
  x: number; y: number; // 정규화 0~1 (씬 이미지 좌상단 기준 박스 좌상단)
  w: number; h: number; // 정규화 0~1 박스 크기
}

interface HiddenObjectScene {
  id: string;            // 'hobj_' + timestamp
  sceneImageUrl: string; // R2 url
  theme?: string;        // 'forest' | 'room' | ... (프롬프트 힌트, 표시용)
  artStyle?: string;     // 생성 당시 그림체 (디버그/추적용)
  hotspots: HiddenObjectHotspot[];
}
```

저장 위치 (기존 자산 패턴 그대로):
- `StyleAssets.hiddenObjectScenes?: HiddenObjectScene[]` — **그림체별 정본**
- `Storybook.hiddenObjectScenes?: HiddenObjectScene[]` — **활성 그림체 미러**(top-level 스냅샷)
- `switchStyleAssets(draft, newStyle)` (`features/editor/lib/style-assets.ts`) 의
  swap 목록에 `hiddenObjectScenes` 추가 → 그림체 전환 시 함께 이동/복원.

모두 optional → R2 기존 211권 호환 유지.

단어 라벨 다국어: `KeyObject.nameTranslations` 를 objectName 으로 resolve (별도 번역 필드 신설 X).

## 3. 생성 파이프라인 (server)

신규 서비스 `packages/server/src/services/hidden-object.service.ts`
라우트 `POST /api/storybooks/:id/hidden-object/generate`

요청 body: `{ artStyle, targetObjectNames: string[], theme?: string }`

- 프롬프트: `[그림체] 스타일의 [테마] 장면. 다음 사물들을 장면 곳곳에 자연스럽게 숨겨라:
  [objectName 목록]. 글자/라벨 없음. 유아 친화. 붐비되 각 사물이 찾을 수 있게 가독성 유지.`
- 레퍼런스 이미지: 선택된 keyObject PNG 들을 `referenceImages[]` 로 투입(정체성·그림체 고정).
- aspectRatio: `16:9` (풀스크린 가로 게임).
- 결과 → R2 업로드 `{storybookId}-hiddenobj-{sceneId}-{ts}.png` (`buildR2Key` 규칙).
- 응답: `{ sceneId, sceneImageUrl }`. **hotspots 는 빈 채로 반환** (저작자가 다음 단계에서 마킹).

권장 subset 크기: **6~10개**. 그 이상은 4~5세 가독성 붕괴 → UI 에서 상한 가이드.

## 4. 저작 UI — `/editor2` 통합

`EditorContent` 에 신규 탭 **"숨은그림"** 추가 (KeyObjectTab/GamesTab 와 동급으로 등록).
`EditorLangContext` / 활성 그림체를 자동 추종 (PagesTab/KeyObjectTab 패턴 동일).

신규 컴포넌트: `features/editor/components/HiddenObjectTab.tsx`

흐름:
1. 활성 그림체의 keyObjectImages 목록 표시 → 타깃 subset 체크(6~10 권장, 상한 안내).
2. 테마 힌트 입력(선택) → **"AI 씬 생성"** 버튼 → generate API 호출 → 캔버스에 씬 등장.
3. 캔버스 위에서 각 사물에 **박스 드래그**(라벨 = objectName 드롭다운/칩). AI 가 안 그린 사물은 스킵.
4. **저장** → 활성 그림체 `StyleAssets.hiddenObjectScenes` + top-level 미러에 persist.
5. 책당 **여러 씬** 생성/관리(씬 리스트 + 삭제).

마킹 캔버스: 정규화 박스 드래그(생성·이동·리사이즈·삭제). object-fit `contain` 좌표 변환 유틸 공유.

## 5. 게임 플레이어 (client)

신규 `features/games/components/players/HiddenObjectPlayer.tsx`
등록 `features/games/registry/games/hidden-object.register.ts`

```ts
registerGame({
  id: 'hidden-object',
  category: 'storybook',
  nameKo: '숨은그림 찾기',
  icon: '🔍',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsKeyObjectImages: true,    // 체크리스트 썸네일
    needsHiddenObjectScenes: true, // 신규 플래그 (씬 1개+ 존재)
  },
  defaultConfig: { ... },
  ConfigPanel: HiddenObjectConfigPanel,
  PlayerComponent: HiddenObjectPlayer,
});
```

- 레이아웃: `GamePlayerLayout` 풀스크린. 씬 이미지 object-fit `contain` 으로 꽉 채움.
- **체크리스트 레일**: 가로모드 하단(모바일) / 측면(데스크탑). 남은 타깃 = 키오브젝트 썸네일 + 단어.
  칩 탭 시 단어 TTS(`obj.ttsUrl`/`ttsUrls[lang]`).
- 탭 판정: 씬 탭 좌표 → object-fit 레터박스 보정 → 미발견 핫스팟 박스 히트테스트.
  - 적중: framer-motion 링/펄스 하이라이트 + 단어 TTS → 정답 차임 → 레일 체크 처리.
    (TTS 체인은 `playAudio(url, onEnded)` 콜백 방식, setTimeout 금지 — games CLAUDE.md 규칙.)
  - 빗나감: 페널티 없음. 가벼운 무반응 또는 부드러운 "다시" (유아 정책).
- 진행: `GameProgressBar` (found/total). 전부 발견 → `GameResultScreen` + confetti + 별 보상(기존 인프라).
- 재사용: `FeedbackOverlay` · `useGameSound` · 시스템 사운드 · `MobileLandscapeGate`.
- `HiddenObjectTutorial` (선택, MVP 후순위): 호리 "사물을 찾아 탭해봐!".
- `prefers-reduced-motion` 존중(기존 패턴).

## 6. 게임 데이터 어댑터

`features/games/lib/game-data-adapter.ts` 에 `storybook → HiddenObjectGameData`:
- 활성 그림체의 `hiddenObjectScenes` 에서 씬 선택(랜덤 또는 순차).
- 핫스팟 배열 + 체크리스트 구성: 각 hotspot.objectName 으로
  keyObjectImages 썸네일 resolve + lang 별 라벨(nameTranslations).
- 이미지 누락 시 폴백(이모지/플레이스홀더) — 기존 어댑터 폴백 패턴 준수.

## 7. 타입/등록 변경 요약

- `shared`: `HiddenObjectHotspot`, `HiddenObjectScene`, `StyleAssets.hiddenObjectScenes`,
  `Storybook.hiddenObjectScenes`, GameTypeId 에 `'hidden-object'` 추가,
  GameConfig/GameData 유니온에 hidden-object variant.
- `contentRequirements` 에 `needsHiddenObjectScenes?: boolean` 추가 + 가용성 판정 로직.
- `style-assets.ts`: swap 목록에 `hiddenObjectScenes` 포함.
- server: hidden-object.service + route 등록.

## 8. 테스트

- **유닛**:
  - object-fit `contain` 좌표 변환 + 정규화 박스 히트테스트(레터박스 경계 케이스 포함).
  - 어댑터: 씬 → GameData, 썸네일 resolve, 이미지 누락 폴백, 다국어 라벨.
  - `switchStyleAssets`: hiddenObjectScenes swap 왕복 보존.
- **수동(브라우저, preview 도구)**:
  - 실제 책 1권으로 editor2 에서 씬 생성 → 마킹 → 저장.
  - 게임 플레이: 여러 뷰포트/비율에서 탭 정확도, 보상 체인, 별 적립 검증.

## 9. 범위 밖 (YAGNI)

- 틀린그림 찾기(추후 별도 spec — 생성 파이프라인 다름).
- 단어 제시형("여우 찾아봐") 모드.
- 자동 객체 검출(ML)로 핫스팟 자동 생성.
- 어휘 삽화 3D 회전 연출(별도 아이디어, 보류).
- 학습자 화면 노출: 동화책 axis MVP 정책 따름(게임 카드로 노출 시점은 추후 결정).

## 10. 구현 순서(요약)

1. shared 타입 + contentRequirements 플래그.
2. server 생성 서비스 + 라우트.
3. editor2 HiddenObjectTab(생성 + 마킹 캔버스) + style-assets swap.
4. 게임 어댑터 + HiddenObjectPlayer + registry 등록.
5. 유닛 테스트 + 수동 검증.
