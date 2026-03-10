import { RankedOption } from "../types/product";
import { fmtRate, fmtMoney } from "../lib/format";
import { DifficultyBadge } from "./DifficultyBadge";
import { expectedInterestWithRate, maturityAmount } from "../lib/calc";

export function ProductTable({ rows, selected, monthlyPayment, onSelect }: {
  rows: RankedOption[];
  selected: Set<string>;
  monthlyPayment: number;
  onSelect: (r: RankedOption) => void;
}) {
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>비교</th>
            <th>금융사</th>
            <th>상품명</th>
            <th>기간</th>
            <th>기본금리</th>
            <th>최고금리</th>
            <th>현실금리</th>
            <th>난이도</th>
            <th>예상이자</th>
            <th>만기예상액</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const interest = expectedInterestWithRate(monthlyPayment, r.expected_rate, r.save_term_months);
            const maturity = maturityAmount(monthlyPayment, r.save_term_months, interest);
            return (
              <tr key={r.option_id}>
                <td>
                  <input type="checkbox" checked={selected.has(r.option_id)} onChange={() => onSelect(r)} />
                </td>
                <td>{r.company_name}</td>
                <td>{r.product_name}</td>
                <td>{r.save_term_months}개월</td>
                <td>{fmtRate(r.base_rate)}</td>
                <td>{fmtRate(r.max_rate)}</td>
                <td>{fmtRate(r.expected_rate)}</td>
                <td>
                  <DifficultyBadge score={r.difficulty_score} />
                </td>
                <td>{fmtMoney(interest)}</td>
                <td>{fmtMoney(maturity)}</td>
                <td>
                  <button onClick={() => (window.location.hash = `#/detail?option=${r.option_id}`)}>보기</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
