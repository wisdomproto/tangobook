import { useState } from 'react';
import { useStorybooks, useDeleteStorybook } from '@/features/storybook';
import { StorybookGrid } from '@/features/storybook/components/StorybookGrid';
import { CreateStorybookModal } from '@/features/storybook/components/CreateStorybookModal';
import { DeleteConfirmModal } from '@/features/storybook/components/DeleteConfirmModal';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

export default function HomePage() {
  const { data: storybooks, isLoading, error } = useStorybooks();
  const deleteMutation = useDeleteStorybook();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-600">탱고북 저작도구</h1>
          <Button onClick={() => setCreateOpen(true)}>+ 새 동화책</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <Spinner size="lg" className="mt-20" />
        ) : error ? (
          <p className="text-center text-red-500 mt-20">{error.message}</p>
        ) : (
          <StorybookGrid
            storybooks={storybooks ?? []}
            onDelete={(id) => {
              const sb = storybooks?.find((s) => s.id === id);
              if (sb) setDeleteTarget({ id: sb.id, title: sb.title });
            }}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </main>

      <CreateStorybookModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.title ?? ''}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
