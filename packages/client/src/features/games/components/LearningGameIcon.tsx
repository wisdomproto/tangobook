/** Small generated WebP artwork; semantics stay on the enclosing control. */
export function LearningGameIcon({
  name,
  size = 28,
}: {
  name: 'replay' | 'listen-play';
  size?: number;
}) {
  return (
    <img
      src={`/images/learning/game-ui-v2/${name}.webp`}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      className="learning-game-icon shrink-0 object-contain"
    />
  );
}
