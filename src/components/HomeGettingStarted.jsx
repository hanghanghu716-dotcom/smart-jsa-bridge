import { LanguageLink } from '../hooks/useLanguage';
import '../styles/home-start-guide.css';

export default function HomeGettingStarted() {
  return <section className="home-start-guide" aria-labelledby="home-start-guide-title">
    <div className="home-start-guide-heading">
      <h2 id="home-start-guide-title">자료 확인부터 문서 작성까지</h2>
      <p>작업별 해설과 작성 도구를 함께 이용하세요.</p>
    </div>
    <div className="home-start-guide-grid">
      <article>
        <h3><LanguageLink to="/archive">작업별 해설·PDF 보기 <span aria-hidden="true">→</span></LanguageLink></h3>
        <p>적용범위, 작업별 위험요인, 중지 조건과 출처를 읽고 첨부 PDF를 확인합니다.</p>
      </article>
      <article>
        <h3><LanguageLink to="/templates">로그인 없이 작성하기 <span aria-hidden="true">→</span></LanguageLink></h3>
        <p>서식을 선택하고 기본 정보·작업 절차·위험요인과 대책을 작성해 PDF로 출력합니다.</p>
      </article>
      <article>
        <h3><LanguageLink to="/jrajsa">JRA·JSA 작성 가이드 <span aria-hidden="true">→</span></LanguageLink></h3>
        <p>위험성평가와 작업안전분석의 관계, 작업 단계 구분과 대책 작성 방법을 확인합니다.</p>
      </article>
    </div>
    <p className="home-start-guide-note">자료를 적용하기 전, 각 해설의 적용범위와 작성·전문검토 상태를 확인하세요. 예시의 위험요인과 대책은 실제 현장 조건에 맞게 검토·보완해야 합니다.</p>
  </section>;
}
