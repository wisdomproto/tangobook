import { useTranslation } from 'react-i18next';
import { AVATAR_IDS, type AvatarId } from '../lib/avatars';
import { AvatarRender } from './AvatarRender';
import { cn } from '@/lib/cn';

interface Props {
  value: AvatarId | null;
  onChange: (id: AvatarId) => void;
}

export function AvatarPicker({ value, onChange }: Props) {
  const { t } = useTranslation('auth');
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-2xl p-2 transition-all bg-white shadow-soft',
            value === id ? 'ring-4 ring-coral-500 scale-105' : 'hover:scale-105 hover:shadow-pop'
          )}
          aria-label={t('avatar.ariaLabel', { id })}
        >
          <AvatarRender id={id} size="md" />
        </button>
      ))}
    </div>
  );
}
