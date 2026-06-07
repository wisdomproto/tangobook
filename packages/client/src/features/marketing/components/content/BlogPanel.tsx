import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChannelTranslationView } from './ChannelTranslationView';
import { Loader2, Monitor, Smartphone, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { WorkflowStepBar, type WorkflowStep } from './WorkflowStepBar';
import { NaverKeywordPanel } from './NaverKeywordPanel';
import { SeoScoreDisplay } from './SeoScoreDisplay';
import { ChannelModelSelector } from './ChannelModelSelector';
import { ChannelContentList } from './ChannelContentList';
import {
  BlogCardItem,
  AddCardButton,
  formatForMobile,
  type GlobalCardStyleVars,
} from './BlogCardItem';
import { BlogPreviewDialog } from './BlogPreviewDialog';
import { GenerationButton } from './GenerationButton';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { useCardImageGeneration } from '../../hooks/use-card-image-generation';
import { useChannelModels } from '../../api/use-channel-models';
import { useContent } from '../../api/use-contents';
import {
  useCreateBlogContent,
  useUpdateBlogContent,
  useDeleteBlogContent,
  useSetBlogCards,
  useAddBlogCard,
  useDeleteBlogCard,
  useUpdateBlogCard,
} from '../../api/use-blog-contents';
import { supabase } from '../../api/supabase';
import { useUIStore } from '../../store/ui-store';
import { buildBlogPrompt, buildBlogImagePromptForCard } from '../../lib/prompt-builder';
import { calculateNaverSeoScore } from '../../lib/seo-scorer';
import { buildSeoFeedback } from '../../lib/seo-feedback';
import { generateId } from '../../lib/utils';
import type { BlogContent, BlogCard, Content, Project } from '../../types/database';

// ─── Workflow steps ───────────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  { step: 1 as WorkflowStep, label: '키워드', icon: '🔍' },
  { step: 2 as WorkflowStep, label: '구조', icon: '📋' },
  { step: 3 as WorkflowStep, label: '생성', icon: '✍️' },
  { step: 4 as WorkflowStep, label: 'SEO', icon: '📊' },
];

const DEFAULT_MAX_RETRIES = 3;

// ─── Async user-id helper (same pattern as use-blog-contents.ts) ──────────────

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

// ─── BlogPanelInner ───────────────────────────────────────────────────────────

interface BlogPanelInnerProps {
  blogContent: BlogContent & { cards: BlogCard[] };
  content: Content;
  project: Project;
  hasBaseArticle: boolean;
  channelModels: ReturnType<typeof useChannelModels>['models'];
  maxRetries?: number;
}

