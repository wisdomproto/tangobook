import { useCallback, useEffect, useRef, useState } from 'react';
import { StoryBgmPlayer } from '../lib/story-bgm-player';

export function useStoryBgm(url: string | undefined, volume: number) {
  const player = useRef<StoryBgmPlayer | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  useEffect(() => {
    const current = new StoryBgmPlayer(0, setIsBgmPlaying);
    player.current = current;
    return () => {
      current.dispose();
      player.current = null;
    };
  }, []);
  useEffect(() => {
    player.current?.setVolume(volume);
  }, [volume]);
  useEffect(() => {
    player.current?.setUrl(url);
  }, [url]);
  const toggleBgm = useCallback(() => player.current?.toggle(), []);
  const unlockBgm = useCallback(() => player.current?.unlock(), []);
  return { isBgmPlaying, toggleBgm, unlockBgm };
}
