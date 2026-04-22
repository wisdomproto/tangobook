import { Mascot } from '@/components/Mascot';

interface MascotCornerProps {
  visible: boolean;
}

export function MascotCorner({ visible }: MascotCornerProps) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-24 right-6 bg-white/85 backdrop-blur-sm rounded-full p-2 shadow-soft z-5 pointer-events-none"
      aria-hidden="true"
    >
      <Mascot state="dancing" size="sm" />
    </div>
  );
}
