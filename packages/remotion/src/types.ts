export type AudiobookSlide = {
  imageUrl: string;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitleText?: string;
};

export type SubtitleStyle = {
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  wordsPerGroup?: number; // 한번에 표시할 단어 수 (기본 2)
};

export type AudiobookRenderProps = {
  slides: AudiobookSlide[];
  aspectRatio: '16:9' | '9:16' | '1:1' | '3:4' | '4:3';
  cover?: {
    imageUrl: string;
    title: string;
    duration: number;
    showTitle?: boolean;
  };
  bgmUrl?: string;
  bgmVolume?: number;
  subtitleStyle: SubtitleStyle;
  enableParticles?: boolean;
  fps?: number;
};

export const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 720, height: 720 },
  '3:4': { width: 720, height: 960 },
  '4:3': { width: 960, height: 720 },
};
