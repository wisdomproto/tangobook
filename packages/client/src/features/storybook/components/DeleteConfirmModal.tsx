import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  loading,
}: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="삭제 확인">
      <div className="space-y-4">
        <p className="text-slate-700 dark:text-slate-200">
          <span className="font-semibold">'{title}'</span>을(를) 삭제하시겠습니까?
        </p>
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>모든 페이지와 삽화가 삭제됩니다</li>
          <li>캐릭터 레퍼런스 이미지가 삭제됩니다</li>
          <li>표지 이미지와 교육 콘텐츠가 삭제됩니다</li>
        </ul>
        <p className="text-sm text-red-500 font-medium">이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            삭제
          </Button>
        </div>
      </div>
    </Modal>
  );
}
