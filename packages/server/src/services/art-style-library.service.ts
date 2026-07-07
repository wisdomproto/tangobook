import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import { ART_STYLES, type SavedArtStyle } from '@tangobook/shared';
import { AppError } from '../middleware/error.middleware.js';

const LIBRARY_KEY = 'art-style-library.json';

/** ART_STYLES preset 을 SavedArtStyle 형태로 변환 — id 보존 (canonicalize 매칭 유지) */
function seedFromPresets(): SavedArtStyle[] {
  const now = new Date().toISOString();
  return ART_STYLES.map((s) => ({
    id: s.id,
    name: s.label,
    prompt: s.prompt,
    createdAt: now,
  }));
}

/**
 * R2 에서 library 로드.
 * - 빈 → ART_STYLES preset 으로 자동 seed (최초 1회) 후 반환
 * - 비어있지 않으면 저장된 그대로 반환 (사용자가 지운 프리셋은 되살리지 않음)
 *
 * ⚠️ 과거엔 누락 preset 을 매 로드마다 backfill 했으나, 저작도구에서 그림체를 3개(장르)만
 *    남기려 지워도 되살아나는 문제가 있어 backfill 을 제거했다. 라이브러리는 이제 완전히
 *    사용자 관리(추가/삭제)다. 새 preset 이 필요하면 저작도구에서 직접 추가한다.
 */
async function getLibrary(): Promise<SavedArtStyle[]> {
  let existing: SavedArtStyle[];
  try {
    const url = `${r2PublicUrl}/${LIBRARY_KEY}`;
    const res = await axios.get<SavedArtStyle[]>(url, { timeout: 10000 });
    existing = Array.isArray(res.data) ? res.data : [];
  } catch {
    existing = [];
  }
  if (existing.length === 0) {
    const seeded = seedFromPresets();
    await saveLibrary(seeded);
    return seeded;
  }
  return existing;
}

async function saveLibrary(library: SavedArtStyle[]): Promise<void> {
  await uploadJsonToR2(library, LIBRARY_KEY);
}

export const ArtStyleLibraryService = {
  async list(): Promise<SavedArtStyle[]> {
    return getLibrary();
  },

  /** 새 그림체 추가. id 미제공 시 timestamp 자동. preset id 와 충돌 시 거부. */
  async save(data: {
    name: string;
    prompt: string;
    referenceImageUrl?: string;
    id?: string;
  }): Promise<SavedArtStyle> {
    const library = await getLibrary();
    const id = data.id ?? `style-${Date.now()}`;
    if (library.some((s) => s.id === id)) {
      throw new AppError(409, `이미 존재하는 그림체 id 입니다: ${id}`);
    }
    const saved: SavedArtStyle = {
      id,
      name: data.name,
      prompt: data.prompt,
      referenceImageUrl: data.referenceImageUrl,
      createdAt: new Date().toISOString(),
    };
    library.push(saved);
    await saveLibrary(library);
    return saved;
  },

  /** name / prompt / referenceImageUrl 부분 수정 (id 변경 X). */
  async update(
    id: string,
    patch: { name?: string; prompt?: string; referenceImageUrl?: string }
  ): Promise<SavedArtStyle> {
    const library = await getLibrary();
    const idx = library.findIndex((s) => s.id === id);
    if (idx < 0) throw new AppError(404, `그림체를 찾을 수 없습니다: ${id}`);
    const updated: SavedArtStyle = {
      ...library[idx],
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.prompt !== undefined ? { prompt: patch.prompt } : {}),
      ...(patch.referenceImageUrl !== undefined
        ? { referenceImageUrl: patch.referenceImageUrl }
        : {}),
    };
    library[idx] = updated;
    await saveLibrary(library);
    return updated;
  },

  /** id 배열의 순서대로 library 재정렬. 누락된 id 는 끝에 그대로 보존. */
  async reorder(ids: string[]): Promise<SavedArtStyle[]> {
    const library = await getLibrary();
    const map = new Map(library.map((s) => [s.id, s]));
    const ordered: SavedArtStyle[] = [];
    for (const id of ids) {
      const entry = map.get(id);
      if (entry) {
        ordered.push(entry);
        map.delete(id);
      }
    }
    // 누락분 보존
    for (const remaining of map.values()) ordered.push(remaining);
    await saveLibrary(ordered);
    return ordered;
  },

  async remove(id: string): Promise<void> {
    const library = await getLibrary();
    const filtered = library.filter((s) => s.id !== id);
    await saveLibrary(filtered);
  },

  async removeAll(): Promise<{ deleted: number }> {
    const library = await getLibrary();
    const count = library.length;
    await saveLibrary([]);
    return { deleted: count };
  },
};
