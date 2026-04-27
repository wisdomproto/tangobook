// 잭과 콩나무 (1772510956605) L3 에 3D Pixar 그림체 추가
// 1. styleAssets[paper-craft] 스냅샷 + availableStyles 에 pixar-3d 추가 + artStyle 전환 + top-level 비우기
// 2. 캐릭터 → 표지 → 페이지 일러스트 → 핵심사물 이미지 순으로 생성
// 3. 매 단계마다 저장 (중단해도 progress 보존)
// 4. 페이지는 paper-craft 페이지를 currentImageUrl 로 전달 — 동일 구도/장면 보존하며 그림체만 변환

const BOOK_ID = '1772510956605';
const PIXAR_PROMPT = '3D Pixar animation style, cinematic CG, soft volumetric lighting, expressive characters, vibrant colors, photorealistic textures';
const SERVER = 'http://localhost:3500';

const ts = () => new Date().toISOString().substring(11, 19);
const log = (msg) => console.log(`[${ts()}] ${msg}`);

async function fetchBook() {
  const r = await fetch(`${SERVER}/api/storybooks/${BOOK_ID}`);
  return (await r.json()).data;
}

async function saveBook(sb) {
  const r = await fetch(`${SERVER}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
  const j = await r.json();
  if (!j.success) throw new Error(`save failed: ${JSON.stringify(j)}`);
  return j.data;
}

async function callImageApi(endpoint, body) {
  const r = await fetch(`${SERVER}/api/images/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${endpoint} HTTP ${r.status}: ${text.substring(0, 200)}`);
  }
  const j = await r.json();
  if (!j.success) throw new Error(`${endpoint} failed: ${JSON.stringify(j)}`);
  // server returns { data: { imageUrl: '...' } }
  if (typeof j.data === 'string') return j.data;
  if (j.data?.imageUrl) return j.data.imageUrl;
  throw new Error(`${endpoint} unexpected response: ${JSON.stringify(j.data).substring(0, 100)}`);
}

async function main() {
  let sb = await fetchBook();
  log(`📚 Book: ${sb.title} (id=${sb.id})`);
  log(`   artStyle=${sb.artStyle} | availableStyles=${JSON.stringify(sb.availableStyles)}`);
  log(`   styleAssets keys: ${JSON.stringify(Object.keys(sb.styleAssets || {}))}`);

  // ─── 보존할 paper-craft 자산을 미리 메모리에 잡아둠 (page reference 용도) ───
  const refPagesByNum = new Map();
  for (const p of sb.pages || []) {
    if (p.illustrationUrl) refPagesByNum.set(p.pageNumber, p.illustrationUrl);
  }
  log(`   paper-craft 페이지 reference: ${refPagesByNum.size}개`);

  // ─── 1. paper-craft 스냅샷 + pixar-3d 활성 ───
  if (!sb.styleAssets) sb.styleAssets = {};
  const oldStyleKey = sb.artStyle; // paper-craft
  if (!sb.styleAssets[oldStyleKey]) {
    sb.styleAssets[oldStyleKey] = {
      coverImages: sb.coverImages,
      coverImage: sb.coverImage,
      coverPrompt: sb.coverPrompt,
      coverImageHistory: sb.coverImageHistory,
      coverCharacterRefs: sb.coverCharacterRefs,
      characterImages: (sb.characters || []).map((c) => ({
        referenceImage: c.referenceImage,
        imageHistory: c.imageHistory,
        prompt: c.prompt,
      })),
      pageIllustrations: Object.fromEntries(
        (sb.pages || [])
          .filter((p) => p.illustrationUrl)
          .map((p) => [
            p.pageNumber,
            {
              illustrationUrl: p.illustrationUrl,
              illustrationHistory: p.illustrationHistory,
              customModifications: p.customModifications,
            },
          ])
      ),
      keyObjectImages: sb.keyObjectImages,
      vocabularyImages: sb.vocabularyImages,
    };
    log(`   📸 ${oldStyleKey} 자산 스냅샷 → styleAssets[${oldStyleKey}]`);
  }

  const cur = sb.availableStyles?.length ? sb.availableStyles : [oldStyleKey];
  if (!cur.includes(PIXAR_PROMPT)) {
    sb.availableStyles = [...cur, PIXAR_PROMPT];
    log(`   ➕ availableStyles 에 pixar-3d 추가`);
  } else {
    sb.availableStyles = cur;
  }

  // pixar-3d 의 기존 자산 (이전 부분 진행분) 이 있으면 복원, 없으면 비움
  const pixarAssets = sb.styleAssets[PIXAR_PROMPT];
  if (pixarAssets) {
    log(`   ♻️  pixar-3d 기존 진행분 복원`);
    sb.coverImages = pixarAssets.coverImages;
    sb.coverImage = pixarAssets.coverImage;
    sb.coverPrompt = pixarAssets.coverPrompt;
    sb.coverImageHistory = pixarAssets.coverImageHistory;
    sb.coverCharacterRefs = pixarAssets.coverCharacterRefs;
    sb.characters = (sb.characters || []).map((c, i) => ({
      ...c,
      referenceImage: pixarAssets.characterImages?.[i]?.referenceImage,
      imageHistory: pixarAssets.characterImages?.[i]?.imageHistory,
      prompt: pixarAssets.characterImages?.[i]?.prompt ?? c.prompt,
    }));
    sb.pages = (sb.pages || []).map((p) => {
      const pa = pixarAssets.pageIllustrations?.[p.pageNumber];
      return {
        ...p,
        illustrationUrl: pa?.illustrationUrl,
        illustrationHistory: pa?.illustrationHistory,
      };
    });
    sb.keyObjectImages = pixarAssets.keyObjectImages;
    sb.vocabularyImages = pixarAssets.vocabularyImages;
  } else {
    log(`   🧹 top-level 자산 초기화 (pixar-3d 신규)`);
    sb.coverImages = undefined;
    sb.coverImage = undefined;
    sb.coverImageHistory = undefined;
    sb.coverCharacterRefs = undefined;
    sb.characters = (sb.characters || []).map((c) => ({
      ...c,
      referenceImage: undefined,
      imageHistory: undefined,
    }));
    sb.pages = (sb.pages || []).map((p) => ({
      ...p,
      illustrationUrl: undefined,
      illustrationHistory: undefined,
    }));
    sb.keyObjectImages = undefined;
  }

  sb.artStyle = PIXAR_PROMPT;
  sb = await saveBook(sb);
  log(`   ✅ pixar-3d 활성 + 저장 완료`);

  // ─── 2. 캐릭터 ───
  log(`\n=== 캐릭터 ${sb.characters.length}개 ===`);
  for (let i = 0; i < sb.characters.length; i++) {
    const c = sb.characters[i];
    const tag = `[${i + 1}/${sb.characters.length}] ${c.name}`;
    if (c.referenceImage) {
      log(`  ${tag}: ⏭️  skip (이미 있음)`);
      continue;
    }
    log(`  ${tag}: 🎨 생성 중...`);
    try {
      const url = await callImageApi('character', {
        character: c,
        artStyle: PIXAR_PROMPT,
        settings: { aspectRatio: '1:1' },
        storybookId: sb.id,
        storybookTitle: sb.title,
      });
      sb.characters[i].referenceImage = url;
      sb = await saveBook(sb);
      log(`  ${tag}: ✓ ${url.substring(url.lastIndexOf('/') + 1, 60 + url.lastIndexOf('/') + 1)}`);
    } catch (e) {
      log(`  ${tag}: ❌ ${e.message}`);
    }
  }

  // ─── 3. 표지 ───
  log(`\n=== 표지 ===`);
  if (sb.coverImage || sb.coverImages?.[0]?.imageUrl) {
    log(`  ⏭️  skip (이미 있음)`);
  } else {
    try {
      log(`  🎨 생성 중...`);
      const url = await callImageApi('cover', {
        storybook: { title: sb.title, artStyle: PIXAR_PROMPT, coverPrompt: sb.coverPrompt },
        characterReferences: sb.characters.filter((c) => c.referenceImage),
        settings: { aspectRatio: sb.coverAspectRatio ?? '3:4' },
      });
      const id = Date.now().toString();
      sb.coverImages = [{ id, imageUrl: url }];
      sb.coverImage = url;
      sb = await saveBook(sb);
      log(`  ✓ ${url.substring(url.lastIndexOf('/') + 1)}`);
    } catch (e) {
      log(`  ❌ ${e.message}`);
    }
  }

  // ─── 4. 페이지 일러스트 ───
  log(`\n=== 페이지 ${sb.pages.length}개 ===`);
  const charRefs = sb.characters.filter((c) => c.referenceImage);
  let prevPixarUrl;
  for (let i = 0; i < sb.pages.length; i++) {
    const p = sb.pages[i];
    const tag = `[${i + 1}/${sb.pages.length}] page ${p.pageNumber}`;
    if (p.illustrationUrl) {
      log(`  ${tag}: ⏭️  skip (이미 있음)`);
      prevPixarUrl = p.illustrationUrl;
      continue;
    }
    const refPaperCraft = refPagesByNum.get(p.pageNumber);
    log(`  ${tag}: 🎨 생성 중 (refs: chars×${charRefs.length}, prev: ${prevPixarUrl ? 'yes' : 'no'}, paper-craft 동일 페이지: ${refPaperCraft ? 'yes' : 'no'})...`);
    try {
      const url = await callImageApi('illustration', {
        page: p,
        artStyle: PIXAR_PROMPT,
        characterReferences: charRefs,
        previousIllustrationUrl: prevPixarUrl,
        currentImageUrl: refPaperCraft, // ← 동일 페이지의 paper-craft 일러스트를 구도 reference 로 사용
        settings: { aspectRatio: sb.illustrationAspectRatio ?? '16:9' },
        storybookId: sb.id,
        storybookTitle: sb.title,
      });
      sb.pages[i].illustrationUrl = url;
      prevPixarUrl = url;
      sb = await saveBook(sb);
      log(`  ${tag}: ✓ ${url.substring(url.lastIndexOf('/') + 1)}`);
    } catch (e) {
      log(`  ${tag}: ❌ ${e.message}`);
    }
  }

  // ─── 5. 핵심사물 ───
  const keyObjects = sb.key_objects || [];
  log(`\n=== 핵심사물 ${keyObjects.length}개 ===`);
  if (!sb.keyObjectImages) sb.keyObjectImages = [];
  for (let i = 0; i < keyObjects.length; i++) {
    const obj = keyObjects[i];
    const tag = `[${i + 1}/${keyObjects.length}] ${obj.name}`;
    const existing = sb.keyObjectImages.find((k) => k.objectName === obj.name);
    if (existing?.imageUrl && existing.success) {
      log(`  ${tag}: ⏭️  skip (이미 있음)`);
      continue;
    }
    // paper-craft 의 같은 사물 이미지가 있으면 currentImageUrl 로 전달 (구도 reference)
    const refKoImg = sb.styleAssets?.[oldStyleKey]?.keyObjectImages?.find(
      (k) => k.objectName === obj.name
    )?.imageUrl;
    log(`  ${tag}: 🎨 생성 중 (paper-craft ref: ${refKoImg ? 'yes' : 'no'})...`);
    try {
      const url = await callImageApi('key-object', {
        keyObject: obj,
        artStyle: PIXAR_PROMPT,
        storybookId: sb.id,
        storybookTitle: sb.title,
        currentImageUrl: refKoImg,
      });
      const idx = sb.keyObjectImages.findIndex((k) => k.objectName === obj.name);
      const entry = { objectName: obj.name, imageUrl: url, success: true };
      if (idx >= 0) sb.keyObjectImages[idx] = entry;
      else sb.keyObjectImages.push(entry);
      sb = await saveBook(sb);
      log(`  ${tag}: ✓ ${url.substring(url.lastIndexOf('/') + 1)}`);
    } catch (e) {
      log(`  ${tag}: ❌ ${e.message}`);
    }
  }

  // ─── 결과 ───
  log(`\n=== 완료 ===`);
  log(`artStyle: ${sb.artStyle.substring(0, 60)}`);
  log(`availableStyles: ${(sb.availableStyles || []).length}개`);
  log(`coverImage: ${sb.coverImage ? '✓' : '✗'}`);
  log(`characters with image: ${sb.characters.filter((c) => c.referenceImage).length}/${sb.characters.length}`);
  log(`pages with illust: ${sb.pages.filter((p) => p.illustrationUrl).length}/${sb.pages.length}`);
  log(`keyObjectImages: ${(sb.keyObjectImages || []).filter((k) => k.imageUrl).length}/${keyObjects.length}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
