# 숨은그림 찾기 게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화책마다 AI 통짜 씬에 그 책 어휘 사물을 숨기고, 학습자가 체크리스트의 단어를 장면에서 모두 찾는 "전부 찾기형" 숨은그림 게임을 추가한다.

**Architecture:** 씬은 `/editor2` 신규 "숨은그림" 탭에서 AI 생성(Nano Banana Pro, 키오브젝트 PNG 레퍼런스) + 저작자가 캔버스에서 핫스팟 박스를 수동 마킹 → 그림체별 자산(`StyleAssets.hiddenObjectScenes`)으로 저장. 게임은 기존 등록 시스템(`features/games/registry`)에 끼우고, 서버 generator 가 저장된 씬을 `HiddenObjectData` 로 변환, `HiddenObjectPlayer` 가 object-fit 보정 히트테스트로 탭을 판정한다. 보상/사운드는 기존 인프라(`useGameAudio`/`GameResultScreen`/`FeedbackOverlay`) 재활용.

**Tech Stack:** TypeScript monorepo (pnpm), React 18 + framer-motion + vitest (client), Express 5 (server), Google Gemini 이미지 생성, Cloudflare R2.

**참조 spec:** [docs/superpowers/specs/2026-06-06-hidden-object-game-design.md](../specs/2026-06-06-hidden-object-game-design.md)

**범위 메모:** 학습자 화면 노출(라이브러리/어휘 카드 surfacing)은 spec 상 범위 밖. 본 계획은 저작(editor2) + 게임 등록/생성 + 플레이어 + 미리보기(GamesTab)까지 완성한다. 다국어 라벨은 ko 기본(`korean||name`)으로 MVP, 언어 전환은 follow-up.

---

## Task 1: shared 타입 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts`

`GameTypeId` 유니온, `GameConfig`/`GameData` 유니온, `StyleAssets`, `Storybook` 에 숨은그림 타입을 추가한다. 기존 동작 변경 없음(모두 신규/optional).

- [ ] **Step 1: GameTypeId 에 'hidden-object' 추가**

`packages/shared/src/types/storybook.ts` 의 `GameTypeId`(라인 305~316) 마지막 항목 뒤에 추가:

```ts
export type GameTypeId =
  | 'connect-the-dots'
  | 'korean-block'
  | 'english-block'
  | 'korean-word-writing'
  | 'english-word-writing'
  | 'korean-speaking'
  | 'english-speaking'
  | 'korean-line-matching'
  | 'english-line-matching'
  | 'korean-story-image'
  | 'english-story-image'
  | 'hidden-object';
```

- [ ] **Step 2: GameConfig / GameData 유니온에 추가**

`GameConfig`(라인 340~350) 와 `GameData`(라인 353~363) 유니온 끝에 각각 추가:

```ts
export type GameConfig =
  | WordWritingConfig
  | ConnectTheDotsConfig
  | KoreanBlockConfig
  | EnglishBlockConfig
  | KoreanSpeakingConfig
  | EnglishSpeakingConfig
  | KoreanLineMatchingConfig
  | EnglishLineMatchingConfig
  | KoreanStoryImageConfig
  | EnglishStoryImageConfig
  | HiddenObjectConfig;

export type GameData =
  | WordWritingData
  | ConnectTheDotsData
  | KoreanBlockData
  | EnglishBlockData
  | KoreanSpeakingData
  | EnglishSpeakingData
  | KoreanLineMatchingData
  | EnglishLineMatchingData
  | KoreanStoryImageData
  | EnglishStoryImageData
  | HiddenObjectData;
```

- [ ] **Step 3: 숨은그림 Config/Data 타입 정의**

`EnglishStoryImageData`(라인 544~547) 정의 바로 뒤, `// === 기존 타입 ===` (라인 549) 앞에 삽입:

```ts
// --- 숨은그림 찾기 (전부 찾기형) ---

/** 씬 이미지 안에서 한 사물의 위치 (정규화 0~1 박스, 씬 이미지 좌상단 기준). */
export interface HiddenObjectHotspot {
  objectName: string; // KeyObject.name (영어 canonical) 과 매칭
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 저작자가 만든 숨은그림 씬 1장 (그림체별 자산으로 저장). */
export interface HiddenObjectScene {
  id: string; // 'hobj_' + timestamp
  sceneImageUrl: string;
  theme?: string;
  artStyle?: string; // 생성 당시 그림체 (추적용)
  hotspots: HiddenObjectHotspot[];
}

export interface HiddenObjectConfig {
  type: 'hidden-object';
  /** 한 게임에 포함할 씬 수 (책에 저장된 씬 중 랜덤 선택). 기본 1. */
  sceneCount: number;
}

/** 플레이어에 전달되는, 라벨/썸네일/TTS 가 resolve 된 타깃. */
export interface HiddenObjectTarget {
  objectName: string;
  label: string;
  thumbnailUrl?: string;
  ttsUrl?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HiddenObjectGameScene {
  sceneImageUrl: string;
  targets: HiddenObjectTarget[];
}

export interface HiddenObjectData {
  type: 'hidden-object';
  scenes: HiddenObjectGameScene[];
}
```

- [ ] **Step 4: StyleAssets 에 hiddenObjectScenes 추가**

`StyleAssets`(라인 738~772) 의 `vocabularyImages?` 필드(라인 771) 바로 뒤에 추가:

```ts
  /** 어휘 이미지 */
  vocabularyImages?: VocabularyImage[];
  /** 숨은그림 찾기 씬 (그림체별로 다른 장면) */
  hiddenObjectScenes?: HiddenObjectScene[];
}
```

- [ ] **Step 5: Storybook 에 top-level 미러 필드 추가**

`Storybook` 의 `vocabularyImages?`(라인 883) 바로 뒤에 추가:

```ts
  vocabularyImages?: VocabularyImage[];
  /** 숨은그림 찾기 씬 (활성 그림체 미러. 정본은 styleAssets[style].hiddenObjectScenes). */
  hiddenObjectScenes?: HiddenObjectScene[];
```

- [ ] **Step 6: 빌드 + 타입체크**

