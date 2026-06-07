import { useState, useCallback } from 'react';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { useAiGeneration } from '../../hooks/use-ai-generation';
import { buildTopicSuggestionPrompt } from '../../lib/prompt-builder';
import type { PromptContext } from '../../lib/prompt-builder';
import { cn } from '../../lib/utils';

interface TopicSuggestion {
  title: string;
  outline: string;
}

interface TopicSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptContext: PromptContext;
  textModel: string;
  onSelect: (topic: string) => void;
}

function parseSuggestions(text: string): TopicSuggestion[] {
  try {
    // Extract JSON from code block or raw
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/([\s\S]*)/);
    if (!match) return [];
    const parsed = JSON.parse(match[1]) as TopicSuggestion[];
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function TopicSuggestionDialog({
  open,
  onOpenChange,
  promptContext,
  textModel,
  onSelect,
}: TopicSuggestionDialogProps) {
  const [hint, setHint] = useState('');
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isGenerating, generate } = useAiGeneration({
    onComplete: (text) => {
      const parsed = parseSuggestions(text);
      setSuggestions(parsed);
      setSelected(null);
      setError(parsed.length === 0 ? '주제를 파싱할 수 없습니다. 다시 시도해 주세요.' : null);
    },
    onError: (msg) => {
      setError(msg);
    },
  });

  const handleGenerate = useCallback(() => {
    setError(null);
    const ctx: PromptContext = {
      ...promptContext,
      topicHint: hint.trim() || undefined,
    };
    const prompt = buildTopicSuggestionPrompt(ctx);
    void generate(prompt, textModel);
  }, [promptContext, hint, textModel, generate]);

  const handleSelect = () => {
    if (selected === null) return;
    const s = suggestions[selected];
    const topic = `${s.title}\n\n아웃라인:\n${s.outline}`;
    onSelect(topic);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI 주제 뽑기</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex gap-2">
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="원하는 주제 방향을 입력하면 더 정확한 제안이 나옵니다. (선택)"
              className="flex-1 min-h-[60px] resize-none text-sm"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="self-end gap-1.5 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> 생성 중...
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> {suggestions.length > 0 ? '다시 뽑기' : '주제 뽑기'}
                </>
              )}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {suggestions.length > 0 && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {suggestions.map((s, i) => (
                <Card
                  key={i}
                  className={cn(
                    'cursor-pointer border-2 transition-colors',
                    selected === i
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                  onClick={() => setSelected(i)}
                >
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{s.title}</p>
                      {selected === i && (
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {s.outline}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={handleSelect} disabled={selected === null}>
            이 주제로 선택
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
