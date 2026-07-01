import { describe, it, expect, beforeEach, vi } from 'vitest';

// We test the module-level loadSettings behaviour by resetting the module between tests.
// useViewerSettings is a React hook (useState), so we test it via the exported
// internals — specifically by re-importing the module after seeding localStorage.

const STORAGE_KEY = 'tangobook-viewer-settings';
const SETTINGS_VERSION = 2;

// Helper: import a fresh copy of the module (bypasses module cache so
// the loadSettings() call at useState initialisation sees fresh localStorage).
async function freshLoad() {
  vi.resetModules();
  const mod = await import('./useViewerSettings');
  return mod;
}

describe('useViewerSettings – settings version migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('no saved settings → fullscreenImage is true and version is stamped', async () => {
    const { loadSettingsForTest } = await freshLoad();
    const settings = loadSettingsForTest();
    expect(settings.fullscreenImage).toBe(true);
    expect(settings.version).toBe(SETTINGS_VERSION);

    // Should also be persisted
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SETTINGS_VERSION);
    expect(parsed.fullscreenImage).toBe(true);
  });

  it('saved settings WITHOUT version and fullscreenImage:false → migrated to true', async () => {
    // Simulate an existing user who had the old default (fullscreenImage:false, no version)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: 'ko',
        textSize: 'md',
        darkMode: true,
        autoPlayTts: true,
        showText: true,
        fullscreenImage: false,
      })
    );

    const { loadSettingsForTest } = await freshLoad();
    const settings = loadSettingsForTest();
    expect(settings.fullscreenImage).toBe(true);
    expect(settings.version).toBe(SETTINGS_VERSION);
  });

  it('saved settings WITH current version and fullscreenImage:false → respected (user chose false)', async () => {
    // Simulate a user who already migrated and then toggled fullscreenImage off
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: 'ko',
        textSize: 'md',
        darkMode: true,
        autoPlayTts: true,
        showText: true,
        fullscreenImage: false,
        version: SETTINGS_VERSION,
      })
    );

    const { loadSettingsForTest } = await freshLoad();
    const settings = loadSettingsForTest();
    expect(settings.fullscreenImage).toBe(false);
    expect(settings.version).toBe(SETTINGS_VERSION);
  });

  it('migration preserves other fields (autoPlayTts value untouched)', async () => {
    // Old user had autoPlayTts turned off
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: 'en',
        textSize: 'lg',
        darkMode: false,
        autoPlayTts: false,
        showText: false,
        fullscreenImage: false,
      })
    );

    const { loadSettingsForTest } = await freshLoad();
    const settings = loadSettingsForTest();

    // Only fullscreenImage is forced; everything else from the saved object is kept
    expect(settings.autoPlayTts).toBe(false);
    expect(settings.textSize).toBe('lg');
    expect(settings.language).toBe('en');
    expect(settings.darkMode).toBe(false);
    expect(settings.showText).toBe(false);
    // Migration target
    expect(settings.fullscreenImage).toBe(true);
  });
});
