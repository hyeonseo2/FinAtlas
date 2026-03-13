import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { filterAndSort, getProductGroupCode } from "../lib/filters";
import { FilterPanel } from "../components/FilterPanel";
import { ProductTable } from "../components/ProductTable";
import { CompareDrawer } from "../components/CompareDrawer";
const initialFilters = {
    group: "020000",
    bank: "",
    term: "",
    minBaseRate: "",
    minMaxRate: "",
    minExpectedRate: "",
    productNameQuery: "",
    productType: "",
    conditionCategory: [],
};
const STORAGE_KEY_MONTHLY = "finatlas:list:monthly:v1";
const STORAGE_KEY_MONTHLY_DEFAULT = 500000;
const PAGE_SIZE = 20;
function loadMonthly() {
    if (typeof window === "undefined")
        return STORAGE_KEY_MONTHLY_DEFAULT;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY_MONTHLY);
        const v = raw ? Number(raw) : NaN;
        return Number.isFinite(v) && v > 0 ? v : STORAGE_KEY_MONTHLY_DEFAULT;
    }
    catch {
        return 500000;
    }
}
function dedupeRows(rows) {
    const m = new Map();
    rows.forEach((r) => {
        if (!m.has(r.option_id))
            m.set(r.option_id, r);
    });
    return Array.from(m.values());
}
function parseBankCode(productId) {
    const first = productId.split("_")[0];
    return first || "-";
}
function formatBankLabel(productId, companyName, companyCode, bankNameMap) {
    if (companyName && companyName.trim())
        return companyName;
    if (companyCode && companyCode.trim() && bankNameMap?.[companyCode]) {
        return bankNameMap[companyCode];
    }
    if (companyCode && companyCode.trim())
        return `은행코드 ${companyCode}`;
    return `은행코드 ${parseBankCode(productId)}`;
}
export function ListPage() {
    const [rows, setRows] = useState([]);
    const [products, setProducts] = useState({});
    const [filters, setFilters] = useState(initialFilters);
    const [sortKey, setSortKey] = useState("interest");
    const [sortDirection, setSortDirection] = useState("asc");
    const [selected, setSelected] = useState(new Set());
    const [payment, setPayment] = useState(loadMonthly);
    const [meta, setMeta] = useState(null);
    const [catalog, setCatalog] = useState({});
    const [bankCodeMap, setBankCodeMap] = useState({});
    const [bankNames, setBankNames] = useState([]);
    const [page, setPage] = useState(1);
    useEffect(() => {
        Promise.all([
            fetch("/data/options_500000.json"),
            fetch("/data/metadata.json"),
            fetch("/data/bonus_conditions.json"),
            fetch("/data/products.json"),
            fetch("/data/bank_name_map.json"),
        ])
            .then(async ([r, m, c, p, b]) => {
            const [rowsJson, metaJson, conditionsJson, productJson, bankNameMapJson] = await Promise.all([
                r.json(),
                m.json(),
                c.json(),
                p.json(),
                b.json(),
            ]);
            setRows(dedupeRows(rowsJson || []));
            setMeta(metaJson || null);
            const productMap = {};
            (productJson || []).forEach((x) => {
                if (!x?.product_id)
                    return;
                productMap[x.product_id] = {
                    company_name: x.company_name || "",
                    product_name: x.product_name || "",
                    company_code: x.company_code || "",
                    product_type: x.product_type || "saving",
                    fin_group_code: x.fin_group_code || "",
                };
            });
            setProducts(productMap);
            const condCatalog = {};
            (conditionsJson || []).forEach((x) => {
                if (!x?.product_id || !x?.condition_category)
                    return;
                condCatalog[x.product_id] = [...(condCatalog[x.product_id] || []), String(x.condition_category)];
            });
            setCatalog(condCatalog);
            setBankCodeMap(bankNameMapJson || {});
            const bankNameMapByBank = new Map();
            (productJson || []).forEach((x) => {
                const companyName = x.company_name?.trim() || (x.company_code ? bankNameMapJson?.[x.company_code] || "" : "");
                if (!companyName)
                    return;
                if (bankNameMapByBank.has(companyName))
                    return;
                const groupCode = getProductGroupCode({
                    company_code: x.company_code || "",
                    company_name: x.company_name || "",
                    product_name: x.product_name || "",
                    product_type: x.product_type || "saving",
                    fin_group_code: x.fin_group_code || "",
                }, bankNameMapJson || {});
                bankNameMapByBank.set(companyName, groupCode || "");
            });
            const bankNameList = Array.from(bankNameMapByBank.entries())
                .map(([name, groupCode]) => ({ name, groupCode }))
                .sort((a, b) => a.name.localeCompare(b.name));
            setBankNames(bankNameList);
        })
            .catch(() => {
            setRows([]);
            setProducts({});
            setMeta(null);
            setCatalog({});
            setBankCodeMap({});
        });
    }, []);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        window.localStorage.setItem(STORAGE_KEY_MONTHLY, String(payment));
    }, [payment]);
    useEffect(() => {
        setPage(1);
    }, [filters]);
    useEffect(() => {
        setFilters((prev) => {
            if (!prev.group || !prev.bank)
                return prev;
            const current = bankNames.find((x) => x.name === prev.bank);
            if (!current || current.groupCode !== prev.group) {
                return { ...prev, bank: "" };
            }
            return prev;
        });
    }, [filters.group, bankNames]);
    const terms = useMemo(() => {
        const s = new Set();
        rows.forEach((r) => s.add(r.save_term_months));
        return Array.from(s).sort((a, b) => a - b);
    }, [rows]);
    const filteredBankNames = useMemo(() => {
        if (!filters.group)
            return bankNames.map((x) => x.name).sort((a, b) => a.localeCompare(b));
        return bankNames.filter((x) => x.groupCode === filters.group).map((x) => x.name).sort((a, b) => a.localeCompare(b));
    }, [bankNames, filters.group]);
    const filtered = useMemo(() => filterAndSort(rows, filters, sortKey, sortDirection, catalog, products, bankCodeMap), [rows, filters, sortKey, sortDirection, catalog, products, bankCodeMap]);
    const displayRows = useMemo(() => {
        return filtered.map((r) => {
            const pm = products[r.product_id];
            const bankName = formatBankLabel(r.product_id, pm?.company_name, pm?.company_code, bankCodeMap);
            return {
                ...r,
                bank_name: bankName,
                product_name: pm?.product_name || "-",
                product_type: pm?.product_type || "saving",
                bonus_condition_count: (catalog[r.product_id] || []).filter((x) => x !== "unclear" && x !== "bonus_rate_notice").length,
            };
        });
    }, [filtered, products, catalog, bankCodeMap]);
    const total = displayRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageRows = displayRows.slice(start, end);
    const onSort = (next) => {
        if (next === sortKey) {
            setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
            return;
        }
        setSortKey(next);
        setSortDirection("desc");
    };
    const onPageChange = (next) => {
        if (next < 1 || next > totalPages)
            return;
        setPage(next);
    };
    const onSelect = (row) => {
        setSelected((prev) => {
            const ns = new Set(prev);
            if (ns.has(row.option_id))
                ns.delete(row.option_id);
            else if (ns.size < 4)
                ns.add(row.option_id);
            return ns;
        });
    };
    const compare = displayRows.filter((r) => selected.has(r.option_id));
    return (_jsxs("div", { children: [_jsx(FilterPanel, { filters: filters, setFilters: setFilters, terms: terms, bankNames: filteredBankNames }), _jsxs("div", { className: "topline no-wrap", style: { margin: "12px 0", flexWrap: "wrap", gap: 10 }, children: [_jsxs("h3", { className: "no-wrap", children: ["\uC0C1\uD488 \uBAA9\uB85D (", filtered.length, ")"] }), _jsxs("div", { className: "actions nowrap", style: { gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [_jsx("label", { htmlFor: "global-monthly", style: { fontSize: 13 }, children: "\uB0A9\uC785\uAE08" }), _jsx("input", { id: "global-monthly", type: "number", min: 10000, step: 10000, value: payment, onChange: (e) => setPayment(Number(e.target.value || 0)), style: { width: 140 } })] })] }), _jsx(ProductTable, { rows: pageRows, sortKey: sortKey, sortDirection: sortDirection, paymentAmount: payment, onSort: onSort, onSelect: onSelect, selected: selected }), _jsx(CompareDrawer, { rows: compare, visible: compare.length > 0, onClose: () => setSelected(new Set()), paymentAmount: payment }), _jsxs("div", { className: "topline", style: { justifyContent: "space-between", marginTop: 10, gap: 10 }, children: [_jsxs("small", { className: "muted", children: ["\uD45C\uC2DC \uAE30\uC900: \uB0A9\uC785\uAE08 ", payment.toLocaleString("ko-KR"), "\uC6D0"] }), _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", onClick: () => setPage(Math.max(1, safePage - 1)), disabled: safePage === 1, children: "\uC774\uC804" }), _jsxs("span", { className: "muted", style: { minWidth: 110, textAlign: "center" }, children: [safePage, " / ", totalPages] }), _jsx("button", { type: "button", onClick: () => setPage(Math.min(totalPages, safePage + 1)), disabled: safePage === totalPages, children: "\uB2E4\uC74C" })] })] }), _jsxs("p", { className: "note", style: { marginTop: 8 }, children: ["\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8: ", meta?.last_success_at ? new Date(meta.last_success_at).toLocaleString() : "-"] }), _jsxs("p", { className: "note", style: { marginTop: 4 }, children: ["\uB4F1\uB85D \uC0C1\uD488 \uC218: ", meta?.normalized_product_count?.toLocaleString() || "-", "\uAC1C \u00B7 \uB178\uCD9C \uC635\uC158 \uC218: ", meta?.normalized_option_count?.toLocaleString() || "-", "\uAC1C"] })] }));
}
