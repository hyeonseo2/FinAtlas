import { Filters } from "../types/product";

const RATE_OPTIONS = Array.from({ length: 61 }, (_, i) => Number((i * 0.5).toFixed(1)));

const PRODUCT_TYPE_OPTIONS: Array<{ value: "saving" | "deposit"; label: string }> = [
  { value: "saving", label: "적금" },
  { value: "deposit", label: "예금" },
];

const GROUP_LABELS: Record<string, string> = {
  "": "전체",
  "020000": "은행",
  "030300": "저축은행",
};

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "marketing_agree", label: "마케팅 동의" },
  { value: "app_signup", label: "앱/비대면 가입" },
  { value: "auto_transfer", label: "자동이체" },
  { value: "salary_transfer", label: "급여이체" },
  { value: "first_customer", label: "첫거래/신규" },
  { value: "card_spending", label: "카드 실적" },
  { value: "pension_transfer", label: "연금이체" },
  { value: "bundle_product", label: "동시보유" },
  { value: "event_participation", label: "이벤트" },
];

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function conditionLabelFromValue(value: string): string {
  const match = CATEGORY_OPTIONS.find((c) => c.value === value);
  return match?.label || value;
}

export function FilterPanel({
  filters,
  setFilters,
  terms,
  bankNames,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  terms: number[];
  bankNames: string[];
}) {
  const set = (k: keyof Filters, v: string) => setFilters((p) => ({ ...p, [k]: v as never }));

  const productTypeLabelClass = (value: "saving" | "deposit") =>
    value === "deposit" ? "filter-type-btn ptype-deposit" : "filter-type-btn ptype-saving";

  const onToggleCondition = (value: string) => {
    setFilters((prev) => {
      const exists = prev.conditionCategory.includes(value);
      const next = exists
        ? prev.conditionCategory.filter((v) => v !== value)
        : [...prev.conditionCategory, value];
      return { ...prev, conditionCategory: next };
    });
  };

  const onToggleProductType = (value: "saving" | "deposit") => {
    setFilters((prev) => ({
      ...prev,
      productType: prev.productType === value ? "" : value,
    }));
  };

  const clearOne = (key: keyof Filters) => {
    setFilters((prev) => {
      if (key === "conditionCategory") {
        return { ...prev, conditionCategory: [] };
      }
      if (key === "productType") {
        return { ...prev, productType: "" };
      }
      if (key === "group") return { ...prev, group: "020000" };
      return { ...prev, [key]: "" as never };
    });
  };

  const clearCondition = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      conditionCategory: prev.conditionCategory.filter((v) => v !== value),
    }));
  };

  const reset = () =>
    setFilters((p) => ({
      ...p,
      group: "020000",
      bank: "",
      term: "",
      minBaseRate: "",
      minMaxRate: "",
      minExpectedRate: "",
      productNameQuery: "",
      productType: "",
      conditionCategory: [],
    }));

  const activeFilters: { key: string; label: string; rawValue: string }[] = [];
  if (filters.group) activeFilters.push({ key: "group", label: `권역: ${GROUP_LABELS[filters.group] || filters.group}`, rawValue: filters.group });
  if (filters.bank) activeFilters.push({ key: "bank", label: `은행: ${filters.bank}`, rawValue: filters.bank });
  if (filters.term) activeFilters.push({ key: "term", label: `기간: ${filters.term}개월`, rawValue: String(filters.term) });
  if (filters.minBaseRate)
    activeFilters.push({ key: "minBaseRate", label: `기본금리 ≥ ${filters.minBaseRate}%`, rawValue: filters.minBaseRate });
  if (filters.minMaxRate)
    activeFilters.push({ key: "minMaxRate", label: `최고금리 ≥ ${filters.minMaxRate}%`, rawValue: filters.minMaxRate });
  if (filters.minExpectedRate)
    activeFilters.push({ key: "minExpectedRate", label: `현실금리 ≥ ${filters.minExpectedRate}%`, rawValue: filters.minExpectedRate });
  if (filters.productNameQuery)
    activeFilters.push({ key: "productNameQuery", label: `상품명: ${filters.productNameQuery}`, rawValue: filters.productNameQuery });
  if (filters.productType) {
    const typeLabel = PRODUCT_TYPE_OPTIONS.find((x) => x.value === filters.productType)?.label || filters.productType;
    activeFilters.push({ key: "productType", label: `상품유형: ${typeLabel}`, rawValue: filters.productType });
  }

  filters.conditionCategory.forEach((cat) => {
    activeFilters.push({ key: `condition-${cat}`, label: `조건: ${conditionLabelFromValue(cat)}`, rawValue: cat });
  });

  return (
    <div className="card">
      <div className="filter-title-row">
        <span className="filter-title">필터</span>
        <button type="button" className="filter-reset-btn" onClick={reset}>
          초기화
        </button>
      </div>

      <div className="filter-active-row">
        {activeFilters.map((chip) => {
          const isCondition = chip.key.startsWith("condition-");
          const key = chip.rawValue;
          return (
            <button
              type="button"
              className="active-filter-chip"
              key={chip.key}
              onClick={() => {
                if (isCondition) {
                  clearCondition(key);
                } else {
                  clearOne(chip.key as keyof Filters);
                }
              }}
            >
              {chip.label}
              <span className="active-filter-chip-x" aria-hidden="true">
                ×
              </span>
            </button>
          );
        })}
        {activeFilters.length === 0 ? <span className="muted">적용 중인 필터가 없습니다.</span> : null}
      </div>

      <div className="filters">
        <div className="filter-field">
          <FieldLabel>상품유형</FieldLabel>
          <div className="filter-type-row">
            {PRODUCT_TYPE_OPTIONS.map((opt) => {
              const active = filters.productType === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  className={`${productTypeLabelClass(opt.value)}${active ? " active" : ""}`}
                  onClick={() => onToggleProductType(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

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
          <select value={filters.bank} onChange={(e) => set("bank", e.target.value)}>
            <option value="">전체</option>
            {bankNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
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
          <FieldLabel>기본금리 최소</FieldLabel>
          <select value={filters.minBaseRate} onChange={(e) => set("minBaseRate", e.target.value)}>
            <option value="">전체</option>
            {RATE_OPTIONS.map((r) => (
              <option key={`base-${r}`} value={r}>
                {r.toFixed(1)}%
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>최고금리 최소</FieldLabel>
          <select value={filters.minMaxRate} onChange={(e) => set("minMaxRate", e.target.value)}>
            <option value="">전체</option>
            {RATE_OPTIONS.map((r) => (
              <option key={`max-${r}`} value={r}>
                {r.toFixed(1)}%
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>현실금리 최소</FieldLabel>
          <select value={filters.minExpectedRate} onChange={(e) => set("minExpectedRate", e.target.value)}>
            <option value="">전체</option>
            {RATE_OPTIONS.map((r) => (
              <option key={`expected-${r}`} value={r}>
                {r.toFixed(1)}%
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <FieldLabel>상품명</FieldLabel>
          <input
            className="product-name-input-wide"
            id="filter-product-name"
            name="productNameQuery"
            placeholder="예: iM함께예금"
            value={filters.productNameQuery}
            onChange={(e) => set("productNameQuery", e.target.value)}
          />
        </div>

        <div className="filter-field condition-filter-field">
          <FieldLabel>우대 조건 (중복 체크)</FieldLabel>
          <div className="condition-checks">
            {CATEGORY_OPTIONS.map((opt) => {
              const checked = filters.conditionCategory.includes(opt.value);
              return (
                <label key={opt.value} className="condition-chip">
                  <input
                    className="pretty-check condition-check"
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCondition(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
