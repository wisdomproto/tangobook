import { StorybookSprite, type StorybookIconName } from './StorybookSprite';

/** A shared visual vocabulary for menu tools; game labels keep their own translations. */
export function StorybookGameIcon({ game, size = 48 }: { game: string; size?: number }) {
  const name: StorybookIconName = /writing|draw|color|trace/.test(game)
    ? 'write'
    : /block|matching|match/.test(game)
      ? 'combine'
      : /order|sequence/.test(game)
        ? 'flag'
        : /hidden|find|object/.test(game)
          ? 'compass'
          : /speak|listen/.test(game)
            ? 'listen'
            : /story|read/.test(game)
              ? 'book'
              : 'play';
  return <StorybookSprite name={name} size={size} />;
}
