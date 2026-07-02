import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mascot } from '@/design-system';
import { useSeo } from '@/lib/useSeo';
import { useAuth } from '@/features/auth/context/AuthContext';

const REF_KEY = 'tb_ref';

/**
 * 친구 초대 랜딩 (`/invite/:code`).
 * 초대 링크로 들어온 방문자에게 차가운 홈 대신 따뜻한 환영 화면을 보여준다.
 * 코드는 localStorage 에 저장 → 가입/로그인 후 AuthContext 가 redeem.
 *
 * ⚠️ OG(카카오 공유 미리보기)는 SPA 라 크롤러가 JS 를 안 돌려 완전히는 안 잡힘 —
 *    prerender/서버 meta 로 `/invite/*` 에 og-invite.png 를 서빙하는 후속 작업 필요.
 *    여기서는 JS 로 og:image 를 세팅해 최소 커버.
 */
export default function InviteLandingPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  useSeo({
    title: '친구가 탱고북에 초대했어요',
    description: '회원 가입하면 7일 동안 모든 동화를 무료로 즐길 수 있어요.',
    image: '/og-invite.png',
    path: code ? `/invite/${code}` : '/invite',
  });

  // 초대 코드 저장 (가입 후 redeem 용). 로그인 여부와 무관하게 보존.
  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem(REF_KEY, code);
      } catch {
        // best-effort
      }
    }
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-pop flex flex-col items-center gap-4 text-center">
        <Mascot state="waving" size="lg" character="hori" />
        <span className="text-xs font-black text-coral-600 bg-coral-50 rounded-full px-3 py-1">
          🎁 친구 초대 선물
        </span>
        <h1 className="text-2xl font-black text-ink-900 font-display break-keep">
          친구가 탱고북에 초대했어요!
        </h1>
        <p className="text-ink-600 leading-relaxed break-keep">
          세계 명작 동화와 자연관찰 그림책을 아이 목소리로 읽어줘요. 회원 가입하면{' '}
          <span className="font-black text-coral-600">7일 동안 모든 동화 무료</span>, 초대로
          시작하면 <span className="font-black text-coral-600">친구도 나도 +7일</span>!
        </p>

        {session ? (
          <button
            onClick={() => navigate('/library')}
            className="mt-2 w-full h-14 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 transition"
          >
            동화 보러 가기
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate('/login?mode=signup')}
              className="mt-2 w-full h-14 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 transition"
            >
              회원 가입하고 7일 무료 시작
            </button>
            <button
              onClick={() => navigate('/library')}
              className="text-sm font-bold text-ink-500 hover:text-coral-500"
            >
              먼저 둘러볼래요
            </button>
          </>
        )}
      </div>
    </div>
  );
}
