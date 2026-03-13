import { RankedOption } from "../types/product";
import { fmtRate, fmtMoney } from "../lib/format";
import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";

const DRAWER_DEFAULT_PAYMENT = 500000;

type DisplayOption = RankedOption & {
  bank_name: string;
  product_name: string;
  product_type: string;
  bonus_condition_count: number;
};

export function CompareDrawer({ rows, visible, onClose, paymentAmount }: { rows: DisplayOption[]; visible: boolean; onClose: () => void; paymentAmount: number }) {

  if (!visible) return null;

  const withCalc = rows
    .map((r) => {
      const interest = expectedInterestByProductType(paymentAmount, r.expected_rate, r.save_term_months, r.product_type);
      return {
        ...r,
        interest,
        maturity: maturityAmount(paymentAmount, r.save_term_months, interest, r.product_type),
      };
    })
    .sort((a, b) => b.interest - a.interest);

  return (
    <div className="card">
      <div className="topline">
        <h3>선택한 상품 비교 ({rows.length})</h3>
        <div className="actions">
          <button onClick={() => onClose()}>닫기</button>
        </div>
      </div>

      <div className="topline" style={{ margin: "8px 0", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span>동일 기준 실수익 비교(세전)</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <label htmlFor="drawer-payment">납입금</label>
          <input
            id="drawer-payment"
            type="number"
            min={10000}
            step={10000}
            value={paymentAmount}
            readOnly
            style={{ maxWidth: 220 }}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>금융사</th>
              <th>상품명</th>
              <th>기간</th>
              <th>현실금리</th>
              <th>난이도</th>
              <th>우대조건</th>
              <th>예상이자</th>
              <th>만기 예상액</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {withCalc.map((r) => (
              <tr key={`c-${r.option_id}`}>
                <td className="bank-cell">{r.bank_name || "-"}</td>
                <td className="product-cell">{r.product_name || "-"}</td>
                <td>{r.save_term_months}개월</td>
                <td>{fmtRate(r.expected_rate)}</td>
                <td>
                  <span className="note">{difficultyLabel(toDisplayDifficulty(r.difficulty_score))}</span>
                </td>
                <td>{r.bonus_condition_count}개</td>
                <td className="money-strong">{fmtMoney(r.interest)}</td>
                <td className="money">{fmtMoney(r.maturity)}</td>
                <td>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => (window.location.hash = `#/detail?option=${r.option_id}`)}
                  >
                    우대조건 원문
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
