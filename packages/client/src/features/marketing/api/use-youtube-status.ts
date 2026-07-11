// 유튜브 연결 상태(오디오북/롱폼과 공용 채널) — /api/mkt/youtube/status.
import { useQuery } from '@tanstack/react-query';

export interface YoutubeChannel {
  id: string;
  name: string;
  channelId?: string;
  channelTitle?: string;
}

export interface YoutubeStatus {
  connected: boolean;
  channels: YoutubeChannel[];
}

export function useYoutubeStatus() {
  return useQuery({
    queryKey: ['mkt', 'youtube-status'],
    staleTime: 60_000,
    queryFn: async (): Promise<YoutubeStatus> => {
      const res = await fetch('/api/mkt/youtube/status');
      const b = (await res.json().catch(() => ({}))) as YoutubeStatus & { success?: boolean };
      if (!res.ok || !b.success) return { connected: false, channels: [] };
      return { connected: b.connected, channels: b.channels ?? [] };
    },
  });
}