Run: `pnpm --filter shared build && pnpm --filter shared typecheck`
Expected: PASS (에러 없음)

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "feat(shared): 숨은그림 찾기 게임 타입 추가"
```

---

## Task 2: style-assets 그림체 swap 에 hiddenObjectScenes 포함

**Files:**
- Modify: `packages/client/src/features/editor/lib/style-assets.ts`
- Test: `packages/client/src/features/editor/lib/style-assets.test.ts` (Create)

그림체 전환 시 씬도 함께 스냅샷/복원되도록 swap 헬퍼를 확장한다. TDD.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `packages/client/src/features/editor/lib/style-assets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { switchStyleAssets } from './style-assets';
import type { Storybook, HiddenObjectScene } from '@tangobook/shared';

function baseBook(): Storybook {
  return {
    id: 'b1',
    title: 't',
    targetAge: '4-5',
    artStyle: 'styleA',
  } as Storybook;
}

const sceneA: HiddenObjectScene = {
  id: 'hobj_1',
  sceneImageUrl: 'https://r2/a.png',
  hotspots: [{ objectName: 'fox', x: 0.1, y: 0.1, w: 0.2, h: 0.2 }],
};

describe('switchStyleAssets — hiddenObjectScenes', () => {
  it('현재 그림체의 씬을 스냅샷하고, 새 그림체로 전환 시 top-level 을 비운다', () => {
    const book = baseBook();
    book.hiddenObjectScenes = [sceneA];

    switchStyleAssets(book, 'styleB');

    expect(book.artStyle).toBe('styleB');
    // styleA 자산에 보관됨
    expect(book.styleAssets?.styleA?.hiddenObjectScenes).toEqual([sceneA]);
    // 새 그림체는 씬 없음 → top-level 비워짐
    expect(book.hiddenObjectScenes).toBeUndefined();
  });

  it('왕복 전환 시 원래 씬이 복원된다', () => {
    const book = baseBook();
    book.hiddenObjectScenes = [sceneA];

    switchStyleAssets(book, 'styleB'); // A→B
    switchStyleAssets(book, 'styleA'); // B→A

    expect(book.artStyle).toBe('styleA');
    expect(book.hiddenObjectScenes).toEqual([sceneA]);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm --filter client test -- style-assets`
Expected: FAIL (`hiddenObjectScenes` 가 snapshot/apply 에 없어 undefined / 복원 안 됨)

- [ ] **Step 3: snapshotCurrentStyleAssets 에 추가**

`packages/client/src/features/editor/lib/style-assets.ts` 의 `snapshotCurrentStyleAssets` return(라인 62~73) 의 `vocabularyImages` 뒤에 추가:

```ts
  return {
    coverImages: sb.coverImages,
    coverImage: sb.coverImage,
    coverPrompt: sb.coverPrompt,
    coverImageHistory: sb.coverImageHistory,
    coverCharacterRefs: sb.coverCharacterRefs,
    primaryCoverByLang: sb.primaryCoverByLang,
    characterImages,
    pageIllustrations,
    keyObjectImages: sb.keyObjectImages,
    vocabularyImages: sb.vocabularyImages,
    hiddenObjectScenes: sb.hiddenObjectScenes,
  };
```

- [ ] **Step 4: applyStyleAssets 에 추가**

같은 파일 `applyStyleAssets` 의 마지막(라인 111~113) `sb.vocabularyImages = assets?.vocabularyImages;` 뒤에 추가:

```ts
  // 핵심사물 / 어휘 이미지
  sb.keyObjectImages = assets?.keyObjectImages;
  sb.vocabularyImages = assets?.vocabularyImages;
  sb.hiddenObjectScenes = assets?.hiddenObjectScenes;
}
```

- [ ] **Step 5: 테스트 실행 → 통과 확인**

Run: `pnpm --filter client test -- style-assets`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/editor/lib/style-assets.ts packages/client/src/features/editor/lib/style-assets.test.ts
git commit -m "feat(editor): 그림체 전환 시 숨은그림 씬 swap 포함"
```

---

## Task 3: 서버 — 숨은그림 씬 이미지 생성

**Files:**
- Modify: `packages/server/src/services/image.service.ts`
- Modify: `packages/server/src/controllers/image.controller.ts`
- Modify: `packages/server/src/routes/image.routes.ts`

editor2 "AI 씬 생성" 버튼이 호출할 엔드포인트. 키오브젝트 PNG 를 레퍼런스로 통짜 씬 1장을 생성해 R2 에 업로드, URL 반환. 핫스팟은 빈 채.

- [ ] **Step 1: ImageService.generateHiddenObjectScene 추가**

`packages/server/src/services/image.service.ts` 의 `generateKeyObject`(라인 399~425) 뒤에 메서드 추가. (`urlToBase64`, `generateImageWithGemini`, `buildR2Key`, `R2Repository.uploadImage`, `IMAGE_SYSTEM_INSTRUCTION` 는 같은 파일에 이미 존재):

```ts
  async generateHiddenObjectScene(req: {
    storybookId: string;
    storybookTitle: string;
    artStyle: string;
    theme?: string;
    objects: { name: string; imageUrl?: string }[];
    model?: string;
  }): Promise<string> {
    const { storybookId, storybookTitle, artStyle, theme, objects, model } = req;
    if (objects.length === 0) {
      throw new AppError(400, '숨길 사물을 1개 이상 선택해주세요.');
    }

    const objectNames = objects.map((o) => o.name).join(', ');
    const themeLine = theme?.trim()
      ? `Scene setting: ${theme.trim()}.`
      : 'Scene setting: a rich, child-friendly environment that fits these objects.';

    const prompt = `Draw a single busy "hidden object" / "I Spy" scene in this art style: ${artStyle}.
${themeLine}
Naturally place and partially camouflage ALL of the following objects throughout the scene so a young child can find them by looking carefully: ${objectNames}.
The objects must be recognizable but blended into the environment (behind, beside, or among other elements) — not floating or pasted.
The scene should be visually rich but readable for ages 4-7. No text, letters, numbers, or labels anywhere.
Aspect ratio 16:9, horizontal composition.`;

    // 키오브젝트 PNG 를 레퍼런스로 → 그림체/정체성 고정 (최대 6장)
    const refImages: Array<{ base64: string; mimeType: string }> = [];
    for (const obj of objects.slice(0, 6)) {
      if (!obj.imageUrl) continue;
      const img = await urlToBase64(obj.imageUrl);
      if (img) refImages.push(img);
    }

    const base64 = await generateImageWithGemini({
      prompt:
        refImages.length > 0
          ? `${prompt}\n\nREFERENCE: Images of the objects to hide are provided. Match their identity and the book's art style exactly.`
          : prompt,
      referenceImages: refImages,
      systemInstruction: IMAGE_SYSTEM_INSTRUCTION,
      aspectRatio: '16:9',
      model,
    });

    const key = buildR2Key({
      storybookId,
      storybookTitle,
      fileType: 'hiddenobj',
      identifier: `scene-${Date.now()}`,
      extension: 'webp',
    });
    return R2Repository.uploadImage(base64, key);
  },
