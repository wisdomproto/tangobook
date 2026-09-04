// 콘텐츠 현황 — R2 에서 직접 계산해 내준다.
//
// 🔴 왜 서버인가 — 예전엔 스크립트가 `/api/storybooks/:id` 를 1,281번 때려 정적 파일로 구웠다.
//    그러면 **프로덕션에선 배포 시점에 멈춘다** — 책을 고쳐도 현황판이 안 따라온다.
//    여기서는 저장소를 직접 읽으므로 HTTP 왕복이 없고, 저장·삭제 때 캐시만 버리면 늘 최신이다.
//
// 🔴 집계식은 여기 없다 — `@tangobook/shared` 의 `buildContentStatus` 한 곳에만 있다.
//    스크립트(build-content-status.mjs)도 같은 함수를 쓴다.
import { buildContentStatus } from '@tangobook/shared';
import { R2Repository } from '../repositories/r2.repository.js';

type Status = Omit<ReturnType<typeof buildContentStatus>, 'rows'> & { at: string; source: 'live' };

// 🔴 캐시 상태는 별도 모듈에 있다 — 저장소가 무효화를 부르는데 여기를 import 하면 순환이 된다.
import { contentStatusCache as C, invalidateContentStatus } from './content-status.cache.js';
export { invalidateContentStatus };

async function compute(): Promise<Status> {
  const list = await R2Repository.listStorybooks();
  // 요약엔 pages·key_objects 가 없어 한 권씩 열어야 한다(목록만 보면 전부 0 이 나온다).
  const full = await Promise.all(
    list.map((s) => R2Repository.getStorybook(s.id).catch(() => null))
  );
  // 🔴 rows(책별 원본 1,200여 건)는 빼고 낸다 — 화면은 categories/seam/graph 만 쓰는데
  //    같이 실으면 응답이 몇 MB가 된다. 책별 표가 필요하면 정적 현황판을 굽는다.
  const books = full.filter((b): b is NonNullable<typeof b> => b !== null);
  const { rows: _rows, ...built } = buildContentStatus(books);
  return { ...built, at: new Date().toISOString(), source: 'live' };
}

/**
 * 캐시된 현황. `fresh` 면 캐시를 무시하고 다시 계산한다.
 * 🔴 동시 요청이 겹쳐도 계산은 한 번만 한다 — 안 그러면 새로고침 두 번에 R2 를 2,500번 읽는다.
 */
export async function getContentStatus(fresh = false): Promise<Status> {
  if (fresh) C.data = null;
  if (C.data) return C.data as Status;
  if (!C.inflight) {
    C.inflight = compute()
      .then((s) => {
        C.data = s;
        return s;
      })
      .finally(() => {
        C.inflight = null;
      });
  }
  return C.inflight as Promise<Status>;
}
