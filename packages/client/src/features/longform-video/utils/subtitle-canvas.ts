const FONT_FAMILY = '"Malgun Gothic", "Apple SD Gothic Neo", "Nanum Gothic", sans-serif';

interface SubtitleStyle {
  fontSize: number;
  textColor: string;
  outlineColor: string;
  bgColor: string;
  position: string;
}

export function renderSubtitleImage(
  text: string,
  videoWidth: number,
  style: SubtitleStyle
): { png: Uint8Array; width: number; height: number } | null {
  if (!text.trim()) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = typeof style.fontSize === 'number' ? style.fontSize : 44;
  const font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.font = font;

  const strokeWidth = 2;
  const maxTextWidth = videoWidth - 80;
  const padding = 24;

  const lines = wrapText(ctx, text, maxTextWidth);
  const lineHeight = fontSize * 1.3;
  const textHeight = lines.length * lineHeight;
  const textWidth = Math.min(Math.max(...lines.map((l) => ctx.measureText(l).width)), maxTextWidth);

  const imgW = Math.ceil(textWidth + padding * 2);
  const imgH = Math.ceil(textHeight + padding * 2);

  canvas.width = imgW;
  canvas.height = imgH;

  // Background
  ctx.fillStyle = style.bgColor;
  ctx.fillRect(0, 0, imgW, imgH);

  // Text
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    const x = imgW / 2;
    const y = padding + i * lineHeight;

    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = strokeWidth * 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(line, x, y);

    ctx.fillStyle = style.textColor;
    ctx.fillText(line, x, y);
  });

  // Convert to PNG bytes
  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return { png: bytes, width: imgW, height: imgH };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  if (words.length === 0) return [text];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = current + ' ' + words[i];
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);

  // Character-level fallback for Korean text without spaces
  const result: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      result.push(line);
    } else {
      let buf = '';
      for (const ch of line) {
        const test = buf + ch;
        if (ctx.measureText(test).width > maxWidth && buf) {
          result.push(buf);
          buf = ch;
        } else {
          buf = test;
        }
      }
      if (buf) result.push(buf);
    }
  }

  return result;
}

export function getSubtitleY(position: string, videoHeight: number, subHeight: number): number {
  const margin = 40;
  if (position === 'top') return margin;
  if (position === 'center') return Math.floor((videoHeight - subHeight) / 2);
  return videoHeight - subHeight - margin;
}
