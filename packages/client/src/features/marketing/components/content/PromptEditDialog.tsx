import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';

interface PromptEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt: string;
  onConfirm: (prompt: string) => void;
  title?: string;
}

export function PromptEditDialog({
  open,
  onOpenChange,
  initialPrompt,
  onConfirm,
  title = '프롬프트 확인 / 수정',
}: PromptEditDialogProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  // Sync when dialog reopens with new initial prompt
  const handleOpenChange = (next: boolean) => {
    if (next) setPrompt(initialPrompt);
    onOpenChange(next);
  };

  const handleConfirm = () => {
    onConfirm(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-xs text-muted-foreground mb-2">
            AI에 전달될 프롬프트입니다. 필요하면 수정 후 생성하세요.
          </p>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[300px] font-mono text-xs resize-y"
            placeholder="프롬프트를 입력하세요..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!prompt.trim()}>
            이 프롬프트로 생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
