import { PanelLeftOpen } from 'lucide-react';
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
    </button>
  );
}

export function WorkspaceMenuIcon() {
  return <PanelLeftOpen size={26} aria-hidden="true" />;
}
