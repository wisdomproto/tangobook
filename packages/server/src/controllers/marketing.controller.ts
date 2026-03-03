import { MarketingService } from '../services/marketing.service.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const MarketingController = {
  generateBlog: asyncHandler(async (req, res) => {
    const { storybookId, title, topic, keywords, model } = req.body as {
      storybookId: string;
      title?: string;
      topic?: string;
      keywords?: string[];
      model?: string;
    };
    const data = await MarketingService.generateBlog(storybookId, {
      title,
      topic,
      keywords,
      model,
    });
    res.json({ success: true, data });
  }),

  regenerateBlogSection: asyncHandler(async (req, res) => {
    const { storybookId, blogPostId, sectionId, instruction, model } = req.body as {
      storybookId: string;
      blogPostId: string;
      sectionId: string;
      instruction?: string;
      model?: string;
    };
    const data = await MarketingService.regenerateBlogSection(
      storybookId,
      blogPostId,
      sectionId,
      instruction,
      model
    );
    res.json({ success: true, data });
  }),

  generateBlogConfig: asyncHandler(async (req, res) => {
    const { storybookId } = req.body as { storybookId: string };
    const data = await MarketingService.generateBlogConfig(storybookId);
    res.json({ success: true, data });
  }),

  searchKeywords: asyncHandler(async (req, res) => {
    const query = req.query.query as string;
    const data = await MarketingService.searchKeywords(query ?? '');
    res.json({ success: true, data });
  }),

  generateCardNews: asyncHandler(async (req, res) => {
    const { storybookId, colorTheme, slideCount, source } = req.body as {
      storybookId: string;
      colorTheme?: string;
      slideCount?: number;
      source?: { type: 'storybook' } | { type: 'blog'; blogPostId: string };
    };
    const data = await MarketingService.generateCardNews(storybookId, {
      colorTheme,
      slideCount,
      source,
    });
    res.json({ success: true, data });
  }),
};
