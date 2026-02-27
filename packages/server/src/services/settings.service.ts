import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

interface TitleTemplate {
  id: string;
  imageUrl: string;
  createdAt: string;
}

const TITLE_TEMPLATES_KEY = 'settings/title-templates.json';

async function getTemplates(): Promise<TitleTemplate[]> {
  try {
    const url = `${r2PublicUrl}/${TITLE_TEMPLATES_KEY}`;
    const res = await axios.get<TitleTemplate[]>(url, { timeout: 5000 });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

async function saveTemplates(templates: TitleTemplate[]): Promise<void> {
  await uploadJsonToR2(templates, TITLE_TEMPLATES_KEY);
}

export const SettingsService = {
  async getTitleTemplates(): Promise<TitleTemplate[]> {
    return getTemplates();
  },

  async addTitleTemplate(imageUrl: string): Promise<TitleTemplate> {
    const templates = await getTemplates();
    const newTemplate: TitleTemplate = {
      id: Date.now().toString(),
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    await saveTemplates(templates);
    return newTemplate;
  },

  async removeTitleTemplate(id: string): Promise<void> {
    const templates = await getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    await saveTemplates(filtered);
  },
};
