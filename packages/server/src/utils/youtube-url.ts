/**
 * Extract a YouTube video ID from a URL or raw ID.
 * Supports: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID, or a bare 11-char ID.
 * Returns undefined if no valid ID is found.
 */
export function parseYouTubeVideoId(input: string): string | undefined {
  const s = input.trim();
  if (!s) return undefined;

  // Bare 11-char YouTube ID
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;

  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = url.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      // /shorts/ID, /embed/ID, /live/ID, /v/ID
      if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
        const id = parts[1];
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch {
    /* fall through */
  }
  return undefined;
}
