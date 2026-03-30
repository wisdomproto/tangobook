import { google } from 'googleapis';
import { Readable } from 'stream';
import type { YouTubeUploadMeta, YouTubeChannel } from '@tangobook/shared';
import { config } from '../config/index.js';
import { uploadJsonToR2, downloadFromR2, deleteFromR2 } from './r2.provider.js';

const CHANNELS_KEY = 'system/youtube-channels.json';
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

interface StoredChannel {
  channel: YouTubeChannel;
  tokens: StoredTokens;
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    config.youtube.clientId,
    config.youtube.clientSecret,
    config.youtube.redirectUri
  );
}

async function loadChannels(): Promise<StoredChannel[]> {
  try {
    const buf = await downloadFromR2(CHANNELS_KEY);
    const data = JSON.parse(buf.toString('utf-8'));
    // Migration: old single-token format → array
    if (!Array.isArray(data) && data.access_token) {
      return [
        {
          channel: {
            id: 'default',
            name: '기본 채널',
            connectedAt: new Date().toISOString(),
          },
          tokens: data as StoredTokens,
        },
      ];
    }
    return data;
  } catch {
    return [];
  }
}

async function saveChannels(channels: StoredChannel[]): Promise<void> {
  await uploadJsonToR2(channels, CHANNELS_KEY);
}

export const YouTubeProvider = {
  /** Generate Google OAuth consent URL with optional channel name in state */
  getAuthUrl(channelName?: string): string {
    const oauth2 = createOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: SCOPES,
      state: channelName || '',
    });
  },

  /** Exchange authorization code for tokens, fetch channel info, save */
  async handleCallback(code: string, channelName?: string): Promise<YouTubeChannel> {
    const oauth2 = createOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token || !tokens.access_token) {
      throw new Error(
        'refresh_token을 받지 못했습니다. Google 계정 설정에서 앱 액세스를 취소 후 다시 시도하세요.'
      );
    }

    const storedTokens: StoredTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope ?? SCOPES.join(' '),
      token_type: tokens.token_type ?? 'Bearer',
      expiry_date: tokens.expiry_date ?? 0,
    };

    // Fetch channel info
    oauth2.setCredentials(storedTokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2 });
    let channelId: string | undefined;
    let channelTitle: string | undefined;
    try {
      const res = await youtube.channels.list({ part: ['snippet'], mine: true });
      const ch = res.data.items?.[0];
      if (ch) {
        channelId = ch.id ?? undefined;
        channelTitle = ch.snippet?.title ?? undefined;
      }
    } catch (err) {
      console.error('[youtube] Failed to fetch channel info:', err);
    }

    const channel: YouTubeChannel = {
      id: crypto.randomUUID(),
      name: channelName || channelTitle || '채널',
      channelId,
      channelTitle,
      connectedAt: new Date().toISOString(),
    };

    const channels = await loadChannels();
    channels.push({ channel, tokens: storedTokens });
    await saveChannels(channels);

    console.log('[youtube] Channel connected:', channel.name, channelId);
    return channel;
  },

  /** List all connected channels */
  async listChannels(): Promise<YouTubeChannel[]> {
    const channels = await loadChannels();
    return channels.map((c) => c.channel);
  },

  /** Check if any YouTube channel is connected */
  async isConnected(): Promise<boolean> {
    const channels = await loadChannels();
    return channels.length > 0;
  },

  /** Get an authenticated YouTube API client for a specific channel */
  async getAuthenticatedClient(channelId?: string) {
    const channels = await loadChannels();
    if (channels.length === 0) throw new Error('YouTube 연결이 필요합니다.');

    // Find specific channel or use first one
    const entry = channelId ? channels.find((c) => c.channel.id === channelId) : channels[0];
    if (!entry) throw new Error('해당 YouTube 채널을 찾을 수 없습니다.');

    const oauth2 = createOAuth2Client();
    oauth2.setCredentials(entry.tokens);

    // Auto-refresh: update tokens when refreshed
    oauth2.on('tokens', async (newTokens) => {
      entry.tokens = {
        ...entry.tokens,
        access_token: newTokens.access_token ?? entry.tokens.access_token,
        refresh_token: newTokens.refresh_token ?? entry.tokens.refresh_token,
        scope: newTokens.scope ?? entry.tokens.scope,
        token_type: newTokens.token_type ?? entry.tokens.token_type,
        expiry_date: newTokens.expiry_date ?? entry.tokens.expiry_date,
      };
      await saveChannels(channels);
      console.log('[youtube] Tokens refreshed for channel:', entry.channel.name);
    });

    return google.youtube({ version: 'v3', auth: oauth2 });
  },

  /** Upload a video to YouTube */
  async uploadVideo(
    videoBuffer: Buffer,
    meta: YouTubeUploadMeta,
    onProgress?: (percent: number) => void,
    channelId?: string
  ): Promise<{ videoId: string; videoUrl: string }> {
    const youtube = await this.getAuthenticatedClient(channelId);
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
            privacyStatus: meta.publishAt ? 'private' : meta.privacy,
            selfDeclaredMadeForKids: false,
            ...(meta.publishAt ? { publishAt: meta.publishAt } : {}),
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
  async setThumbnail(videoId: string, imageBuffer: Buffer, channelId?: string): Promise<void> {
    const youtube = await this.getAuthenticatedClient(channelId);
    await youtube.thumbnails.set({
      videoId,
      media: {
        mimeType: 'image/jpeg',
        body: Readable.from(imageBuffer),
      },
    });
    console.log(`[youtube] Thumbnail set for video ${videoId}`);
  },

  /** Upload caption/subtitle track */
  async uploadCaption(
    videoId: string,
    languageCode: string,
    srtContent: string,
    name?: string,
    channelId?: string
  ): Promise<void> {
    const youtube = await this.getAuthenticatedClient(channelId);
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

  /** Remove a connected channel */
  async removeChannel(channelId: string): Promise<void> {
    const channels = await loadChannels();
    const filtered = channels.filter((c) => c.channel.id !== channelId);
    await saveChannels(filtered);
    console.log('[youtube] Channel removed:', channelId);
  },

  /** Disconnect all channels (backward compat) */
  async disconnect(): Promise<void> {
    try {
      await deleteFromR2(CHANNELS_KEY);
      console.log('[youtube] All channels disconnected');
    } catch {
      // tokens might not exist
    }
  },
};
