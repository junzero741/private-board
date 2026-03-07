import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | 님보',
  description: '님보 서비스 이용약관',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">이용약관</h1>
      <p className="text-sm text-text-muted mb-10">최종 수정일: 2025년 3월 7일</p>

      <div className="flex flex-col gap-8 text-sm text-text-secondary leading-relaxed">
        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">1. 서비스 소개</h2>
          <p>
            님보(이하 "서비스")는 비밀번호로 보호된 문서를 간편하게 공유할 수 있는 플랫폼입니다.
            별도의 회원가입 없이 누구나 이용할 수 있으며, 작성된 게시글은 설정된 만료 시간이 지나면
            자동으로 삭제됩니다.
          </p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">2. 금지 행위</h2>
          <p className="mb-2">이용자는 서비스를 통해 다음 콘텐츠를 작성하거나 공유해서는 안 됩니다.</p>
          <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1">
            <li>아동·청소년 성착취물 등 불법 성인 콘텐츠</li>
            <li>마약, 불법 무기 등 불법 물품의 거래·홍보 정보</li>
            <li>타인의 명예를 훼손하거나 허위사실을 유포하는 내용</li>
            <li>동의 없이 수집된 개인정보 및 민감정보</li>
            <li>저작권·초상권 등 타인의 지식재산권을 침해하는 콘텐츠</li>
            <li>피싱, 사기, 악성코드 등 타인을 속이거나 해치는 행위</li>
            <li>그 밖에 현행 법령에 위반되는 모든 행위</li>
          </ul>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">3. 콘텐츠 책임</h2>
          <p>
            서비스에 게시되는 모든 콘텐츠의 법적 책임은 작성자 본인에게 있습니다.
            운영자는 이용자가 작성한 콘텐츠를 사전에 검토하지 않으나, 불법 콘텐츠가 신고되거나
            확인될 경우 해당 게시글을 즉시 삭제하고 관계 기관에 협조할 수 있습니다.
          </p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">4. 서비스 이용 안내</h2>
          <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1">
            <li>게시글은 설정된 만료 시간이 지나면 자동 삭제되며, 복구가 불가능합니다.</li>
            <li>비밀번호는 암호화되어 저장되므로 분실 시 복구가 불가능합니다.</li>
            <li>서비스 안정성을 위해 과도한 요청은 제한될 수 있습니다.</li>
          </ul>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">5. 면책조항</h2>
          <p>
            운영자는 서비스의 중단, 데이터 손실, 또는 이용자 간 분쟁으로 인한 손해에 대해
            법령이 허용하는 범위 내에서 책임을 지지 않습니다.
            서비스는 현재 상태 그대로("as-is") 제공되며, 무중단을 보장하지 않습니다.
          </p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">6. 약관 변경</h2>
          <p>
            운영자는 필요에 따라 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내
            공지 또는 본 페이지 상단의 수정일 업데이트를 통해 고지합니다.
            변경 후 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주합니다.
          </p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-text-primary mb-3">7. 문의</h2>
          <p>
            불법 콘텐츠 신고 및 서비스 관련 문의는{' '}
            <a
              href="https://forms.gle/icQCbPWP2wT3HUUD9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              피드백 폼
            </a>
            을 통해 접수해주세요.
          </p>
        </article>
      </div>
    </section>
  );
}