```

- [ ] **Step 2: image.controller.ts 에 핸들러 추가**

먼저 기존 핸들러 시그니처 패턴 확인:

Run: `grep -n "generateKeyObject" packages/server/src/controllers/image.controller.ts`
Expected: `generateKeyObject` async 핸들러 정의 라인 출력

해당 핸들러 본문을 열어 패턴(요청 body 파싱 → `ImageService.generateX` 호출 → `res.json({ success: true, data: ... })`)을 그대로 따라, `image.controller.ts` 의 `ImageController` 객체에 새 핸들러 추가:

```ts
  generateHiddenObjectScene: asyncHandler(async (req, res) => {
    const { storybookId, storybookTitle, artStyle, theme, objects, model } = req.body as {
      storybookId: string;
      storybookTitle: string;
      artStyle: string;
      theme?: string;
      objects: { name: string; imageUrl?: string }[];
      model?: string;
    };
    if (!storybookId || !artStyle || !Array.isArray(objects)) {
      throw new AppError(400, 'storybookId, artStyle, objects 가 필요합니다.');
    }
    const imageUrl = await ImageService.generateHiddenObjectScene({
      storybookId,
      storybookTitle: storybookTitle ?? '',
      artStyle,
      theme,
      objects,
      model,
    });
    res.json({ success: true, data: { imageUrl } });
  }),
```

> 주의: 파일 상단 import 에 `asyncHandler`, `AppError`, `ImageService` 가 이미 있는지 확인하고 없으면 기존 핸들러와 동일하게 import. (`generateKeyObject` 가 쓰는 것과 동일.)

- [ ] **Step 3: 라우트 등록**

`packages/server/src/routes/image.routes.ts` 의 `router.post('/key-object', ...)`(라인 12) 뒤에 추가:

```ts
router.post('/key-object', ImageController.generateKeyObject);
router.post('/hidden-object-scene', ImageController.generateHiddenObjectScene);
```

- [ ] **Step 4: 타입체크**

Run: `pnpm --filter server typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/image.service.ts packages/server/src/controllers/image.controller.ts packages/server/src/routes/image.routes.ts
git commit -m "feat(server): 숨은그림 씬 AI 생성 엔드포인트"
```

---

## Task 4: 서버 — 숨은그림 게임 데이터 generator

**Files:**
- Modify: `packages/server/src/services/game.service.ts`
- Test: `packages/server/src/services/game.service.test.ts`

저장된 씬을 `HiddenObjectData` 로 변환. 라벨/썸네일/TTS 를 `key_objects` + `keyObjectImages` 에서 objectName 으로 resolve. TDD.

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/server/src/services/game.service.test.ts` 파일 끝에 `describe` 블록을 추가한다. (이 함수는 순수 변환이므로 export 해서 직접 테스트.) 단, `import` 는 파일 **상단 import 블록에 병합**한다 — `Storybook`/`describe`/`it`/`expect` 가 이미 import 돼 있으면 중복 선언 에러가 나므로, 없는 것만 추가:

```ts
// 상단 import 블록에 병합 (이미 있으면 생략)
import { buildHiddenObjectData } from './game.service.js';
import type { HiddenObjectConfig } from '@tangobook/shared';
```

```ts
// 파일 끝에 추가
describe('buildHiddenObjectData', () => {
  const book = {
    id: 'b1',
    title: 't',
    targetAge: '4-5',
    artStyle: 's',
    key_objects: [
      { name: 'fox', korean: '여우', description: '', pages: [1], ttsUrl: 'https://tts/fox.mp3' },
    ],
    keyObjectImages: [{ objectName: 'fox', imageUrl: 'https://r2/fox.png', success: true }],
    hiddenObjectScenes: [
      {
        id: 'hobj_1',
        sceneImageUrl: 'https://r2/scene.png',
        hotspots: [{ objectName: 'fox', x: 0.1, y: 0.2, w: 0.3, h: 0.4 }],
      },
    ],
  } as unknown as Storybook;

  it('씬의 핫스팟을 라벨/썸네일/TTS resolve 된 타깃으로 변환한다', () => {
    const cfg: HiddenObjectConfig = { type: 'hidden-object', sceneCount: 1 };
    const data = buildHiddenObjectData(book, cfg);
    expect(data.type).toBe('hidden-object');
    expect(data.scenes).toHaveLength(1);
    const t = data.scenes[0].targets[0];
    expect(t).toMatchObject({
      objectName: 'fox',
      label: '여우',
      thumbnailUrl: 'https://r2/fox.png',
      ttsUrl: 'https://tts/fox.mp3',
      x: 0.1,
      y: 0.2,
      w: 0.3,
      h: 0.4,
    });
  });

  it('씬이 없으면 명확한 에러를 던진다', () => {
    const empty = { ...book, hiddenObjectScenes: [] } as Storybook;
    const cfg: HiddenObjectConfig = { type: 'hidden-object', sceneCount: 1 };
    expect(() => buildHiddenObjectData(empty, cfg)).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm --filter server test -- game.service`
Expected: FAIL (`buildHiddenObjectData` 미정의)

- [ ] **Step 3: generator 구현 + generators 맵 등록**

`packages/server/src/services/game.service.ts` import 블록(라인 6~32)의 타입 목록에 추가:

```ts
  StoryImageRound,
  HiddenObjectConfig,
  HiddenObjectData,
  HiddenObjectTarget,
} from '@tangobook/shared';
```

`generators` 맵(라인 40~54)에 항목 추가:

```ts
  'korean-story-image': (sb, cfg) => generateStoryImage(sb, cfg as KoreanStoryImageConfig, 'ko'),
  'english-story-image': (sb, cfg) => generateStoryImage(sb, cfg as EnglishStoryImageConfig, 'en'),
  'hidden-object': (sb, cfg) => Promise.resolve(buildHiddenObjectData(sb, cfg as HiddenObjectConfig)),
};
```

파일 끝에 순수 변환 함수 추가(export):

