import { useEffect, useMemo, useState } from "react";
import { RankedOption, Filters, ProductMeta } from "../types/product";
import { filterAndSort } from "../lib/filters";
import { FilterPanel } from "../components/FilterPanel";
import { ProductTable } from "../components/ProductTable";
import { CompareDrawer } from "../components/CompareDrawer";

type ConditionCatalog = Record<string, string[]>;
type BankNameMap = Record<string, string>;
type DisplayOption = RankedOption & {
  bank_name: string;
  product_name: string;
  bonus_condition_count: number;
};

const initialFilters: Filters = {
  group: "",
  bank: "",
  term: "",
  minBaseRate: "",
  minMaxRate: "",
  minExpectedRate: "",
  maxDifficulty: "100",
  savingType: "",
  conditionCategory: "",
  sort: "interest",
};

const STORAGE_KEY_MONTHLY = "finatlas:list:monthly:v1";

function loadMonthly(): number {
  if (typeof window === "undefined") return 500000;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_MONTHLY);
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) && v > 0 ? v : 500000;
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

function formatBankLabel(productId: string, companyName?: string, companyCode?: string, bankCodeMap?: BankNameMap): string {
  if (companyName && companyName.trim()) return companyName;

  if (companyCode && companyCode.trim() && bankCodeMap?.[companyCode]) {
    return bankCodeMap[companyCode];
  }

  if (companyCode && companyCode.trim()) return `은행코드 ${companyCode}`;

  return `은행코드 ${parseBankCode(productId)}`;
}

export function ListPage() {
  const [rows, setRows] = useState<RankedOption[]>([]);
  const [products, setProducts] = useState<Record<string, { company_name: string; product_name: string; company_code: string }>>({});
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [monthly, setMonthly] = useState<number>(loadMonthly);
  const [meta, setMeta] = useState<{ last_success_at?: string; normalized_product_count?: number; normalized_option_count?: number } | null>(null);
  const [catalog, setCatalog] = useState<ConditionCatalog>({});
  const [bankCodeMap, setBankCodeMap] = useState<BankNameMap>({});

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

        const productMap: Record<string, { company_name: string; product_name: string; company_code: string }> = {};
        (productJson || []).forEach((x: ProductMeta) => {
          if (!x?.product_id) return;
          productMap[x.product_id] = {
            company_name: x.company_name || "",
            product_name: x.product_name || "",
            company_code: x.company_code || "",
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
    window.localStorage.setItem(STORAGE_KEY_MONTHLY, String(monthly));
  }, [monthly]);

  const terms = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => s.add(r.save_term_months));
    return Array.from(s).sort((a, b) => a - b);
  }, [rows]);

  const filtered = useMemo(() => filterAndSort(rows, filters, catalog), [rows, filters, catalog]);

  const displayRows = useMemo<DisplayOption[]>(() => {
    return filtered.map((r) => {
      const pm = products[r.product_id];
      const bankName = formatBankLabel(r.product_id, pm?.company_name, pm?.company_code, bankCodeMap);
      return {
        ...r,
        bank_name: bankName,
        product_name: pm?.product_name || "-",
        bonus_condition_count: (catalog[r.product_id] || []).length,
      };
    });
  }, [filtered, products, catalog, bankCodeMap]);

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
      <FilterPanel filters={filters} setFilters={setFilters} terms={terms} />

      <div className="topline" style={{ margin: "12px 0" }}>
        <h3>상품 목록 ({filtered.length})</h3>
        <div className="actions" style={{ gap: 8, alignItems: "center" }}>
          <label htmlFor="global-monthly" style={{ fontSize: 13 }}>
            비교 납입금
          </label>
          <input
            id="global-monthly"
            type="number"
            min={10000}
            step={10000}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value || 0))}
            style={{ width: 140 }}
          />
          <small>
            {meta?.last_success_at ? `데이터 기준: ${new Date(meta.last_success_at).toLocaleString()}` : "데이터 상태: 미갱신"}
          </small>
        </div>
      </div>

      <CompareDrawer visible={compare.length >= 2} rows={compare} onClose={() => setSelected(new Set())} />
      <ProductTable rows={displayRows} selected={selected} monthlyPayment={monthly} onSelect={onSelect} />
    </div>
  );
}
