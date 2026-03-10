from __future__ import annotations

COUNT_PENALTY = {1: 5, 2: 10, 3: 18, 4: 26}
TYPE_PENALTY = {
    "marketing_agree": 1,
    "auto_transfer": 3,
    "app_signup": 2,
    "first_customer": 8,
    "salary_transfer": 15,
    "card_spending": 12,
    "pension_transfer": 18,
    "bundle_product": 10,
    "event_participation": 8,
    "unclear": 6,
}
REL_PENALTY = {"first_customer", "salary_transfer", "pension_transfer"}
RECUR_PENALTY = {"auto_transfer", "card_spending"}


def score(conditions: list[dict]) -> int:
    if not conditions:
        return 100
    s = 100
    n = len(conditions)
    if n >= 5:
        s -= 35
    else:
        s -= COUNT_PENALTY.get(n, 0)

    for c in conditions:
        cat = c.get("condition_category")
        s -= TYPE_PENALTY.get(cat, 4)
        if cat in REL_PENALTY:
            s -= 7
        if cat in RECUR_PENALTY:
            s -= 5

    return max(0, min(100, s))


def grade(score: int) -> str:
    if score >= 85:
        return "매우 쉬움"
    if score >= 70:
        return "쉬움"
    if score >= 55:
        return "보통"
    if score >= 40:
        return "어려움"
    return "매우 어려움"


def group_score(conditions: list[dict]) -> dict[str, int]:
    by = {}
    for c in conditions:
        by.setdefault(c["product_id"], []).append(c)
    return {pid: score(conds) for pid, conds in by.items()}
