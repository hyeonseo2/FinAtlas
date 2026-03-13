import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const RATE_OPTIONS = Array.from({ length: 61 }, (_, i) => Number((i * 0.5).toFixed(1)));
const PRODUCT_TYPE_OPTIONS = [
    { value: "saving", label: "적금" },
    { value: "deposit", label: "예금" },
];
const GROUP_LABELS = {
    "": "전체",
    "020000": "은행",
    "030300": "저축은행",
};
const CATEGORY_OPTIONS = [
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
function FieldLabel({ htmlFor, children }) {
    return (_jsx("label", { className: "field-label", htmlFor: htmlFor, children: children }));
}
function conditionLabelFromValue(value) {
    const match = CATEGORY_OPTIONS.find((c) => c.value === value);
    return match?.label || value;
}
export function FilterPanel({ filters, setFilters, terms, bankNames, }) {
    const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
    const productTypeLabelClass = (value) => value === "deposit" ? "filter-type-btn ptype-deposit" : "filter-type-btn ptype-saving";
    const onToggleCondition = (value) => {
        setFilters((prev) => {
            const exists = prev.conditionCategory.includes(value);
            const next = exists
                ? prev.conditionCategory.filter((v) => v !== value)
                : [...prev.conditionCategory, value];
            return { ...prev, conditionCategory: next };
        });
    };
    const onToggleProductType = (value) => {
        setFilters((prev) => ({
            ...prev,
            productType: prev.productType === value ? "" : value,
        }));
    };
    const clearOne = (key) => {
        setFilters((prev) => {
            if (key === "conditionCategory") {
                return { ...prev, conditionCategory: [] };
            }
            if (key === "productType") {
                return { ...prev, productType: "" };
            }
            if (key === "group")
                return { ...prev, group: "020000" };
            return { ...prev, [key]: "" };
        });
    };
    const clearCondition = (value) => {
        setFilters((prev) => ({
            ...prev,
            conditionCategory: prev.conditionCategory.filter((v) => v !== value),
        }));
    };
    const reset = () => setFilters((p) => ({
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
    const activeFilters = [];
    if (filters.group)
        activeFilters.push({ key: "group", label: `권역: ${GROUP_LABELS[filters.group] || filters.group}`, rawValue: filters.group });
    if (filters.bank)
        activeFilters.push({ key: "bank", label: `은행: ${filters.bank}`, rawValue: filters.bank });
    if (filters.term)
        activeFilters.push({ key: "term", label: `기간: ${filters.term}개월`, rawValue: String(filters.term) });
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
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "filter-title-row", children: [_jsx("span", { className: "filter-title", children: "\uD544\uD130" }), _jsx("button", { type: "button", className: "filter-reset-btn", onClick: reset, children: "\uCD08\uAE30\uD654" })] }), _jsxs("div", { className: "filter-active-row", children: [activeFilters.map((chip) => {
                        const isCondition = chip.key.startsWith("condition-");
                        const key = chip.rawValue;
                        return (_jsxs("button", { type: "button", className: "active-filter-chip", onClick: () => {
                                if (isCondition) {
                                    clearCondition(key);
                                }
                                else {
                                    clearOne(chip.key);
                                }
                            }, children: [chip.label, _jsx("span", { className: "active-filter-chip-x", "aria-hidden": "true", children: "\u00D7" })] }, chip.key));
                    }), activeFilters.length === 0 ? _jsx("span", { className: "muted", children: "\uC801\uC6A9 \uC911\uC778 \uD544\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }) : null] }), _jsxs("div", { className: "filters", children: [_jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uC0C1\uD488\uC720\uD615" }), _jsx("div", { className: "filter-type-row", children: PRODUCT_TYPE_OPTIONS.map((opt) => {
                                    const active = filters.productType === opt.value;
                                    return (_jsx("button", { type: "button", className: `${productTypeLabelClass(opt.value)}${active ? " active" : ""}`, onClick: () => onToggleProductType(opt.value), children: opt.label }, opt.value));
                                }) })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uAD8C\uC5ED" }), _jsxs("select", { value: filters.group, onChange: (e) => set("group", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), _jsx("option", { value: "020000", children: "\uC740\uD589" }), _jsx("option", { value: "030300", children: "\uC800\uCD95\uC740\uD589" })] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uC740\uD589\uBA85" }), _jsxs("select", { value: filters.bank, onChange: (e) => set("bank", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), bankNames.map((name) => (_jsx("option", { value: name, children: name }, name)))] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uAE30\uAC04" }), _jsxs("select", { value: filters.term, onChange: (e) => set("term", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), terms.map((t) => (_jsxs("option", { value: t, children: [t, "\uAC1C\uC6D4"] }, t)))] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uAE30\uBCF8\uAE08\uB9AC \uCD5C\uC18C" }), _jsxs("select", { value: filters.minBaseRate, onChange: (e) => set("minBaseRate", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), RATE_OPTIONS.map((r) => (_jsxs("option", { value: r, children: [r.toFixed(1), "%"] }, `base-${r}`)))] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uCD5C\uACE0\uAE08\uB9AC \uCD5C\uC18C" }), _jsxs("select", { value: filters.minMaxRate, onChange: (e) => set("minMaxRate", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), RATE_OPTIONS.map((r) => (_jsxs("option", { value: r, children: [r.toFixed(1), "%"] }, `max-${r}`)))] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uD604\uC2E4\uAE08\uB9AC \uCD5C\uC18C" }), _jsxs("select", { value: filters.minExpectedRate, onChange: (e) => set("minExpectedRate", e.target.value), children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), RATE_OPTIONS.map((r) => (_jsxs("option", { value: r, children: [r.toFixed(1), "%"] }, `expected-${r}`)))] })] }), _jsxs("div", { className: "filter-field", children: [_jsx(FieldLabel, { children: "\uC0C1\uD488\uBA85" }), _jsx("input", { className: "product-name-input-wide", id: "filter-product-name", name: "productNameQuery", placeholder: "\uC608: iM\uD568\uAED8\uC608\uAE08", value: filters.productNameQuery, onChange: (e) => set("productNameQuery", e.target.value) })] }), _jsxs("div", { className: "filter-field condition-filter-field", children: [_jsx(FieldLabel, { children: "\uC6B0\uB300 \uC870\uAC74 (\uC911\uBCF5 \uCCB4\uD06C)" }), _jsx("div", { className: "condition-checks", children: CATEGORY_OPTIONS.map((opt) => {
                                    const checked = filters.conditionCategory.includes(opt.value);
                                    return (_jsxs("label", { className: "condition-chip", children: [_jsx("input", { className: "pretty-check condition-check", type: "checkbox", checked: checked, onChange: () => onToggleCondition(opt.value) }), _jsx("span", { children: opt.label })] }, opt.value));
                                }) })] })] })] }));
}
