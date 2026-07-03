import { Link } from 'react-router-dom';
import { BUSINESS_INFO } from '@/config/business';

const B = BUSINESS_INFO;

/**
 * 사이트 푸터 — 사업자 정보 + 법적 문서 링크.
 * PG(토스) 가맹 심사 필수 표기 (전자상거래법 신원정보 표시).
 * 노출: LibraryPage 하단 · SubscribePage 하단.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-100/60 bg-cream-100/50 px-6 py-8 text-xs text-ink-500">
      <div className="mx-auto max-w-5xl space-y-3">
        <p className="flex flex-wrap gap-x-3 gap-y-1 font-bold">
          <Link to="/terms" className="hover:text-ink-800">
            이용약관
          </Link>
          <Link to="/privacy" className="font-black hover:text-ink-800">
            개인정보처리방침
          </Link>
          <Link to="/refund" className="hover:text-ink-800">
            취소·환불 규정
          </Link>
        </p>
        <div className="space-y-0.5 break-keep leading-relaxed">
          <p>
            {B.companyName} · 대표 {B.ceoName} · 사업자등록번호 {B.businessNumber}
          </p>
          <p>
            통신판매업신고 {B.mailOrderNumber} · {B.address}
          </p>
          <p>
            고객센터 {B.supportEmail} ({B.supportHours})
          </p>
        </div>
        <p className="pt-1 text-ink-400">
          © {new Date().getFullYear()} {B.serviceName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
