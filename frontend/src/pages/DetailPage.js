import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { getHashParam } from "../lib/interest";
import { fmtRate, fmtMoney } from "../lib/format";
import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";
const DEFAULT_PAYMENT = 500000;
const CONDITION_LABEL = {
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
function displayDifficultyScore(rawScore, category) {
    if (category === "marketing_agree" || category === "app_signup")
        return 0;
    return toDisplayDifficulty(rawScore);
}
function buildDifficultyReason(conds, rawScore) {
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
    if (rel.length)
        reason += ` · 기존관계 필요(${rel.map((x) => CONDITION_LABEL[x] || x).join(", ")})`;
    if (recur.length)
        reason += ` · 매월/매실적 유지 필요`;
    if (ambiguousCount > 0)
        reason += ` · 해석불명 ${ambiguousCount}건`;
    const displayScore = displayDifficultyScore(rawScore);
    reason += ` · 난이도 ${difficultyLabel(displayScore)}`;
    return reason;
}
function normalizeNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
export function DetailPage() {
    const [options, setOptions] = useState([]);
    const [products, setProducts] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [allOptions, setAllOptions] = useState([]);
    const [bankNameMap, setBankNameMap] = useState({});
    const [payment, setPayment] = useState(DEFAULT_PAYMENT);
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
        if (!row)
            return null;
        return products.find((p) => p.product_id === row.product_id) || null;
    }, [products, row]);
    const productConditions = useMemo(() => {
        if (!row)
            return [];
        return conditions.filter((x) => x.product_id === row.product_id);
    }, [conditions, row]);
    const clearProductConditions = useMemo(() => {
        return productConditions.filter((c) => !c.is_uncertain_parse &&
            c.condition_category !== "unclear" &&
            c.condition_category !== "bonus_rate_notice");
    }, [productConditions]);
    const ambiguousProductConditions = useMemo(() => {
        return productConditions.filter((c) => c.is_uncertain_parse || c.condition_category === "unclear" || c.condition_category === "bonus_rate_notice");
    }, [productConditions]);
    const ambiguousRawText = useMemo(() => {
        if (ambiguousProductConditions.length === 0)
            return "";
        return ambiguousProductConditions
            .map((c, i) => `원문 ${i + 1}. [${c.condition_id}] ${c.condition_text || "(내용 없음)"} (우대 ${c.bonus_rate}%)`)
            .join("\n");
    }, [ambiguousProductConditions]);
    const productOptions = useMemo(() => {
        if (!row)
            return [];
        return allOptions
            .filter((o) => o.product_id === row.product_id)
            .sort((a, b) => a.save_term_months - b.save_term_months);
    }, [allOptions, row]);
    const productOptionRows = useMemo(() => {
        if (!product) {
            return [];
        }
        const map = new Map();
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
        return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "\uC0C1\uC138" }), _jsx("p", { className: "note", children: "\uBAA9\uB85D\uC5D0\uC11C \uC0C1\uD488\uC758 \uC790\uC138\uD55C \uBCF4\uAE30\uB97C \uB20C\uB7EC \uC9C4\uC785\uD558\uC138\uC694." })] }));
    }
    if (!row || !product) {
        return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "\uC0C1\uC138" }), _jsx("p", { children: "\uC0C1\uD488 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC774\uAC70\uB098 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." })] }));
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
    return (_jsxs("div", { children: [_jsxs("div", { className: "card", children: [_jsxs("h3", { children: [bankLabel, " ", product.product_name ? `· ${product.product_name}` : ""] }), _jsxs("p", { children: ["\uAD8C\uC5ED: ", product.fin_group_name, " | \uC0C1\uD488\uC720\uD615: ", (product.product_type === "deposit" ? "예금" : "적금"), " | \uAE30\uAC04: ", row.save_term_months, "\uAC1C\uC6D4"] }), _jsx("p", { className: "note", children: "\uC774 \uD398\uC774\uC9C0\uB294 \uACF5\uAC1C \uC6B0\uB300\uC870\uAC74 \uAE30\uC900 \uCD94\uC815\uCE58\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uC801\uC6A9 \uC774\uC728\uC740 \uAC00\uC785 \uC2DC\uC810/\uACC4\uC57D \uC870\uAC74\uC5D0 \uB530\uB77C \uBCC0\uB3D9\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }), _jsxs("div", { className: "detail-metrics", children: [_jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uAE30\uBCF8\uAE08\uB9AC" }), _jsx("strong", { children: fmtRate(row.base_rate) })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uCD5C\uACE0\uAE08\uB9AC" }), _jsx("strong", { children: fmtRate(row.max_rate) })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uD604\uC2E4\uAE08\uB9AC" }), _jsx("strong", { children: fmtRate(expected) })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uB09C\uC774\uB3C4" }), _jsx("strong", { children: difficultyGrade })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uC6B0\uB300\uC870\uAC74" }), _jsxs("strong", { children: [row.condition_count, "\uAC1C"] })] }), _jsxs("div", { className: "metric-item", children: [_jsx("span", { children: "\uC608\uC0C1\uC6B0\uB300\uAE08\uB9AC" }), _jsx("strong", { children: fmtRate(row.expected_bonus_rate) })] })] }), _jsxs("div", { className: "section difficulty-reason", children: [_jsx("strong", { children: "\uB09C\uC774\uB3C4 \uC774\uC720" }), _jsx("div", { className: "note", children: difficultyReason })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "\uC6B0\uB300\uC870\uAC74 \uC0C1\uC138" }), clearProductConditions.length === 0 ? (_jsx(_Fragment, { children: _jsxs("p", { className: "note", children: ["\uD574\uC11D \uAC00\uB2A5\uD55C \uC6B0\uB300\uC870\uAC74\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", effectiveUnknownCount > 0 ? (_jsxs(_Fragment, { children: [_jsx("br", {}), "\uD604\uC7AC\uB294 \uD574\uC11D \uBD88\uBA85\uD655 \uD56D\uBAA9 ", effectiveUnknownCount, "\uAC74\uC774 \uC788\uC2B5\uB2C8\uB2E4."] })) : null, effectiveUnknownCount === 0 && hasRawConditionText && rawConditionSummary ? (_jsxs(_Fragment, { children: [_jsx("br", {}), "\uC6D0\uBB38 \uC6B0\uB300\uC870\uAC74: ", rawConditionSummary] })) : null, effectiveUnknownCount === 0 && !hasRawConditionText && hasRateGap ? (_jsxs(_Fragment, { children: [_jsx("br", {}), "\uC6D0\uBB38 \uC6B0\uB300\uC870\uAC74 \uD14D\uC2A4\uD2B8\uAC00 \uBE44\uC5B4\uC788\uAC70\uB098 \uD30C\uC2F1 \uB300\uC0C1\uC5D0\uC11C \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."] })) : null] }) })) : (_jsx("ul", { className: "detail-condition-list", children: clearProductConditions.map((c) => (_jsxs("li", { className: "detail-condition-item", children: [_jsxs("div", { className: "detail-condition-head", children: [_jsx("span", { className: "badge blue", children: CONDITION_LABEL[c.condition_category] || c.condition_category }), _jsxs("strong", { children: [fmtRate(c.bonus_rate), " \uC6B0\uB300"] }), _jsx("span", { className: "note", children: difficultyLabel(displayDifficultyScore(c.difficulty_level, c.condition_category)) })] }), _jsx("p", { children: c.condition_text })] }, c.condition_id))) })), effectiveUnknownCount > 0 ? (_jsxs("details", { className: "detail-raw-block detail-scroll-row", children: [_jsxs("summary", { children: ["\uD574\uC11D \uBD88\uBA85\uD655 \uD56D\uBAA9 ", effectiveUnknownCount, "\uAC74 \uBCF4\uAE30"] }), _jsx("div", { className: "table-wrap", style: { marginTop: 10, maxHeight: 190, overflowY: "auto", border: "1px dashed #c7ddff", borderRadius: 8, padding: 10 }, children: _jsx("pre", { style: { whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }, children: ambiguousRawText || `해석 불명확 원문 데이터는 별도 추출되지 않았습니다.
최고금리 적용 조건은 문구 패턴 차이로 파싱되지 않았을 수 있습니다.` }) })] })) : null] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "\uAE30\uAC04\uBCC4 \uC635\uC158" }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\uAE30\uAC04" }), _jsx("th", { children: "\uC801\uB9BD\uC720\uD615" }), _jsx("th", { children: "\uAE30\uBCF8\uAE08\uB9AC" }), _jsx("th", { children: "\uCD5C\uACE0\uAE08\uB9AC" })] }) }), _jsx("tbody", { children: productOptions.map((o) => (_jsxs("tr", { children: [_jsxs("td", { children: [o.save_term_months, "\uAC1C\uC6D4"] }), _jsx("td", { children: o.rate_type }), _jsx("td", { children: fmtRate(o.base_rate) }), _jsx("td", { children: fmtRate(o.max_rate) })] }, o.option_id))) })] }) })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "\uAE30\uAC04\uBCC4 \uB0A9\uC785 \uC608\uC0C1\uC774\uC790 (\uD574\uB2F9 \uB0A9\uC785\uAE08 \uAE30\uC900)" }), _jsx("div", { className: "note", children: "\uC785\uB825 \uAE30\uC900\uC740 \uC544\uB798\uC5D0\uC11C \uC870\uC815 \uAC00\uB2A5\uD569\uB2C8\uB2E4." }), _jsxs("div", { className: "detail-monthly-line", children: [_jsx("label", { htmlFor: "detail-payment", children: "\uB0A9\uC785\uAE08" }), _jsx("input", { id: "detail-payment", value: payment, type: "number", min: 10000, step: 10000, onChange: (e) => setPayment(Number(e.target.value || 0)) })] }), productOptionRows.length === 0 ? (_jsx("p", { className: "note", children: "\uD574\uB2F9 \uC0C1\uD488\uC758 \uAE30\uAC04 \uC635\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })) : (_jsx("div", { className: "chart-wrap", children: productOptionRows.map((r) => {
                            const width = maxInterest > 0 ? Math.round((r.interest / maxInterest) * 100) : 0;
                            return (_jsxs("div", { className: "chart-row", children: [_jsxs("div", { className: "chart-term", children: [r.term, "\uAC1C\uC6D4"] }), _jsx("div", { className: "chart-bar-shell", children: _jsx("div", { className: "chart-bar", style: { width: `${width}%` } }) }), _jsx("div", { className: "chart-value", children: fmtMoney(r.interest) })] }, r.term));
                        }) }))] }), _jsxs("div", { className: "card", children: [_jsx("h4", { children: "\uC120\uD0DD\uD55C \uAE30\uAC04 \uAE30\uC900 \uACC4\uC0B0" }), _jsxs("p", { children: ["\uC120\uD0DD\uC0C1\uD488(\uD604\uC2E4\uAE08\uB9AC ", fmtRate(expected), ")\uC758 \uC138\uC804 \uC608\uC0C1\uC774\uC790: ", _jsx("strong", { children: fmtMoney(recomputedInterest) }), _jsx("br", {}), "\uB9CC\uAE30\uC2DC \uC608\uC0C1\uC561(\uC6D0\uAE08+\uC774\uC790): ", _jsx("strong", { children: fmtMoney(maturity) })] })] })] }));
}
