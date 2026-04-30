import type { ReactNode } from 'react';
import { Mascot, type MascotState } from './Mascot';
import { Button } from './Button';

interface StateScreenProps {
  mascotState: MascotState;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function StateScreen({
  mascotState,
  title,
  description,
  action,
  children,
}: StateScreenProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
      <Mascot state={mascotState} size="lg" />
      <h2 className="text-2xl font-black text-ink-900 font-display">{title}</h2>
      {description && <p className="text-ink-700 text-base max-w-md">{description}</p>}
      {action && (
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
