import { withLearningStorageLock } from './storage-lock';
import { eventsApi } from '../api/events.api';
import { prepareGuestTransfer, acknowledgeGuestEvents } from './guest-events';

/** ACK each small batch independently; a failed batch stays on this device. */
export async function transferGuestEvents(profileId: string): Promise<boolean> {
  try {
    const pending = await withLearningStorageLock(() => prepareGuestTransfer(profileId));
    for (let offset = 0; offset < pending.length; offset += 100) {
      const chunk = pending.slice(offset, offset + 100);
      if (!(await eventsApi.insert(chunk))) return false;
      await withLearningStorageLock(() =>
        acknowledgeGuestEvents(chunk.flatMap((e) => (e.id ? [e.id] : [])))
      );
    }
    return true;
  } catch {
    return false;
  }
}
