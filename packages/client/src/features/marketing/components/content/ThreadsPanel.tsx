import { useCallback, useRef, useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Loader2, Copy, Check, Eye } from 'lucide-react';
import { ThreadsCardItem, AddPostButton } from './ThreadsCardItem';
import { ThreadsPreviewDialog } from './ThreadsPreviewDialog';
import { ChannelModelSelector } from './ChannelModelSelector';
import { ChannelContentList } from './ChannelContentList';
import { PromptEditDialog } from './PromptEditDialog';
import { GenerationButton } from './GenerationButton';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { useCardImageGeneration } from '../../hooks/use-card-image-generation';
import { useChannelModels } from '../../api/use-channel-models';
import { useContent } from '../../api/use-contents';
import {
  useCreateThreadsContent,
  useUpdateThreadsContent,
  useDeleteThreadsContent,
  useSetThreadsCards,
  useAddThreadsCard,
  useUpdateThreadsCard,
  useDeleteThreadsCard,
} from '../../api/use-threads-contents';
import { supabase } from '../../api/supabase';
import { buildThreadsPrompt } from '../../lib/prompt-builder';
import { generateId } from '../../lib/utils';
import type {
  Content,
  Project,
  ThreadsContent,
  ThreadsCard,
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

// ─── ThreadsPanelInner ────────────────────────────────────────────────────────

interface ThreadsPanelInnerProps {
  threadsContent: ThreadsContent & { cards: ThreadsCard[] };
  content: Content;
  project: Project;
  hasBaseArticle: boolean;
  baseArticle: BaseArticle | null;
  channelModels: ReturnType<typeof useChannelModels>['models'];
}

function ThreadsPanelInner({
  threadsContent,
  content,
  project,
  hasBaseArticle,
  baseArticle,
  channelModels,
}: ThreadsPanelInnerProps) {
  const contentId = content.id;
  const threadsContentId = threadsContent.id;

  // Local mirror of cards — updated optimistically; DB synced via mutations / debounce
  const [localCards, setLocalCards] = useState<ThreadsCard[]>(threadsContent.cards ?? []);

  // Keep local mirror in sync when the graph refetches
  const prevContentIdRef = useRef<string | null>(null);
  if (prevContentIdRef.current !== threadsContentId) {
    prevContentIdRef.current = threadsContentId;
    setLocalCards(threadsContent.cards ?? []);
  }

  // Dialog state
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Track which card is being imaged
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);

  // Mutation hooks
  const setThreadsCards = useSetThreadsCards();
  const addThreadsCard = useAddThreadsCard();
  const updateThreadsCard = useUpdateThreadsCard();
  const deleteThreadsCard = useDeleteThreadsCard();

  // ── AI text generation ────────────────────────────────────────────────────

  const { isGenerating, generate, abort } = useAiGeneration({
    onComplete: useCallback(
      async (fullText: string) => {
        try {
          const objMatch = fullText.match(/\{[\s\S]*\}/);
          if (!objMatch) throw new Error('JSON not found');
          const parsed = JSON.parse(objMatch[0]) as {
            posts: { text: string; order: number }[];
          };
          if (!parsed.posts?.length) throw new Error('No posts');

          // Stamp user_id (R-9 requirement — mirrors BlogPanel.tsx:196-217)
          const userId = await getCurrentUserId();
          const now = new Date().toISOString();
          const newCards: ThreadsCard[] = parsed.posts
            .sort((a, b) => a.order - b.order)
            .map((post, i) => ({
              id: generateId(),
              user_id: userId,
              threads_content_id: threadsContentId,
              text_content: post.text || '',
              media_url: null,
              media_type: null,
              sort_order: i,
              created_at: now,
              updated_at: now,
            }));

          setLocalCards(newCards);
          await setThreadsCards.mutateAsync({ threadsContentId, contentId, cards: newCards });
        } catch {
          alert('스레드 포스트 파싱 실패. 다시 시도해 주세요.');
        }
      },
      [threadsContentId, contentId, setThreadsCards]
    ),
    onError: useCallback((err: string) => {
      alert(`AI 생성 오류: ${err}`);
    }, []),
  });

  const handleGenerate = () => {
    const prompt = buildThreadsPrompt({ project, content, baseArticle: baseArticle ?? undefined });
    setGeneratedPrompt(prompt);
    setShowPromptDialog(true);
  };

  const handleStartGeneration = (prompt: string) => {
    generate(prompt, channelModels.textModel);
  };

  // ── Per-post image generation (§7 adaptation) ─────────────────────────────

  const { isGenerating: isGeneratingImage, generateForCard } = useCardImageGeneration({
    getPrompt: (cardId: string) => {
      const c = localCards.find((x) => x.id === cardId);
      // R-4 quirk: media_type holds the user's image prompt text before generation
      const base = c?.media_type || 'Professional photo related to the post content';
      return channelModels.imageStyle ? `${channelModels.imageStyle}. ${base}` : base;
    },
    getModel: () => channelModels.imageModel,
    getAspectRatio: () => channelModels.aspectRatio || '1:1',
    onSave: async (cardId: string, url: string) => {
      // Overwrite media_type from prompt string → 'image' on success
      setLocalCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, media_url: url, media_type: 'image' } : c))
      );
      await updateThreadsCard.mutateAsync({
        cardId,
        contentId,
        updates: { media_url: url, media_type: 'image' },
      });
    },
    projectId: project.id,
  });

  const handleGenerateImage = async (cardId: string) => {
    setGeneratingCardId(cardId);
    try {
      await generateForCard(cardId);
    } finally {
      setGeneratingCardId(null);
    }
  };

  // ── Card handlers (O-F: text edits debounced, structural changes immediate) ─

  // O-F: text edits debounced ~400 ms per card id; structural changes persist immediately.
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleCardUpdate = useCallback(
    (cardId: string, updates: Partial<ThreadsCard>) => {
      // Always update local state immediately
      setLocalCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));

      if ('text_content' in updates) {
        // Coalesce keystrokes — persist after 400 ms of inactivity
        const existing = debounceTimers.current.get(cardId);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          debounceTimers.current.delete(cardId);
          updateThreadsCard.mutate({ cardId, contentId, updates });
        }, 400);
        debounceTimers.current.set(cardId, timer);
      } else {
        // Structural changes (image set/remove, media_type quirk) persist immediately
        updateThreadsCard.mutate({ cardId, contentId, updates });
      }
    },
    [contentId, updateThreadsCard]
  );

  const handleCardDelete = useCallback(
    (cardId: string) => {
      setLocalCards((prev) => prev.filter((c) => c.id !== cardId));
      deleteThreadsCard.mutate({ cardId, contentId });
    },
    [contentId, deleteThreadsCard]
  );

  const handleAddPost = async () => {
    const id = await addThreadsCard.mutateAsync({
      threadsContentId,
      contentId,
      sortOrder: localCards.length,
    });
    // optimistically append a blank card (the refetch will confirm)
    const userId = await getCurrentUserId().catch(() => '');
    const now = new Date().toISOString();
    setLocalCards((prev) => [
      ...prev,
      {
        id,
        user_id: userId,
        threads_content_id: threadsContentId,
        text_content: '',
        media_url: null,
        media_type: null,
        sort_order: prev.length,
        created_at: now,
        updated_at: now,
      },
    ]);
  };

  // ── 전체 복사 (CF :126-133) ───────────────────────────────────────────────

  const handleCopyAll = async () => {
    const allText = localCards
      .map((card, i) => `[${i + 1}/${localCards.length}]\n${card.text_content}`)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {localCards.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {localCards.length}개 포스트
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <GenerationButton
            variant="text"
            isGenerating={isGenerating}
            disabled={!hasBaseArticle}
            onClick={handleGenerate}
            onAbort={abort}
            className={
              !isGenerating
                ? 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white'
                : undefined
            }
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

      {/* No base article hint */}
      {!hasBaseArticle && (
        <p className="text-sm text-muted-foreground">기본 글을 먼저 작성해 주세요.</p>
      )}

      {/* Thread post cards */}
      {localCards.length > 0 && (
        <div className="space-y-0">
          {localCards.map((card, i) => (
            <ThreadsCardItem
              key={card.id}
              card={card}
              index={i}
              isLast={i === localCards.length - 1}
              onUpdate={handleCardUpdate}
              onDelete={handleCardDelete}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={isGeneratingImage}
              generatingCardId={generatingCardId}
            />
          ))}
        </div>
      )}

      {/* Add post button */}
      {hasBaseArticle && <AddPostButton onAdd={handleAddPost} />}

      {/* Dialogs */}
      {/* PromptEditDialog: onConfirm triggers generation and closes the dialog */}
      <PromptEditDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        initialPrompt={generatedPrompt}
        onConfirm={(prompt) => {
          handleStartGeneration(prompt);
        }}
      />

      <ThreadsPreviewDialog open={showPreview} onOpenChange={setShowPreview} cards={localCards} />
    </div>
  );
}

