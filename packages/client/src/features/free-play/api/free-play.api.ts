import type { ColoringCatalogEntry, HiddenObjectCatalogEntry } from '@tangobook/shared';

export async function getFreePlayCatalog(kind: 'coloring' | 'hidden-object', signal?: AbortSignal) {
  const response = await fetch(`/activity-data/${kind}.json`, { signal });
  if (!response.ok) throw new Error(`Play catalog ${response.status}`);
  return response.json() as Promise<ColoringCatalogEntry[] | HiddenObjectCatalogEntry[]>;
}
