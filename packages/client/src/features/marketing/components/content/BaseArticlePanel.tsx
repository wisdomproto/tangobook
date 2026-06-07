import { useRef, useState, useCallback } from 'react';
import { CheckCircle, XCircle, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { GenerationButton } from './GenerationButton';
import { BaseArticleEditor, type BaseArticleEditorRef } from './editor/BaseArticleEditor';
import { PromptEditDialog } from './PromptEditDialog';
import { TopicSuggestionDialog } from './TopicSuggestionDialog';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { useAutoSave } from '../../hooks/use-auto-save';
import { useContent } from '../../api/use-contents';
import { useUpdateContent } from '../../api/use-contents';
import { useUpsertBaseArticle } from '../../api/use-base-article';
import { useChannelModels } from '../../api/use-channel-models';
import { buildBaseArticlePrompt, buildPartialRegenerationPrompt } from '../../lib/prompt-builder';
import { countWords } from '../../lib/utils';
import { useUIStore } from '../../store/ui-store';
import type { Content, Project } from '../../types/database';
import { cn } from '../../lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Inner component (keyed by content.id to reset editor state on switch)
// ────────────────────────────────────────────────────────────────────────────

interface BaseArticlePanelInnerProps {
  content: Content;
  project: Project;
}

function BaseArticlePanelInner({ content, project }: BaseArticlePanelInnerProps) {
  const editorRef = useRef<BaseArticleEditorRef>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [liveWordCount, setLiveWordCount] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Throttle ref for streaming (200 ms)
  const streamThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamBufferRef = useRef('');

  // NOTE: ContentTabs passes the bare Content row (not the full ContentGraph), so we
  // must call useContent here to load baseArticle. TanStack Query deduplicates by key
  // (mktKeys.content(id)), so this does NOT cause a second network round-trip when
  // ContentTabs has already fetched the same id — the cached data is returned immediately.
  const { data: contentGraph } = useContent(content.id);
  const baseArticle = contentGraph?.baseArticle ?? null;

  const updateContent = useUpdateContent();
  const upsertBaseArticle = useUpsertBaseArticle();
  const { models: channelModels } = useChannelModels(project.id, 'base-article');

  // ── Autosave ──────────────────────────────────────────────────────────────
  const { schedule: scheduleAutoSave, lastSaved } = useAutoSave<string>({
    onSave: useCallback(
      async (html: string) => {
        const plain = html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const wc = countWords(plain);
        await upsertBaseArticle.mutateAsync({
          contentId: content.id,
          data: { body: html, body_plain_text: plain, word_count: wc },
        });
      },
      [content.id, upsertBaseArticle]
    ),
    delay: 2000,
  });

  // ── AI Generation ─────────────────────────────────────────────────────────
  const {
    isGenerating,
    generate: runGenerate,
    abort,
  } = useAiGeneration({
    onChunk: useCallback((accumulated: string) => {
      streamBufferRef.current = accumulated;
      if (!streamThrottleRef.current) {
        streamThrottleRef.current = setTimeout(() => {
          streamThrottleRef.current = null;
          editorRef.current?.setContent(streamBufferRef.current);
        }, 200);
      }
    }, []),
    onComplete: useCallback(
      (fullText: string) => {
        if (streamThrottleRef.current) {
          clearTimeout(streamThrottleRef.current);
          streamThrottleRef.current = null;
        }
        editorRef.current?.setContent(fullText);
        const plain = fullText
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const wc = countWords(plain);
        void upsertBaseArticle.mutateAsync({
          contentId: content.id,
          data: {
            body: fullText,
            body_plain_text: plain,
            word_count: wc,
            prompt_used: pendingPrompt,
          },
        });
      },
      [content.id, upsertBaseArticle, pendingPrompt]
    ),
    onError: useCallback((msg: string) => {
      console.error('AI generation error:', msg);
      setGenError(msg);
    }, []),
  });

  // ── Partial regeneration ──────────────────────────────────────────────────
  const [isPartialGenerating, setIsPartialGenerating] = useState(false);

  const handlePartialRegenerate = useCallback(
    (selectedText: string, fullText: string) => {
      const prompt = buildPartialRegenerationPrompt(
        { project, content, baseArticle: baseArticle ?? undefined },
        selectedText,
        fullText
      );
      setIsPartialGenerating(true);
      let accumulated = '';
      // Inline SSE fetch to avoid calling a hook inside a callback
      void (async () => {
        try {
          const res = await fetch('/api/mkt/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model: channelModels.textModel }),
          });
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                const t = line.trim();
                if (!t.startsWith('data: ')) continue;
                const payload = t.slice(6);
                if (payload === '[DONE]') break outer;
                try {
                  const chunk = JSON.parse(payload) as { text?: string; error?: string };
                  if (chunk.text) accumulated += chunk.text;
                } catch {
                  // skip malformed JSON
                }
              }
            }
            reader.releaseLock();
          }
        } finally {
          setIsPartialGenerating(false);
          if (accumulated) editorRef.current?.replaceSelection(accumulated);
        }
      })();
    },
    [project, content, baseArticle, channelModels.textModel]
  );

  // ── Confirm toggle ────────────────────────────────────────────────────────
  const handleConfirmToggle = () => {
    updateContent.mutate({
      id: content.id,
      projectId: content.project_id,
      updates: { confirmed: !content.confirmed },
    });
  };

  // ── Prompt dialog trigger ─────────────────────────────────────────────────
  const handleOpenPromptDialog = () => {
    const prompt = buildBaseArticlePrompt({
      project,
      content,
      baseArticle: baseArticle ?? undefined,
    });
    setPendingPrompt(prompt);
    setPromptOpen(true);
  };

  const handlePromptConfirm = (prompt: string) => {
    setPendingPrompt(prompt);
    setGenError(null);
    void runGenerate(prompt, channelModels.textModel);
  };

  // ── Editor update ─────────────────────────────────────────────────────────
  const handleEditorUpdate = useCallback((_html: string, _plain: string, wc: number) => {
    setLiveWordCount(wc);
  }, []);

  const handleEditorChange = useCallback(
    (html: string) => {
      scheduleAutoSave(html);
    },
    [scheduleAutoSave]
  );

  const wordCount = liveWordCount ?? baseArticle?.word_count ?? 0;

  return (
    <div className="marketing-scope flex flex-col h-full">
      {/* Header toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <BookOpen size={15} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{content.title}</span>
          {wordCount > 0 && (
            <Badge variant="secondary" className="text-xs font-normal ml-1">
              {wordCount.toLocaleString()}자
            </Badge>
          )}
          {lastSaved && (
            <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">저장됨</span>
          )}
        </div>

        {/* Topic suggestion */}
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1"
          onClick={() => setTopicOpen(true)}
        >
          AI 주제뽑기
        </Button>

        {/* AI generation */}
        <GenerationButton
          variant="text"
          isGenerating={isGenerating}
          disabled={!content.topic}
          onClick={handleOpenPromptDialog}
          onAbort={abort}
          label="AI 글 생성"
          loadingLabel="생성 중..."
        />

        {/* Generation error */}
        {genError && (
          <span className="text-xs text-red-600 flex items-center gap-1">
            <XCircle size={12} /> 생성 실패: {genError}
          </span>
        )}

        {/* Perplexity (disabled) */}
        <Button size="sm" variant="outline" className="text-xs gap-1" disabled>
          Perplexity 첨삭
        </Button>

        {/* 원장님 컨펌 toggle */}
        <Button
          size="sm"
          variant={content.confirmed ? 'default' : 'outline'}
          className={cn(
            'text-xs gap-1',
            content.confirmed && 'bg-green-600 hover:bg-green-700 text-white'
          )}
          onClick={handleConfirmToggle}
        >
          {content.confirmed ? (
            <>
              <CheckCircle size={13} /> 원장님 컨펌 완료
            </>
          ) : (
            <>
              <XCircle size={13} className="text-muted-foreground" /> 원장님 컨펌
            </>
          )}
        </Button>
      </div>

      {/* Topic display */}
      {content.topic && (
        <div className="px-4 py-1.5 bg-muted/30 border-b text-xs text-muted-foreground flex gap-1.5 items-start">
          <span className="font-medium shrink-0">주제:</span>
          <span className="line-clamp-2">{content.topic}</span>
        </div>
      )}

      {/* No topic warning */}
      {!content.topic && (
        <div className="px-4 py-1.5 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border-b">
          <AlertCircle size={12} />
          주제를 먼저 설정하면 AI 글 생성이 활성화됩니다.
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <BaseArticleEditor
          ref={editorRef}
          initialContent={baseArticle?.body ?? ''}
          onUpdate={(html, _plain, wc) => {
            handleEditorUpdate(html, _plain, wc);
            handleEditorChange(html);
          }}
          onPartialRegenerate={isPartialGenerating ? undefined : handlePartialRegenerate}
          projectId={project.id}
          placeholder="기본 글을 작성하거나 AI로 생성하세요."
        />
      </div>

      {/* Dialogs */}
      <PromptEditDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        initialPrompt={pendingPrompt}
        onConfirm={handlePromptConfirm}
        title="AI 글 생성 프롬프트"
      />

      <TopicSuggestionDialog
        open={topicOpen}
        onOpenChange={setTopicOpen}
        promptContext={{ project, content, baseArticle: baseArticle ?? undefined }}
        textModel={channelModels.textModel}
        onSelect={(topic) => {
          updateContent.mutate({
            id: content.id,
            projectId: content.project_id,
            updates: { topic },
          });
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Outer component — reads from store, guards, keys inner
// ────────────────────────────────────────────────────────────────────────────

interface BaseArticlePanelProps {
  content: Content;
  project: Project;
}

export function BaseArticlePanel({ content, project }: BaseArticlePanelProps) {
  return <BaseArticlePanelInner key={content.id} content={content} project={project} />;
}