// ─── ThreadsPanel (outer — reads graph, manages ChannelContentList) ───────────

interface ThreadsPanelProps {
  content: Content;
  project: Project;
}

export function ThreadsPanel({ content, project }: ThreadsPanelProps) {
  const { data: contentGraph } = useContent(content.id);
  const { models: channelModels, setChannelModels } = useChannelModels(project.id, 'threads');

  const createThreadsContent = useCreateThreadsContent();
  const deleteThreadsContent = useDeleteThreadsContent();
  const updateThreadsContent = useUpdateThreadsContent();

  const threadsContents = (contentGraph?.threadsContents ?? []) as Array<
    ThreadsContent & { cards: ThreadsCard[] }
  >;

  const hasBaseArticle = Boolean(contentGraph?.baseArticle);
  // Fidelity point #1: forward baseArticle into the inner panel (mirrors CardNewsPanel:1225-1226)
  const baseArticle = contentGraph?.baseArticle ?? null;

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
          defaultAspectRatio="1:1"
          onTextModelChange={(m) => setChannelModels({ textModel: m })}
          onImageModelChange={(m) => setChannelModels({ imageModel: m })}
          onAspectRatioChange={(r) => setChannelModels({ aspectRatio: r })}
          onImageStyleChange={(s) => setChannelModels({ imageStyle: s })}
        />
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3">
        <ChannelContentList<ThreadsContent & { cards: ThreadsCard[] }>
          items={threadsContents}
          getId={(tc) => tc.id}
          getTitle={(tc) => tc.title || '스레드'}
          onTitleChange={(id, title) =>
            updateThreadsContent.mutate({ id, contentId: content.id, updates: { title } })
          }
          onAdd={() => createThreadsContent.mutateAsync({ contentId: content.id })}
          onDelete={(id) => deleteThreadsContent.mutate({ id, contentId: content.id })}
          addLabel="새 스레드 추가"
          accentColor="border-l-4 border-l-indigo-600"
          renderContent={(tc) => (
            <ThreadsPanelInner
              key={tc.id}
              threadsContent={tc}
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
