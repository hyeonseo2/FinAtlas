export function HomePage() {
  return (
    <div className="card">
      <h2>finatlas</h2>
      <h2>적금 현실금리 비교 서비스</h2>
      <ul>
        <li>최고금리가 아니라 실제로 받기 쉬운 금리 중심</li>
        <li>상품/옵션 단위 비교(예: 12/24/36개월)</li>
        <li>우대조건 난이도 점수와 추정 이자 동시 제공</li>
      </ul>
      <p className="note">
        본 지표는 공개된 우대조건 텍스트를 기반한 추정치입니다. 실제 적용금리는 개인 조건과 은행 심사에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}
