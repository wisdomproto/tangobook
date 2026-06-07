import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChannelTranslationView } from './ChannelTranslationView';
import { Loader2, Monitor, Smartphone, RefreshCw, Eye, Calendar, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { WorkflowStepBar, type WorkflowStep } from './WorkflowStepBar';
// SeoScoreDisplay intentionally NOT imported here (O-3 — Google boolean checklist only, not Naver scorer)
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
import { generateId } from '../../lib/utils';
import { fetchGoogleKeywords, type GoogleKeywordRow } from '../../api/use-keywords';
import type { BlogContent, BlogCard, Content, Project } from '../../types/database';

// ─── Google/GEO prompt suffix (appended to the base blog prompt) ──────────────

const GOOGLE_GEO_SUFFIX = `

## Google SEO + GEO 최적화 필수 규칙

### URL 슬러그 (url_slug)
- url_slug 필드를 응답에 포함하세요. 영문 소문자·하이픈만, 3~5 단어 (예: "child-growth-tips-2025")
- URL에서 핵심 키워드가 앞에 위치하도록 하세요.

### 제목 계층 구조 (H1/H2/H3)
- 페이지 전체에 H1 1개만 사용 (사이트 제목 포함). 섹션마다 H2, 소항목에 H3.
- H1/H2에 주요 키워드를 자연스럽게 포함하세요.

### 키워드 밀도 (1~2%)
- 주요 키워드: 본문에 5~7회 자연 반복. 강요하지 마세요.
- 보조 키워드: 각각 2~3회.

### 내부 링크 제안 (Internal Link Suggestions)
- 마지막 섹션 또는 별도 섹션에 "관련 글 추천" 항목을 포함하세요.
- 예: \`<p>관련 글: <a href="/관련-주제">관련 글 제목</a></p>\`

### FAQ (3~5개 — GEO 필수)
- 별도 "자주 묻는 질문" 섹션에 Q&A 형식 3~5개를 포함하세요 (GEO 검색엔진 노출 핵심).
- 형식: \`<h3>Q. 질문?</h3><p>A. 답변.</p>\`
- 실제 독자가 검색할 법한 질문으로 구성하세요.

### 스키마 마크업 안내
발행 시 Article + FAQ + (의료/건강 콘텐츠의 경우 MedicalEntity) Schema가 자동으로 추가됩니다.

### 모바일 가독성
- 단락 200~300자 이내. 리스트 적극 활용.

응답은 반드시 아래 JSON 형식으로만 출력하세요 (Naver 블로그 형식과 동일하되 url_slug 추가):
\`\`\`json
{
  "seo_title": "...",
  "url_slug": "keyword-english-slug-here",
  "primary_keyword": "...",
  "secondary_keywords": ["..."],
  "sections": [
    { "text": "<h2>...</h2><p>...</p>", "alt": "...", "caption": "...", "image_prompt": "..." }
  ]
}
\`\`\``;

// ─── Google keyword panel (mirrors NaverKeywordPanel but uses Google API) ──────

interface GoogleKeywordPanelProps {
  primaryKeyword: string;
  secondaryKeywords: string[];
  onSetPrimary: (kw: string) => void;
  onAddSecondary: (kw: string) => void;
}

function GoogleKeywordPanel({
  primaryKeyword,
  secondaryKeywords,
  onSetPrimary,
  onAddSecondary,
}: GoogleKeywordPanelProps) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<GoogleKeywordRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const kws = query
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (kws.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchGoogleKeywords(kws);
      setRows(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 키워드 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSearch();
          }}
          placeholder="키워드 입력 (쉼표로 구분)"
          className="flex-1 text-xs"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="gap-1"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          조회
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{error}</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">키워드</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">검색량</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">CPC</th>
                <th className="px-2 py-1.5 text-center font-medium text-muted-foreground">설정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const isPrimary = row.keyword === primaryKeyword;
                const isSecondary = secondaryKeywords.includes(row.keyword);
                return (
                  <tr
                    key={row.keyword}
                    className={`hover:bg-muted/30 transition-colors${isPrimary ? ' bg-primary/5' : ''}`}
                  >
                    <td className="px-2 py-1.5 font-medium">
                      {row.keyword}
                      {isPrimary && (
                        <span className="ml-1.5 text-[10px] text-primary font-semibold">
                          (주요)
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {row.searchVolume.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">${row.cpc.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="xs"
                          variant={isPrimary ? 'default' : 'outline'}
                          onClick={() => onSetPrimary(row.keyword)}
                          className="h-5 px-1.5 text-[10px]"
                          title="주요 키워드로 설정"
                        >
                          주요
                        </Button>
                        <Button
                          size="xs"
                          variant={isSecondary ? 'secondary' : 'outline'}
                          onClick={() => onAddSecondary(row.keyword)}
                          disabled={isSecondary}
                          className="h-5 px-1.5 text-[10px]"
                          title="보조 키워드로 추가"
                        >
                          +
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && rows.length === 0 && !error && (
        <p className="text-xs text-muted-foreground text-center py-4">
          키워드를 입력하고 조회하세요. (DataForSEO 자격증명 필요)
        </p>
      )}
    </div>
  );
}

// ─── Google SEO boolean checklist ─────────────────────────────────────────────
// O-3: no calculateNaverSeoScore, no SeoScoreDisplay, no auto-retry.

interface GoogleSeoChecklistProps {
  urlSlug: string;
  cards: BlogCard[];
  primary: string;
  secondary: string[];
}

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
}

function GoogleSeoChecklist({ urlSlug, cards, primary, secondary }: GoogleSeoChecklistProps) {
  const checks = useMemo((): CheckItem[] => {
    // Aggregate all card text for analysis
    const allText = cards
      .map((c) => {
        const content = c.content as { text?: string };
        return content.text ?? '';
      })
      .join(' ');
    const plainText = allText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

    // Check: url_slug present
    const hasSlug = urlSlug.trim().length > 0;

    // Check: FAQ section present (look for Q. pattern or "자주 묻는 질문")
    const hasFaq =
      allText.includes('Q.') ||
      allText.includes('자주 묻는 질문') ||
      allText.includes('<h3>Q') ||
      allText.includes('FAQ');

    // Check: H1/H2/H3 hierarchy — at least 2 H2 tags
    const h2Count = (allText.match(/<h2/gi) ?? []).length;
    const hasHeadingHierarchy = h2Count >= 2;

    // Check: internal link suggestions present
    const hasInternalLink =
      allText.includes('관련 글') || allText.includes('href=') || allText.includes('내부 링크');

    // Check: keyword density hint (primary appears ≥4 times)
    const primaryCount = primary
      ? (plainText.match(new RegExp(primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? [])
          .length
      : 0;
    const hasKeywordDensity = primaryCount >= 4;

    // Check: secondary keywords present
    const hasSecondary =
      secondary.length === 0 ||
      secondary.some((kw) => plainText.toLowerCase().includes(kw.toLowerCase()));

    return [
      {
        id: 'slug',
        label: 'URL 슬러그 설정',
        passed: hasSlug,
        hint: 'url_slug 필드에 영문 소문자·하이픈 형태로 입력하세요.',
      },
      {
        id: 'faq',
        label: 'FAQ 섹션 포함 (GEO 필수)',
        passed: hasFaq,
        hint: '자주 묻는 질문 Q&A 3~5개를 포함하세요.',
      },
      {
        id: 'headings',
        label: 'H1/H2/H3 계층 구조 (H2 2개 이상)',
        passed: hasHeadingHierarchy,
        hint: 'H2 소제목을 2개 이상 사용하세요.',
      },
      {
        id: 'internal',
        label: '내부 링크 제안 포함',
        passed: hasInternalLink,
        hint: '"관련 글" 섹션 또는 링크를 포함하세요.',
      },
      {
        id: 'density',
        label: `키워드 밀도 — "${primary || '주요 키워드'}" 4회 이상`,
        passed: hasKeywordDensity,
        hint: `현재 ${primaryCount}회. 주요 키워드를 자연스럽게 더 포함하세요.`,
      },
      {
        id: 'secondary',
        label: '보조 키워드 포함',
        passed: hasSecondary,
        hint: '보조 키워드가 본문에 포함되었는지 확인하세요.',
      },
      {
        id: 'schema',
        label: 'Article/FAQ Schema (발행 시 자동 추가)',
        passed: true, // Always passes — it's informational
        hint: '발행 시 Article + FAQ Schema가 자동으로 추가됩니다.',
      },
    ];
  }, [urlSlug, cards, primary, secondary]);

  const passCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">🔍 Google SEO 검사</h3>
        <span className="text-xs text-muted-foreground">
          {passCount}/{checks.length} 항목 통과
        </span>
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs border ${
              check.passed
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="mt-0.5 shrink-0">{check.passed ? '✅' : '⚠️'}</span>
            <div className="min-w-0">
              <p className="font-medium leading-tight">{check.label}</p>
              {!check.passed && check.hint && (
                <p className="mt-0.5 text-[11px] opacity-80">{check.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workflow steps ───────────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  { step: 1 as WorkflowStep, label: '키워드', icon: '🔍' },
  { step: 2 as WorkflowStep, label: '구조', icon: '📋' },
  { step: 3 as WorkflowStep, label: '생성', icon: '✍️' },
  { step: 4 as WorkflowStep, label: 'SEO', icon: '📊' },
];

// ─── Async user-id helper ─────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('인증이 필요합니다');
  return user.id;
}

// ─── InternalBlogPanelInner ───────────────────────────────────────────────────

interface InternalBlogPanelInnerProps {
  blogContent: BlogContent & { cards: BlogCard[] };
  content: Content;
  project: Project;
  hasBaseArticle: boolean;
  channelModels: ReturnType<typeof useChannelModels>['models'];
}

function InternalBlogPanelInner({
  blogContent,
  content,
  project,
  hasBaseArticle,
  channelModels,
}: InternalBlogPanelInnerProps) {
  const contentId = content.id;
  const blogContentId = blogContent.id;

  const cards: BlogCard[] = blogContent.cards ?? [];

  // ── Step state ────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(() => (cards.length > 0 ? 3 : 1));

  // ── Keyword + slug state ──────────────────────────────────────────────────
  const [primary, setPrimary] = useState<string>(blogContent.primary_keyword ?? '');
  const [secondary, setSecondary] = useState<string[]>(blogContent.secondary_keywords ?? []);
  const [seoTitle, setSeoTitle] = useState<string>(blogContent.seo_title ?? '');
  const [urlSlug, setUrlSlug] = useState<string>(blogContent.url_slug ?? '');
  const [secondaryInput, setSecondaryInput] = useState('');

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'pc' | 'mobile'>('pc');

  // ── GlobalCardStyle ───────────────────────────────────────────────────────
  const [globalStyle, setGlobalStyle] = useState<GlobalCardStyleVars>(() => {
    const details = blogContent.seo_details as Record<string, unknown> | null;
    return (details?.globalStyle as GlobalCardStyleVars) ?? {};
  });

  // ── Preview dialog ────────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Local card state ──────────────────────────────────────────────────────
  const [localCards, setLocalCards] = useState<BlogCard[]>(cards);
  useEffect(() => {
    setLocalCards(blogContent.cards ?? []);
  }, [blogContent.cards]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const setBlogCards = useSetBlogCards();
  const addBlogCard = useAddBlogCard();
  const deleteBlogCard = useDeleteBlogCard();
  const updateBlogCard = useUpdateBlogCard();
  const updateBlogContent = useUpdateBlogContent();

  // ── generateRef indirection ────────────────────────────────────────────────
  const generateRef = useRef<((prompt: string, model: string) => void) | null>(null);

  // ── AI generation ─────────────────────────────────────────────────────────
  const { isGenerating, generate, abort } = useAiGeneration({
    onChunk: useCallback((_accumulated: string) => {}, []),
    onComplete: useCallback(
      async (fullText: string) => {
        let seoTitleOut = seoTitle;
        let primaryOut = primary;
        let secondaryOut = secondary;
        let urlSlugOut = urlSlug;
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
              parsed = null;
            }
          }

          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            seoTitleOut = (obj.seo_title as string) || seoTitle;
            primaryOut = (obj.primary_keyword as string) || primary;
            secondaryOut = (obj.secondary_keywords as string[]) || secondary;
            urlSlugOut = (obj.url_slug as string) || urlSlug;
            sections = (obj.sections as typeof sections) || [];
          } else if (!parsed && arrMatch) {
            try {
              sections = JSON.parse(arrMatch[0]) as typeof sections;
            } catch {
              sections = [];
            }
          }

          if (sections.length === 0) {
            throw new Error('섹션이 없습니다');
          }

          // Build BlogCard[]
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

          setLocalCards(newCards);
          await setBlogCards.mutateAsync({ blogContentId, contentId, cards: newCards });

          setSeoTitle(seoTitleOut);
          setPrimary(primaryOut);
          setSecondary(secondaryOut);
          setUrlSlug(urlSlugOut);

          await updateBlogContent.mutateAsync({
            id: blogContentId,
            contentId,
            updates: {
              seo_title: seoTitleOut,
              primary_keyword: primaryOut,
              secondary_keywords: secondaryOut,
              url_slug: urlSlugOut,
              naver_keywords: {
                primary: primaryOut,
                secondary: secondaryOut,
              } as unknown as Record<string, unknown>,
            },
          });

          // No SEO auto-retry loop (O-3 — Google checklist only, not numeric scorer)
          setCurrentStep(4);
        } catch {
          alert('내부 블로그 섹션 파싱 실패. 다시 시도해 주세요.');
        }
      },
      [
        seoTitle,
        primary,
        secondary,
        urlSlug,
        blogContentId,
        contentId,
        setBlogCards,
        updateBlogContent,
      ]
    ),
    onError: useCallback((msg: string) => {
      alert(`생성 오류: ${msg}`);
    }, []),
  });

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
    onSave: async (cardId, url) => {
      await updateBlogCard.mutateAsync({
        cardId,
        contentId,
        updates: {
          content: { ...(localCards.find((c) => c.id === cardId)?.content ?? {}), url },
        },
      });
    },
  });

  // ── Generate handler ──────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    // Append the Google/GEO suffix to the standard blog prompt
    const basePrompt = buildBlogPrompt({
      project,
      content,
      seoTitle,
      keywords: { primary, secondary },
    });
    generate(basePrompt + GOOGLE_GEO_SUFFIX, channelModels.textModel);
    setCurrentStep(3);
  }, [project, content, seoTitle, primary, secondary, channelModels.textModel, generate]);

  // ── Mobile format ─────────────────────────────────────────────────────────
  const handleApplyMobileFormat = useCallback(() => {
    const reformatted = localCards.map((card) => {
      const c = card.content as { text?: string };
      if (!c.text) return card;
      return { ...card, content: { ...card.content, text: formatForMobile(c.text) } };
    });
    setLocalCards(reformatted);
    reformatted.forEach((card) => {
      updateBlogCard.mutate({ cardId: card.id, contentId, updates: { content: card.content } });
    });
  }, [localCards, contentId, updateBlogCard]);

  // ── Add card ──────────────────────────────────────────────────────────────
  const handleAddCard = useCallback(async () => {
    await addBlogCard.mutateAsync({
      blogContentId,
      contentId,
      cardType: 'text',
      sortOrder: localCards.length,
    });
  }, [addBlogCard, blogContentId, contentId, localCards.length]);

  // ── Card update ───────────────────────────────────────────────────────────
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

  // ── Persist helpers ───────────────────────────────────────────────────────
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

  const persistSlug = useCallback(
    (slug: string) => {
      updateBlogContent.mutate({ id: blogContentId, contentId, updates: { url_slug: slug } });
    },
    [blogContentId, contentId, updateBlogContent]
  );

  // Keep globalStyle ref stable (wired in future settings panel)
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
  const saveGlobalStyleRef = useRef(saveGlobalStyle);
  saveGlobalStyleRef.current = saveGlobalStyle;

  const hasCards = localCards.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-4">
      <WorkflowStepBar
        steps={WORKFLOW_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      />

      {/* ── Step 1: 키워드 ── */}
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

          {/* Google keyword panel */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">키워드 조회 (Google)</h3>
            <GoogleKeywordPanel
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

      {/* ── Step 2: 구조 ── */}
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
              placeholder="15~60자, 핵심 키워드 포함"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{seoTitle.length}자</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">URL 슬러그</h3>
            <Input
              value={urlSlug}
              onChange={(e) => setUrlSlug(e.target.value)}
              onBlur={() => persistSlug(urlSlug)}
              placeholder="keyword-english-slug (영문·하이픈)"
              className="text-sm font-mono"
            />
            {urlSlug && <p className="text-[11px] text-muted-foreground">/{urlSlug}</p>}
          </div>

          {!hasBaseArticle && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
              기본글이 없습니다. 기본글 탭에서 먼저 작성하면 더 나은 내부 블로그 글을 생성할 수
              있습니다.
            </p>
          )}

          <Button className="w-full" onClick={() => setCurrentStep(3)}>
            다음: 콘텐츠 생성 →
          </Button>
        </div>
      )}

      {/* ── Step 3: 생성 ── */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">텍스트: {channelModels.textModel}</p>
            <p className="text-[11px] text-muted-foreground bg-blue-50 border border-blue-200 rounded px-2 py-1">
              Google SEO + GEO 최적화 (H1/H2/H3 계층, FAQ 3~5개, 내부 링크 제안)
            </p>
          </div>

          <GenerationButton
            isGenerating={isGenerating}
            onClick={handleGenerate}
            onAbort={abort}
            label={hasCards ? '내부 블로그 재생성' : '내부 블로그 생성 시작'}
          />

          {isGenerating && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">
              AI가 내부 블로그 섹션을 작성 중입니다...
            </p>
          )}

          {/* Schedule stub (Phase 3) */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="gap-1.5 text-xs opacity-60"
              onClick={() => alert('예약 발행은 Phase 3에서 지원됩니다')}
              title="Phase 3 예정"
            >
              <Calendar size={13} />
              예약 발행
              <span className="text-[10px] bg-muted rounded px-1">Phase 3</span>
            </Button>
          </div>

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

              {/* Batch image generation */}
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

      {/* ── Step 4: Google SEO 검사 ── */}
      {currentStep === 4 && (
        <div className="space-y-4">
          {/* URL slug quick-edit */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-medium">URL 슬러그</h3>
            <Input
              value={urlSlug}
              onChange={(e) => setUrlSlug(e.target.value)}
              onBlur={() => persistSlug(urlSlug)}
              placeholder="keyword-english-slug"
              className="text-sm font-mono"
            />
          </div>

          <GoogleSeoChecklist
            urlSlug={urlSlug}
            cards={localCards}
            primary={primary}
            secondary={secondary}
          />

          {/* Schedule stub */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs opacity-60"
            onClick={() => alert('예약 발행은 Phase 3에서 지원됩니다')}
          >
            <Calendar size={13} />
            예약 발행 (Phase 3)
          </Button>

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

// ─── InternalBlogPanel (outer) ────────────────────────────────────────────────

interface InternalBlogPanelProps {
  content: Content;
  project: Project;
}

export function InternalBlogPanel({ content, project }: InternalBlogPanelProps) {
  const { selectedContentId } = useUIStore();
  const { data: contentGraph, isLoading } = useContent(selectedContentId);
  const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'blog');

  const createBlogContent = useCreateBlogContent();
  const deleteBlogContent = useDeleteBlogContent();
  const updateBlogContent = useUpdateBlogContent();

  const baseArticle = contentGraph?.baseArticle ?? null;

  // Internal blog: channel='self_hosted'
  const internalContents = (contentGraph?.blogContents ?? []).filter(
    (bc) => bc.channel === 'self_hosted'
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

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3">
        <ChannelTranslationView contentId={content.id} channel="self_hosted" />
        <ChannelContentList
          items={internalContents}
          getId={(bc) => bc.id}
          getTitle={(bc) =>
            (bc as BlogContent & { cards: BlogCard[]; title?: string }).title ||
            bc.seo_title ||
            `내부 블로그 ${internalContents.indexOf(bc) + 1}`
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
              channel: 'self_hosted',
            });
            return id;
          }}
          onDelete={(id) => deleteBlogContent.mutate({ id, contentId: content.id })}
          accentColor="border-l-4 border-l-emerald-600"
          addLabel="내부 블로그 글 추가"
          renderContent={(bc) => (
            <InternalBlogPanelInner
              key={bc.id}
              blogContent={bc}
              content={content}
              project={project}
              hasBaseArticle={Boolean(baseArticle)}
              channelModels={channelModels}
            />
          )}
        />
      </div>
    </div>
  );
}