function BlogPanelInner({
  blogContent,
  content,
  project,
  hasBaseArticle,
  channelModels,
  maxRetries = DEFAULT_MAX_RETRIES,
}: BlogPanelInnerProps) {
  const contentId = content.id;
  const blogContentId = blogContent.id;

  const cards: BlogCard[] = blogContent.cards ?? [];

  // ── Step state ────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(() => {
    // Auto-jump to step 3 if cards already exist
    return cards.length > 0 ? 3 : 1;
  });

  // ── Keyword state ─────────────────────────────────────────────────────────
  const [primary, setPrimary] = useState<string>(blogContent.primary_keyword ?? '');
  const [secondary, setSecondary] = useState<string[]>(blogContent.secondary_keywords ?? []);
  const [seoTitle, setSeoTitle] = useState<string>(blogContent.seo_title ?? '');
  const [secondaryInput, setSecondaryInput] = useState('');

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'pc' | 'mobile'>('pc');

  // ── GlobalCardStyle persisted via seo_details.globalStyle ─────────────────
  const [globalStyle, setGlobalStyle] = useState<GlobalCardStyleVars>(() => {
    const details = blogContent.seo_details as Record<string, unknown> | null;
    return (details?.globalStyle as GlobalCardStyleVars) ?? {};
  });

  // ── Preview dialog ────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Local card state (mirrors server, updated optimistically) ─────────────
  const [localCards, setLocalCards] = useState<BlogCard[]>(cards);
  useEffect(() => {
    setLocalCards(blogContent.cards ?? []);
  }, [blogContent.cards]);

  // ── SEO retry counter ─────────────────────────────────────────────────────
  const retryCountRef = useRef(0);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const setBlogCards = useSetBlogCards();
  const addBlogCard = useAddBlogCard();
  const deleteBlogCard = useDeleteBlogCard();
  const updateBlogCard = useUpdateBlogCard();
  const updateBlogContent = useUpdateBlogContent();

  // ── Live SEO score ────────────────────────────────────────────────────────
  const seoResult = useMemo(
    () =>
      calculateNaverSeoScore(seoTitle, localCards, {
        primary,
        secondary,
      }),
    [seoTitle, localCards, primary, secondary]
  );

  // ── generateRef indirection (stable ref for the retry loop) ──────────────
  const generateRef = useRef<((prompt: string, model: string) => void) | null>(null);

  // ── AI generation ─────────────────────────────────────────────────────────
  const { isGenerating, generate, abort } = useAiGeneration({
    onChunk: useCallback((_accumulated: string) => {
      // Streaming preview not needed for JSON output
    }, []),
    onComplete: useCallback(
      async (fullText: string) => {
        // ── Step 1: Parse JSON (object or array) ──────────────────────────
        let seoTitleOut = seoTitle;
        let primaryOut = primary;
        let secondaryOut = secondary;
        let sections: Array<{
          text?: string;
          alt?: string;
          caption?: string;
          image_prompt?: string;
          image_style?: string;
        }> = [];

        try {
          let parsed: unknown = null;
          const objMatch = fullText.match(/\{[\s\S]*\}/);
          const arrMatch = fullText.match(/\[[\s\S]*\]/);

          if (objMatch) {
            try {
              parsed = JSON.parse(objMatch[0]);
            } catch {
              // Try to clean and parse
              const cleaned = objMatch[0];
              try {
                parsed = JSON.parse(cleaned);
              } catch {
                parsed = null;
              }
            }
          }

          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            seoTitleOut = (obj.seo_title as string) || seoTitle;
            primaryOut = (obj.primary_keyword as string) || primary;
            secondaryOut = (obj.secondary_keywords as string[]) || secondary;
            sections = (obj.sections as typeof sections) || [];
          } else if (!parsed && arrMatch) {
            // Bare array format
            try {
              sections = JSON.parse(arrMatch[0]) as typeof sections;
            } catch {
              sections = [];
            }
          }

          if (sections.length === 0) {
            throw new Error('섹션이 없습니다');
          }

          // ── Step 2: Build BlogCard[] with user_id ─────────────────────
          const userId = await getCurrentUserId();
          const now = new Date().toISOString();
          const newCards: BlogCard[] = sections.map((s, i) => {
            const text = formatForMobile(s.text ?? '');
            return {
              id: generateId(),
              blog_content_id: blogContentId,
              user_id: userId,
              card_type: 'text' as const,
              content: {
                text,
                url: '',
                alt: s.alt ?? '',
                caption: s.caption ?? '',
                image_prompt: s.image_prompt ?? '',
                image_style: s.image_style ?? '',
              },
              sort_order: i,
              created_at: now,
              updated_at: now,
            };
          });

          // ── Step 3: Persist cards ─────────────────────────────────────
          setLocalCards(newCards);
          await setBlogCards.mutateAsync({ blogContentId, contentId, cards: newCards });

          // ── Step 4: Persist SEO meta ──────────────────────────────────
          const kwUpdates = { primary: primaryOut, secondary: secondaryOut };
          setSeoTitle(seoTitleOut);
          setPrimary(primaryOut);
          setSecondary(secondaryOut);
          await updateBlogContent.mutateAsync({
            id: blogContentId,
            contentId,
            updates: {
              seo_title: seoTitleOut,
              primary_keyword: primaryOut,
              secondary_keywords: secondaryOut,
              naver_keywords: kwUpdates as unknown as Record<string, unknown>,
            },
          });

          // ── Step 5: SEO auto-retry loop ───────────────────────────────
          const seoCheck = calculateNaverSeoScore(seoTitleOut, newCards, {
            primary: primaryOut,
            secondary: secondaryOut,
          });
          const totalMax = seoCheck.details.reduce((s, d) => s + d.maxScore, 0);
          const ratio = totalMax > 0 ? seoCheck.score / totalMax : 1;
          const feedback = buildSeoFeedback(seoCheck.details);

          if (feedback && ratio < 0.9 && maxRetries > 0 && retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            const retryN = retryCountRef.current;
            const seoFixPrompt =
              buildBlogPrompt({
                project,
                content,
                seoTitle: seoTitleOut,
                keywords: { primary: primaryOut, secondary: secondaryOut },
              }) +
              `\n\n## ⚠️ SEO 점수 개선 필요 (재생성 ${retryN}/${maxRetries}회)\n현재 총점: ${seoCheck.score}/${totalMax} (이미지 제외)\n아래 항목을 개선하세요:\n${feedback}\n이전 응답의 전체 구조는 유지하되 위 항목만 집중 개선하세요.`;
            setTimeout(() => generateRef.current?.(seoFixPrompt, channelModels.textModel), 100);
          } else {
            retryCountRef.current = 0;
            setCurrentStep(4);
          }
        } catch {
          retryCountRef.current = 0;
          alert('블로그 섹션 파싱 실패. 다시 시도해 주세요.');
        }
      },
      // deps: all values read inside; retryCountRef is a ref (stable)
      [
        seoTitle,
        primary,
        secondary,
        blogContentId,
        contentId,
        project,
        content,
        channelModels.textModel,
        maxRetries,
        setBlogCards,
        updateBlogContent,
      ]
    ),
    onError: useCallback((msg: string) => {
      retryCountRef.current = 0;
      alert(`생성 오류: ${msg}`);
    }, []),
  });

  // Keep generateRef stable
  useEffect(() => {
    generateRef.current = generate;
  }, [generate]);

  // ── Image generation ──────────────────────────────────────────────────────
  const {
    isGenerating: isGeneratingImages,
    progress: imgProgress,
    generateForCard,
    generateAll,
    abort: abortImages,
  } = useCardImageGeneration({
    projectId: project.id,
    category: 'images',
    getPrompt: (cardId) => {
      const idx = localCards.findIndex((c) => c.id === cardId);
      const card = localCards[idx];
      const c = card?.content as { image_prompt?: string; image_style?: string } | undefined;
      if (c?.image_prompt) {
        return `${channelModels.imageStyle ? channelModels.imageStyle + '. ' : ''}${c.image_prompt}`;
      }
      return buildBlogImagePromptForCard(
        project,
        localCards,
        idx >= 0 ? idx : 0,
        channelModels.imageStyle,
        channelModels.imageInstruction
      );
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '16:9',
    shouldSkip: (cardId) => {
      const card = localCards.find((c) => c.id === cardId);
      const url = (card?.content as { url?: string })?.url;
      return Boolean(url && url.trim().length > 0);
    },
    onSave: async (cardId, url, _prompt) => {
      await updateBlogCard.mutateAsync({
        cardId,
        contentId,
        updates: { content: { ...(localCards.find((c) => c.id === cardId)?.content ?? {}), url } },
      });
    },
  });

  // ── Generate handler ──────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    retryCountRef.current = 0;
    const prompt = buildBlogPrompt({
      project,
      content,
      seoTitle,
      keywords: { primary, secondary },
    });
    generate(prompt, channelModels.textModel);
    setCurrentStep(3);
  }, [project, content, seoTitle, primary, secondary, channelModels.textModel, generate]);

  // ── Apply mobile format to all cards ─────────────────────────────────────
  const handleApplyMobileFormat = useCallback(() => {
    const reformatted = localCards.map((card) => {
      const c = card.content as { text?: string };
      if (!c.text) return card;
      return {
        ...card,
        content: { ...card.content, text: formatForMobile(c.text) },
      };
    });
    setLocalCards(reformatted);
    // Persist each card individually
    reformatted.forEach((card) => {
      updateBlogCard.mutate({
        cardId: card.id,
        contentId,
        updates: { content: card.content },
      });
    });
  }, [localCards, contentId, updateBlogCard]);

  // ── Add card manually ─────────────────────────────────────────────────────
  const handleAddCard = useCallback(async () => {
    await addBlogCard.mutateAsync({
      blogContentId,
      contentId,
      cardType: 'text',
      sortOrder: localCards.length,
    });
  }, [addBlogCard, blogContentId, contentId, localCards.length]);

  // ── Card update (local + debounced persist handled inside BlogCardItem) ────
  const handleCardUpdate = useCallback(
    (
      cardId: string,
      partial: Partial<{
        text: string;
        url: string;
        alt: string;
        caption: string;
        image_prompt: string;
        image_style: string;
      }>
    ) => {
      setLocalCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, content: { ...c.content, ...partial } } : c))
      );
    },
    []
  );

  // ── Card delete ───────────────────────────────────────────────────────────
  const handleCardDelete = useCallback(
    (cardId: string) => {
      setLocalCards((prev) => prev.filter((c) => c.id !== cardId));
      deleteBlogCard.mutate({ cardId, contentId });
    },
    [deleteBlogCard, contentId]
  );

  // ── Persist globalStyle changes — called when user edits card style settings ─
  // (wired in a future settings panel; stored in seo_details.globalStyle)
  const saveGlobalStyle = (style: GlobalCardStyleVars) => {
    setGlobalStyle(style);
    const currentDetails = (blogContent.seo_details ?? {}) as Record<string, unknown>;
    updateBlogContent.mutate({
      id: blogContentId,
      contentId,
      updates: {
        seo_details: { ...currentDetails, globalStyle: style } as Record<string, unknown>,
      },
    });
  };
  // Keep reference for potential future wiring (avoids stale-closure issues)
  const saveGlobalStyleRef = useRef(saveGlobalStyle);
  saveGlobalStyleRef.current = saveGlobalStyle;

  // ── Persist keyword changes ───────────────────────────────────────────────
  const persistKeywords = useCallback(
    (p: string, s: string[]) => {
      updateBlogContent.mutate({
        id: blogContentId,
        contentId,
        updates: {
          primary_keyword: p,
          secondary_keywords: s,
          naver_keywords: { primary: p, secondary: s } as unknown as Record<string, unknown>,
        },
      });
    },
    [blogContentId, contentId, updateBlogContent]
  );

  // ── Rendering ─────────────────────────────────────────────────────────────
  const hasCards = localCards.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      {/* Workflow step bar */}
      <WorkflowStepBar
        steps={WORKFLOW_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      />

      {/* Step 1: 키워드 */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">주요 키워드</h3>
            <Input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              onBlur={() => persistKeywords(primary, secondary)}
              placeholder="주요 키워드를 입력하세요"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">보조 키워드</h3>
            <div className="flex gap-2">
              <Input
                value={secondaryInput}
                onChange={(e) => setSecondaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && secondaryInput.trim()) {
                    const next = [...secondary, secondaryInput.trim()];
                    setSecondary(next);
                    setSecondaryInput('');
                    persistKeywords(primary, next);
                  }
                }}
                placeholder="보조 키워드 입력 후 Enter"
                className="text-sm flex-1"
              />
            </div>
            {secondary.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {secondary.map((kw, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="gap-1 cursor-pointer text-xs"
                    onClick={() => {
                      const next = secondary.filter((_, j) => j !== i);
                      setSecondary(next);
                      persistKeywords(primary, next);
                    }}
                  >
                    {kw} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Naver keyword panel */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">키워드 조회 (네이버)</h3>
            <NaverKeywordPanel
              primaryKeyword={primary}
              secondaryKeywords={secondary}
              onSetPrimary={(kw) => {
                setPrimary(kw);
                persistKeywords(kw, secondary);
              }}
              onAddSecondary={(kw) => {
                if (secondary.includes(kw)) return;
                const next = [...secondary, kw];
                setSecondary(next);
                persistKeywords(primary, next);
              }}
            />
          </div>

          <Button className="w-full" onClick={() => setCurrentStep(2)}>
            다음: 구조 설정 →
          </Button>
        </div>
      )}

      {/* Step 2: 구조 */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">SEO 제목</h3>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              onBlur={() =>
                updateBlogContent.mutate({
                  id: blogContentId,
                  contentId,
                  updates: { seo_title: seoTitle },
                })
              }
              placeholder="15~25자, 핵심 키워드 앞쪽 배치"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{seoTitle.length}자 (15~25자 권장)</p>
          </div>

          {!hasBaseArticle && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
              기본글이 없습니다. 기본글 탭에서 먼저 작성하면 더 나은 블로그 글을 생성할 수 있습니다.
            </p>
          )}

          <Button className="w-full" onClick={() => setCurrentStep(3)}>
            다음: 콘텐츠 생성 →
          </Button>
        </div>
      )}

      {/* Step 3: 생성 */}
      {currentStep === 3 && (
        <div className="space-y-4">
          {/* Model selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">모델 설정</h3>
            {/* Read-only display — model changes via step 2 or settings */}
            <p className="text-xs text-muted-foreground">텍스트: {channelModels.textModel}</p>
          </div>

          {/* Generate button */}
          <GenerationButton
            isGenerating={isGenerating}
            onClick={handleGenerate}
            onAbort={abort}
            label={hasCards ? '블로그 재생성' : '블로그 생성 시작'}
          />

          {isGenerating && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">
              AI가 네이버 블로그 섹션을 작성 중입니다...
            </p>
          )}

          {/* Cards list */}
          {hasCards && (
            <div className="space-y-3">
              {/* PC/Mobile toggle + actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('pc')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${viewMode === 'pc' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Monitor size={12} /> PC
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('mobile')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${viewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Smartphone size={12} /> 모바일
                  </button>
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleApplyMobileFormat}
                  className="gap-1 text-xs"
                  title="모든 섹션에 모바일 단락 분리 적용"
                >
                  <RefreshCw size={11} /> 모바일 포맷
                </Button>

                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="gap-1 text-xs ml-auto"
                >
                  <Eye size={11} /> 미리보기
                </Button>
              </div>

              {/* Image generation batch */}
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => generateAll(localCards.map((c) => c.id))}
                  disabled={isGeneratingImages}
                  className="gap-1 text-xs"
                >
                  {isGeneratingImages ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      {imgProgress.current}/{imgProgress.total} 이미지 생성 중...
                    </>
                  ) : (
                    '전체 이미지 생성'
                  )}
                </Button>
                {isGeneratingImages && (
                  <Button size="xs" variant="ghost" onClick={abortImages} className="text-xs">
                    취소
                  </Button>
                )}
              </div>

              {/* Card list */}
              <div className={`space-y-3 ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                {localCards
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((card, idx) => (
                    <BlogCardItem
                      key={card.id}
                      card={card}
                      index={idx}
                      contentId={contentId}
                      onUpdate={handleCardUpdate}
                      onDelete={handleCardDelete}
                      onGenerateImage={() => generateForCard(card.id)}
                      onAbortImage={abortImages}
                      isGeneratingImage={isGeneratingImages}
                      generatingCardId={null}
                      globalStyle={globalStyle}
                    />
                  ))}
                <AddCardButton onClick={handleAddCard} disabled={addBlogCard.isPending} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: SEO */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <SeoScoreDisplay score={seoResult.score} details={seoResult.details} />

          {/* Retry loop info */}
          {retryCountRef.current > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
              SEO 점수 개선 중 ({retryCountRef.current}/{maxRetries}회 재생성)...
            </p>
          )}

          <Button variant="outline" className="w-full text-sm" onClick={() => setCurrentStep(3)}>
            ← 섹션 편집으로 돌아가기
          </Button>

          {hasCards && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="w-full gap-1.5"
            >
              <Eye size={14} /> 미리보기
            </Button>
          )}
        </div>
      )}

      {/* Preview dialog */}
      <BlogPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        cards={localCards}
        title={seoTitle || content.title}
      />
    </div>
  );
}

// ─── BlogPanel (outer — reads graph, manages ChannelContentList) ──────────────

interface BlogPanelProps {
  content: Content;
  project: Project;
}

export function BlogPanel({ content, project }: BlogPanelProps) {
  const { selectedContentId } = useUIStore();
  const { data: contentGraph, isLoading } = useContent(selectedContentId);
  const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'blog');

  const createBlogContent = useCreateBlogContent();
  const deleteBlogContent = useDeleteBlogContent();
  const updateBlogContent = useUpdateBlogContent();

  const baseArticle = contentGraph?.baseArticle ?? null;
  const blogContents = (contentGraph?.blogContents ?? []).filter(
    (bc) => bc.channel === 'naver_blog' || bc.channel == null
  ) as Array<BlogContent & { cards: BlogCard[] }>;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Channel model selector */}
      <div className="p-3 border-b border-border shrink-0">
        <ChannelModelSelector
          textModel={channelModels.textModel}
          imageModel={channelModels.imageModel}
          onTextModelChange={(m) => setChannelModels({ textModel: m })}
          onImageModelChange={(m) => setChannelModels({ imageModel: m })}
          aspectRatio={channelModels.aspectRatio || '16:9'}
          onAspectRatioChange={(r) => setChannelModels({ aspectRatio: r })}
          imageStyle={channelModels.imageStyle}
          onImageStyleChange={(s) => setChannelModels({ imageStyle: s })}
          imageInstruction={channelModels.imageInstruction}
          onImageInstructionChange={(i) => setChannelModels({ imageInstruction: i })}
          defaultAspectRatio="16:9"
        />
      </div>

      {/* Blog content list */}
      <div className="flex-1 overflow-y-auto p-3">
        <ChannelTranslationView contentId={content.id} channel="naver_blog" />
        <ChannelContentList
          items={blogContents}
          getId={(bc) => bc.id}
          getTitle={(bc) =>
            (bc as BlogContent & { cards: BlogCard[]; title?: string }).title ||
            bc.seo_title ||
            `블로그 글 ${blogContents.indexOf(bc) + 1}`
          }
          onTitleChange={(id, title) =>
            updateBlogContent.mutate({
              id,
              contentId: content.id,
              updates: { title } as Partial<BlogContent>,
            })
          }
          onAdd={async () => {
            const id = await createBlogContent.mutateAsync({
              contentId: content.id,
              channel: 'naver_blog',
            });
            return id;
          }}
          onDelete={(id) => deleteBlogContent.mutate({ id, contentId: content.id })}
          accentColor="border-l-4 border-l-indigo-600"
          addLabel="N 블로그 글 추가"
          renderContent={(bc) => (
            <BlogPanelInner
              key={bc.id}
              blogContent={bc}
              content={content}
              project={project}
              hasBaseArticle={Boolean(baseArticle)}
              channelModels={channelModels}
              maxRetries={DEFAULT_MAX_RETRIES}
            />
          )}
        />
      </div>
    </div>
  );
}
