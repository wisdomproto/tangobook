import { useRef, useEffect } from 'react';
import { settingsApi } from '@/features/settings/api/settings.api';

type ModuleKey = 'mod_korean' | 'mod_phonics' | 'mod_english';

/**
 * 파닉스 음원 라이브러리를 로드하여 sound→URL 맵을 반환.
 * modules 순서대로 로드하며, 먼저 등록된 sound가 우선.
 */
export function usePhonicsMap(modules: ModuleKey[]) {
  const mapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    settingsApi
      .getPhonicsLibrary()
      .then((lib) => {
        const map = new Map<string, string>();
        for (const mod of modules) {
          for (const item of lib[mod]) {
            if (!map.has(item.sound)) map.set(item.sound, item.url);
          }
        }
        mapRef.current = map;
      })
      .catch(() => {});
  }, []);

  return mapRef;
}
