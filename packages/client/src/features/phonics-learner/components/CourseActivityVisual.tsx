import {
  Blocks,
  Headphones,
  MousePointer2,
  PencilLine,
  Search,
  Shapes,
  Volume2,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { CourseActivityMode } from '../lib/course-presentation';
import { ToyHangul } from './ToyHangul';

export const courseActivityIcons = {
  learn: Volume2,
  listen: Headphones,
  write: PencilLine,
  find: Search,
  match: Shapes,
  draw: MousePointer2,
  build: Blocks,
};

export function CourseActivityVisual({
  mode,
  preview,
  iconUrl,
  illustrated = false,
  repetitions = 1,
  toolVisual,
  fallbackVisual,
}: {
  mode: CourseActivityMode;
  preview: string[];
  iconUrl?: string;
  illustrated?: boolean;
  repetitions?: number;
  toolVisual?: ReactNode;
  fallbackVisual?: ReactNode;
}) {
  const Icon = courseActivityIcons[mode];
  const letters =
    repetitions > 1 && preview.length === 1
      ? Array.from({ length: repetitions }, () => preview[0])
      : preview.slice(0, preview.some((letter) => letter.length > 2) ? 1 : 3);
  const longest = Math.max(1, ...letters.map((letter) => letter.length));
  const letterStyle = { '--course-preview-length': longest } as CSSProperties;
  return (
    <div
      className="course-activity-art"
      aria-hidden="true"
      data-mode={mode}
      data-illustrated={illustrated || undefined}
    >
      {preview.length ? (
        <div
          className="course-activity-letters"
          style={letterStyle}
          data-long={longest > 4 || undefined}
          data-writing={mode === 'write' || undefined}
        >
          {letters.map((letter, index) => (
            <span key={`${letter}-${index}`}>
              {illustrated ? <ToyHangul text={letter} decorative /> : letter}
            </span>
          ))}
        </div>
      ) : iconUrl ? (
        <img src={iconUrl} alt="" className="size-20 object-contain" />
      ) : (
        (fallbackVisual ?? <Icon size={52} strokeWidth={1.75} />)
      )}
      <span className="course-activity-tool">
        {toolVisual ?? <Icon size={23} strokeWidth={2} />}
      </span>
    </div>
  );
}
