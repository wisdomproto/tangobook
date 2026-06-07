/**
 * Channel translator — translates channel HTML via the AI SSE route and persists
 * the result to R2 + `mkt_translations` (single-owner RLS table).
 *
 * Phase 1d fixes applied (spec §4.4, §11):
 *   C-1: table was `translations` → now `mkt_translations`
 *   C-2: insert now stamps `user_id` (RLS with check)
 *   C-3: streamTranslate builds the prompt CLIENT-SIDE via buildTranslationPrompt
 *        and POSTs {prompt,model} to /api/mkt/ai/translate (not the CF shape)
 *   drop: _setUploadToR2 bridge removed → direct import from api/use-r2-upload
 */
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from '../api/supabase';
import { fetchSSEText } from './sse-stream-parser';
import { uploadToR2 } from '../api/use-r2-upload';
import { buildTranslationPrompt } from './translation-prompt-builder';
import type { BlogCard, InstagramCard, ThreadsCard, YoutubeCard, Project } from '../types/database';

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
  th: 'Thai',
  ja: 'Japanese',
  zh: 'Chinese',
  ms: 'Malay',
  id: 'Indonesian',
};

export type ChannelKind =
  | 'base'
  | 'naver_blog'
  | 'self_hosted'
  | 'instagram'
  | 'threads'
  | 'youtube';

export interface ChannelTranslationInput {
  projectId: string;
  contentId: string;
  project: Project;
  targetLang: string;
  channel: ChannelKind;
  /** HTML/text source to translate. Must be ready-to-translate. */
  sourceHtml: string;
  /** `true` for Naver blog to apply Naver-specific formatting. */
  isNaver?: boolean;
  /** Optional model override (e.g. 'gemini-2.5-flash-lite'). */
  model?: string;
}

/**
 * Builds the full translation prompt CLIENT-SIDE (the worktree `/api/mkt/ai/translate`
 * controller only reads `{prompt,model}` and calls streamGenerate — it does NOT build a
 * prompt server-side, unlike CF). Composes the buildTranslationPrompt system prompt with
 * the source text and streams the result. (spec §4.4 — the C-3 contract fix.)
 */
function streamTranslate(input: {
  text: string;
  targetLang: string;
  channelType: string;
  project?: Project;
  isNaver?: boolean;
  model?: string;
}): Promise<string> {
  const systemPrompt = buildTranslationPrompt({
    sourceLanguage: 'ko',
    targetLanguage: input.targetLang,
    channelType: input.channelType,
    project: input.project,
    isNaver: input.isNaver,
  });
  const prompt = `${systemPrompt}\n\n---\n${input.text}`;
  return fetchSSEText('/api/mkt/ai/translate', {
    prompt,
    ...(input.model ? { model: input.model } : {}),
  });
}

async function uploadHtmlToR2(params: {
  projectId: string;
  contentId: string;
  channel: ChannelKind;
  targetLang: string;
  html: string;
}): Promise<string> {
  const { projectId, contentId, channel, targetLang, html } = params;
  const blob = new Blob([html], { type: 'text/html' });
  const { publicUrl } = await uploadToR2(blob, {
    projectId,
    category: 'content',
    fileName: `${contentId}_${channel}_${targetLang}.html`,
    contentType: 'text/html',
    contentId,
  });
  return publicUrl;
}

/**
 * Translates the given channel source HTML and persists the result to R2
 * plus a row in `mkt_translations`. Returns the public R2 URL. (spec §4.3)
 */
