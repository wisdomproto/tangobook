import { useCallback } from 'react';
import { useProject, useUpdateProject } from './use-projects';
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from '../lib/ai-models';

export interface ChannelModelSettings {
  textModel: string;
  imageModel: string;
  aspectRatio: string;
  imageStyle: string;
  imageInstruction: string;
}

const DEFAULTS: ChannelModelSettings = {
  textModel: DEFAULT_TEXT_MODEL,
  imageModel: DEFAULT_IMAGE_MODEL,
  // '1:1' is the first ASPECT_RATIO_PRESETS entry; inline to avoid api/ → components/ coupling
  aspectRatio: '1:1',
  imageStyle: '',
  imageInstruction: '',
};

interface ChannelModelsBag {
  channelModels?: Record<string, Partial<ChannelModelSettings>>;
  [k: string]: unknown;
}

export function useChannelModels(projectId: string | null, channel: string) {
  const { data: project } = useProject(projectId);
  const updateProject = useUpdateProject();

  const bag = (project?.ai_model_settings ?? {}) as ChannelModelsBag;
  const stored = bag.channelModels?.[channel] ?? {};
  const models: ChannelModelSettings = { ...DEFAULTS, ...stored };

  const setChannelModels = useCallback(
    (updates: Partial<ChannelModelSettings>) => {
      if (!projectId) return;
      const prevBag = (project?.ai_model_settings ?? {}) as ChannelModelsBag;
      const nextBag: ChannelModelsBag = {
        ...prevBag,
        channelModels: {
          ...(prevBag.channelModels ?? {}),
          [channel]: { ...(prevBag.channelModels?.[channel] ?? {}), ...updates },
        },
      };
      updateProject.mutate({
        id: projectId,
        updates: { ai_model_settings: nextBag as unknown as Record<string, unknown> },
      });
    },
    [projectId, channel, project, updateProject]
  );

  return { models, setChannelModels };
}
