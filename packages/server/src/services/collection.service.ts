import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import { R2Repository } from '../repositories/r2.repository.js';
import type {
  CollectionCatalog,
  CollectionCategoryId,
  CollectionItem,
  StorybookSummary,
} from '@tangobook/shared';

const CATALOG_KEY = 'collection-catalog.json';

let memoryCache: { catalog: CollectionCatalog; loadedAt: number } | null = null;
const TTL_MS = 5 * 60_000;

async function fetchFromR2(): Promise<CollectionCatalog> {
  try {
    const url = `${r2PublicUrl}/${CATALOG_KEY}`;
    const res = await axios.get<CollectionCatalog>(url, { timeout: 10_000 });
    if (res.data && Array.isArray(res.data.items)) return res.data;
  } catch {
    // 카탈로그 미생성 — 빈 카탈로그 반환
  }
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

export const CollectionService = {
  async getCatalog(): Promise<CollectionCatalog> {
    const now = Date.now();
    if (memoryCache && now - memoryCache.loadedAt < TTL_MS) return memoryCache.catalog;
    const catalog = await fetchFromR2();
    memoryCache = { catalog, loadedAt: now };
    return catalog;
  },

  async saveCatalog(catalog: CollectionCatalog): Promise<void> {
    catalog.updatedAt = new Date().toISOString();
    await uploadJsonToR2(catalog, CATALOG_KEY);
    memoryCache = { catalog, loadedAt: Date.now() };
  },

  invalidate() {
    memoryCache = null;
  },

  /**
   * storybookId → 매칭 카드 ID 배열 역인덱스 (page_read 이벤트 metadata 채우기용)
   * 클라이언트가 page_read emit 시 호출 (서버에서 미리 계산해 캐시).
   */
  async buildStorybookCardIndex(): Promise<Record<string, string[]>> {
    const catalog = await this.getCatalog();
    const index: Record<string, string[]> = {};
    for (const item of catalog.items) {
      for (const bid of item.sourceBookIds) {
        if (!index[bid]) index[bid] = [];
        index[bid].push(item.id);
      }
    }
    return index;
  },

  async upsertItems(items: CollectionItem[]): Promise<{ added: number; updated: number }> {
    const catalog = await this.getCatalog();
    const map = new Map(catalog.items.map((i) => [i.id, i]));
    let added = 0;
    let updated = 0;
    for (const item of items) {
      if (map.has(item.id)) {
        map.set(item.id, item);
        updated++;
      } else {
        map.set(item.id, item);
        added++;
      }
    }
    catalog.items = Array.from(map.values());
    await this.saveCatalog(catalog);
    return { added, updated };
  },

  /**
   * 모든 storybook (type='storybook') 을 카드로 자동 변환.
   * 기존 stub 8장은 보존 (id 충돌 시 storybook id 가 우선).
   * nature 카테고리는 title 키워드로 dinosaur/ocean/space/plant/animal 분배.
   */
  async syncFromStorybooks(): Promise<{
    total: number;
    added: number;
    updated: number;
    skipped: number;
  }> {
    const all = await R2Repository.listStorybooks();
    const items: CollectionItem[] = [];
    let skipped = 0;

    for (const sb of all) {
      // 파닉스/비공개/표지 없는 책 제외
      if (isPhonicsBook(sb)) {
        skipped++;
        continue;
      }
      if (sb.isPublic === false) {
        skipped++;
        continue;
      }
      if (!sb.coverImage) {
        skipped++;
        continue;
      }

      const category = mapStorybookCategory(sb);
      if (!category) {
        skipped++;
        continue;
      }

      items.push({
        id: `card-${category}-${sb.id}`,
        category,
        nameKo: sb.title,
        imageUrl: sb.coverImage,
        sourceBookIds: [sb.id],
        rarity: 'common',
        createdAt: sb.createdAt ?? new Date().toISOString(),
      });
    }

    const result = await this.upsertItems(items);
    return { total: all.length, ...result, skipped };
  },
};

const NATURE_KEYWORDS: { cat: CollectionCategoryId; words: string[] }[] = [
  { cat: 'dinosaur', words: ['공룡', '티라노', '브라키오', '트리케라톱스', 'dino'] },
  {
    cat: 'ocean',
    words: ['고래', '상어', '문어', '해마', '산호', '바다', '심해', '돌고래', '물고기'],
  },
  { cat: 'space', words: ['지구', '달', '화성', '토성', '목성', '우주', '행성', '태양', '은하'] },
  { cat: 'plant', words: ['해바라기', '나무', '꽃', '식물', '잎', '뿌리', '벚나무', '민들레'] },
];

function isPhonicsBook(sb: StorybookSummary): boolean {
  if (sb.type === 'phonics') return true;
  if (sb.phonicsLanguage) return true;
  const folder = (sb.folder ?? '').toLowerCase();
  return folder.includes('파닉스') || folder.includes('phonics');
}

function distributeNature(sb: StorybookSummary): CollectionCategoryId {
  const text = `${sb.title ?? ''} ${sb.folder ?? ''}`.toLowerCase();
  for (const rule of NATURE_KEYWORDS) {
    if (rule.words.some((w) => text.includes(w.toLowerCase()))) return rule.cat;
  }
  return 'animal'; // 기본
}

function mapStorybookCategory(sb: StorybookSummary): CollectionCategoryId | null {
  // 명시 카테고리 우선
  const cat = sb.category?.toLowerCase();
  if (cat === 'classic') return 'classic';
  if (cat === 'folktale') return 'folktale';
  if (cat === 'life') return 'life';
  if (cat === 'nature') return distributeNature(sb);

  // folder 한국어 키워드 추론 (예: '자연관찰(P3)', '명작(L2)', '전래동화', '생활동화')
  const folder = (sb.folder ?? '').toLowerCase();
  if (folder.includes('명작') || folder.includes('classic')) return 'classic';
  if (folder.includes('전래') || folder.includes('folktale')) return 'folktale';
  if (folder.includes('생활') || folder.includes('life')) return 'life';
  if (folder.includes('자연') || folder.includes('nature')) return distributeNature(sb);

  return null;
}
