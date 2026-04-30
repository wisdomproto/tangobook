import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { Button } from '@/design-system';
import { useGenerateStorybook } from '../hooks/useStorybookMutations';
import { TARGET_AGES, ART_STYLES } from '@tangobook/shared';

interface CreateStorybookModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStorybookModal({ open, onClose }: CreateStorybookModalProps) {
  const navigate = useNavigate();
  const generateMutation = useGenerateStorybook();

  const [title, setTitle] = useState('');
  const [targetAge, setTargetAge] = useState<(typeof TARGET_AGES)[number]>('5-7');
  const [referenceContent, setReferenceContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    generateMutation.mutate(
      {
        title: title.trim(),
        targetAge,
        artStyle: ART_STYLES[0].prompt,
        referenceContent: referenceContent.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          onClose();
          navigate(`/editor/${data.id}`);
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="새 동화책 만들기" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 용감한 토끼의 모험"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        {/* 타겟 연령 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            타겟 연령
          </label>
          <div className="flex gap-2">
            {TARGET_AGES.map((age) => (
              <button
                key={age}
                onClick={() => setTargetAge(age)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  targetAge === age
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {age}세
              </button>
            ))}
          </div>
        </div>

        {/* 참고 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            참고 내용 (선택)
          </label>
          <textarea
            value={referenceContent}
            onChange={(e) => setReferenceContent(e.target.value)}
            placeholder="스토리 생성 시 참조할 내용을 입력하세요"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        {/* Error */}
        {generateMutation.isError && (
          <p className="text-sm text-red-500">{generateMutation.error.message}</p>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={generateMutation.isPending}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            loading={generateMutation.isPending}
            disabled={!title.trim()}
          >
            {generateMutation.isPending ? 'AI 생성 중...' : '동화책 생성하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
