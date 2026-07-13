import { generateTextWithGemini } from '../providers/gemini.provider.js';

export const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  vi: 'Vietnamese',
  th: 'Thai',
  ms: 'Malay',
  id: 'Indonesian',
};

/**
 * Translate SRT subtitle content to a target language using Gemini AI.
 * Preserves SRT format (index numbers, timestamps, blank lines).
 */
export async function translateSrt(
  srtContent: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const sourceName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage;
  const targetName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

  const prompt = [
    `Translate the following SRT subtitle file from ${sourceName} to ${targetName}.`,
    '',
    'RULES:',
    '- Keep the SRT format EXACTLY the same.',
    '- Preserve ALL index numbers, timestamps, and blank lines.',
    '- Only translate the text content lines.',
    '- Do NOT add any explanation or markdown formatting.',
    '- Return ONLY the translated SRT file content.',
    '',
    '=== SRT FILE ===',
    srtContent,
  ].join('\n');

  const result = await generateTextWithGemini(prompt, 3);

  // Clean up any markdown code block wrapping
  const cleaned = result
    .replace(/```(?:srt)?\s*/g, '')
    .replace(/```\s*$/g, '')
    .trim();

  // Validate: count entries in source and result
  const sourceCount = (srtContent.match(/^\d+$/gm) || []).length;
  const resultCount = (cleaned.match(/^\d+$/gm) || []).length;

  if (resultCount !== sourceCount && resultCount > 0) {
    console.warn(
      `[srt-translator] Entry count mismatch: source=${sourceCount}, result=${resultCount} (${sourceName}→${targetName})`
    );
  }

  return cleaned;
}
