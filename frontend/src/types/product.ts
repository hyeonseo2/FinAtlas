export type DifficultyGrade = "매우 쉬움" | "쉬움" | "보통" | "어려움" | "매우 어려움";

export type ConditionCategory =
  | "marketing_agree"
  | "app_signup"
  | "auto_transfer"
  | "first_customer"
  | "salary_transfer"
  | "pension_transfer"
  | "card_spending"
  | "bundle_product"
  | "event_participation"
  | "unclear"
  | "unknown";

export interface RankedOption {
  option_id: string;
  product_id: string;
  company_name: string;
  product_name: string;
  save_term_months: number;
  rate_type: string;
  base_rate: number | null;
  max_rate: number | null;
  rate_gap?: number | null;
  expected_bonus_rate: number;
  expected_rate: number;
  difficulty_score: number;
  difficulty_grade: DifficultyGrade;
  condition_count: number;
  monthly_payment: number;
  estimated_interest_before_tax: number;
  estimated_maturity_amount: number;
}

export interface ProductMeta {
  product_id: string;
  company_name: string;
  product_name: string;
  fin_group_code: string;
  fin_group_name: string;
  saving_type: string;
  join_members: string;
  join_way: string[];
  join_deny_level: number | null;
  max_limit: number | null;
  special_condition_text: string;
  maturity_interest_text: string;
  etc_note_text: string;
  disclosure_start_date: string | null;
  disclosure_end_date: string | null;
  is_active: boolean;
}

export interface BonusCondition {
  condition_id: string;
  product_id: string;
  condition_text: string;
  condition_category: ConditionCategory;
  bonus_rate: number;
  difficulty_level: number;
  requires_existing_relationship: boolean;
  requires_recurring_action: boolean;
  is_uncertain_parse: boolean;
  achievability_probability?: number;
}

export interface ProductOption {
  option_id: string;
  product_id: string;
  save_term_months: number;
  rate_type: string;
  rate_type_code: string;
  base_rate: number | null;
  max_rate: number | null;
  rate_gap: number | null;
}

export interface Filters {
  group: string;
  bank: string;
  term: number | "";
  minBaseRate: string;
  minMaxRate: string;
  minExpectedRate: string;
  maxDifficulty: string;
  savingType: string;
  conditionCategory: string;
  sort: string;
}
