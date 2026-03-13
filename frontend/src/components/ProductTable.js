import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fmtRate, fmtMoney } from "../lib/format";
import { DifficultyBadge } from "./DifficultyBadge";
import { expectedInterestByProductType, maturityAmount } from "../lib/calc";
const SORT_LABELS = {
    interest: "예상이자",
    expected: "현실금리",
    max: "최고금리",
    base: "기본금리",
    easy: "난이도 쉬움순",
    conditions: "조건 적은순",
    maturity: "만기예상액",
};
function productTypeLabel(v) {
    if (v === "deposit")
        return "예금";
    return "적금";
}
function renderProductNameWithParen(name) {
    const raw = (name || "-").trim();
    if (!raw || raw === "-")
        return _jsx(_Fragment, { children: raw });
    const parts = raw.split(/(\([^\)]*\))/g).filter((x) => x.length > 0);
    return (_jsx(_Fragment, { children: parts.map((part, idx) => (/\([^\)]*\)/.test(part) ? (_jsx("span", { className: "paren-nowrap", children: part }, idx)) : (_jsx("span", { children: part }, idx)))) }));
}
export function ProductTable({ rows, selected, paymentAmount, onSelect, sortKey, sortDirection, onSort, }) {
    const arrow = (key) => (sortKey === key ? (sortDirection === "desc" ? " ▼" : " ▲") : "");
    const goDetail = (optionId) => {
        window.location.hash = `#/detail?option=${optionId}`;
    };
    const HeaderButton = ({ keyName, label, disabled = false, onClick, }) => (_jsxs("button", { type: "button", className: `sortable ${keyName === sortKey ? "active" : ""} ${disabled ? "disabled" : ""}`, onClick: onClick, disabled: disabled, title: disabled ? "해당 컬럼은 정렬 미지원" : undefined, children: [label, keyName !== "none" ? arrow(keyName) : ""] }));
    return (_jsx("div", { className: "card table-wrap", children: _jsxs("table", { className: "product-list-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "col-compare", children: "\uBE44\uAD50" }), _jsx("th", { children: "\uAE08\uC735\uC0AC" }), _jsx("th", { children: "\uC0C1\uD488\uBA85" }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "none", label: "\uAE30\uAC04", disabled: true, onClick: () => { } }) }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "base", label: "\uAE30\uBCF8\uAE08\uB9AC", onClick: () => onSort("base") }) }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "max", label: "\uCD5C\uACE0\uAE08\uB9AC", onClick: () => onSort("max") }) }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "expected", label: SORT_LABELS.expected, onClick: () => onSort("expected") }) }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "easy", label: "\uB09C\uC774\uB3C4", onClick: () => onSort("easy") }) }), _jsx("th", { children: _jsx(HeaderButton, { keyName: "interest", label: SORT_LABELS.interest, onClick: () => onSort("interest") }) }), _jsx("th", { className: "col-maturity", children: _jsx(HeaderButton, { keyName: "maturity", label: "\uB9CC\uAE30\uC608\uC0C1\uC561", onClick: () => onSort("maturity") }) }), _jsx("th", { className: "col-detail", children: "\uC0C1\uC138" })] }) }), _jsx("tbody", { children: rows.map((r) => {
                        const interest = expectedInterestByProductType(paymentAmount, r.expected_rate, r.save_term_months, r.product_type);
                        const maturity = maturityAmount(paymentAmount, r.save_term_months, interest, r.product_type);
                        const isSelected = selected.has(r.option_id);
                        return (_jsxs("tr", { className: isSelected ? "selected-row" : undefined, children: [_jsx("td", { className: "col-compare", children: _jsx("input", { className: "pretty-check compare-check", type: "checkbox", checked: isSelected, onClick: (e) => {
                                            e.stopPropagation();
                                        }, onChange: (e) => {
                                            e.stopPropagation();
                                            onSelect(r);
                                        }, "aria-label": `비교에 추가: ${r.product_name || r.bank_name || "상품"}` }) }), _jsx("td", { className: "bank-cell", children: r.bank_name || "-" }), _jsxs("td", { className: "product-cell product-cell-linebreak", children: [_jsx("span", { className: `product-type-label ${r.product_type === "deposit" ? "ptype-deposit" : "ptype-saving"}`, children: productTypeLabel(r.product_type) }), _jsx("span", { className: "product-cell-name", children: renderProductNameWithParen(r.product_name || "-") })] }), _jsxs("td", { children: [r.save_term_months, "\uAC1C\uC6D4"] }), _jsx("td", { className: "nowrap-cell", children: fmtRate(r.base_rate) }), _jsx("td", { className: "nowrap-cell", children: fmtRate(r.max_rate) }), _jsx("td", { className: "nowrap-cell", children: fmtRate(r.expected_rate) }), _jsx("td", { className: "nowrap-cell", children: _jsx(DifficultyBadge, { score: r.difficulty_score }) }), _jsx("td", { className: "money-strong nowrap-cell", children: fmtMoney(interest) }), _jsx("td", { className: "money nowrap-cell col-maturity", children: fmtMoney(maturity) }), _jsx("td", { className: "nowrap-cell action-col-cell col-detail", children: _jsx("button", { type: "button", className: "table-action-btn table-action-icon-btn", "aria-label": `상세 보기: ${r.product_name || r.bank_name || "상품"}`, title: "\uC0C1\uC138 \uBCF4\uAE30", onClick: (e) => {
                                            e.stopPropagation();
                                            goDetail(r.option_id);
                                        }, children: "\uD83D\uDD0D" }) })] }, r.option_id));
                    }) })] }) }));
}
