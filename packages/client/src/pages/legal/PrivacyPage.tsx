import { useSeo } from '@/lib/useSeo';
import { BUSINESS_INFO } from '@/config/business';
import { LegalLayout } from './LegalLayout';

const B = BUSINESS_INFO;

export default function PrivacyPage() {
  useSeo({
    title: `개인정보처리방침 | ${B.serviceName}`,
    description: `${B.serviceName} 개인정보처리방침`,
  });

  return (
    <LegalLayout title="개인정보처리방침">
      <section>
        <p>
          {B.companyName}(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 등 관련 법령을 준수하며,
          이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>
      </section>

      <section>
        <h2>1. 수집하는 개인정보 항목 및 수집 방법</h2>
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>수집 항목</th>
              <th>수집 방법</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>이메일 가입</td>
              <td>이메일 주소, 비밀번호(암호화 저장)</td>
              <td>회원 가입 시</td>
            </tr>
            <tr>
              <td>소셜 가입 (카카오/구글)</td>
              <td>이메일 주소, 닉네임, 프로필 이미지</td>
              <td>소셜 로그인 연동 시</td>
            </tr>
            <tr>
              <td>자녀 프로필</td>
              <td>자녀 이름(또는 애칭), 프로필 아이콘</td>
              <td>보호자(회원)가 직접 등록</td>
            </tr>
            <tr>
              <td>서비스 이용 기록</td>
              <td>읽은 책, 학습 게임 결과, 학습 시간 등 학습 활동 기록</td>
              <td>서비스 이용 과정에서 자동 생성</td>
            </tr>
            <tr>
              <td>결제 기록</td>
              <td>주문번호, 상품명, 결제 금액, 결제 일시</td>
              <td>이용권 구매 시</td>
            </tr>
          </tbody>
        </table>
        <p>
          ※ 신용카드 번호 등 결제 수단 정보는 전자결제대행사(토스페이먼츠)가 직접 처리하며, 회사는
          이를 저장하지 않습니다.
        </p>
      </section>

      <section>
        <h2>2. 개인정보의 처리 목적</h2>
        <ul>
          <li>회원 가입 및 관리, 본인 확인, 부정 이용 방지</li>
          <li>디지털 동화책·학습 서비스 제공 및 자녀별 학습 기록·리포트 제공</li>
          <li>이용권 결제, 환불 등 계약의 이행</li>
          <li>공지사항 전달, 문의 응대</li>
          <li>서비스 개선을 위한 통계 분석 (개인 식별이 불가능한 형태)</li>
        </ul>
      </section>

      <section>
        <h2>3. 아동의 개인정보 보호</h2>
        <ul>
          <li>
            만 14세 미만 아동은 서비스에 직접 가입할 수 없으며, 보호자(법정대리인)인 회원이 자녀
            프로필을 직접 생성·관리합니다. 자녀 프로필 정보의 등록·수정·삭제 권한은 전적으로
            보호자에게 있습니다.
          </li>
          <li>회사는 아동으로부터 직접 개인정보를 수집하지 않습니다.</li>
          <li>부모 전용 화면(설정·결제)에는 어른 확인 절차를 두어 아동의 접근을 제한합니다.</li>
        </ul>
      </section>

      <section>
        <h2>4. 개인정보의 보유 및 이용 기간</h2>
        <ul>
          <li>회원 탈퇴 시 수집된 개인정보(자녀 프로필, 학습 기록 포함)는 지체 없이 파기합니다.</li>
          <li>
            단, 관련 법령에 따라 보존이 필요한 경우 아래 기간 동안 보관합니다:
            <ul>
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
            </ul>
          </li>
        </ul>
      </section>

      <section>
        <h2>5. 개인정보 처리의 위탁</h2>
        <p>회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.</p>
        <table>
          <thead>
            <tr>
              <th>수탁자</th>
              <th>위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase Inc.</td>
              <td>회원 인증 및 데이터베이스 운영 (서울 리전)</td>
            </tr>
            <tr>
              <td>토스페이먼츠(주)</td>
              <td>전자결제 처리</td>
            </tr>
            <tr>
              <td>Cloudflare, Inc. / Railway Corp.</td>
              <td>콘텐츠 저장 및 서버 호스팅 (클라우드 인프라, 국외 소재 가능)</td>
            </tr>
          </tbody>
        </table>
        <p>
          ※ 국외 사업자에 위탁되는 정보는 서비스 제공에 필요한 최소한의 범위이며, 위탁 계약 시
          개인정보 보호 관련 법령 준수를 요구하고 있습니다.
        </p>
      </section>

      <section>
        <h2>6. 이용자의 권리</h2>
        <ul>
          <li>
            회원은 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 서비스 내 설정에서 계정 삭제
            (탈퇴)를 통해 수집·이용 동의를 철회할 수 있습니다.
          </li>
          <li>
            보호자는 자녀 프로필 정보의 열람·수정·삭제를 서비스 내에서 직접 수행할 수 있습니다.
          </li>
          <li>
            기타 개인정보 관련 요청은 고객센터({B.supportEmail})로 문의할 수 있으며, 회사는 지체
            없이 조치합니다.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. 쿠키 및 유사 기술</h2>
        <p>
          서비스는 로그인 유지 및 화면 설정(음량, 자막 등) 저장을 위해 브라우저의 쿠키 및
          로컬스토리지를 사용합니다. 이용자는 브라우저 설정을 통해 이를 거부할 수 있으나, 이 경우
          일부 기능 이용이 제한될 수 있습니다. 회사는 제3자 광고 목적의 추적 쿠키를 사용하지
          않습니다.
        </p>
      </section>

      <section>
        <h2>8. 개인정보의 안전성 확보 조치</h2>
        <ul>
          <li>비밀번호 및 인증 정보의 암호화 저장</li>
          <li>접근 권한 최소화 및 접근 통제 (행 수준 보안 적용)</li>
          <li>전송 구간 암호화(HTTPS)</li>
        </ul>
      </section>

      <section>
        <h2>9. 개인정보 보호책임자</h2>
        <ul>
          <li>개인정보 보호책임자: {B.privacyOfficer}</li>
          <li>문의: {B.supportEmail}</li>
        </ul>
        <p>
          개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118)에
          문의할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>10. 고지 의무</h2>
        <p>
          이 방침의 내용이 추가, 삭제, 수정되는 경우 시행 7일 전부터 서비스 내 공지를 통해 알립니다.
          이 방침은 {B.effectiveDate}부터 시행합니다.
        </p>
      </section>
    </LegalLayout>
  );
}
