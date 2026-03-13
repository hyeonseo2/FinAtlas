import { useEffect, useMemo, useState } from "react";
import { RankedOption, Filters, ProductMeta } from "../types/product";
import { filterAndSort, getProductGroupCode } from "../lib/filters";
import { FilterPanel } from "../components/FilterPanel";
import { ProductTable, type SortKey, type SortDirection } from "../components/ProductTable";
import { CompareDrawer } from "../components/CompareDrawer";

type ConditionCatalog = Record<string, string[]>;
type BankNameMap = Record<string, string>;
type ProductMap = Record<string, { company_name: string; product_name: string; company_code: string; product_type: string; fin_group_code: string }>;
type BankNameItem = { name: string; groupCode: string };
type DisplayOption = RankedOption & {
  bank_name: string;
  product_name: string;
  product_type: string;
  bonus_condition_count: number;
};

const initialFilters: Filters = {
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

function loadMonthly(): number {
  if (typeof window === "undefined") return STORAGE_KEY_MONTHLY_DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_MONTHLY);
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) && v > 0 ? v : STORAGE_KEY_MONTHLY_DEFAULT;
  } catch {
    return 500000;
  }
}


function dedupeRows(rows: RankedOption[]): RankedOption[] {
  const m = new Map<string, RankedOption>();
  rows.forEach((r) => {
    if (!m.has(r.option_id)) m.set(r.option_id, r);
  });
  return Array.from(m.values());
}

function parseBankCode(productId: string): string {
  const first = productId.split("_")[0];
  return first || "-";
}

function formatBankLabel(productId: string, companyName?: string, companyCode?: string, bankNameMap?: BankNameMap): string {
  if (companyName && companyName.trim()) return companyName;

  if (companyCode && companyCode.trim() && bankNameMap?.[companyCode]) {
    return bankNameMap[companyCode];
  }

  if (companyCode && companyCode.trim()) return `은행코드 ${companyCode}`;

  return `은행코드 ${parseBankCode(productId)}`;
}

