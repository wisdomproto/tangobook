/**
 * 마케팅 UI 포털(드롭다운·다이얼로그·툴팁 등) 대상.
 *
 * 포털 콘텐츠를 `.marketing-scope` 요소 안으로 보내, 그 안에만 정의된 OKLCH
 * 디자인 토큰(--popover, --background 등)과 다크모드(.marketing-scope.dark)를
 * 상속받게 한다. body 로 포털하면 토큰이 미정의돼 배경이 투명해진다.
 * .marketing-scope 가 없으면 body 폴백.
 */
export function marketingPortalTarget(): HTMLElement {
  if (typeof document === 'undefined') return null as unknown as HTMLElement;
  return (document.querySelector('.marketing-scope') as HTMLElement | null) ?? document.body;
}
