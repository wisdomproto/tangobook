import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BUSINESS_INFO } from '@/config/business';

/**
 * 법적 문서(약관/개인정보/환불) 공용 레이아웃 — 문서 가독 중심의 담백한 톤.
 * PG(토스) 가맹 심사 확인 대상 페이지라 사업자 정보·시행일을 하단에 고정 표기.
 */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream-50">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          data-sound="back"
          className="mb-6 text-sm font-bold text-ink-500 hover:text-ink-800"
        >
          ← 돌아가기
        </button>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-ink-900 break-keep">
          {title}
        </h1>
        <p className="mt-1 text-xs text-ink-400">시행일: {BUSINESS_INFO.effectiveDate}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink-800 break-keep [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-ink-900 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:bg-peach-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-black [&_td]:border-t [&_td]:border-ink-100 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top">
          {children}
        </div>

        <div className="mt-12 border-t border-ink-100 pt-6 text-xs text-ink-500 space-y-1">
          <p>
            {BUSINESS_INFO.companyName} · 대표 {BUSINESS_INFO.ceoName}
          </p>
          <p>
            사업자등록번호 {BUSINESS_INFO.businessNumber} · 통신판매업신고{' '}
            {BUSINESS_INFO.mailOrderNumber}
          </p>
          <p>{BUSINESS_INFO.address}</p>
          <p>
            고객센터 {BUSINESS_INFO.supportEmail} ({BUSINESS_INFO.supportHours})
          </p>
          <p className="pt-2">
            <Link to="/terms" className="underline hover:text-ink-800">
              이용약관
            </Link>
            {' · '}
            <Link to="/privacy" className="underline hover:text-ink-800">
              개인정보처리방침
            </Link>
            {' · '}
            <Link to="/refund" className="underline hover:text-ink-800">
              취소·환불 규정
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
