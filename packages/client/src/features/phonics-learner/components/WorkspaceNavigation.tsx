import { useEffect, useRef, type ReactNode } from 'react';
import { PanelLeftClose } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLearningWorkspace } from './learning-workspace-context';

/** Native modal keeps focus in the drawer without resizing/remounting the activity behind it. */
export function WorkspaceNavigation({ children }: { children: ReactNode }) {
  const workspace = useLearningWorkspace();
  const dialog = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation('phonics');
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (workspace?.active && workspace.navigationOpen && !node.open) node.showModal();
    else if (node.open) node.close();
  }, [workspace?.active, workspace?.navigationOpen]);
  if (!workspace?.active) return workspace?.navigationOpen === false ? null : children;
  return (
    <dialog
      ref={dialog}
      className="workspace-navigation storybook-scope"
      aria-label={t('workspace.activities')}
      onClose={() => workspace.setNavigationOpen(false)}
      onClick={(event) => {
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom)
        )
          workspace.setNavigationOpen(false);
      }}
    >
      <div className="workspace-navigation-tools">
        <button type="button" className="journey-small-button" onClick={workspace.backToMap}>
          {t(workspace.mode === 'free' ? 'freeShelf.chooseGame' : 'workspace.map')}
        </button>
        <button
          type="button"
          className="journey-small-button"
          aria-label={t('workspace.close')}
          onClick={() => workspace.setNavigationOpen(false)}
        >
          <PanelLeftClose size={24} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
