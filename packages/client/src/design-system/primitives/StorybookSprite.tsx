import assets from '../storybook-assets.json';
import '../storybook-theme.css';

export type StorybookIconName = keyof typeof assets.icons.regions;
export type StorybookSpriteName =
  | StorybookIconName
  | keyof typeof assets.buttons.regions
  | keyof typeof assets.scenery.regions;
type Rect = { x: number; y: number; width: number; height: number };

/** Crop windows only; the generated alpha atlases stay intact and share browser cache. */
export function StorybookSprite({
  name,
  size,
  className = '',
  preserveAspect = false,
}: {
  name: StorybookSpriteName;
  size?: number;
  className?: string;
  preserveAspect?: boolean;
}) {
  const resolvedName = name === 'scenery-cottage' ? 'home' : name;
  const atlas =
    resolvedName in assets.buttons.regions
      ? assets.buttons
      : resolvedName in assets.scenery.regions
        ? assets.scenery
        : assets.icons;
  const rect = (atlas.regions as Record<string, Rect>)[resolvedName];
  return (
    <span
      aria-hidden="true"
      className={`path-game-sprite ${className}`}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: preserveAspect && size ? (size * rect.width) / rect.height : (size ?? '100%'),
        height: size ?? '100%',
        backgroundImage: `url(${atlas.file})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${(atlas.width / rect.width) * 100}% ${(atlas.height / rect.height) * 100}%`,
        backgroundPosition: `${(rect.x / (atlas.width - rect.width)) * 100}% ${(rect.y / (atlas.height - rect.height)) * 100}%`,
      }}
    />
  );
}
