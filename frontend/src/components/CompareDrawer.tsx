import { useState } from "react";
import { RankedOption } from "../types/product";
import { fmtRate, fmtMoney } from "../lib/format";
import { simpleMonthlyInterest, maturityAmount } from "../lib/calc";

type DisplayOption = RankedOption & {
  bank_name: string;
  product_name: string;
  bonus_condition_count: number;
};

export function CompareDrawer({ rows, visible, onClose }: { rows: DisplayOption[]; visible: boolean; onClose: () => void }) {
  const [monthly, setMonthly] = useState(500000);

  if (!visible) return null;

  const withCalc = rows
    .map((r) => {
      const interest = simpleMonthlyInterest(monthly, r.expected_rate, r.save_term_months);
      return {
        ...r,
        interest,
        maturity: maturityAmount(monthly, r.save_term_months, interest),
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

      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <p className="note" style={{ margin: 0 }}>
          비교 목록에서 2개 이상 상품을 선택하면 비교표가 표시됩니다. 동일 납입금(기본 50만) 기준 실수익 비교 현실금리, 난이도, 우대조건 개수 비교 필요 시 상세 페이지로 이동해 우대조건 원문까지 확인
        </p>
      </div>

      <div className="topline" style={{ margin: "8px 0", alignItems: "center" }}>
        <span>동일 납입금 기준 실수익 비교(세전)</span>
        <input
          type="number"
          min={10000}
          step={10000}
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value || 0))}
          style={{ maxWidth: 220 }}
        />
      </div>

      <div className="table-wrap">
        <table>
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
                  {r.difficulty_score}점<br />
                  <span className="note">{r.difficulty_grade}</span>
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
