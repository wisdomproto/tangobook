import { apiPost } from '@/lib/axios';

export interface GenerateHiddenObjectSceneReq {
  storybookId: string;
  storybookTitle: string;
  artStyle: string;
  theme?: string;
  objects: { name: string; imageUrl?: string }[];
  model?: string;
}

export const hiddenObjectApi = {
  generateScene(req: GenerateHiddenObjectSceneReq): Promise<{ imageUrl: string }> {
    return apiPost<{ imageUrl: string }>('/images/hidden-object-scene', req);
  },
};
