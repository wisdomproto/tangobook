import React from 'react';
import { AbsoluteFill, Audio } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { KenBurnsSlide } from '../components/KenBurnsSlide';
import { TypewriterSubtitle } from '../components/TypewriterSubtitle';
import { SparkleParticles } from '../components/SparkleParticles';
import { CoverSlide } from '../components/CoverSlide';
import { EndingSlide } from '../components/EndingSlide';
import type { AudiobookRenderProps } from '../types';

const CROSSFADE_DURATION = 15;
const DEFAULT_SLIDE_DURATION = 90;
const ENDING_DURATION = 90;

function getSlideDuration(slide: AudiobookRenderProps['slides'][0], fps: number): number {
  if (slide.ttsDuration) {
    return Math.ceil((slide.ttsDuration + 0.5) * fps);
  }
  return DEFAULT_SLIDE_DURATION;
}

export const AudiobookComposition: React.FC<AudiobookRenderProps> = ({
  slides,
  cover,
  bgmUrl,
  bgmVolume = 30,
  subtitleStyle,
  enableParticles = true,
}) => {
  const fps = 30;
  const coverDuration = cover ? Math.ceil(cover.duration * fps) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {cover && (
          <>
            <TransitionSeries.Sequence durationInFrames={coverDuration} key="cover">
              <CoverSlide
                imageUrl={cover.imageUrl}
                title={cover.title}
                subtitleStyle={subtitleStyle}
                enableParticles={enableParticles}
              />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
            />
          </>
        )}

        {slides.map((slide, index) => {
          const duration = getSlideDuration(slide, fps);
          return (
            <React.Fragment key={index}>
              <TransitionSeries.Sequence durationInFrames={duration}>
                <AbsoluteFill>
                  <KenBurnsSlide imageUrl={slide.imageUrl} slideIndex={index} />
                  {slide.subtitleText && (
                    <TypewriterSubtitle
                      text={slide.subtitleText}
                      style={subtitleStyle}
                      wordsPerGroup={subtitleStyle.wordsPerGroup}
                    />
                  )}
                  {enableParticles && <SparkleParticles seed={index} />}
                  {slide.ttsUrl && <Audio src={slide.ttsUrl} volume={1} />}
                </AbsoluteFill>
              </TransitionSeries.Sequence>
              {index < slides.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
                />
              )}
            </React.Fragment>
          );
        })}

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={ENDING_DURATION} key="ending">
          <EndingSlide enableParticles={enableParticles} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {bgmUrl && <Audio src={bgmUrl} volume={bgmVolume / 100} loop />}
    </AbsoluteFill>
  );
};
