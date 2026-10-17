// These are silent preparation elements, never the iOS-unlocked shared playback element.
// Retain real buffers, not a persisted "was loaded" flag. Recheck every reuse.
const LIMIT = 24;
const MAX_AGE_MS = 5 * 60 * 1000;
interface Entry {
  audio: HTMLAudioElement;
  source: string;
  expires: number;
  timer: ReturnType<typeof setTimeout>;
}
const entries = new Map<string, Entry>();

function ready(audio: HTMLAudioElement, source: string): boolean {
  try {
    return (
      !audio.error &&
      audio.paused &&
      !audio.seeking &&
      audio.currentTime <= 0.05 &&
      audio.src === source &&
      audio.currentSrc === source &&
      audio.readyState >= 2 &&
      audio.buffered.length > 0 &&
      audio.buffered.start(0) <= 0.05 &&
      audio.buffered.end(0) > 0
    );
  } catch {
    return false;
  }
}

function discard(key: string, entry: Entry): void {
  if (entries.get(key) !== entry) return;
  entries.delete(key);
  clearTimeout(entry.timer);
  try {
    entry.audio.pause();
    entry.audio.removeAttribute('src');
    entry.audio.load();
  } catch {
    // Best-effort release; never block the existing media-preparation fallback.
  }
}

export function reusePreparedAudio(url: string): boolean {
  const entry = entries.get(url);
  if (!entry) return false;
  if (Date.now() >= entry.expires || !ready(entry.audio, entry.source)) {
    discard(url, entry);
    return false;
  }
  entries.delete(url);
  entries.set(url, entry);
  return true;
}

export function retainPreparedAudio(url: string, audio: HTMLAudioElement): void {
  const source = audio.src;
  if (!ready(audio, source)) return;
  const previous = entries.get(url);
  if (previous) discard(url, previous);
  const entry = { audio, source, expires: Date.now() + MAX_AGE_MS } as Entry;
  entry.timer = setTimeout(() => discard(url, entry), MAX_AGE_MS);
  entries.set(url, entry);
  while (entries.size > LIMIT) {
    const oldest = entries.entries().next().value;
    if (oldest) discard(...oldest);
  }
}
