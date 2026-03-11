import { useEffect, useMemo, useState } from "react";
import { BonusCondition, ProductMeta, ProductOption, RankedOption } from "../types/product";
import { getHashParam } from "../lib/interest";
import { fmtRate, fmtMoney } from "../lib/format";
import { simpleMonthlyInterest, maturityAmount } from "../lib/calc";

const DEFAULT_PAYMENT = 500000;

const CONDITION_LABEL: Record<string, string> = {
  marketing_agree: "마케팅 동의",
  app_signup: "앱/비대면 가입",
  auto_transfer: "자동이체",
  first_customer: "첫거래/신규",
  salary_transfer: "급여이체",
  pension_transfer: "연금이체/수령",
  card_spending: "카드 실적",
  bundle_product: "번들/패키지",
  event_participation: "이벤트",
  unclear: "기타/불명확",
};

function difficultyLabel(level: number): string {
  if (level <= 20) return "매우 쉬움";
  if (level <= 40) return "쉬움";
  if (level <= 60) return "보통";
  if (level <= 80) return "어려움";
  return "매우 어려움";
}

function buildDifficultyReason(conds: BonusCondition[], score: number): string {
  if (!conds || conds.length === 0) {
    return "우대조건이 거의 없어 달성 난이도가 낮습니다.";
  }

  const rel = conds.filter((c) => c.requires_existing_relationship).map((c) => c.condition_category);
  const recur = conds.filter((c) => c.requires_recurring_action).map((c) => c.condition_category);
  const uncertain = conds.filter((c) => c.is_uncertain_parse).length;

  const labels = [...new Set(conds.map((c) => CONDITION_LABEL[c.condition_category] || c.condition_category))];
  let reason = `우대조건 ${conds.length}개 (${labels.join(", ")})`;

  if (rel.length) reason += ` · 기존관계 필요(${rel.map((x) => CONDITION_LABEL[x] || x).join(", ")})`;
  if (recur.length) reason += ` · 매월/매실적 유지 필요`;
  if (uncertain > 0) reason += ` · 해석 불명 조건 ${uncertain}건`;

  reason += `, 난이도점수 ${score}점`;
  return reason;
}

function normalizeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function DetailPage() {
  const [options, setOptions] = useState<RankedOption[]>([]);
  const [products, setProducts] = useState<ProductMeta[]>([]);
  const [conditions, setConditions] = useState<BonusCondition[]>([]);
  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [bankNameMap, setBankNameMap] = useState<Record<string, string>>({});
  const [monthly, setMonthly] = useState<number>(DEFAULT_PAYMENT);

  useEffect(() => {
    Promise.all([
      fetch("/data/options_500000.json"),
      fetch("/data/products.json"),
      fetch("/data/bonus_conditions.json"),
      fetch("/data/product_options.json"),
      fetch("/data/bank_name_map.json"),
    ]).then(async ([a, b, c, d, e]) => {
      const [os, ps, cs, opts, bankMap] = await Promise.all([a.json(), b.json(), c.json(), d.json(), e.json()]);
      setOptions(os || []);
      setProducts(ps || []);
      setConditions(cs || []);
      setAllOptions(opts || []);
      setBankNameMap(bankMap || {});
    }).catch(() => {
      setOptions([]);
      setProducts([]);
      setConditions([]);
      setAllOptions([]);
    });
  }, []);

  const optionId = getHashParam("option");

  const row = useMemo(() => options.find((r) => r.option_id === optionId), [options, optionId]);

  const product = useMemo(() => {
    if (!row) return null;
    return products.find((p) => p.product_id === row.product_id) || null;
  }, [products, row]);

  const productConditions = useMemo(() => {
    if (!row) return [];
    return conditions.filter((x) => x.product_id === row.product_id);
  }, [conditions, row]);

  const productOptions = useMemo(() => {
    if (!row) return [];
    return allOptions
      .filter((o) => o.product_id === row.product_id)
      .sort((a, b) => a.save_term_months - b.save_term_months);
  }, [allOptions, row]);

  const productOptionRows = useMemo(() => {
    const map = new Map<number, { product: ProductOption; interest: number; maturity: number }>();
    productOptions.forEach((o) => {
      const baseRate = normalizeNumber(o.base_rate);
      const maxRate = normalizeNumber(o.max_rate);
      const realRate = normalizeNumber(row?.expected_rate ?? Math.max(baseRate, maxRate));
      const interest = simpleMonthlyInterest(monthly, realRate, o.save_term_months);
      const maturity = maturityAmount(monthly, o.save_term_months, interest);
      map.set(o.save_term_months, { product: o, interest, maturity });
    });
    return Array.from(map.entries())
      .map(([, item]) => ({
        term: item.product.save_term_months,
        baseRate: item.product.base_rate,
        maxRate: item.product.max_rate,
        interest: item.interest,
        maturity: item.maturity,
      }))
      .sort((a, b) => a.term - b.term);
  }, [monthly, productOptions, row]);

  const maxInterest = useMemo(() => productOptionRows.reduce((m, r) => Math.max(m, r.interest), 0), [productOptionRows]);
  const difficultyReason = useMemo(() => buildDifficultyReason(productConditions, row?.difficulty_score || 100), [productConditions, row]);

  const difficultyByCategory = useMemo(() => {
    const grouped: Record<string, BonusCondition[]> = {};
    for (const c of productConditions) {
      grouped[c.condition_category] = grouped[c.condition_category] || [];
      grouped[c.condition_category].push(c);
    }
    return grouped;
  }, [productConditions]);

  if (!optionId) {
    return (
      <div className="card">
        <h3>상세</h3>
        <p className="note">목록에서 상품의 자세한 보기를 눌러 진입하세요.</p>
      </div>
    );
  }

  if (!row || !product) {
    return (
      <div className="card">
        <h3>상세</h3>
        <p>상품 정보를 불러오는 중이거나 데이터가 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  const expected = row.expected_rate;
  const recomputedInterest = simpleMonthlyInterest(monthly, expected, row.save_term_months);
  const maturity = maturityAmount(monthly, row.save_term_months, recomputedInterest);

  const bankLabel = product.company_name && product.company_name.trim()
    ? product.company_name
    : product.company_code && bankNameMap[product.company_code]
      ? bankNameMap[product.company_code]
      : `은행코드 ${product.company_code || "-"}`;

  return (
    <div>
      <div className="card">
        <h3>
          {bankLabel} {product.product_name ? `· ${product.product_name}` : ""}
        </h3>
        <p>
          권역: {product.fin_group_name} | 상품유형: {row.rate_type} | 기간: {row.save_term_months}개월
        </p>
        <p className="note">
          이 페이지는 공개 우대조건 기준 추정치입니다. 실제 적용 이율은 가입 시점/계약 조건에 따라 변동될 수 있습니다.
        </p>

        <div className="topline">
          <div>
            <strong>기본금리:</strong> {fmtRate(row.base_rate)}
            <br />
            <strong>최고금리:</strong> {fmtRate(row.max_rate)}
            <br />
            <strong>현실금리(예상):</strong> {fmtRate(expected)}
          </div>
          <div>
            <strong>난이도:</strong> {row.difficulty_score}점 / {row.difficulty_grade}
            <br />
            <strong>우대조건 개수:</strong> {row.condition_count}개
            <br />
            <strong>예상우대금리:</strong> {fmtRate(row.expected_bonus_rate)}
            <br />
            <strong>조건 설명:</strong> {difficultyReason}
          </div>
        </div>
      </div>

      <div className="card">
        <h4>우대조건 원문 + 난이도</h4>
        <ul>
          {productConditions.length === 0 ? (
            <li>특이 우대조건 없음</li>
          ) : (
            productConditions.map((c) => (
              <li key={c.condition_id}>
                <strong>[{CONDITION_LABEL[c.condition_category] || c.condition_category}]</strong>{" "}
                {c.condition_text} (우대 {fmtRate(c.bonus_rate)})
                <br />
                <span className="note">우대조건 난이도: {difficultyLabel(c.difficulty_level)} ({c.difficulty_level}점)</span>
                {c.is_uncertain_parse ? " · 문구 해석 신뢰도 낮음" : ""}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="card">
        <h4>우대조건별 카테고리 요약</h4>
        {Object.keys(difficultyByCategory).length === 0 ? (
          <p className="note">해당 상품에 등록된 우대조건 카테고리가 없습니다.</p>
        ) : (
          <ul>
            {Object.entries(difficultyByCategory).map(([cat, items]) => {
              const min = Math.min(...items.map((x) => x.difficulty_level));
              const max = Math.max(...items.map((x) => x.difficulty_level));
              const avg = Math.round(items.reduce((s, x) => s + x.difficulty_level, 0) / items.length);
              const label = difficultyLabel(avg);
              return (
                <li key={cat}>
                  <strong>{CONDITION_LABEL[cat] || cat}</strong>: {items.length}건 / 난이도 평균 {avg}점 ({label}), 점수 범위 {min}~{max}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h4>기간별 옵션</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>기간</th>
                <th>적립유형</th>
                <th>기본금리</th>
                <th>최고금리</th>
              </tr>
            </thead>
            <tbody>
              {productOptions.map((o) => (
                <tr key={o.option_id}>
                  <td>{o.save_term_months}개월</td>
                  <td>{o.rate_type}</td>
                  <td>{fmtRate(o.base_rate)}</td>
                  <td>{fmtRate(o.max_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h4>기간별 납입 예상이자 (해당 납입금 기준)</h4>
        <div className="note">월 납입금은 아래에서 조정 가능</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
          <label htmlFor="detail-monthly">월 납입금</label>
          <input
            id="detail-monthly"
            value={monthly}
            type="number"
            min={10000}
            step={10000}
            onChange={(e) => setMonthly(Number(e.target.value || 0))}
          />
        </div>

        {productOptionRows.length === 0 ? (
          <p className="note">해당 상품의 기간 옵션이 없습니다.</p>
        ) : (
          <div className="chart-wrap">
            {productOptionRows.map((r) => {
              const width = maxInterest > 0 ? Math.round((r.interest / maxInterest) * 100) : 0;
              return (
                <div className="chart-row" key={r.term}>
                  <div className="chart-term">{r.term}개월</div>
                  <div className="chart-bar-shell">
                    <div className="chart-bar" style={{ width: `${width}%` }} />
                  </div>
                  <div className="chart-value">{fmtMoney(r.interest)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h4>선택한 기간 기준 계산</h4>
        <p>
          선택상품(현실금리 {fmtRate(expected)})의 세전 예상이자: <strong>{fmtMoney(recomputedInterest)}</strong>
          <br />
          만기시 예상액(원금+이자): <strong>{fmtMoney(maturity)}</strong>
        </p>
      </div>
    </div>
  );
}