```ts
// --- 숨은그림 찾기: 저장된 씬 → 플레이용 데이터 ---
export function buildHiddenObjectData(
  storybook: Storybook,
  config: HiddenObjectConfig
): HiddenObjectData {
  const all = storybook.hiddenObjectScenes ?? [];
  if (all.length === 0) {
    throw new AppError(400, '숨은그림 씬이 없습니다. /editor2 의 "숨은그림" 탭에서 먼저 만들어주세요.');
  }

  const keyObjects = storybook.key_objects ?? [];
  const images = storybook.keyObjectImages ?? [];
  const labelOf = (objectName: string): string => {
    const ko = keyObjects.find((k) => k.name === objectName);
    return ko?.korean || ko?.name || objectName;
  };
  const thumbOf = (objectName: string): string | undefined =>
    images.find((i) => i.objectName === objectName && i.success)?.imageUrl;
  const ttsOf = (objectName: string): string | undefined =>
    keyObjects.find((k) => k.name === objectName)?.ttsUrl;

  const count = Math.max(1, config.sceneCount || 1);
  const chosen = shuffle([...all]).slice(0, Math.min(count, all.length));

  const scenes = chosen.map((scene) => ({
    sceneImageUrl: scene.sceneImageUrl,
    targets: scene.hotspots.map(
      (h): HiddenObjectTarget => ({
        objectName: h.objectName,
        label: labelOf(h.objectName),
        thumbnailUrl: thumbOf(h.objectName),
        ttsUrl: ttsOf(h.objectName),
        x: h.x,
        y: h.y,
        w: h.w,
        h: h.h,
      })
    ),
  }));

  return { type: 'hidden-object', scenes };
}
```

> `shuffle` 와 `AppError` 는 파일 상단에 이미 import 됨(라인 2~3).

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pnpm --filter server test -- game.service`
Expected: PASS

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter server typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/services/game.service.ts packages/server/src/services/game.service.test.ts
git commit -m "feat(server): 숨은그림 게임 데이터 generator"
```

---

## Task 5: 클라이언트 — object-fit 보정 히트테스트 유틸

**Files:**
- Create: `packages/client/src/features/games/utils/hitTest.ts`
- Test: `packages/client/src/features/games/utils/hitTest.test.ts`

`object-fit: contain` 으로 렌더된 이미지 위의 픽셀 탭 좌표를, 이미지 정규화 좌표(0~1)로 변환하고 박스 적중 여부를 판정. 레터박스(여백) 보정 포함. TDD.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `packages/client/src/features/games/utils/hitTest.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toImageNorm, hitNormalizedBox } from './hitTest';
import type { HiddenObjectTarget } from '@tangobook/shared';

// 컨테이너 800x600, 이미지 본래 비율 16:9 → contain 시 가로꽉(800), 세로 450, 위아래 레터박스 75px씩
const container = { width: 800, height: 600 };
const imageAspect = 16 / 9;

describe('toImageNorm (object-fit: contain)', () => {
  it('레터박스 안의 탭을 0~1 정규화 좌표로 변환한다', () => {
    // 컨테이너 정중앙 (400,300) → 이미지 정중앙 (0.5,0.5)
    const p = toImageNorm(400, 300, container, imageAspect);
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(0.5, 5);
    expect(p!.y).toBeCloseTo(0.5, 5);
  });

  it('레터박스(여백) 위의 탭은 null 을 반환한다', () => {
    // y=10 은 위쪽 레터박스(75px) 안 → 이미지 밖
    const p = toImageNorm(400, 10, container, imageAspect);
    expect(p).toBeNull();
  });

  it('이미지 좌상단 모서리는 (0,0) 근처', () => {
    // 이미지 영역: x 0~800, y 75~525
    const p = toImageNorm(0, 75, container, imageAspect);
    expect(p!.x).toBeCloseTo(0, 5);
    expect(p!.y).toBeCloseTo(0, 5);
  });
});

describe('hitNormalizedBox', () => {
  const target = { x: 0.4, y: 0.4, w: 0.2, h: 0.2 } as HiddenObjectTarget;

  it('박스 안의 점은 적중', () => {
    expect(hitNormalizedBox({ x: 0.5, y: 0.5 }, target)).toBe(true);
  });
  it('박스 밖의 점은 미적중', () => {
    expect(hitNormalizedBox({ x: 0.1, y: 0.1 }, target)).toBe(false);
  });
  it('경계선 위(좌상단 꼭짓점)는 적중', () => {
    expect(hitNormalizedBox({ x: 0.4, y: 0.4 }, target)).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `pnpm --filter client test -- hitTest`
Expected: FAIL (`./hitTest` 모듈 없음)

- [ ] **Step 3: 유틸 구현**

Create `packages/client/src/features/games/utils/hitTest.ts`:

```ts
import type { HiddenObjectTarget } from '@tangobook/shared';

export interface NormPoint {
  x: number;
  y: number;
}

/**
 * object-fit: contain 으로 렌더된 이미지 위의 컨테이너 픽셀 좌표(px,py)를
 * 이미지 정규화 좌표(0~1)로 변환. 레터박스(여백) 위면 null.
 *
 * @param px 컨테이너 기준 x (clientX - rect.left)
 * @param py 컨테이너 기준 y (clientY - rect.top)
 * @param container 컨테이너 크기
 * @param imageAspect 이미지 본래 가로/세로 비율 (naturalWidth / naturalHeight)
 */
export function toImageNorm(
  px: number,
  py: number,
  container: { width: number; height: number },
  imageAspect: number
): NormPoint | null {
  const containerAspect = container.width / container.height;
  let renderW: number;
  let renderH: number;
  if (imageAspect > containerAspect) {
    // 이미지가 더 넓음 → 가로 꽉, 세로 레터박스
    renderW = container.width;
    renderH = container.width / imageAspect;
  } else {
    // 이미지가 더 높음 → 세로 꽉, 가로 레터박스(필러박스)
    renderH = container.height;
    renderW = container.height * imageAspect;
  }
  const offsetX = (container.width - renderW) / 2;
  const offsetY = (container.height - renderH) / 2;

  const ix = px - offsetX;
  const iy = py - offsetY;
  if (ix < 0 || iy < 0 || ix > renderW || iy > renderH) return null;

  return { x: ix / renderW, y: iy / renderH };
}

