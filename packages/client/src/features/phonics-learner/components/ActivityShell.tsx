import { createContext, useContext, type ReactNode } from 'react';

/**
 * 이 셸이 **전체화면이 아니라 남의 화면 속 상자**에 그려져야 하는가.
 *
 * 🔴 활동 13개에 prop 을 하나씩 뚫지 않으려고 컨텍스트로 뒀다. 기본값 `false` 라
 *    학습 화면은 아무것도 안 바뀐다 — 블로그처럼 감싸는 쪽만 provider 를 켠다.
 *    (공유 컴포넌트를 새 용도에 맞춰 고치면 원래 쓰던 13화면이 조용히 망가진다.)
 */
const EmbeddedContext = createContext(false);
export const PhonicsEmbeddedProvider = EmbeddedContext.Provider;

/**
 * 지금 이 화면이 **광고 랜딩 상자 안**인지. 🔴 게임 쪽(`features/games`)도 알아야 한다 —
 * 전체화면 전제로 만든 장치(가로 회전 요구·「🏠 홈」)가 상자 안에서는 틀린 행동이 되기 때문이다.
 */
export function usePhonicsEmbedded() {
  return useContext(EmbeddedContext);
}

interface Props {
  onBack: () => void;
  /**
   * 뒤로가기 **오른쪽**에 놓을 것(진행 dots 등). 있으면 헤더가 양끝 정렬이 된다.
   * 없으면 예전처럼 버튼만 왼쪽에 붙는다.
   */
  headerRight?: ReactNode;
  /** 세로로 넘치는 걸 허용할지(모음 듣기처럼 카드가 많은 화면). 기본은 화면 안에 가둔다. */
  scroll?: boolean;
  /** 배경 — 기본은 파닉스 공용 배경. 알파벳 쓰기처럼 다른 배경을 쓰는 화면만 넘긴다. */
  background?: 'study' | 'peach-gradient';
  children: ReactNode;
}

const BACKGROUND_CLASS: Record<NonNullable<Props['background']>, string> = {
  // 🔴 크림 바탕을 깔고 그 위에 사진을 얹는다 — 사진이 뜨기 전 한 프레임이 투명(검정 배경)으로
  //    번쩍이던 자리다. 예전엔 화면마다 `bg-cream-50` 을 붙였다 말았다 했다.
  study: 'bg-cream-50 bg-cover bg-center',
  'peach-gradient': 'bg-gradient-to-b from-cream-50 to-peach-100',
};

const STUDY_BG = {
  backgroundImage: "url('/images/phonics/study-bg.webp')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
} as const;

/**
 * 파닉스 활동의 공용 껍데기 — 전체화면 + 배경 + 「← 돌아가기」.
 *
 * 🔴 왜 있나: 활동 13개가 이 마크업을 **글자 하나까지 똑같이** 복사해 갖고 있었다. 그래서
 *    패딩·z-index·뒤로가기 생김새를 한 번 바꾸려면 13곳을 고쳐야 했고, 실제로는 그중 몇 개만
 *    고쳐져서 화면마다 조금씩 다른 상태가 됐다(`overflow` 만 두 종류였다).
 *
 * 🔴 **본문은 셸이 정하지 않는다.** 활동마다 gap·정렬이 달라서 안쪽까지 공용화하면 오히려
 *    화면 하나 고칠 때마다 나머지 12개가 흔들린다. 셸은 **바깥 테두리와 뒤로가기까지**만 맡는다.
 *
 * 🔴 카드·타일 크기는 여기서 안 준다 — 격자가 활동마다 달라 한 공식으로 못 묶는다.
 *    대신 규칙만 적어둔다: **전체화면 활동의 정사각 타일은 `min(Nvw, Mvh)`** 로 잡는다.
 *    vw 만 보면 세로가 짧은 화면(1024×768·모바일 가로)에서 아래가 잘리고, vh 만 보면
 *    넓은 화면에서 좁쌀만 해진다.
 */
export function ActivityShell({
  onBack,
  headerRight,
  scroll = false,
  background = 'study',
  children,
}: Props) {
  const embedded = useContext(EmbeddedContext);
  const back = (
    /**
     * 🔴 `shrink-0` 필수 — 옆에 `headerRight` 가 서면 flex 가 **뒤로가기부터 줄인다**. 영어 4글자
     *    단원(STUV)의 글자 탭이 298px 이라 375px 화면에서 버튼이 47px 로 눌려 **세 줄로 접혔고**
     *    헤더가 136px 로 부풀어 아래 내용을 밀어냈다.
     * 🔴 `min-h-[44px]` — 아이 손가락 기준. 예전엔 13화면 전부 40px 이었고, 이제 한 곳이라 같이 낫는다.
     */
    <button
      onClick={onBack}
      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full bg-white shadow-soft text-ink-700 font-bold"
    >
      ← 돌아가기
    </button>
  );
  return (
    <div
      className={[
        // 🔴 embedded 는 **자기 상자 안에만** 그린다 — `fixed inset-0` 이면 블로그 글 위를 덮는다.
        //    높이를 정해 주는 건 감싸는 쪽(`PhonicsTryIt`)이고, 여기선 그 높이를 채우기만 한다.
        embedded
          ? 'relative h-full w-full flex flex-col px-3 sm:px-4 py-3 rounded-[22px]'
          : 'fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4',
        scroll ? 'overflow-y-auto' : 'overflow-hidden',
        BACKGROUND_CLASS[background],
      ]
        .filter(Boolean)
        .join(' ')}
      style={background === 'study' ? STUDY_BG : undefined}
    >
      {/* 🔴 embedded 엔 「← 돌아가기」를 두지 않는다 — 돌아갈 데가 없고(블로그 글 안이다),
          그 자리는 아래 CTA 가 맡는다. 활동이 넘긴 `onBack` 은 그대로 무시된다. */}
      {embedded ? (
        headerRight ? (
          <div className="mb-2 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {headerRight}
          </div>
        ) : null
      ) : headerRight ? (
        <div className="flex items-center justify-between gap-3 mb-3">
          {back}
          {/* 🔴 넘치는 쪽은 **오른쪽**이다 — 글자 탭이 많은 단원(STUV·WXYZ)은 줄여도 안 들어가므로
              가로로 밀어 볼 수 있게 한다. `min-w-0` 없이는 flex 자식이 안 줄어 페이지가 옆으로 샌다. */}
          <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {headerRight}
          </div>
        </div>
      ) : (
        <div className="self-start mb-3">{back}</div>
      )}
      {children}
    </div>
  );
}
