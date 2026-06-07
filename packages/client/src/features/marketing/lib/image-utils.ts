/**
 * Image helpers ported from ContentFlow src/hooks/use-r2-upload.ts (:24 / :52).
 * convertToWebpBlob is Canvas-bound (browser only); base64ToBlob is pure.
 */

/** Convert a PNG/JPEG base64 to a WebP Blob via Canvas; falls back to the source blob. */
export async function convertToWebpBlob(
  base64: string,
  srcMime: string
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => {
          if (b && b.type === 'image/webp') resolve({ blob: b, mimeType: 'image/webp' });
          else resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => resolve({ blob: base64ToBlob(base64, srcMime), mimeType: srcMime });
    img.src = `data:${srcMime};base64,${base64}`;
  });
}

/** Convert base64 (data URL or raw) to a Blob. Exported for testing. */
export function base64ToBlob(input: string, mimeType?: string): Blob {
  let base64: string;
  let type: string;

  if (input.startsWith('data:')) {
    const match = input.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('잘못된 base64 data URL 형식입니다.');
    type = match[1];
    base64 = match[2];
  } else {
    if (!mimeType) throw new Error('raw base64에는 mimeType이 필요합니다.');
    type = mimeType;
    base64 = input;
  }

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  } catch {
    throw new Error('base64 디코딩에 실패했습니다.');
  }
}
