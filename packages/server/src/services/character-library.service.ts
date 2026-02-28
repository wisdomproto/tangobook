import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { Character, SavedCharacter } from '@tangobook/shared';

const LIBRARY_KEY = 'character-library.json';

async function getLibrary(): Promise<SavedCharacter[]> {
  try {
    const url = `${r2PublicUrl}/${LIBRARY_KEY}`;
    const res = await axios.get<SavedCharacter[]>(url, { timeout: 10000 });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

async function saveLibrary(library: SavedCharacter[]): Promise<void> {
  await uploadJsonToR2(library, LIBRARY_KEY);
}

export const CharacterLibraryService = {
  async list(): Promise<SavedCharacter[]> {
    return getLibrary();
  },

  async save(character: Character): Promise<SavedCharacter> {
    const library = await getLibrary();
    const saved: SavedCharacter = {
      ...character,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    library.push(saved);
    await saveLibrary(library);
    return saved;
  },

  async updateByName(name: string, updates: Partial<Character>): Promise<SavedCharacter | null> {
    const library = await getLibrary();
    const idx = library.findIndex((c) => c.name === name);
    if (idx === -1) return null;
    library[idx] = { ...library[idx], ...updates };
    await saveLibrary(library);
    return library[idx];
  },

  async remove(id: string): Promise<void> {
    const library = await getLibrary();
    const filtered = library.filter((c) => c.id !== id);
    await saveLibrary(filtered);
  },

  async removeAll(): Promise<{ deleted: number }> {
    const library = await getLibrary();
    const count = library.length;
    await saveLibrary([]);
    return { deleted: count };
  },
};
