import { useState } from 'react';
import type { ChildProfile } from '@tangobook/shared';
import { useAuth } from '../context/AuthContext';
import { ProfileCreateModal, type ProfileInput } from '../components/ProfileCreateModal';
import { AvatarRender } from '../components/AvatarRender';
import { profilesApi } from '../api/profiles.api';

export default function ParentProfilesPage() {
  const { account, profiles, refresh, activeProfile, setActiveProfile } = useAuth();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ChildProfile | null>(null);

  const canAddNew = profiles.length < 4;

  const handleCreate = () => {
    setEditing(null);
    setModalMode('create');
  };
  const handleEdit = (p: ChildProfile) => {
    setEditing(p);
    setModalMode('edit');
  };
  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };
  const handleSubmit = async (input: ProfileInput) => {
    if (modalMode === 'edit' && editing) {
      await profilesApi.update(editing.id, input);
    } else if (modalMode === 'create' && account) {
      const firstEver = profiles.length === 0;
      const created = await profilesApi.create({ accountId: account.id, ...input });
      if (firstEver) setActiveProfile(created);
    }
    await refresh();
    closeModal();
  };
  const handleDelete = async () => {
    if (!editing) return;
    await profilesApi.delete(editing.id);
    if (activeProfile?.id === editing.id) setActiveProfile(null);
    await refresh();
    closeModal();
  };

  return (
    <>
      <h2 className="text-2xl font-black text-ink-900 mb-1">자녀 프로필 관리</h2>
      <p className="text-sm text-ink-500 mb-4">
        카드를 탭하면 <strong>활성 프로필로 선택</strong>돼요. 활성 중인 카드를 다시 탭하면 편집.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {profiles.map((p) => {
          const isActive = activeProfile?.id === p.id;
          return (
            <div
              key={p.id}
              className={`relative bg-white rounded-2xl p-4 shadow-soft transition-all flex flex-col items-center gap-2 ${
                isActive ? 'ring-2 ring-coral-500' : ''
              }`}
            >
              <button
                onClick={() => (isActive ? handleEdit(p) : setActiveProfile(p))}
                className="w-full flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                title={isActive ? '편집' : '이 아이로 선택'}
              >
                <AvatarRender id={p.avatarId} size="lg" />
                <div className="text-xl font-black text-ink-900">{p.name}</div>
                {isActive ? (
                  <span className="text-xs font-bold text-coral-500">✓ 현재 활성</span>
                ) : (
                  <span className="text-xs text-ink-400">탭해서 선택</span>
                )}
              </button>
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(p);
                  }}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-ink-100 hover:bg-ink-200 text-sm"
                  title="편집"
                >
                  ✏️
                </button>
              )}
            </div>
          );
        })}
        {canAddNew && (
          <button
            onClick={handleCreate}
            aria-label="새 아이 추가"
            className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop flex flex-col items-center justify-center text-5xl text-coral-500 font-black min-h-[160px]"
          >
            +<span className="text-sm text-ink-700 mt-2">새 아이 추가</span>
          </button>
        )}
      </div>
      <ProfileCreateModal
        open={modalMode !== null}
        mode={modalMode ?? 'create'}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        onDelete={modalMode === 'edit' ? handleDelete : undefined}
      />
    </>
  );
}
