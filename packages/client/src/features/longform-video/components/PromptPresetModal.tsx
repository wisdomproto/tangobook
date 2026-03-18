import { useState } from 'react';
import { Modal } from '@/components/Modal';
import {
  usePresetList,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
} from '../hooks/usePromptPresets';
import type { PromptPreset } from '@tangobook/shared';

// ===== Edit mode: edit systemPrompt content of one preset =====
interface EditModeProps {
  open: boolean;
  onClose: () => void;
  preset: PromptPreset;
}

function PromptPresetEditModal({ open, onClose, preset }: EditModeProps) {
  const [content, setContent] = useState(preset.systemPrompt);
  const updatePreset = useUpdatePreset();

  const handleSave = async () => {
    await updatePreset.mutateAsync({ id: preset.id, data: { systemPrompt: content } });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="시스템 프롬프트 편집" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {preset.name}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono resize-y"
            placeholder="시스템 프롬프트를 입력하세요..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={updatePreset.isPending}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {updatePreset.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ===== Manage mode: full CRUD for preset list =====
interface ManageModeProps {
  open: boolean;
  onClose: () => void;
}

function PromptPresetManageModal({ open, onClose }: ManageModeProps) {
  const { data: presets = [], isLoading } = usePresetList();
  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createPreset.mutateAsync({ name: newName.trim(), systemPrompt: '' });
    setNewName('');
  };

  const handleRenameStart = (preset: PromptPreset) => {
    setEditingId(preset.id);
    setEditingName(preset.name);
  };

  const handleRenameConfirm = async () => {
    if (!editingId || !editingName.trim()) return;
    await updatePreset.mutateAsync({ id: editingId, data: { name: editingName.trim() } });
    setEditingId(null);
    setEditingName('');
  };

  const handleDuplicate = async (preset: PromptPreset) => {
    await createPreset.mutateAsync({
      name: `${preset.name} (복사본)`,
      systemPrompt: preset.systemPrompt,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 프리셋을 삭제하시겠습니까?')) return;
    await deletePreset.mutateAsync(id);
  };

  return (
    <Modal open={open} onClose={onClose} title="프롬프트 프리셋 관리" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* 새 프리셋 추가 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="새 프리셋 이름..."
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || createPreset.isPending}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            추가
          </button>
        </div>

        {/* 프리셋 목록 */}
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            불러오는 중...
          </p>
        ) : presets.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            등록된 프리셋이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {presets.map((preset) => (
              <li
                key={preset.id}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                {editingId === preset.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameConfirm();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-violet-400 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      onClick={handleRenameConfirm}
                      className="text-xs px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors"
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">
                      {preset.name}
                    </span>
                    {/* 이름 변경 */}
                    <button
                      onClick={() => handleRenameStart(preset)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded"
                      title="이름 변경"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {/* 복제 */}
                    <button
                      onClick={() => handleDuplicate(preset)}
                      disabled={createPreset.isPending}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50 transition-colors rounded"
                      title="복제"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    {/* 삭제 */}
                    <button
                      onClick={() => handleDelete(preset.id)}
                      disabled={deletePreset.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors rounded"
                      title="삭제"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ===== Public-facing unified component =====

interface PromptPresetModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'edit' | 'manage';
  /** Required when mode === 'edit' */
  preset?: PromptPreset;
}

export function PromptPresetModal({ open, onClose, mode, preset }: PromptPresetModalProps) {
  if (mode === 'edit') {
    if (!preset) return null;
    return <PromptPresetEditModal open={open} onClose={onClose} preset={preset} />;
  }
  return <PromptPresetManageModal open={open} onClose={onClose} />;
}