export async function translateAndSaveChannel(input: ChannelTranslationInput): Promise<string> {
  const translated = await streamTranslate({
    text: input.sourceHtml.slice(0, 16000), // CF parity (R-1d-6 — large-article truncation)
    targetLang: input.targetLang,
    channelType: input.channel,
    project: input.project,
    isNaver: input.isNaver,
    model: input.model,
  });

  const publicUrl = await uploadHtmlToR2({
    projectId: input.projectId,
    contentId: input.contentId,
    channel: input.channel,
    targetLang: input.targetLang,
    html: translated,
  });

  // Upsert on (content_id, language, channel_type) — body holds the R2 URL.
  const { data: existing } = await supabase
    .from('mkt_translations') // C-1
    .select('id')
    .eq('content_id', input.contentId)
    .eq('language', input.targetLang)
    .eq('channel_type', input.channel)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('mkt_translations') // C-1
      .update({
        status: 'completed',
        body: publicUrl,
        translated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    const userId = await getCurrentUserId(); // C-2 — RLS with check (user_id = auth.uid())
    await supabase.from('mkt_translations').insert({
      user_id: userId,
      content_id: input.contentId,
      language: input.targetLang,
      channel_type: input.channel,
      status: 'completed',
      body: publicUrl,
      translated_at: new Date().toISOString(),
    });
  }

  return publicUrl;
}

/* ─── Channel-specific HTML builders ─────────────────────────── */

export function buildBlogCardsHtml(cards: BlogCard[]): string {
  const parts: string[] = [];
  for (const card of cards) {
    const c = card.content as Record<string, unknown>;
    const text = (c?.text as string) || '';
    const imgUrl = (c?.url as string) || '';
    const alt = (c?.alt as string) || '';
    const caption = (c?.caption as string) || '';
    if (text) parts.push(text);
    if (imgUrl) {
      parts.push(
        `<figure><img src="${imgUrl}" alt="${alt}" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
      );
    }
  }
  return parts.join('\n\n');
}

export function buildCardnewsHtml(cards: InstagramCard[], caption?: string | null): string {
  const parts: string[] = [];
  if (caption) parts.push(`<p data-role="caption">${caption}</p>`);
  cards
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((card, i) => {
      const style = (card.text_style as Record<string, unknown>) || {};
      const header = (style.header as string) || '';
      const title = (style.title as string) || '';
      const body = (style.body as string) || card.text_content || '';
      const footer = (style.footer as string) || '';
      parts.push(
        `<section data-slide="${i + 1}">` +
          (header ? `<p data-role="header">${header}</p>` : '') +
          (title ? `<h3 data-role="title">${title}</h3>` : '') +
          (body ? `<p data-role="body">${body}</p>` : '') +
          (footer ? `<p data-role="footer">${footer}</p>` : '') +
          `</section>`
      );
    });
  return parts.join('\n\n');
}

export function buildThreadsHtml(cards: ThreadsCard[]): string {
  return cards
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c, i) => `<section data-post="${i + 1}"><p>${c.text_content || ''}</p></section>`)
    .join('\n\n');
}

export function buildYoutubeHtml(cards: YoutubeCard[]): string {
  return cards
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c, i) => {
      const narration = c.narration_text || '';
      const subtitle = c.subtitle_text || '';
      const direction = c.screen_direction || '';
      return (
        `<section data-scene="${i + 1}">` +
        (subtitle ? `<h4 data-role="subtitle">${subtitle}</h4>` : '') +
        (narration ? `<p data-role="narration">${narration}</p>` : '') +
        (direction ? `<p data-role="direction"><em>${direction}</em></p>` : '') +
        `</section>`
      );
    })
    .join('\n\n');
}

/** Resolve the saved R2 URL for a (content, channel, language). */
export async function getChannelTranslationUrl(
  contentId: string,
  language: string,
  channel: ChannelKind
): Promise<string | null> {
  if (language === 'ko') return null;
  const { data } = await supabase
    .from('mkt_translations') // C-1
    .select('body')
    .eq('content_id', contentId)
    .eq('language', language)
    .eq('channel_type', channel)
    .eq('status', 'completed')
    .maybeSingle();
  return (data?.body as string) || null;
}

export function languageLabel(lang: string): string {
  return LANG_NAMES[lang] || lang.toUpperCase();
}
