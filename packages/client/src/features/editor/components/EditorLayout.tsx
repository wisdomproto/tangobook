import { ReactNode } from 'react';
import type { Storybook } from '@tangobook/shared';
import { EditorHeader } from './EditorHeader';
import { TabBar } from './TabBar';

interface EditorLayoutProps {
  storybook: Storybook;
  saving?: boolean;
  onSave: () => void;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  children: ReactNode;
}

export function EditorLayout({ storybook, saving, onSave, onUpdate, children }: EditorLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <EditorHeader storybook={storybook} saving={saving} onSave={onSave} onUpdate={onUpdate} />
      <TabBar />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
