import { google } from 'googleapis';
import { Readable } from 'stream';
import type { YouTubeUploadMeta } from '@tangobook/shared';
import { config } from '../config/index.js';
import { uploadJsonToR2, downloadFromR2, deleteFromR2 } from './r2.provider.js';

const TOKENS_KEY = 'system/youtube-tokens.json';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.youtube.clientId,
    config.youtube.clientSecret,
    config.youtube.redirectUri
  );
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const buf = await downloadFromR2(TOKENS_KEY);
    return JSON.parse(buf.toString('utf-8'));
  } catch {
    return null;
  }
}

async function saveTokens(tokens: StoredTokens): Promise<void> {
  await uploadJsonToR2(tokens, TOKENS_KEY);
}

export const YouTubeProvider = {
  /** Generate Google OAuth consent URL */
  getAuthUrl(): string {
    const oauth2 = createOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
  },

  /** Exchange authorization code for tokens and save to R2 */
  async handleCallback(code: string): Promise<void> {
    const oauth2 = createOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token || !tokens.access_token) {
      throw new Error(
        'refresh_token을 받지 못했습니다. Google 계정 설정에서 앱 액세스를 취소 후 다시 시도하세요.'
      );
    }
    await saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope ?? SCOPES.join(' '),
      token_type: tokens.token_type ?? 'Bearer',
      expiry_date: tokens.expiry_date ?? 0,
    });
    console.log('[youtube] OAuth tokens saved to R2');
  },

  /** Check if YouTube is connected (tokens exist) */
  async isConnected(): Promise<boolean> {
    const tokens = await loadTokens();
    return tokens !== null && !!tokens.refresh_token;
  },

  /** Get an authenticated YouTube API client */
  async getAuthenticatedClient() {
    const tokens = await loadTokens();
    if (!tokens) throw new Error('YouTube 연결이 필요합니다.');

    const oauth2 = createOAuth2Client();
    oauth2.setCredentials(tokens);

    // Auto-refresh: listen for new tokens and save them
    oauth2.on('tokens', async (newTokens) => {
      const merged: StoredTokens = {
        ...tokens,
        access_token: newTokens.access_token ?? tokens.access_token,
        refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
        scope: newTokens.scope ?? tokens.scope,
        token_type: newTokens.token_type ?? tokens.token_type,
        expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
      };
      await saveTokens(merged);
      console.log('[youtube] Tokens refreshed and saved');
    });

    return google.youtube({ version: 'v3', auth: oauth2 });
  },

  /** Upload a video to YouTube */
  async uploadVideo(
    videoBuffer: Buffer,
    meta: YouTubeUploadMeta,
    onProgress?: (percent: number) => void
  ): Promise<{ videoId: string; videoUrl: string }> {
    const youtube = await this.getAuthenticatedClient();
    const totalBytes = videoBuffer.length;

    const res = await youtube.videos.insert(
      {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: meta.title,
            description: meta.description,
            tags: meta.tags,
            categoryId: meta.categoryId,
            defaultLanguage: meta.language || 'ko',
            defaultAudioLanguage: meta.language || 'ko',
          },
          status: {
            privacyStatus: meta.privacy,
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: Readable.from(videoBuffer),
        },
      },
      {
        onUploadProgress: (evt) => {
          if (onProgress && evt.bytesRead) {
            const percent = Math.round((evt.bytesRead / totalBytes) * 100);
            onProgress(percent);
          }
        },
      }
    );

    const videoId = res.data.id!;
    const videoUrl = `https://youtu.be/${videoId}`;

    console.log(`[youtube] Video uploaded: ${videoUrl}`);
    return { videoId, videoUrl };
  },

  /** Set thumbnail for a YouTube video */
  async setThumbnail(videoId: string, imageBuffer: Buffer): Promise<void> {
    const youtube = await this.getAuthenticatedClient();
    await youtube.thumbnails.set({
      videoId,
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(imageBuffer),
      },
    });
    console.log(`[youtube] Thumbnail set for video ${videoId}`);
  },

  /** Disconnect YouTube (delete stored tokens) */
  async uploadCaption(
    videoId: string,
    languageCode: string,
    srtContent: string,
    name?: string
  ): Promise<void> {
    const youtube = await this.getAuthenticatedClient();
    await youtube.captions.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId,
          language: languageCode,
          name: name || '',
        },
      },
      media: {
        mimeType: 'application/x-subrip',
        body: Readable.from(Buffer.from(srtContent, 'utf-8')),
      },
    });
  },

  async disconnect(): Promise<void> {
    try {
      await deleteFromR2(TOKENS_KEY);
      console.log('[youtube] Tokens deleted from R2');
    } catch {
      // tokens might not exist
    }
  },
};
