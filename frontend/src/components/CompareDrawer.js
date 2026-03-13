import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { fmtRate, fmtMoney } from "../lib/format";
import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";
const DRAWER_DEFAULT_PAYMENT = 500000;
export function CompareDrawer({ rows, visible, onClose, paymentAmount }) {
    if (!visible)
        return null;
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
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "topline", children: [_jsxs("h3", { children: ["\uC120\uD0DD\uD55C \uC0C1\uD488 \uBE44\uAD50 (", rows.length, ")"] }), _jsx("div", { className: "actions", children: _jsx("button", { onClick: () => onClose(), children: "\uB2EB\uAE30" }) })] }), _jsx("div", { className: "topline", style: { margin: "8px 0", alignItems: "center", flexWrap: "wrap", gap: 8 }, children: _jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [_jsx("label", { htmlFor: "drawer-payment", style: { whiteSpace: "nowrap" }, children: "\uB0A9\uC785\uAE08" }), _jsx("input", { id: "drawer-payment", type: "number", min: 10000, step: 10000, value: paymentAmount, readOnly: true, style: { maxWidth: 220 } })] }) }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "compare-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\uAE08\uC735\uC0AC" }), _jsx("th", { children: "\uC0C1\uD488\uBA85" }), _jsx("th", { children: "\uAE30\uAC04" }), _jsx("th", { children: "\uD604\uC2E4\uAE08\uB9AC" }), _jsx("th", { children: "\uB09C\uC774\uB3C4" }), _jsx("th", { children: "\uC6B0\uB300\uC870\uAC74" }), _jsx("th", { children: "\uC608\uC0C1\uC774\uC790" }), _jsx("th", { children: "\uB9CC\uAE30 \uC608\uC0C1\uC561" }), _jsx("th", { children: "\uC0C1\uC138" })] }) }), _jsx("tbody", { children: withCalc.map((r) => (_jsxs("tr", { children: [_jsx("td", { className: "bank-cell", children: r.bank_name || "-" }), _jsx("td", { className: "product-cell", children: r.product_name || "-" }), _jsxs("td", { children: [r.save_term_months, "\uAC1C\uC6D4"] }), _jsx("td", { children: fmtRate(r.expected_rate) }), _jsx("td", { children: _jsx("span", { className: "note", children: difficultyLabel(toDisplayDifficulty(r.difficulty_score)) }) }), _jsxs("td", { children: [r.bonus_condition_count, "\uAC1C"] }), _jsx("td", { className: "money-strong", children: fmtMoney(r.interest) }), _jsx("td", { className: "money", children: fmtMoney(r.maturity) }), _jsx("td", { children: _jsx("button", { type: "button", className: "table-action-btn table-action-icon-btn", "aria-label": `상세 보기: ${r.product_name || r.bank_name || "상품"}`, title: "\uC0C1\uC138 \uBCF4\uAE30", onClick: () => (window.location.hash = `#/detail?option=${r.option_id}`), children: "\uD83D\uDD0D" }) })] }, `c-${r.option_id}`))) })] }) })] }));
}
