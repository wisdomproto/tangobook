import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { readGuestEvents } from '../lib/guest-events';
import { LEARNING_CHANGE } from '../lib/event-outbox';
import { transferGuestEvents } from '../lib/guest-transfer';

const subscribe = (callback: () => void) => {
  window.addEventListener(LEARNING_CHANGE, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(LEARNING_CHANGE, callback);
    window.removeEventListener('storage', callback);
  };
};
export function GuestRecordImport({
  profileId,
  name,
  onImported,
}: {
  profileId: string;
  name: string;
  onImported: () => void;
}) {
  const { t } = useTranslation('learning');
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(readGuestEvents()),
    () => '[]'
  );
  const events = JSON.parse(snapshot) as ReturnType<typeof readGuestEvents>;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!events.some((event) => !event.profile_id || event.profile_id === profileId)) return null;
  return (
    <section className="rounded-2xl border border-peach-200 bg-peach-50 p-4">
      <h2 className="font-bold">{t('overview.guestTitle')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">
        {t('overview.guestNote', { name })}
      </p>
      {failed && (
        <p role="alert" className="mt-2 text-sm">
          {t('overview.guestFailed')}
        </p>
      )}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await transferGuestEvents(profileId);
          setBusy(false);
          setFailed(!ok);
          if (ok) onImported();
        }}
        className="mt-3 min-h-11 rounded-full bg-white px-4 py-3 text-sm font-bold text-coral-600 disabled:opacity-50"
      >
        {t(busy ? 'overview.guestBusy' : 'overview.guestTransfer')}
      </button>
    </section>
  );
}
