export function HomePage() {
  return (
    <div className="card service-hero">
      <h2 className="service-name">FinAtlas</h2>
      <p className="service-subtitle">Financial Atlas 금융상품 분석 비교 서비스</p>
      <p className="hero-summary-line">
        현실적으로 받기 쉬운 금리로 비교하는 서비스입니다. 우대조건 달성 난이도와 추정 이자를 기반으로 내가 맞는 금융상품을 찾아볼 수 있습니다.
      </p>
      <div className="hero-features">
        <div className="hero-feature-item">최고금리가 아니라 실제 적용 가능성이 높은 금리 중심</div>
        <div className="hero-feature-item">우대조건 난이도 점수 + 추정 이자 동시 제공</div>
        <div className="hero-feature-item">상품/옵션 단위 비교</div>
      </div>
      <p className="note" style={{ marginTop: 4 }}>
        본 지표는 공개된 우대조건 텍스트를 기반한 추정치입니다. 실제 적용금리는 개인 조건과 은행 심사에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}
