import { useEffect, useMemo, useState } from "react";
import { BonusCondition, ProductMeta, ProductOption, RankedOption } from "../types/product";
import { getHashParam } from "../lib/interest";
import { fmtRate, fmtMoney } from "../lib/format";
import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";

const DEFAULT_PAYMENT = 500000;

const CONDITION_LABEL: Record<string, string> = {
  marketing_agree: "마케팅 동의",
  app_signup: "앱/비대면 가입",
  auto_transfer: "자동이체",
  first_customer: "첫거래/신규",
  salary_transfer: "급여이체",
  pension_transfer: "연금이체/수령",
  card_spending: "카드 실적",
  bundle_product: "동시보유",
  event_participation: "이벤트",
  bonus_rate_notice: "우대금리 안내",
  unclear: "해석 필요(난이도 높음)",
};

function displayDifficultyScore(rawScore: number, category?: string): number {
  if (category === "marketing_agree" || category === "app_signup") return 0;
  return toDisplayDifficulty(rawScore);
}

function buildDifficultyReason(conds: BonusCondition[], rawScore: number): string {
  if (!conds || conds.length === 0) {
    return "우대조건이 거의 없어 달성 난이도가 낮습니다.";
  }

  const rel = conds.filter((c) => c.requires_existing_relationship).map((c) => c.condition_category);
  const recur = conds.filter((c) => c.requires_recurring_action).map((c) => c.condition_category);
  const uncertain = conds.filter((c) => c.is_uncertain_parse).length;

  const clearConds = conds.filter((c) => !c.is_uncertain_parse && c.condition_category !== "unclear");
  const labels = [...new Set(clearConds.map((c) => CONDITION_LABEL[c.condition_category] || c.condition_category))];
  const clearCount = clearConds.length;
  const ambiguousCount = conds.length - clearCount;

  let reason = `우대조건 ${clearCount}개 (${labels.join(", ") || "기타"})`;

  if (rel.length) reason += ` · 기존관계 필요(${rel.map((x) => CONDITION_LABEL[x] || x).join(", ")})`;
  if (recur.length) reason += ` · 매월/매실적 유지 필요`;
  if (ambiguousCount > 0) reason += ` · 해석불명 ${ambiguousCount}건`;

  const displayScore = displayDifficultyScore(rawScore);
  reason += ` · 난이도 ${difficultyLabel(displayScore)}`;
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
  const [payment, setPayment] = useState<number>(DEFAULT_PAYMENT);

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


  const clearProductConditions = useMemo(() => {
    return productConditions.filter((c) =>
      !c.is_uncertain_parse &&
      c.condition_category !== "unclear" &&
      c.condition_category !== "bonus_rate_notice"
    );
  }, [productConditions]);


  const ambiguousProductConditions = useMemo(() => {
    return productConditions.filter((c) => c.is_uncertain_parse || c.condition_category === "unclear" || c.condition_category === "bonus_rate_notice");
  }, [productConditions]);

  const ambiguousRawText = useMemo(() => {
    if (ambiguousProductConditions.length === 0) return "";
    return ambiguousProductConditions
      .map((c, i) => `원문 ${i + 1}. [${c.condition_id}] ${c.condition_text || "(내용 없음)"} (우대 ${c.bonus_rate}%)`)
      .join("\n");
  }, [ambiguousProductConditions]);

  const productOptions = useMemo(() => {
    if (!row) return [];
    return allOptions
      .filter((o) => o.product_id === row.product_id)
      .sort((a, b) => a.save_term_months - b.save_term_months);
  }, [allOptions, row]);

  const productOptionRows = useMemo(() => {
    if (!product) {
      return [] as { term: number; baseRate: number | null; maxRate: number | null; interest: number; maturity: number }[];
    }
    const map = new Map<number, { product: ProductOption; interest: number; maturity: number }>();
    productOptions.forEach((o) => {
      const baseRate = normalizeNumber(o.base_rate);
      const maxRate = normalizeNumber(o.max_rate);
      const realRate = normalizeNumber(row?.expected_rate ?? Math.max(baseRate, maxRate));
      const interest = expectedInterestByProductType(payment, realRate, o.save_term_months, product.product_type);
      const maturity = maturityAmount(payment, o.save_term_months, interest, product.product_type);
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
  }, [payment, productOptions, row, product]);

  const maxInterest = useMemo(() => productOptionRows.reduce((m, r) => Math.max(m, r.interest), 0), [productOptionRows]);
  const normalizedDifficultyScore = row ? displayDifficultyScore(row.difficulty_score) : 100;
  const difficultyReason = useMemo(() => buildDifficultyReason(productConditions, row?.difficulty_score || 100), [productConditions, row]);
  const difficultyGrade = difficultyLabel(normalizedDifficultyScore);

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
  const recomputedInterest = expectedInterestByProductType(payment, expected, row.save_term_months, product.product_type);
  const maturity = maturityAmount(payment, row.save_term_months, recomputedInterest, product.product_type);

  const parsedBaseRate = normalizeNumber(row.base_rate);
  const parsedMaxRate = normalizeNumber(row.max_rate);
  const hasRateGap = parsedMaxRate > parsedBaseRate + 1e-9;
  const hasRawConditionText = !!(product.special_condition_text || "").trim();
  const rawConditionSummary = (product.special_condition_text || "").trim();

  const inferredUnknownCount = hasRateGap ? 1 : 0;
  const effectiveUnknownCount = ambiguousProductConditions.length + (inferredUnknownCount > 0 && !ambiguousProductConditions.length ? 1 : 0);

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
          권역: {product.fin_group_name} | 상품유형: {(product.product_type === "deposit" ? "예금" : "적금")} | 기간: {row.save_term_months}개월
        </p>
        <p className="note">
          이 페이지는 공개 우대조건 기준 추정치입니다. 실제 적용 이율은 가입 시점/계약 조건에 따라 변동될 수 있습니다.
        </p>

        <div className="detail-metrics">
          <div className="metric-item">
            <span>기본금리</span>
            <strong>{fmtRate(row.base_rate)}</strong>
          </div>
          <div className="metric-item">
            <span>최고금리</span>
            <strong>{fmtRate(row.max_rate)}</strong>
          </div>
          <div className="metric-item">
            <span>현실금리</span>
            <strong>{fmtRate(expected)}</strong>
          </div>
          <div className="metric-item">
            <span>난이도</span>
            <strong>{difficultyGrade}</strong>
          </div>
          <div className="metric-item">
            <span>우대조건</span>
            <strong>{row.condition_count}개</strong>
                      </div>
          <div className="metric-item">
            <span>예상우대금리</span>
            <strong>{fmtRate(row.expected_bonus_rate)}</strong>
          </div>
        </div>
        <div className="section difficulty-reason">
          <strong>난이도 이유</strong>
          <div className="note">{difficultyReason}</div>
        </div>
      </div>

      <div className="card">
        <h4>우대조건 상세</h4>
        {clearProductConditions.length === 0 ? (
          <>
            <p className="note">
              해석 가능한 우대조건이 없습니다.
              {effectiveUnknownCount > 0 ? (
                <>
                  <br />
                  현재는 해석 불명확 항목 {effectiveUnknownCount}건이 있습니다.
                </>
              ) : null}
              {effectiveUnknownCount === 0 && hasRawConditionText && rawConditionSummary ? (
                <>
                  <br />
                  원문 우대조건: {rawConditionSummary}
                </>
              ) : null}
              {effectiveUnknownCount === 0 && !hasRawConditionText && hasRateGap ? (
                <>
                  <br />
                  원문 우대조건 텍스트가 비어있거나 파싱 대상에서 누락되었습니다.
                </>
              ) : null}
            </p>
          </>
        ) : (
          <ul className="detail-condition-list">
            {clearProductConditions.map((c) => (
              <li key={c.condition_id} className="detail-condition-item">
                <div className="detail-condition-head">
                  <span className="badge blue">{CONDITION_LABEL[c.condition_category] || c.condition_category}</span>
                  <strong>{fmtRate(c.bonus_rate)} 우대</strong>
                  <span className="note">{difficultyLabel(displayDifficultyScore(c.difficulty_level, c.condition_category))}</span>
                </div>
                <p>{c.condition_text}</p>
              </li>
            ))}
          </ul>
        )}

        {effectiveUnknownCount > 0 ? (
          <details className="detail-raw-block detail-scroll-row">
            <summary>해석 불명확 항목 {effectiveUnknownCount}건 보기</summary>
            <div className="table-wrap" style={{ marginTop: 10, maxHeight: 190, overflowY: "auto", border: "1px dashed #c7ddff", borderRadius: 8, padding: 10 }}>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }}>{ambiguousRawText || `해석 불명확 원문 데이터는 별도 추출되지 않았습니다.
최고금리 적용 조건은 문구 패턴 차이로 파싱되지 않았을 수 있습니다.`}</pre>
            </div>
          </details>
        ) : null}
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
        <div className="note">입력 기준은 아래에서 조정 가능합니다.</div>
        <div className="detail-monthly-line">
          <label htmlFor="detail-payment">납입금</label>
          <input
            id="detail-payment"
            value={payment}
            type="number"
            min={10000}
            step={10000}
            onChange={(e) => setPayment(Number(e.target.value || 0))}
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
