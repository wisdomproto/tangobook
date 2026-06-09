import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Copy,
  Check,
  Eye,
  Clock,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { TimelineCard, AddSceneButton, SECTION_TYPES, getSectionInfo } from './YoutubeCardItem';
import { YoutubePreviewDialog } from './YoutubePreviewDialog';
import { ChannelModelSelector } from './ChannelModelSelector';
import { ChannelContentList } from './ChannelContentList';
import { ChannelTranslationView } from './ChannelTranslationView';
import { ImageEditorDialog } from './ImageEditorDialog';
import { PromptEditDialog } from './PromptEditDialog';
import { GenerationButton } from './GenerationButton';
import { ImageCardWidget } from './ImageCardWidget';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { useCardImageGeneration } from '../../hooks/use-card-image-generation';
import { useChannelModels } from '../../api/use-channel-models';
import { useContent } from '../../api/use-contents';
import {
  useCreateYoutubeContent,
  useUpdateYoutubeContent,
  useDeleteYoutubeContent,
  useSetYoutubeCards,
  useAddYoutubeCard,
  useUpdateYoutubeCard,
  useDeleteYoutubeCard,
} from '../../api/use-youtube-contents';
import { supabase } from '../../api/supabase';
import { uploadToR2 } from '../../api/use-r2-upload';
import { base64ToBlob } from '../../lib/image-utils';
import {
  buildYoutubePrompt,
  buildYoutubeImagePrompt,
  buildYoutubeVideoPrompt,
} from '../../lib/prompt-builder';
import { generateId, cn } from '../../lib/utils';
import type {
  Content,
  Project,
  YoutubeContent,
  YoutubeCard,
  BaseArticle,
} from '../../types/database';

// ─── Async user-id helper ─────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

export interface ParsedYoutubeScript {
  video_title?: string;
  video_description?: string;
  video_tags?: string[];
  sections: {
    section_type: string;
    narration_text: string;
    screen_direction: string;
    subtitle_text?: string;
  }[];
}

/** Extract the first `{...}` JSON object from model output and validate it has sections (CF :86-94). */
export function parseYoutubeScript(fullText: string): ParsedYoutubeScript {
  const objMatch = fullText.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error('JSON not found');
  const parsed = JSON.parse(objMatch[0]) as ParsedYoutubeScript;
  if (!parsed.sections?.length) throw new Error('No sections');
  return parsed;
}

/**
 * Map parsed sections → YoutubeCard[] (CF :104-126). The load-bearing detail (spec §7):
 * each card's image_prompt / video_prompt is filled from the two youtube builders.
 * R-A: every card is stamped with user_id (DB col is NOT NULL + RLS).
 */
export function buildYoutubeCardsFromParsed(
  parsed: ParsedYoutubeScript,
  opts: {
    youtubeContentId: string;
    userId: string;
    project: Project;
    imageStyle: string;
    now: string;
  }
): YoutubeCard[] {
  const { youtubeContentId, userId, project, imageStyle, now } = opts;
  return parsed.sections.map((sec, i) => {
    const tempCard = {
      section_type: sec.section_type || 'main',
      narration_text: sec.narration_text || '',
      screen_direction: sec.screen_direction || '',
      subtitle_text: sec.subtitle_text ?? null,
    } as YoutubeCard;
    return {
      id: generateId(),
      user_id: userId,
      youtube_content_id: youtubeContentId,
      section_type: tempCard.section_type,
      narration_text: tempCard.narration_text,
      screen_direction: tempCard.screen_direction,
      subtitle_text: tempCard.subtitle_text,
      image_url: null,
      image_prompt: buildYoutubeImagePrompt(project, tempCard, imageStyle),
      video_prompt: buildYoutubeVideoPrompt(project, tempCard, imageStyle),
      sort_order: i,
      created_at: now,
      updated_at: now,
    };
  });
}

// ─── YoutubePanelInner ────────────────────────────────────────────────────────

