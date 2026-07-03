import { useSeo } from '@/lib/useSeo';
import { BUSINESS_INFO } from '@/config/business';
import { LegalLayout } from './LegalLayout';

const B = BUSINESS_INFO;

export default function RefundPolicyPage() {
  useSeo({
    title: `취소·환불 규정 | ${B.serviceName}`,
    description: `${B.serviceName} 이용권 취소 및 환불 규정`,
  });

  return (
    <LegalLayout title="취소·환불 규정">
      <section>
        <p>
          {B.serviceName}의 이용권은 일정 기간 디지털 콘텐츠를 이용하는{' '}
          <strong>기간제 이용권</strong>이며, <strong>자동 결제(자동 갱신)되지 않습니다.</strong>{' '}
          취소·환불은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 이 규정을 따릅니다.
        </p>
      </section>

      <section>
        <h2>1. 청약철회 (전액 환불)</h2>
        <ul>
          <li>
            결제일로부터 <strong>7일 이내</strong>이고{' '}
            <strong>유료 콘텐츠를 이용하지 않은 경우</strong>, 전액 환불받을 수 있습니다.
          </li>
          <li>
            &ldquo;유료 콘텐츠 이용&rdquo;이란 무료 제공 콘텐츠 외의 유료 동화책 열람 또는 유료
            콘텐츠 기반 학습 기능 사용을 말합니다.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. 이용 개시 후 환불 (일할 계산)</h2>
        <ul>
          <li>
            유료 콘텐츠 이용을 시작한 후에는 아래와 같이 잔여 기간에 대해 일할 계산하여 환불합니다.
          </li>
        </ul>
        <p className="rounded-xl bg-peach-100 px-4 py-3 font-bold">
          환불 금액 = 실제 결제 금액 − (실제 결제 금액 ÷ 총 이용권 일수 × 사용 일수)
        </p>
        <ul>
          <li>
            사용 일수는 이용권 개시일부터 환불 신청일까지의 일수(1일 미만은 1일)로 계산합니다.
          </li>
          <li>할인가로 구매한 경우 실제 결제한 할인 금액을 기준으로 계산합니다.</li>
          <li>잔여 일수가 없는 경우(기간 만료) 환불 대상이 아닙니다.</li>
        </ul>
      </section>

      <section>
        <h2>3. 무료 체험 및 보너스 기간</h2>
        <ul>
          <li>
            무료 체험(가입 7일) 및 친구 초대 보너스 기간은 무상 제공 혜택으로, 환불 대상이 아닙니다.
          </li>
          <li>
            무료 체험 기간 중에는 결제가 발생하지 않으므로 별도의 해지 절차 없이 기간 만료 시
            자동으로 무료 이용이 종료됩니다.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. 환불 신청 방법 및 처리</h2>
        <ol>
          <li>고객센터 이메일({B.supportEmail})로 가입 이메일 주소와 함께 환불을 신청해 주세요.</li>
          <li>
            환불은 신청일로부터 <strong>영업일 기준 3일 이내</strong> 결제 수단 취소 방식으로
            처리됩니다. (카드 취소의 경우 카드사 사정에 따라 영업일 3~7일이 추가로 소요될 수
            있습니다.)
          </li>
          <li>환불 완료 시 이용권은 즉시 종료됩니다.</li>
        </ol>
      </section>

      <section>
        <h2>5. 회사 귀책 사유로 인한 환불</h2>
        <p>
          회사의 귀책 사유(서비스 장애, 콘텐츠 하자 등)로 정상적인 이용이 불가능했던 경우, 해당
          기간만큼 이용 기간을 연장하거나 그 기간에 해당하는 금액을 환불합니다.
        </p>
      </section>

      <section>
        <h2>6. 문의</h2>
        <p>
          취소·환불에 관한 문의: {B.supportEmail} ({B.supportHours})
        </p>
      </section>
    </LegalLayout>
  );
}
