// 콘텐츠 현황 캐시의 상태만 든다.
// 🔴 저장소(r2.repository)가 무효화를 부르는데, 서비스를 직접 import 하면 순환이 된다
//    (서비스 → 저장소 → 서비스). 그래서 아무것도 import 하지 않는 이 모듈에 상태를 둔다.
export const contentStatusCache: { data: unknown | null; inflight: Promise<unknown> | null } = {
  data: null,
  inflight: null,
};

/** 책이 저장·삭제되면 부른다. 다음 조회가 다시 계산한다. */
export function invalidateContentStatus(): void {
  contentStatusCache.data = null;
}
