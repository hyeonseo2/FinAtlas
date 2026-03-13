import { toDisplayDifficulty } from "./difficulty";

import { Filters, RankedOption, ProductMeta } from "../types/product";
type BankLikeProduct = Pick<ProductMeta, "company_code" | "company_name" | "product_name" | "product_type" | "fin_group_code">;

function resolveGroupCode(pm: BankLikeProduct | undefined, bankNameMap: Record<string, string> = {}): string {
  if (!pm) return "";
  const direct = (pm.fin_group_code || "").trim();
  if (direct) return direct;

  // fallback: use name-based heuristic for legacy cases
  const code = (pm.company_code || "").trim();
  const name = (pm.company_name || bankNameMap[code] || "").trim().toLowerCase();
  const isSavings = name.includes("저축은행") || name.endsWith("저축") || name.includes("저축금융") || name.includes("저축예금");
  return isSavings ? "030300" : "020000";
}

function hasBankGroupFilter(rawGroup: string | number, pm: BankLikeProduct | undefined, bankNameMap: Record<string, string> = {}): boolean {
  const group = String(rawGroup || "").trim();
  if (!group) return true;
  const resolved = resolveGroupCode(pm, bankNameMap);
  if (!resolved) return true;
  if (group === resolved) return true;
  return false;
}

function hasBonusCategoryInProduct(rowProductId: string, categories: string[], catalog: Record<string, string[]>): boolean {
  if (!categories || categories.length === 0) return true;
  const list = catalog[rowProductId] || [];
  if (!list.length) return false;
  return categories.some((category) => list.includes(category));
}

export type SortDirection = "asc" | "desc";

export function filterAndSort(
  rows: RankedOption[],
  filters: Filters,
  sortKey: "interest" | "expected" | "max" | "base" | "easy" | "conditions" | "maturity",
  sortDirection: SortDirection,
  conditionCatalog: Record<string, string[]> = {},
  productMap: Record<string, BankLikeProduct> = {},
  bankNameMap: Record<string, string> = {},
): RankedOption[] {
  const result = rows.filter((o) => {
    if (!hasBankGroupFilter(filters.group, productMap[o.product_id], bankNameMap)) return false;
    const pm = productMap[o.product_id];
    if (filters.productType) {
      if ((pm?.product_type || "saving") !== filters.productType) return false;
    }
    const bankText = (pm?.company_name || bankNameMap[pm?.company_code || ""] || "").toLowerCase();
    if (filters.bank && bankText && !bankText.includes(filters.bank.toLowerCase())) return false;
    if (filters.term && o.save_term_months !== Number(filters.term)) return false;

    const minBase = filters.minBaseRate ? Number(filters.minBaseRate) : -Infinity;
    const minMax = filters.minMaxRate ? Number(filters.minMaxRate) : -Infinity;
    const minExp = filters.minExpectedRate ? Number(filters.minExpectedRate) : -Infinity;
    if (o.base_rate != null && o.base_rate < minBase) return false;
    if (o.max_rate != null && o.max_rate < minMax) return false;
    if (o.expected_rate < minExp) return false;

    if (filters.productNameQuery) {
      const q = filters.productNameQuery.toLowerCase().trim();
      const productName = (pm?.product_name || "").toLowerCase();
      if (!productName.includes(q)) return false;
    }

    if (!hasBonusCategoryInProduct(o.product_id, filters.conditionCategory || [], conditionCatalog)) return false;

    return true;
  });

  const sortMultiplier = sortDirection === "asc" ? 1 : -1;
  switch (sortKey) {
    case "expected":
      return [...result].sort((a, b) => (b.expected_rate - a.expected_rate) * sortMultiplier);
    case "interest":
      return [...result].sort((a, b) => (b.estimated_interest_before_tax - a.estimated_interest_before_tax) * sortMultiplier);
    case "base":
      return [...result].sort((a, b) => ((b.base_rate ?? 0) - (a.base_rate ?? 0)) * sortMultiplier);
    case "max":
      return [...result].sort((a, b) => ((b.max_rate ?? 0) - (a.max_rate ?? 0)) * sortMultiplier);
    case "easy":
      return [...result].sort((a, b) => (toDisplayDifficulty(a.difficulty_score) - toDisplayDifficulty(b.difficulty_score)) * sortMultiplier);
    case "conditions":
      return [...result].sort((a, b) => (a.condition_count - b.condition_count) * sortMultiplier);
    case "maturity":
      return [...result].sort((a, b) => ((b.estimated_maturity_amount ?? 0) - (a.estimated_maturity_amount ?? 0)) * sortMultiplier);
    default:
      return [...result].sort((a, b) => (b.estimated_interest_before_tax - a.estimated_interest_before_tax) * sortMultiplier);
  }
}


export function getProductGroupCode(pm?: BankLikeProduct, bankNameMap: Record<string, string> = {}): string {
  return resolveGroupCode(pm, bankNameMap);
}
