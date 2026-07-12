import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useCreateContent } from '../../api/use-contents';
import { useUIStore } from '../../store/ui-store';
import type { ContentKind } from '../../types/database';

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  kind?: ContentKind;
}

export function CreateContentDialog({
  open,
  onOpenChange,
  projectId,
  kind = 'regular',
}: CreateContentDialogProps) {
  const isAd = kind === 'ad';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const createContent = useCreateContent();
  const { setSelectedContentId } = useUIStore();

  function reset() {
    setTitle('');
    setCategory('');
    setTagsInput('');
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createContent.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        category: category.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        content_kind: kind,
      },
      {
        onSuccess: (content) => {
          setSelectedContentId(content.id);
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  function handleKeyDown(e: { key: string; preventDefault(): void }) {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAd ? '📣 새 광고' : '새 콘텐츠'}</DialogTitle>
          <DialogDescription>
            {isAd
              ? '광고 릴스(영상)를 업로드해 인스타그램·페이스북·쇼츠로 발행할 수 있습니다.'
              : '콘텐츠를 생성하면 기본 글과 채널별 콘텐츠를 작성할 수 있습니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-title">{isAd ? '광고 이름 *' : '콘텐츠 제목 *'}</Label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAd ? '예: 7일 무료 체험 광고 릴스' : '예: 장 건강을 위한 프로바이오틱스 가이드'
              }
              autoFocus
            />
          </div>

          {!isAd && (
            <>
              <div className="space-y-2">
                <Label htmlFor="content-category">카테고리</Label>
                <Input
                  id="content-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 건강, IT, 뷰티"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-tags">태그</Label>
                <Input
                  id="content-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="쉼표로 구분 (예: 건강, 프로바이오틱스, 장건강)"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createContent.isPending}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
