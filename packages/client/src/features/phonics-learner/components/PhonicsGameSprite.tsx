import assets from '../lib/path-assets.json';
import './phonics-game-assets.css';

export type PathIconName = keyof typeof assets.icons.regions;
type SpriteName =
  | PathIconName
  | keyof typeof assets.buttons.regions
  | keyof typeof assets.scenery.regions;
type Rect = { x: number; y: number; width: number; height: number };

/** Crop windows only; the generated alpha atlases stay intact and share browser cache. */
export function PhonicsGameSprite({
  name,
  size,
  className = '',
  preserveAspect = false,
}: {
  name: SpriteName;
  size?: number;
  className?: string;
  preserveAspect?: boolean;
}) {
  const atlas =
    name in assets.buttons.regions
      ? assets.buttons
      : name in assets.scenery.regions
        ? assets.scenery
        : assets.icons;
  const rect = (atlas.regions as Record<string, Rect>)[name];
  return (
    <span
      aria-hidden="true"
      className={`path-game-sprite ${className}`}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: preserveAspect && size ? (size * rect.width) / rect.height : (size ?? '100%'),
        height: size ?? '100%',
        backgroundImage: `url(/images/phonics/path-premium-v1/${atlas.file})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${(atlas.width / rect.width) * 100}% ${(atlas.height / rect.height) * 100}%`,
        backgroundPosition: `${(rect.x / (atlas.width - rect.width)) * 100}% ${(rect.y / (atlas.height - rect.height)) * 100}%`,
      }}
    />
  );
}