interface YoutubePanelInnerProps {
  youtubeContent: YoutubeContent & { cards: YoutubeCard[] };
  content: Content;
  project: Project;
  hasBaseArticle: boolean;
  baseArticle: BaseArticle | null;
  channelModels: ReturnType<typeof useChannelModels>['models'];
}

function YoutubePanelInner({
  youtubeContent,
  content,
  project,
  hasBaseArticle,
  baseArticle,
  channelModels,
}: YoutubePanelInnerProps) {
  const contentId = content.id;

  // Local mirror of cards (sorted by sort_order)
  const [localCards, setLocalCards] = useState<YoutubeCard[]>(() =>
    (youtubeContent.cards ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
  );

  // Re-sync when youtubeContent.id changes (R-H: prevContentIdRef guard)
  const prevContentIdRef = useRef<string | null>(null);
  if (prevContentIdRef.current !== youtubeContent.id) {
    prevContentIdRef.current = youtubeContent.id;
    setLocalCards((youtubeContent.cards ?? []).slice().sort((a, b) => a.sort_order - b.sort_order));
  }

  // Dialog/UI state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Textarea ref for narration auto-resize
  const narrationRef = useRef<HTMLTextAreaElement>(null);

  // Mutation hooks
  const setYoutubeCards = useSetYoutubeCards();
  const addYoutubeCard = useAddYoutubeCard();
  const updateYoutubeCard = useUpdateYoutubeCard();
  const deleteYoutubeCard = useDeleteYoutubeCard();
  const updateYoutubeContent = useUpdateYoutubeContent();

  // ── Auto-select-first effect (CF :62-67) ────────────────────────────────────
  useEffect(() => {
    if (localCards.length === 0) {
      setSelectedCardId(null);
      return;
    }
    const stillExists = localCards.some((c) => c.id === selectedCardId);
    if (!stillExists) {
      setSelectedCardId(localCards[0].id);
    }
  }, [localCards, selectedCardId]);

  // ── Auto-resize narration textarea (CF :70-76) ───────────────────────────────
  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.style.height = 'auto';
      narrationRef.current.style.height = `${narrationRef.current.scrollHeight}px`;
    }
  }, [selectedCardId, localCards]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedCard = localCards.find((c) => c.id === selectedCardId) ?? null;
  const selectedIndex = selectedCard ? localCards.indexOf(selectedCard) : -1;
  const totalChars = localCards.reduce((s, c) => s + (c.narration_text?.length ?? 0), 0);
  const estimatedMinutes = Math.max(1, Math.round(totalChars / 250));
  const selectedSectionInfo = selectedCard ? getSectionInfo(selectedCard.section_type) : null;

  // ── AI 대본 generation ────────────────────────────────────────────────────────
  const { isGenerating, generate, abort } = useAiGeneration({
    onComplete: useCallback(
      async (fullText: string) => {
        try {
          const parsed = parseYoutubeScript(fullText);

          // Update content meta if present (CF :96-102)
          if (parsed.video_title || parsed.video_description || parsed.video_tags) {
            await updateYoutubeContent.mutateAsync({
              id: youtubeContent.id,
              contentId,
              updates: {
                ...(parsed.video_title ? { video_title: parsed.video_title } : {}),
                ...(parsed.video_description
                  ? { video_description: parsed.video_description }
                  : {}),
                ...(parsed.video_tags ? { video_tags: parsed.video_tags } : {}),
              },
            });
          }

          const userId = await getCurrentUserId(); // R-A
          const now = new Date().toISOString();
          const newCards = buildYoutubeCardsFromParsed(parsed, {
            youtubeContentId: youtubeContent.id,
            userId,
            project,
            imageStyle: channelModels.imageStyle,
            now,
          });

          setLocalCards(newCards);
          setSelectedCardId(newCards[0]?.id ?? null);
          await setYoutubeCards.mutateAsync({
            youtubeContentId: youtubeContent.id,
            contentId,
            cards: newCards,
          });
        } catch {
          alert('대본 파싱 실패. 다시 시도해 주세요.'); // CF :130-132
        }
      },
      [youtubeContent.id, contentId, project, channelModels.imageStyle]
    ),
    onError: useCallback((err: string) => {
      alert(`AI 생성 오류: ${err}`);
    }, []),
  });

  const handleGenerate = () => {
    const prompt = buildYoutubePrompt({
      project,
      content,
      baseArticle: baseArticle ?? undefined, // fidelity #1 (baseArticle injection)
      youtubeContent, // target_duration → short/mid/long guidance
    });
    setGeneratedPrompt(prompt);
    setShowPromptDialog(true);
  };

  const handleStartGeneration = (prompt: string) => generate(prompt, channelModels.textModel);

  // ── Per-card image generation (R-B) ─────────────────────────────────────────
  const {
    isGenerating: isGeneratingImage,
    progress: imageProgress,
    generateForCard,
    generateAll,
    abort: abortImageGeneration,
  } = useCardImageGeneration({
    projectId: project.id,
    category: 'images',
    getPrompt: (cardId: string) => {
      const c = localCards.find((x) => x.id === cardId);
      return c?.image_prompt || buildYoutubeImagePrompt(project, c!, channelModels.imageStyle);
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '16:9',
    shouldSkip: (cardId: string) => !!localCards.find((x) => x.id === cardId)?.image_url,
    onSave: async (cardId: string, url: string, prompt: string) => {
      setLocalCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, image_url: url, image_prompt: prompt } : c))
      );
      await updateYoutubeCard.mutateAsync({
        cardId,
        contentId,
        updates: { image_url: url, image_prompt: prompt },
      });
    },
  });

  const handleGenerateCardImage = (cardId: string) => {
    setGeneratingCardId(cardId);
    generateForCard(cardId).finally(() => setGeneratingCardId(null));
  };

  const handleGenerateAllImages = () => generateAll(localCards.map((c) => c.id));

  // ── Card edit handlers (R-F debounce) ────────────────────────────────────────
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const TEXT_FIELDS = new Set([
    'narration_text',
    'screen_direction',
    'subtitle_text',
    'image_prompt',
    'video_prompt',
  ]);

  const handleCardUpdate = useCallback(
    (cardId: string, updates: Partial<YoutubeCard>) => {
      setLocalCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
      const isTextOnly = Object.keys(updates).every((k) => TEXT_FIELDS.has(k));
      if (isTextOnly) {
        const existing = debounceTimers.current.get(cardId);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          debounceTimers.current.delete(cardId);
          updateYoutubeCard.mutate({ cardId, contentId, updates });
        }, 400);
        debounceTimers.current.set(cardId, timer);
      } else {
        // section_type / image_url → immediate
        updateYoutubeCard.mutate({ cardId, contentId, updates });
      }
    },
    [contentId, updateYoutubeCard]
  );

  const handleCardDelete = useCallback(
    (cardId: string) => {
      const remaining = localCards.filter((c) => c.id !== cardId);
      setLocalCards(remaining);
      deleteYoutubeCard.mutate({ cardId, contentId });
      if (selectedCardId === cardId) {
        setSelectedCardId(remaining[0]?.id ?? null);
      }
    },
    [contentId, deleteYoutubeCard, localCards, selectedCardId]
  );

  const handleSaveEditedScene = async (dataUrl: string) => {
    if (!selectedCard) return;
    try {
      const blob = base64ToBlob(dataUrl);
      const { publicUrl } = await uploadToR2(blob, {
        projectId: project.id,
        category: 'images',
        contentType: 'image/webp',
        contentId,
      });
      handleCardUpdate(selectedCard.id, { image_url: publicUrl }); // existing write path (immediate)
    } catch (err) {
      alert(`이미지 저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddSection = async () => {
    const id = await addYoutubeCard.mutateAsync({
      youtubeContentId: youtubeContent.id,
      contentId,
      sortOrder: localCards.length,
    });
    const userId = await getCurrentUserId().catch(() => '');
    const now = new Date().toISOString();
    setLocalCards((prev) => [
      ...prev,
      {
        id,
        user_id: userId,
        youtube_content_id: youtubeContent.id,
        section_type: 'main',
        narration_text: '',
        screen_direction: '',
        subtitle_text: null,
        image_url: null,
        image_prompt: null,
        video_prompt: null,
        sort_order: prev.length,
        created_at: now,
        updated_at: now,
      },
    ]);
    setSelectedCardId(id);
  };

  // ── Nav handlers ─────────────────────────────────────────────────────────────
  const handlePrevCard = () => {
    if (selectedIndex > 0) setSelectedCardId(localCards[selectedIndex - 1].id);
  };
  const handleNextCard = () => {
    if (selectedIndex < localCards.length - 1) setSelectedCardId(localCards[selectedIndex + 1].id);
  };

  // ── 전체 복사 ─────────────────────────────────────────────────────────────────
  const handleCopyAll = async () => {
    const sectionTexts = localCards.map((card, i) => {
      const typeLabel = (card.section_type ?? 'main').toUpperCase();
      const parts = [`[${i + 1}] ${typeLabel}`, `나레이션: ${card.narration_text || ''}`];
      if (card.screen_direction) parts.push(`화면: ${card.screen_direction}`);
      if (card.subtitle_text) parts.push(`자막: ${card.subtitle_text}`);
      return parts.join('\n');
    });
    const fullText = [
      ...(youtubeContent.video_title ? [`# ${youtubeContent.video_title}`] : []),
      ...sectionTexts,
    ].join('\n\n---\n\n');
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Video Settings collapsible (CF :230-278) */}
      <div className="border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
          onClick={() => setShowVideoSettings((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <span>영상 설정</span>
            {youtubeContent.video_title && (
              <span className="text-xs text-muted-foreground truncate max-w-48">
                {youtubeContent.video_title}
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className={cn(
              'text-muted-foreground transition-transform',
              showVideoSettings ? 'rotate-180' : ''
            )}
          />
        </button>

        {showVideoSettings && (
          <div className="p-3 space-y-3 border-t">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                영상 제목
              </label>
              <Input
                placeholder="유튜브 영상 제목"
                defaultValue={youtubeContent.video_title ?? ''}
                onBlur={(e) =>
                  updateYoutubeContent.mutate({
                    id: youtubeContent.id,
                    contentId,
                    updates: { video_title: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                영상 길이
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                defaultValue={youtubeContent.target_duration ?? 'mid'}
                onChange={(e) =>
                  updateYoutubeContent.mutate({
                    id: youtubeContent.id,
                    contentId,
                    updates: {
                      target_duration: e.target.value as 'short' | 'mid' | 'long',
                    },
                  })
                }
              >
                <option value="short">숏폼 1~3분</option>
                <option value="mid">표준 5~10분</option>
                <option value="long">롱폼 15~30분</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                태그 (쉼표 구분)
              </label>
              <Input
                placeholder="태그1, 태그2, 태그3"
                defaultValue={(youtubeContent.video_tags ?? []).join(', ')}
                onBlur={(e) =>
                  updateYoutubeContent.mutate({
                    id: youtubeContent.id,
                    contentId,
                    updates: {
                      video_tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                영상 설명
              </label>
              <Textarea
                placeholder="유튜브 영상 설명"
                defaultValue={youtubeContent.video_description ?? ''}
                rows={3}
                onBlur={(e) =>
                  updateYoutubeContent.mutate({
                    id: youtubeContent.id,
                    contentId,
                    updates: { video_description: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Action bar (CF :280-325) */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {localCards.length > 0 && (
            <>
              <Badge variant="secondary" className="text-xs">
                {localCards.length}개 씬
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock size={10} />~{estimatedMinutes}분
              </Badge>
            </>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <GenerationButton
            variant="text"
            isGenerating={isGenerating}
            disabled={!hasBaseArticle}
            onClick={handleGenerate}
            onAbort={abort}
            label="AI 대본"
            loadingLabel="대본 생성 중..."
            className={!isGenerating ? 'bg-red-600 hover:bg-red-700 text-white' : undefined}
          />
          <GenerationButton
            variant="batch-image"
            isGenerating={isGeneratingImage}
            disabled={localCards.length === 0}
            onClick={handleGenerateAllImages}
            onAbort={abortImageGeneration}
            progress={imageProgress}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={localCards.length === 0}
            className="gap-1.5"
          >
            <Eye size={14} /> 미리보기
          </Button>
          {localCards.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '복사됨!' : '전체 복사'}
            </Button>
          )}
        </div>
      </div>

      {/* No base article hint (CF :328-330) */}
      {!hasBaseArticle && (
        <p className="text-sm text-muted-foreground">기본 글을 먼저 작성해 주세요.</p>
      )}

      {/* Preview + Script Editor 2-col (CF :333-469) */}
      {localCards.length > 0 && selectedCard && (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Left 3/5: image widget + navigation */}
          <div className="lg:col-span-3 space-y-2">
            <div className="relative">
              {/* Section badge overlay */}
              {selectedSectionInfo && (
                <div
                  className={cn(
                    'absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-semibold text-white leading-none',
                    selectedSectionInfo.color
                  )}
                >
                  {selectedSectionInfo.label}
                </div>
              )}
              <ImageCardWidget
                src={selectedCard.image_url ?? undefined}
                alt={`씬 ${selectedIndex + 1}`}
                aspectClass="aspect-video"
                isGenerating={generatingCardId === selectedCard.id}
                onRegenerate={() => handleGenerateCardImage(selectedCard.id)}
                onAbort={abortImageGeneration}
                onDelete={() =>
                  updateYoutubeCard.mutate({
                    cardId: selectedCard.id,
                    contentId,
                    updates: { image_url: null },
                  })
                }
                onUpload={(file) => {
                  const r = new FileReader();
                  r.onload = () =>
                    handleCardUpdate(selectedCard.id, { image_url: r.result as string });
                  r.readAsDataURL(file);
                }}
                onEdit={selectedCard.image_url ? () => setEditorOpen(true) : undefined}
              />
              {selectedCard.image_url && (
                <ImageEditorDialog
                  open={editorOpen}
                  onOpenChange={setEditorOpen}
                  src={selectedCard.image_url}
                  onSave={handleSaveEditedScene}
                />
              )}
            </div>

            {/* Prev/next nav */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevCard}
                disabled={selectedIndex <= 0}
                className="gap-1"
              >
                <ChevronLeft size={14} /> 이전 씬
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedIndex + 1} / {localCards.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextCard}
                disabled={selectedIndex >= localCards.length - 1}
                className="gap-1"
              >
                다음 씬 <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          {/* Right 2/5: script fields */}
          <div className="lg:col-span-2 space-y-3">
            {/* Section type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                씬 타입
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={selectedCard.section_type ?? 'main'}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, { section_type: e.target.value })
                }
              >
                {SECTION_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Narration */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                나레이션 ({selectedCard.narration_text?.length ?? 0}자)
              </label>
              <textarea
                ref={narrationRef}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-hidden"
                value={selectedCard.narration_text ?? ''}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, { narration_text: e.target.value })
                }
                placeholder="나레이터가 읽을 텍스트"
                rows={4}
              />
            </div>

            {/* Screen direction */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                화면 디렉션
              </label>
              <Textarea
                value={selectedCard.screen_direction ?? ''}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, { screen_direction: e.target.value })
                }
                placeholder="화면에 보여줄 것 (B-roll, 텍스트 오버레이 등)"
                rows={2}
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">자막</label>
              <Input
                value={selectedCard.subtitle_text ?? ''}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, {
                    subtitle_text: e.target.value || null,
                  })
                }
                placeholder="화면에 표시할 자막 텍스트"
              />
            </div>

            {/* Image prompt */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                이미지 프롬프트
              </label>
              <Textarea
                value={selectedCard.image_prompt ?? ''}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, { image_prompt: e.target.value })
                }
                placeholder="씬 스틸 이미지 생성 프롬프트"
                rows={2}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-1.5 gap-1.5 w-full"
                onClick={() => handleGenerateCardImage(selectedCard.id)}
                disabled={isGeneratingImage}
              >
                {generatingCardId === selectedCard.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ImageIcon size={12} />
                )}
                {selectedCard.image_url ? '이미지 재생성' : '이미지 생성'}
              </Button>
            </div>

            {/* Video prompt */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                영상 프롬프트
              </label>
              <Textarea
                value={selectedCard.video_prompt ?? ''}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.id, { video_prompt: e.target.value })
                }
                placeholder="영상 편집 모션 가이드"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timeline (CF :471-491) */}
      {localCards.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {localCards.map((card, i) => (
            <TimelineCard
              key={card.id}
              card={card}
              index={i}
              isSelected={card.id === selectedCardId}
              onClick={() => setSelectedCardId(card.id)}
              onDelete={handleCardDelete}
            />
          ))}
          {hasBaseArticle && <AddSceneButton onAdd={handleAddSection} />}
        </div>
      )}

      {/* Empty state (CF :493-500) */}
      {localCards.length === 0 && hasBaseArticle && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            AI 대본을 생성하거나 수동으로 씬을 추가하세요
          </p>
          <Button variant="outline" size="sm" onClick={handleAddSection}>
            씬 추가
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <PromptEditDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        initialPrompt={generatedPrompt}
        onConfirm={(prompt) => handleStartGeneration(prompt)}
      />
      <YoutubePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        cards={localCards}
        videoTitle={youtubeContent.video_title}
      />
    </div>
  );
}

// ─── YoutubePanel (outer) ─────────────────────────────────────────────────────

interface YoutubePanelProps {
  content: Content;
  project: Project;
}

export function YoutubePanel({ content, project }: YoutubePanelProps) {
  const { data: contentGraph } = useContent(content.id);
  const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'youtube');

  const createYoutubeContent = useCreateYoutubeContent();
  const deleteYoutubeContent = useDeleteYoutubeContent();
  const updateYoutubeContent = useUpdateYoutubeContent();

  const youtubeContents = (contentGraph?.youtubeContents ?? []) as Array<
    YoutubeContent & { cards: YoutubeCard[] }
  >;

  const hasBaseArticle = Boolean(contentGraph?.baseArticle);
  const baseArticle = contentGraph?.baseArticle ?? null; // fidelity #1 — forwarded into inner

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Channel model selector */}
      <div className="p-3 border-b border-border shrink-0">
        <ChannelModelSelector
          textModel={channelModels.textModel}
          imageModel={channelModels.imageModel}
          showImageModel
          aspectRatio={channelModels.aspectRatio}
          imageStyle={channelModels.imageStyle}
          defaultAspectRatio="16:9"
          onTextModelChange={(m) => setChannelModels({ textModel: m })}
          onImageModelChange={(m) => setChannelModels({ imageModel: m })}
          onAspectRatioChange={(r) => setChannelModels({ aspectRatio: r })}
          onImageStyleChange={(s) => setChannelModels({ imageStyle: s })}
        />
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3">
        <ChannelTranslationView contentId={content.id} channel="youtube" />
        <ChannelContentList<YoutubeContent & { cards: YoutubeCard[] }>
          items={youtubeContents}
          getId={(yc) => yc.id}
          getTitle={(yc) => yc.title || '유튜브 대본'} // R-D: 1-arg getTitle
          onTitleChange={(id, title) =>
            updateYoutubeContent.mutate({ id, contentId: content.id, updates: { title } })
          }
          onAdd={() => createYoutubeContent.mutateAsync({ contentId: content.id })} // R-D: Promise<string>
          onDelete={(id) => deleteYoutubeContent.mutate({ id, contentId: content.id })}
          addLabel="새 유튜브 대본 추가"
          accentColor="border-l-4 border-l-red-600"
          renderContent={(yc) => (
            <YoutubePanelInner
              key={yc.id}
              youtubeContent={yc}
              content={content}
              project={project}
              hasBaseArticle={hasBaseArticle}
              baseArticle={baseArticle}
              channelModels={channelModels}
            />
          )}
        />
      </div>
    </div>
  );
}
