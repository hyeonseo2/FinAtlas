import { Filters, RankedOption, ProductMeta } from "../types/product";
type BankLikeProduct = Pick<ProductMeta, "company_code" | "company_name"> & Partial<Pick<ProductMeta, "fin_group_code">>;

function isSavingsProductByName( productMeta: BankLikeProduct | undefined, bankNameMap: Record<string, string> = {}): boolean {
  const code = (productMeta?.company_code || "").trim();
  const name = (productMeta?.company_name || bankNameMap[code] || "").trim().toLowerCase();
  return name.includes("저축은행") || name.endsWith("저축") || name.includes("저축금융") || name.includes("저축예금");
}

function isSavingsProduct(productMeta: BankLikeProduct | undefined, bankNameMap: Record<string, string> = {}): boolean {
  return isSavingsProductByName(productMeta, bankNameMap);
}

function hasBankGroupFilter(rawGroup: string | number, pm: BankLikeProduct | undefined, bankNameMap: Record<string, string> = {}): boolean {
  const group = String(rawGroup || "").trim();
  if (!group) return true;
  const isSavings = isSavingsProduct(pm, bankNameMap);
  if (group === "020000") return !isSavings;
  if (group === "030300") return isSavings;
  return true;
}

function hasBonusCategoryInProduct(rowProductId: string, category: string, catalog: Record<string, string[]>): boolean {
  if (!category || category === "") return true;
  const list = catalog[rowProductId] || [];
  if (!list.length) return false;
  return list.includes(category);
}

export function filterAndSort(
  rows: RankedOption[],
  filters: Filters,
  conditionCatalog: Record<string, string[]> = {},
  productMap: Record<string, BankLikeProduct> = {},
  bankNameMap: Record<string, string> = {},
): RankedOption[] {
  const result = rows.filter((o) => {
    if (!hasBankGroupFilter(filters.group, productMap[o.product_id], bankNameMap)) return false;
    const pm = productMap[o.product_id];
    const bankText = (pm?.company_name || bankNameMap[pm?.company_code || ""] || "").toLowerCase();
    if (filters.bank && bankText && !bankText.includes(filters.bank.toLowerCase())) return false;
    if (filters.term && o.save_term_months !== Number(filters.term)) return false;

    const minBase = filters.minBaseRate ? Number(filters.minBaseRate) : -Infinity;
    const minMax = filters.minMaxRate ? Number(filters.minMaxRate) : -Infinity;
    const minExp = filters.minExpectedRate ? Number(filters.minExpectedRate) : -Infinity;
    if (o.base_rate != null && o.base_rate < minBase) return false;
    if (o.max_rate != null && o.max_rate < minMax) return false;
    if (o.expected_rate < minExp) return false;

    const maxDiff = filters.maxDifficulty ? Number(filters.maxDifficulty) : 100;
    if (o.difficulty_score > maxDiff) return false;
    if (filters.savingType && !o.rate_type.includes(filters.savingType)) return false;

    if (!hasBonusCategoryInProduct(o.product_id, filters.conditionCategory || "", conditionCatalog)) return false;

    return true;
  });

  switch (filters.sort) {
    case "expected":
      return [...result].sort((a, b) => b.expected_rate - a.expected_rate);
    case "interest":
      return [...result].sort((a, b) => b.estimated_interest_before_tax - a.estimated_interest_before_tax);
    case "base":
      return [...result].sort((a, b) => (b.base_rate ?? 0) - (a.base_rate ?? 0));
    case "max":
      return [...result].sort((a, b) => (b.max_rate ?? 0) - (a.max_rate ?? 0));
    case "easy":
      return [...result].sort((a, b) => a.difficulty_score - b.difficulty_score);
    case "conditions":
      return [...result].sort((a, b) => a.condition_count - b.condition_count);
    default:
      return [...result].sort((a, b) => b.estimated_interest_before_tax ?? 0);
  }
}
