import { Filters, RankedOption } from "../types/product";

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
): RankedOption[] {
  const result = rows.filter((o) => {
    if (filters.group && !o.option_id.startsWith(filters.group)) return false;
    if (filters.bank && !o.option_id.includes(filters.bank)) return false;
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
