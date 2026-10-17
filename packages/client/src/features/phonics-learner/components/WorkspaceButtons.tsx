import { PanelLeftOpen } from 'lucide-react';
import './workspace-buttons.css';
import { useTranslation } from 'react-i18next';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { useLearningWorkspace } from './learning-workspace-context';

export function WorkspaceMapButton() {
  const workspace = useLearningWorkspace();
  const { t } = useTranslation('phonics');
  if (!workspace?.active) return null;
  return (
    <button
      type="button"
      className="workspace-map-button"
      aria-label={t('workspace.map')}
      title={t('workspace.map')}
      onClick={workspace.backToMap}
    >
      <StorybookSprite name="compass" size={28} />
      <span>{t('workspace.map')}</span>
    </button>
  );
}

/** Back exits the activity; the separate menu opens its chapter without exiting. */
export function WorkspaceActivityButtons({ onBack }: { onBack: () => void }) {
  const workspace = useLearningWorkspace();
  const { t } = useTranslation('phonics');
  return (
    <div className="workspace-activity-buttons">
      <button
        type="button"
        className="workspace-icon-button"
        aria-label={t('common.back')}
        title={t('common.back')}
        onClick={onBack}
      >
        <StorybookSprite name="back" size={28} />
      </button>
      {workspace?.active && (
        <button
          type="button"
          className="workspace-icon-button"
          aria-label={t('workspace.activities')}
          title={t('workspace.activities')}
          aria-expanded={workspace.navigationOpen}
          onClick={() => workspace.setNavigationOpen(true)}
        >
          <WorkspaceMenuIcon />
        </button>
      )}
    </div>
  );
}

export function WorkspaceMenuIcon() {
  return <PanelLeftOpen size={26} aria-hidden="true" />;
}
