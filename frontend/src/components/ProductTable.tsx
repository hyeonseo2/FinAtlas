import { RankedOption } from "../types/product";
import { fmtRate, fmtMoney } from "../lib/format";
import { DifficultyBadge } from "./DifficultyBadge";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";

type DisplayOption = RankedOption & {
  bank_name: string;
  product_name: string;
  product_type: string;
  bonus_condition_count: number;
};

export type SortKey = "interest" | "expected" | "max" | "base" | "easy" | "conditions" | "maturity";
export type SortDirection = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  interest: "예상이자",
  expected: "현실금리",
  max: "최고금리",
  base: "기본금리",
  easy: "난이도 쉬움순",
  conditions: "조건 적은순",
  maturity: "만기예상액",
};


function productTypeLabel(v?: string): string {
  if (v === "deposit") return "예금";
  return "적금";
}

function renderProductNameWithParen(name?: string) {
  const raw = (name || "-").trim();
  if (!raw || raw === "-") return <>{raw}</>;
  const parts = raw.split(/(\([^\)]*\))/g).filter((x) => x.length > 0);
  return (
    <>
      {parts.map((part, idx) => (
        /\([^\)]*\)/.test(part) ? (
          <span key={idx} className="paren-nowrap">{part}</span>
        ) : (
          <span key={idx}>{part}</span>
        )
      ))}
    </>
  );
}

export function ProductTable({
  rows,
  selected,
  paymentAmount,
  onSelect,
  sortKey,
  sortDirection,
  onSort,
}: {
  rows: DisplayOption[];
  selected: Set<string>;
  paymentAmount: number;
  onSelect: (r: DisplayOption) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const arrow = (key: SortKey) => (sortKey === key ? (sortDirection === "desc" ? " ▼" : " ▲") : "");
  const goDetail = (optionId: string) => {
    window.location.hash = `#/detail?option=${optionId}`;
  };

  const HeaderButton = ({
    keyName,
    label,
    disabled = false,
    onClick,
  }: {
    keyName: SortKey | "none";
    label: string;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={`sortable ${keyName === sortKey ? "active" : ""} ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "해당 컬럼은 정렬 미지원" : undefined}
    >
      {label}
      {keyName !== "none" ? arrow(keyName as SortKey) : ""}
    </button>
  );

  return (
    <div className="card table-wrap">
      <table className="product-list-table">
        <thead>
          <tr>
            <th className="col-compare">비교</th>
            <th>금융사</th>
            <th>상품명</th>
            <th>
              <HeaderButton keyName="none" label="기간" disabled onClick={() => {}} />
            </th>
            <th>
              <HeaderButton keyName="base" label="기본금리" onClick={() => onSort("base")} />
            </th>
            <th>
              <HeaderButton keyName="max" label="최고금리" onClick={() => onSort("max")} />
            </th>
            <th>
              <HeaderButton keyName="expected" label={SORT_LABELS.expected} onClick={() => onSort("expected")} />
            </th>
            <th>
              <HeaderButton keyName="easy" label="난이도" onClick={() => onSort("easy")} />
            </th>
            <th>
              <HeaderButton keyName="interest" label={SORT_LABELS.interest} onClick={() => onSort("interest")} />
            </th>
                        <th className="col-maturity">
              <HeaderButton keyName="maturity" label="만기예상액" onClick={() => onSort("maturity")} />
            </th>
            <th className="col-detail">상세</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const interest = expectedInterestByProductType(paymentAmount, r.expected_rate, r.save_term_months, r.product_type);
            const maturity = maturityAmount(paymentAmount, r.save_term_months, interest, r.product_type);
            const isSelected = selected.has(r.option_id);
            return (
              <tr
                key={r.option_id}
                className={isSelected ? "selected-row" : undefined}
              >
                <td className="col-compare">
                  <input
                    className="pretty-check compare-check"
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelect(r);
                    }}
                    aria-label={`비교에 추가: ${r.product_name || r.bank_name || "상품"}`}
                  />
                </td>
                <td className="bank-cell">{r.bank_name || "-"}</td>
                <td className="product-cell product-cell-linebreak">
                  <span className={`product-type-label ${r.product_type === "deposit" ? "ptype-deposit" : "ptype-saving"}`}>
                    {productTypeLabel(r.product_type)}
                  </span>
                  <span className="product-cell-name">{renderProductNameWithParen(r.product_name || "-")}</span>
                </td>
                <td>{r.save_term_months}개월</td>
                <td className="nowrap-cell">{fmtRate(r.base_rate)}</td>
                <td className="nowrap-cell">{fmtRate(r.max_rate)}</td>
                <td className="nowrap-cell">{fmtRate(r.expected_rate)}</td>
                <td className="nowrap-cell">
                  <DifficultyBadge score={r.difficulty_score} />
                </td>
                <td className="money-strong nowrap-cell">{fmtMoney(interest)}</td>
                <td className="money nowrap-cell col-maturity">{fmtMoney(maturity)}</td>
                <td className="nowrap-cell action-col-cell col-detail">
                  <button
                    type="button"
                    className="table-action-btn table-action-icon-btn"
                    aria-label={`상세 보기: ${r.product_name || r.bank_name || "상품"}`}
                    title="상세 보기"
                    onClick={(e) => {
                      e.stopPropagation();
                      goDetail(r.option_id);
                    }}
                  >
                    🔍
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