/** 정규화 점이 타깃 박스 안(경계 포함)에 있는지. */
export function hitNormalizedBox(
  p: NormPoint,
  box: Pick<HiddenObjectTarget, 'x' | 'y' | 'w' | 'h'>
): boolean {
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `pnpm --filter client test -- hitTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/games/utils/hitTest.ts packages/client/src/features/games/utils/hitTest.test.ts
git commit -m "feat(games): object-fit contain 히트테스트 유틸"
```

---

## Task 6: 클라이언트 — 숨은그림 플레이어

**Files:**
- Create: `packages/client/src/features/games/components/players/HiddenObjectPlayer.tsx`

씬 이미지 + 찾을 단어 체크리스트 레일. 탭 → 히트테스트 → 적중 시 단어 TTS + 효과음 + 체크. 모두 찾으면 `GameResultScreen`.

- [ ] **Step 1: 플레이어 컴포넌트 작성**

Create `packages/client/src/features/games/components/players/HiddenObjectPlayer.tsx`:

```tsx
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { HiddenObjectData, HiddenObjectTarget } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { toImageNorm, hitNormalizedBox } from '../../utils/hitTest';
import { cn } from '@/lib/cn';

export function HiddenObjectPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as HiddenObjectData;
  const scenes = data.scenes ?? [];

  const [sceneIdx, setSceneIdx] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [missFlash, setMissFlash] = useState<{ x: number; y: number; id: number } | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const { playWordCorrect, playFeedbackSound } = useGameAudio();

  const scene = scenes[sceneIdx] as { sceneImageUrl: string; targets: HiddenObjectTarget[] } | undefined;
  const targets = scene?.targets ?? [];
  const totalTargets = useMemo(
    () => scenes.reduce((sum, s) => sum + s.targets.length, 0),
    [scenes]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scene || !imgRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const aspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
      const norm = toImageNorm(px, py, { width: rect.width, height: rect.height }, aspect);
      if (!norm) return;

      const hit = targets.find(
        (t) => !found.has(t.objectName) && hitNormalizedBox(norm, t)
      );
      if (!hit) {
        // 오답: 페널티 없음, 가벼운 표시만
        setMissFlash({ x: px, y: py, id: Date.now() });
        setTimeout(() => setMissFlash(null), 500);
        return;
      }

      const nextFound = new Set(found);
      nextFound.add(hit.objectName);
      setFound(nextFound);
      setScore((s) => s + 1);
      playWordCorrect({ ttsUrl: hit.ttsUrl });

      const sceneCleared = targets.every((t) => nextFound.has(t.objectName));
      if (sceneCleared) {
        if (sceneIdx + 1 >= scenes.length) {
          setTimeout(() => setFinished(true), 700);
        } else {
          setTimeout(() => {
            setSceneIdx((i) => i + 1);
            setFound(new Set());
          }, 700);
        }
      }
    },
    [scene, targets, found, sceneIdx, scenes.length, playWordCorrect]
  );

  const handleRestart = useCallback(() => {
    setSceneIdx(0);
    setFound(new Set());
    setScore(0);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, totalTargets);
  }, [finished, score, totalTargets, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={totalTargets}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!scene) return null;

  const remaining = targets.filter((t) => !found.has(t.objectName));

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <div className="flex flex-col items-center gap-3 w-full h-full min-h-0">
        <GameProgressBar current={found.size} total={targets.length} score={score} />

        {/* 씬 + 탭 영역 */}
        <div
          className="relative flex-1 min-h-0 w-full max-w-5xl flex items-center justify-center cursor-pointer select-none"
          onClick={handleTap}
        >
          <img
            ref={imgRef}
            src={scene.sceneImageUrl}
            alt=""
            draggable={false}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-card"
          />
          {/* 찾은 사물 위치에 ✓ 링 표시 */}
          {targets
            .filter((t) => found.has(t.objectName))
            .map((t) => (
              <FoundRing key={t.objectName} target={t} imgRef={imgRef} />
            ))}
          {/* 오답 탭 위치 가벼운 표시 */}
          <AnimatePresence>
            {missFlash && (
              <motion.span
                key={missFlash.id}
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-danger"
                style={{ left: missFlash.x, top: missFlash.y }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 찾을 단어 체크리스트 레일 */}
        <div className="shrink-0 w-full overflow-x-auto">
          <div className="flex gap-3 justify-center px-2 pb-1">
            {targets.map((t) => {
              const done = found.has(t.objectName);
              return (
                <div
                  key={t.objectName}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border-4 p-2 min-w-[5rem] transition-all',
                    done
                      ? 'border-success bg-success/10 opacity-60'
                      : 'border-peach-200 bg-white'
                  )}
                >
                  {t.thumbnailUrl ? (
                    <img
                      src={t.thumbnailUrl}
                      alt=""
                      className={cn('w-14 h-14 object-contain', done && 'grayscale')}
                    />
                  ) : (
                    <span className="text-3xl">🔍</span>
                  )}
                  <span className="text-sm font-bold text-ink-900">{t.label}</span>
                  {done && <span className="text-success font-black">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        <p className="shrink-0 text-base sm:text-lg font-bold text-ink-900 dark:text-peach-200">
          그림 속에서 {remaining.length}개 더 찾아보세요!
        </p>
      </div>
    </GamePlayerLayout>
  );
}

/** 찾은 사물 위치(정규화 박스 중심)에 ✓ 링 — 이미지 렌더 영역 기준으로 계산. */
function FoundRing({
  target,
  imgRef,
}: {
  target: HiddenObjectTarget;
  imgRef: React.RefObject<HTMLImageElement | null>;
}) {
  const img = imgRef.current;
  if (!img) return null;
  const parent = img.parentElement;
  if (!parent) return null;
  const pr = parent.getBoundingClientRect();
  const ir = img.getBoundingClientRect();
  // 이미지의 렌더 영역(부모 기준 offset)
  const offX = ir.left - pr.left;
  const offY = ir.top - pr.top;
  const cx = offX + (target.x + target.w / 2) * ir.width;
  const cy = offY + (target.y + target.h / 2) * ir.height;
  const size = Math.max(target.w * ir.width, target.h * ir.height) * 1.1;

  return (
    <motion.span
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="pointer-events-none absolute rounded-full border-4 border-success bg-success/10 flex items-center justify-center"
      style={{ left: cx - size / 2, top: cy - size / 2, width: size, height: size }}
    >
      <span className="text-success font-black text-xl">✓</span>
    </motion.span>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm --filter client typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/games/components/players/HiddenObjectPlayer.tsx
git commit -m "feat(games): 숨은그림 플레이어 컴포넌트"
```

---

## Task 7: 클라이언트 — 설정 패널 + 게임 등록

**Files:**
- Create: `packages/client/src/features/games/components/config/HiddenObjectConfigPanel.tsx`
- Create: `packages/client/src/features/games/registry/games/hidden-object.register.tsx`
- Modify: `packages/client/src/features/games/registry/index.ts`
- Modify: `packages/client/src/features/games/registry/game-registry.ts`

- [ ] **Step 1: ContentRequirement 에 optional 플래그 추가**

`packages/client/src/features/games/registry/game-registry.ts` 의 `ContentRequirement`(라인 11~17) 에 추가 (optional — 기존 11개 register 파일 무수정):

```ts
export interface ContentRequirement {
  needsVocabularyImages: boolean;
  needsKeyObjectImages: boolean;
  needsCharacterImages: boolean;
  needsIllustrations: boolean;
  needsPhonicsData: boolean;
  /** 숨은그림 씬(저작 완료)이 필요한 게임. 기본 false. */
  needsHiddenObjectScenes?: boolean;
}
```

- [ ] **Step 2: 설정 패널 작성**

기존 `StoryImageConfigPanel` 패턴 참고(`NumberSelector` 사용처 확인):

Run: `grep -n "NumberSelector\|ConfigCheckbox" packages/client/src/features/games/components/config/StoryImageConfigPanel.tsx`
Expected: import 및 사용 라인 출력 → 동일 컴포넌트 재사용

Create `packages/client/src/features/games/components/config/HiddenObjectConfigPanel.tsx`:

```tsx
import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { HiddenObjectConfig } from '@tangobook/shared';

export function HiddenObjectConfigPanel({ storybook, config, onChange }: GameConfigPanelProps) {
  const c = config as HiddenObjectConfig;
  const sceneCount = storybook.hiddenObjectScenes?.length ?? 0;

  return (
    <div className="space-y-4">
      {sceneCount === 0 ? (
        <p className="text-sm text-danger font-medium">
          숨은그림 씬이 없습니다. /editor2 의 "숨은그림" 탭에서 씬을 먼저 만들어주세요.
        </p>
      ) : (
        <p className="text-sm text-ink-700">
          저장된 씬 {sceneCount}개 중 무작위로 골라 게임을 만듭니다.
        </p>
      )}
      <label className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-900">한 게임에 포함할 씬 수</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, sceneCount)}
          value={c.sceneCount}
          onChange={(e) =>
            onChange({ ...c, sceneCount: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
          className="w-20 rounded-md border-2 border-peach-200 px-2 py-1"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 3: 게임 등록 파일 작성**

Create `packages/client/src/features/games/registry/games/hidden-object.register.tsx`:

```tsx
import { registerGame } from '../game-registry';
import { HiddenObjectConfigPanel } from '../../components/config/HiddenObjectConfigPanel';
import { HiddenObjectPlayer } from '../../components/players/HiddenObjectPlayer';

registerGame({
  id: 'hidden-object',
  category: 'storybook',
  nameKo: '숨은그림 찾기',
  descriptionKo: '그림 속에 숨은 단어들을 모두 찾아요',
  icon: '🔍',
  supportedTypes: ['storybook'],
  contentRequirements: {
    needsVocabularyImages: false,
    needsKeyObjectImages: true,
    needsCharacterImages: false,
    needsIllustrations: false,
    needsPhonicsData: false,
    needsHiddenObjectScenes: true,
  },
  defaultConfig: { type: 'hidden-object', sceneCount: 1 },
  ConfigPanel: HiddenObjectConfigPanel,
  PlayerComponent: HiddenObjectPlayer,
});
```

- [ ] **Step 4: registry/index.ts 에 side-effect import 추가**

먼저 기존 import 라인 확인:

Run: `grep -n "register" packages/client/src/features/games/registry/index.ts`
Expected: `import './games/korean-story-image.register';` 류의 라인들 출력

`korean-story-image` import 줄 근처에 동일 패턴으로 한 줄 추가:

```ts
import './games/hidden-object.register';
```

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter client typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/games/components/config/HiddenObjectConfigPanel.tsx packages/client/src/features/games/registry/games/hidden-object.register.tsx packages/client/src/features/games/registry/index.ts packages/client/src/features/games/registry/game-registry.ts
git commit -m "feat(games): 숨은그림 게임 등록 + 설정 패널"
```

---

## Task 8: 클라이언트 — 씬 생성 API 모듈

**Files:**
- Create: `packages/client/src/features/games/api/hiddenObject.api.ts`

editor2 탭이 호출할 씬 생성 API 래퍼.

- [ ] **Step 1: 기존 axios 헬퍼 시그니처 확인**

Run: `grep -n "export const apiPost\|export function apiPost\|export const apiClient" packages/client/src/lib/axios.ts`
Expected: `apiPost` 또는 `apiClient` export 라인 출력

- [ ] **Step 2: API 모듈 작성**

Create `packages/client/src/features/games/api/hiddenObject.api.ts` (응답 통일 규약 `{ success, data }` → `apiPost` 가 data 언랩한다고 가정. 만약 `apiPost` 가 없으면 `apiClient.post(...).then(r => r.data.data)` 패턴 사용):

```ts
import { apiPost } from '@/lib/axios';

export interface GenerateHiddenObjectSceneReq {
  storybookId: string;
  storybookTitle: string;
  artStyle: string;
  theme?: string;
  objects: { name: string; imageUrl?: string }[];
  model?: string;
}

export const hiddenObjectApi = {
  generateScene(req: GenerateHiddenObjectSceneReq): Promise<{ imageUrl: string }> {
    return apiPost<{ imageUrl: string }>('/images/hidden-object-scene', req);
  },
};
```

> Step 1 결과로 `apiPost` 시그니처(제네릭/언랩 여부)를 맞춘다. 다른 api 모듈(예: `features/key-object/api/keyObject.api.ts`)의 호출 형식을 그대로 따른다.

- [ ] **Step 3: 타입체크**

Run: `pnpm --filter client typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/games/api/hiddenObject.api.ts
git commit -m "feat(games): 숨은그림 씬 생성 API 모듈"
```

---

## Task 9: editor2 — "숨은그림" 탭 (생성 + 마킹 캔버스)

**Files:**
- Create: `packages/client/src/features/games/components/HiddenObjectEditorTab.tsx`
- Modify: `packages/client/src/features/editor/components/EditorContent.tsx`
- Modify: `packages/client/src/features/editor/components/TabBar.tsx`
- Modify: `packages/client/src/features/games/index.ts`

활성 그림체의 키오브젝트에서 타깃 subset 선택 → AI 씬 생성 → 캔버스에서 박스 드래그로 마킹 → 저장. 책당 여러 씬.

- [ ] **Step 1: 탭 컴포넌트 작성**

Create `packages/client/src/features/games/components/HiddenObjectEditorTab.tsx`:

```tsx
import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/design-system';
import { hiddenObjectApi } from '../api/hiddenObject.api';
import type { Storybook, HiddenObjectScene, HiddenObjectHotspot } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

interface DraftBox extends HiddenObjectHotspot {}

export function HiddenObjectEditorTab({ storybook, onUpdate, onSave }: Props) {
  const keyObjects = storybook.key_objects ?? [];
  const keyObjectImages = storybook.keyObjectImages ?? [];
  const scenes = storybook.hiddenObjectScenes ?? [];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState('');
  const [draftSceneUrl, setDraftSceneUrl] = useState<string | null>(null);
  const [draftBoxes, setDraftBoxes] = useState<DraftBox[]>([]);
  const [labelFor, setLabelFor] = useState<string>(''); // 다음에 그릴 박스의 objectName
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<DraftBox | null>(null);

  const imageOf = (name: string) =>
    keyObjectImages.find((i) => i.objectName === name && i.success)?.imageUrl;

  const genMutation = useMutation({
    mutationFn: () =>
      hiddenObjectApi.generateScene({
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        artStyle: storybook.artStyle,
        theme: theme || undefined,
        objects: Array.from(selected).map((name) => ({ name, imageUrl: imageOf(name) })),
      }),
    onSuccess: ({ imageUrl }) => {
      setDraftSceneUrl(imageUrl);
      setDraftBoxes([]);
      const first = Array.from(selected)[0];
      setLabelFor(first ?? '');
    },
  });

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // 캔버스 드래그로 박스 그리기 (정규화 좌표)
  const norm = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!labelFor) return;
    const p = norm(e.clientX, e.clientY);
    dragRef.current = p;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !labelFor) return;
    const p = norm(e.clientX, e.clientY);
    const x = Math.min(dragRef.current.x, p.x);
    const y = Math.min(dragRef.current.y, p.y);
    const w = Math.abs(p.x - dragRef.current.x);
    const h = Math.abs(p.y - dragRef.current.y);
    setDragBox({ objectName: labelFor, x, y, w, h });
  };
  const onMouseUp = () => {
    if (dragBox && dragBox.w > 0.02 && dragBox.h > 0.02) {
      setDraftBoxes((prev) => [...prev.filter((b) => b.objectName !== dragBox.objectName), dragBox]);
    }
    dragRef.current = null;
    setDragBox(null);
  };

  const saveScene = useCallback(() => {
    if (!draftSceneUrl || draftBoxes.length === 0) return;
    const scene: HiddenObjectScene = {
      id: `hobj_${Date.now()}`,
      sceneImageUrl: draftSceneUrl,
      theme: theme || undefined,
      artStyle: storybook.artStyle,
      hotspots: draftBoxes,
    };
    onUpdate((draft) => {
      draft.hiddenObjectScenes = [...(draft.hiddenObjectScenes ?? []), scene];
    });
    onSave();
    setDraftSceneUrl(null);
    setDraftBoxes([]);
  }, [draftSceneUrl, draftBoxes, theme, storybook.artStyle, onUpdate, onSave]);

  const deleteScene = (id: string) => {
    onUpdate((draft) => {
      draft.hiddenObjectScenes = (draft.hiddenObjectScenes ?? []).filter((s) => s.id !== id);
    });
    onSave();
  };

  const markedNames = new Set(draftBoxes.map((b) => b.objectName));

  return (
    <div className="space-y-6">
      {/* 1. 타깃 선택 */}
      <section className="space-y-2">
        <h3 className="text-lg font-bold text-ink-900">1. 숨길 단어 선택 (6~10개 권장)</h3>
        <div className="flex flex-wrap gap-2">
          {keyObjects.map((ko) => {
            const on = selected.has(ko.name);
            return (
              <button
                key={ko.name}
                onClick={() => toggle(ko.name)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${
                  on ? 'border-coral-500 bg-coral-100' : 'border-peach-200 bg-white'
                }`}
              >
                {imageOf(ko.name) && (
                  <img src={imageOf(ko.name)} alt="" className="w-8 h-8 object-contain" />
                )}
                <span className="text-sm font-medium">{ko.korean || ko.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="테마 힌트 (예: 숲속, 아이 방) — 선택"
            className="flex-1 rounded-md border-2 border-peach-200 px-3 py-2"
          />
          <Button onClick={() => genMutation.mutate()} disabled={selected.size === 0 || genMutation.isPending}>
            {genMutation.isPending ? '생성 중…' : 'AI 씬 생성'}
          </Button>
        </div>
      </section>

      {/* 2. 마킹 캔버스 */}
      {draftSceneUrl && (
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-ink-900">2. 사물 위치 마킹</h3>
          <p className="text-sm text-ink-700">
            아래에서 단어를 고른 뒤, 씬에서 해당 사물을 박스로 드래그하세요. AI가 안 그린 사물은 건너뜁니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((name) => (
              <button
                key={name}
                onClick={() => setLabelFor(name)}
                className={`rounded-lg border-2 px-3 py-1 text-sm ${
                  labelFor === name
                    ? 'border-coral-500 bg-coral-100'
                    : markedNames.has(name)
                      ? 'border-success bg-success/10'
                      : 'border-peach-200 bg-white'
                }`}
              >
                {markedNames.has(name) ? '✓ ' : ''}
                {keyObjects.find((k) => k.name === name)?.korean || name}
              </button>
            ))}
          </div>
          <div
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="relative w-full max-w-3xl mx-auto select-none cursor-crosshair"
          >
            <img src={draftSceneUrl} alt="" draggable={false} className="w-full rounded-2xl" />
            {draftBoxes.map((b) => (
              <div
                key={b.objectName}
                className="absolute border-2 border-coral-500 bg-coral-500/20 flex items-start"
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                }}
              >
                <span className="text-xs bg-coral-500 text-white px-1 rounded">
                  {keyObjects.find((k) => k.name === b.objectName)?.korean || b.objectName}
                </span>
              </div>
            ))}
            {dragBox && (
              <div
                className="absolute border-2 border-dashed border-coral-600 bg-coral-500/10"
                style={{
                  left: `${dragBox.x * 100}%`,
                  top: `${dragBox.y * 100}%`,
                  width: `${dragBox.w * 100}%`,
                  height: `${dragBox.h * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={saveScene} disabled={draftBoxes.length === 0}>
              씬 저장 ({draftBoxes.length}개 마킹)
            </Button>
            <Button variant="ghost" onClick={() => genMutation.mutate()} disabled={genMutation.isPending}>
              다시 생성
            </Button>
          </div>
        </section>
      )}

      {/* 3. 저장된 씬 목록 */}
      <section className="space-y-2">
        <h3 className="text-lg font-bold text-ink-900">저장된 씬 ({scenes.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {scenes.map((s) => (
            <div key={s.id} className="relative rounded-xl overflow-hidden border-2 border-peach-200">
              <img src={s.sceneImageUrl} alt="" className="w-full aspect-video object-cover" />
              <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                {s.hotspots.length}개 사물
              </span>
              <button
                onClick={() => deleteScene(s.id)}
                className="absolute top-1 right-1 bg-danger text-white rounded-full w-6 h-6 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

> `Button` 의 `variant` prop 이 다르면(예: `secondary`), 기존 사용처(`grep -n "variant=" packages/client/src/features/games/components/GamesTab.tsx`)에 맞춰 조정. `useMutation` 은 `@tanstack/react-query` (KeyObjectTab 과 동일).

- [ ] **Step 2: games/index.ts 에서 export**

Run: `grep -n "export" packages/client/src/features/games/index.ts`
Expected: `export { GamesTab } ...` 류 출력

해당 파일에 추가:

```ts
export { HiddenObjectEditorTab } from './components/HiddenObjectEditorTab';
```

- [ ] **Step 3: EditorContent 에 탭 등록**

`packages/client/src/features/editor/components/EditorContent.tsx`:

import 추가(라인 18 `import { GamesTab } from '@/features/games';` 수정):

```ts
import { GamesTab, HiddenObjectEditorTab } from '@/features/games';
```

`storybookOnlyTabs`(라인 74~79) 에 항목 추가:

```ts
  const storybookOnlyTabs = [
    {
      id: 'key-objects',
      el: <KeyObjectTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
    {
      id: 'hidden-object',
      el: <HiddenObjectEditorTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />,
    },
  ];
```

- [ ] **Step 4: TabBar 에 탭 라벨 추가**

`packages/client/src/features/editor/components/TabBar.tsx` 의 `STORYBOOK_TABS`(라인 4~17) 에서 `games` 앞에 추가:

```ts
  { id: 'key-objects' as const, label: '핵심단어' },
  { id: 'hidden-object' as const, label: '숨은그림' },
  { id: 'pages' as const, label: '페이지' },
```

> `hidden-object` 는 storybook 전용 → `STORYBOOK_TABS` 에만 추가(`PHONICS_TABS` 는 그대로).

- [ ] **Step 5: 타입체크 + 빌드**

Run: `pnpm --filter client typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/games/components/HiddenObjectEditorTab.tsx packages/client/src/features/games/index.ts packages/client/src/features/editor/components/EditorContent.tsx packages/client/src/features/editor/components/TabBar.tsx
git commit -m "feat(editor): /editor2 숨은그림 탭 (씬 생성 + 핫스팟 마킹)"
```

---

## Task 10: 전체 검증 (타입·테스트·수동)

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 타입체크**

Run: `pnpm typecheck`
Expected: PASS (shared/server/client 모두)

- [ ] **Step 2: 전체 클라 테스트**

Run: `pnpm --filter client test`
Expected: PASS (style-assets, hitTest 신규 포함)

- [ ] **Step 3: 서버 테스트**

Run: `pnpm --filter server test -- game.service`
Expected: PASS (buildHiddenObjectData)

- [ ] **Step 4: lint**

Run: `pnpm lint`
Expected: 신규 파일 에러 없음

- [ ] **Step 5: 수동 검증 (preview 도구)**

`pnpm dev` 실행 후:
1. `/editor2/<keyObject 이미지가 있는 책 id>` → "숨은그림" 탭.
2. 단어 6~8개 선택 + 테마 입력 → "AI 씬 생성" → 씬 등장 확인(서버 로그/네트워크).
3. 단어 칩 고른 뒤 씬에서 박스 드래그 → 박스/라벨 표시 확인 → "씬 저장".
4. 저장된 씬 목록에 썸네일 + "N개 사물" 표시 확인.
5. "학습게임" 탭 → "숨은그림 찾기" 생성 → 미리보기(GamePreviewModal)로 플레이:
   - 씬 + 체크리스트 레일 표시.
   - 마킹한 사물 영역 탭 → ✓ 링 + 단어 TTS + 효과음 + 레일 체크.
   - 빈 곳 탭 → 페널티 없이 빨간 링 잠깐.
   - 모두 찾으면 `GameResultScreen` + confetti.
   - 브라우저 창 리사이즈(다른 비율)로 탭 정확도 재확인(레터박스 보정).

> UI 검증 결과(스크린샷/네트워크)를 사용자에게 보고. 자동 테스트로 커버 못 하는 "실제 탭 정확도/보상 체인"이 핵심 확인 포인트.

- [ ] **Step 6: 문서 갱신 + Commit (커밋은 사용자 명시 시)**

`packages/client/src/features/games/CLAUDE.md` "게임 목록" 표에 `hidden-object | 숨은그림 찾기 | (중립)` 한 줄 + 저작 위치(editor2 숨은그림 탭) 한 줄 추가.
`CLAUDE.md`(루트) 또는 `features/editor/CLAUDE.md` 에 숨은그림 탭 언급 추가.

> 사용자 전역 규칙: 명시 지시 없이 commit 금지. "업데이트"/"커밋" 시 docs 갱신 + 커밋 일괄 처리.

---

## 구현 순서 / 의존성

Task 1(타입) → 2(swap)·3(씬 생성)·4(generator)·5(히트테스트) 는 1 이후 병렬 가능 →
6(플레이어, 5 의존) → 7(등록, 6 의존) → 8(api, 3 의존) → 9(editor 탭, 8 의존) → 10(검증).
