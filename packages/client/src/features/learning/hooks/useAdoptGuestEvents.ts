import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { eventsApi } from '../api/events.api';
import { readGuestEvents, drainGuestEvents } from '../lib/guest-events';

/**
 * 게스트로 놀며 로컬에 쌓인 기록을, **프로필이 생기는 순간 그 프로필로 옮겨 붙인다.**
 *
 * 🔴 이게 없으면 로컬 기록은 그냥 쌓이기만 하고 아무도 안 본다 — 가입한 부모가 첫 리포트를 열었을 때
 *    "아무것도 안 했음" 을 보는 건 게스트 30일을 통째로 버리던 예전과 같다.
 * 🔴 **업로드가 성공한 뒤에 비운다**(`drainGuestEvents` 는 꺼내면서 지운다). 실패하면 그대로 두고
 *    다음 기회에 다시 시도한다 — 한 번 지우면 되돌릴 데가 없다.
 * 🔴 한 세션에 한 번만 시도한다(`triedRef`). 실패를 렌더마다 재시도하면 조용한 무한 업로드가 된다.
 */
export function useAdoptGuestEvents() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id ?? null;
  const queryClient = useQueryClient();
  const triedRef = useRef(false);

  useEffect(() => {
    if (!profileId || triedRef.current) return;
    if (readGuestEvents().length === 0) return;
    triedRef.current = true;

    void (async () => {
      // 지우기 전에 사본을 들고 있는다 — 업로드가 실패하면 되돌려 놓는다.
      const pending = drainGuestEvents(profileId);
      const ok = await eventsApi.insert(pending);
      if (!ok) {
        try {
          localStorage.setItem(
            'tangobook-guest-learning-events',
            JSON.stringify(pending.map((e) => ({ ...e, profile_id: '' })))
          );
        } catch {
          /* 되돌리기까지 실패하면 더 할 수 있는 게 없다 */
        }
        triedRef.current = false;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['learning-events', profileId] });
    })();
  }, [profileId, queryClient]);
}
