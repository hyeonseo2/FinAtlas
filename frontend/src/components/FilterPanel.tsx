import { Filters } from "../types/product";

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "우대조건(전체)" },
  { value: "marketing_agree", label: "마케팅 동의" },
  { value: "app_signup", label: "앱/비대면 가입" },
  { value: "auto_transfer", label: "자동이체" },
  { value: "salary_transfer", label: "급여이체" },
  { value: "first_customer", label: "첫거래/신규" },
  { value: "card_spending", label: "카드 실적" },
  { value: "pension_transfer", label: "연금이체" },
  { value: "bundle_product", label: "번들상품" },
  { value: "event_participation", label: "이벤트" },
  { value: "unclear", label: "기타/해석불명" },
];

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function FilterPanel({
  filters,
  setFilters,
  terms,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  terms: number[];
}) {
  const set = (k: keyof Filters, v: string) => setFilters((p) => ({ ...p, [k]: v as never }));

  const reset = () =>
    setFilters((p) => ({
      ...p,
      group: "",
      bank: "",
      term: "",
      minBaseRate: "",
      minMaxRate: "",
      minExpectedRate: "",
      maxDifficulty: "100",
      savingType: "",
      conditionCategory: "",
      sort: "interest",
    }));

  return (
    <div className="card">
      <div className="filter-title">필터 & 정렬</div>
      <div className="filters">
        <div className="filter-field">
          <FieldLabel>권역</FieldLabel>
          <select value={filters.group} onChange={(e) => set("group", e.target.value)}>
            <option value="">전체</option>
            <option value="020000">은행</option>
            <option value="030300">저축은행</option>
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>은행명</FieldLabel>
          <input placeholder="예: KB국민" value={filters.bank} onChange={(e) => set("bank", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>기간</FieldLabel>
          <select value={filters.term} onChange={(e) => set("term", e.target.value)}>
            <option value="">전체</option>
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}개월
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>우대 조건</FieldLabel>
          <select value={filters.conditionCategory} onChange={(e) => set("conditionCategory", e.target.value)}>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>기본금리 최소</FieldLabel>
          <input placeholder="예: 2.0" value={filters.minBaseRate} onChange={(e) => set("minBaseRate", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>최고금리 최소</FieldLabel>
          <input placeholder="예: 3.0" value={filters.minMaxRate} onChange={(e) => set("minMaxRate", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>예상 금리 최소</FieldLabel>
          <input placeholder="예: 4.0" value={filters.minExpectedRate} onChange={(e) => set("minExpectedRate", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>난이도 최대점수</FieldLabel>
          <input placeholder="100" value={filters.maxDifficulty} onChange={(e) => set("maxDifficulty", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>적립 유형</FieldLabel>
          <input placeholder="예: 정기예금" value={filters.savingType} onChange={(e) => set("savingType", e.target.value)} />
        </div>

        <div className="filter-field">
          <FieldLabel>정렬</FieldLabel>
          <select value={filters.sort} onChange={(e) => set("sort", e.target.value)}>
            <option value="interest">현실 예상이자순</option>
            <option value="expected">현실금리순</option>
            <option value="max">최고금리순</option>
            <option value="base">기본금리순</option>
            <option value="easy">난이도 쉬움순</option>
            <option value="conditions">조건 적은순</option>
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>초기화</FieldLabel>
          <button type="button" onClick={reset}>
            필터 초기화
          </button>
        </div>
      </div>
      <p className="note">난이도 점수는 높을수록 조건 달성이 쉽고(성공 가능성 큼)으로 해석합니다.</p>
    </div>
  );
}
