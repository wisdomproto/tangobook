import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { BUSINESS_INFO } from '@/config/business';

const B = BUSINESS_INFO;

// 통신판매업 신고번호 미발급(TODO 값) 상태에서는 미완성 문자열 대신 안내 문구를 노출.
// business.ts 에 실제 번호가 채워지면 자동으로 번호가 표시된다.
const mailOrderLabel = B.mailOrderNumber.startsWith('TODO') ? '신고 준비 중' : B.mailOrderNumber;

/**
 * 사이트 푸터 — 법적 문서 링크 + (기본) 사업자 정보.
 * 사업자 정보는 전자상거래법 신원표시(사이버몰 **초기화면** 기준) · PG(토스) 가맹 심사용.
 *
 * `minimal` — 링크 + 저작권만. 공개 블로그처럼 판매 화면이 아닌 콘텐츠 페이지용:
 *   초기화면이 아니라 신원표시 의무 대상이 아니고, 해외(vi/zh/th) 방문자에게
 *   한국 사업자등록번호·통신판매업신고·고객센터 번호는 의미가 없다.
 *   개인정보처리방침 접근성은 링크로 유지한다.
 * `lang` — 그 언어로 라벨 고정(블로그는 URL 의 :lang 이 표시 언어). 없으면 UI 언어.
 */
export function SiteFooter({ minimal = false, lang }: { minimal?: boolean; lang?: string } = {}) {
  const { t: tUi } = useTranslation('payment');
  const t = lang ? i18n.getFixedT(lang, 'payment') : tUi;
  return (
    <footer className="mt-16 border-t border-ink-100/60 bg-cream-100/50 px-6 py-8 text-xs text-ink-500">
      <div className="mx-auto max-w-5xl space-y-3">
        <p className="flex flex-wrap gap-x-3 gap-y-1 font-bold">
          <Link to="/terms" className="hover:text-ink-800">
            {t('subscribe.terms')}
          </Link>
          <Link to="/privacy" className="font-black hover:text-ink-800">
            {t('subscribe.privacy')}
          </Link>
          <Link to="/refund" className="hover:text-ink-800">
            {t('subscribe.refund')}
          </Link>
        </p>
        {!minimal && (
          <div className="space-y-0.5 break-keep leading-relaxed">
            <p>
              {B.companyName} · 대표 {B.ceoName} · 사업자등록번호 {B.businessNumber}
            </p>
            <p>통신판매업신고 {mailOrderLabel}</p>
            <p>주소 {B.address}</p>
            <p>
              고객센터 {B.supportPhone} · {B.supportEmail} ({B.supportHours})
            </p>
          </div>
        )}
        <p className="pt-1 text-ink-400">
          © {new Date().getFullYear()} {B.serviceName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
