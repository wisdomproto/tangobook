/** Validates every SRT cue, including timestamps. Returns a displayable error or null. */
export function videoSubtitleError(srt: string): string | null {
  const text = srt
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!text) return null;
  let previous = -1;
  for (const cue of text.split(/\n\s*\n/)) {
    const lines = cue.split('\n');
    if (!/^\d+$/.test(lines[0] ?? '') || lines.length < 3 || !lines.slice(2).join('\n').trim())
      return 'SRT 자막의 번호·시간·본문을 확인해 주세요.';
    const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/.exec(
      lines[1] ?? ''
    );
    if (!match) return '자막 시간은 00:00:00,000 --> 00:00:02,000 형식으로 입력해 주세요.';
    const n = match.slice(1).map(Number);
    if ([n[1], n[2], n[5], n[6]].some((v) => v! > 59))
      return '자막 시간의 분·초는 0~59여야 합니다.';
    const start = n[0]! * 3600000 + n[1]! * 60000 + n[2]! * 1000 + n[3]!;
    const end = n[4]! * 3600000 + n[5]! * 60000 + n[6]! * 1000 + n[7]!;
    if (end <= start || start < previous)
      return '자막 시간은 순서대로, 시작보다 끝이 늦게 입력해 주세요.';
    previous = start;
  }
  return null;
}