export function ListPage() {
  const [rows, setRows] = useState<RankedOption[]>([]);
  const [products, setProducts] = useState<ProductMap>({});
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortKey, setSortKey] = useState<SortKey>("interest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payment, setPayment] = useState<number>(loadMonthly);
  const [meta, setMeta] = useState<{ last_success_at?: string; normalized_product_count?: number; normalized_option_count?: number } | null>(null);
  const [catalog, setCatalog] = useState<ConditionCatalog>({});
  const [bankCodeMap, setBankCodeMap] = useState<BankNameMap>({});
  const [bankNames, setBankNames] = useState<BankNameItem[]>([]);
  const [page, setPage] = useState<number>(1);

  const baseDataPath = `${import.meta.env.BASE_URL}data`;

  useEffect(() => {
    Promise.all([
      fetch(`${baseDataPath}/options_500000.json`),
      fetch(`${baseDataPath}/metadata.json`),
      fetch(`${baseDataPath}/bonus_conditions.json`),
      fetch(`${baseDataPath}/products.json`),
      fetch(`${baseDataPath}/bank_name_map.json`),
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

        const productMap: ProductMap = {};
        (productJson || []).forEach((x: ProductMeta) => {
          if (!x?.product_id) return;
          productMap[x.product_id] = {
            company_name: x.company_name || "",
            product_name: x.product_name || "",
            company_code: x.company_code || "",
            product_type: x.product_type || "saving",
            fin_group_code: x.fin_group_code || "",
          };
        });
        setProducts(productMap);

        const condCatalog: ConditionCatalog = {};
        (conditionsJson || []).forEach((x: any) => {
          if (!x?.product_id || !x?.condition_category) return;
          condCatalog[x.product_id] = [...(condCatalog[x.product_id] || []), String(x.condition_category)];
        });
        setCatalog(condCatalog);
        setBankCodeMap(bankNameMapJson || {});

        const bankNameMapByBank: Map<string, string> = new Map();
        (productJson || []).forEach((x: ProductMeta) => {
          const companyName = x.company_name?.trim() || (x.company_code ? bankNameMapJson?.[x.company_code] || "" : "");
          if (!companyName) return;
          if (bankNameMapByBank.has(companyName)) return;
          const groupCode = getProductGroupCode(
            {
              company_code: x.company_code || "",
              company_name: x.company_name || "",
              product_name: x.product_name || "",
              product_type: x.product_type || "saving",
              fin_group_code: x.fin_group_code || "",
            },
            bankNameMapJson || {},
          );
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY_MONTHLY, String(payment));
  }, [payment]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    setFilters((prev) => {
      if (!prev.group || !prev.bank) return prev;
      const current = bankNames.find((x) => x.name === prev.bank);
      if (!current || current.groupCode !== prev.group) {
        return { ...prev, bank: "" };
      }
      return prev;
    });
  }, [filters.group, bankNames]);

  const terms = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => s.add(r.save_term_months));
    return Array.from(s).sort((a, b) => a - b);
  }, [rows]);

  const filteredBankNames = useMemo(() => {
    if (!filters.group) return bankNames.map((x) => x.name).sort((a, b) => a.localeCompare(b));
    return bankNames.filter((x) => x.groupCode === filters.group).map((x) => x.name).sort((a, b) => a.localeCompare(b));
  }, [bankNames, filters.group]);

  const filtered = useMemo(
    () => filterAndSort(rows, filters, sortKey, sortDirection, catalog, products, bankCodeMap),
    [rows, filters, sortKey, sortDirection, catalog, products, bankCodeMap],
  );

  const displayRows = useMemo<DisplayOption[]>(() => {
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

  const onSort = (next: SortKey) => {
    if (next === sortKey) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(next);
    setSortDirection("desc");
  };

  const onPageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  const onSelect = (row: DisplayOption) => {
    setSelected((prev) => {
      const ns = new Set(prev);
      if (ns.has(row.option_id)) ns.delete(row.option_id);
      else if (ns.size < 4) ns.add(row.option_id);
      return ns;
    });
  };

  const compare = displayRows.filter((r) => selected.has(r.option_id));

  return (
    <div>
      <FilterPanel filters={filters} setFilters={setFilters} terms={terms} bankNames={filteredBankNames} />

      <div className="topline no-wrap" style={{ margin: "12px 0", flexWrap: "wrap", gap: 10 }}>
        <h3 className="no-wrap">상품 목록 ({filtered.length})</h3>
        <div className="actions nowrap" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label htmlFor="global-monthly" style={{ fontSize: 13 }}>
            납입금
          </label>
          <input
            id="global-monthly"
            type="number"
            min={10000}
            step={10000}
            value={payment}
            onChange={(e) => setPayment(Number(e.target.value || 0))}
            style={{ width: 140 }}
          />

        </div>
      </div>

      <CompareDrawer rows={compare} visible={compare.length > 0} onClose={() => setSelected(new Set())} paymentAmount={payment} />

      <ProductTable
        rows={pageRows}
        sortKey={sortKey}
        sortDirection={sortDirection}
        paymentAmount={payment}
        onSort={onSort}
        onSelect={onSelect}
        selected={selected}
      />

      <div className="topline" style={{ justifyContent: "space-between", marginTop: 10, gap: 10 }}>
        <small className="muted">표시 기준: 납입금 {payment.toLocaleString("ko-KR")}원</small>
        <div className="actions">
          <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1}>
            이전
          </button>
          <span className="muted" style={{ minWidth: 110, textAlign: "center" }}>
            {safePage} / {totalPages}
          </span>
          <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}>
            다음
          </button>
        </div>
      </div>
      <p className="note" style={{ marginTop: 8 }}>
        최근 업데이트: {meta?.last_success_at ? new Date(meta.last_success_at).toLocaleString() : "-"}
      </p>
      <p className="note" style={{ marginTop: 4 }}>
        등록 상품 수: {meta?.normalized_product_count?.toLocaleString() || "-"}개 · 노출 옵션 수: {meta?.normalized_option_count?.toLocaleString() || "-"}개
      </p>
    </div>
  );
}
