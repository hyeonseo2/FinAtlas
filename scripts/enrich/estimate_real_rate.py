from __future__ import annotations


def expected_bonus_rate(conds: list[dict]) -> float:
    v = 0.0
    for c in conds:
        v += float(c.get("bonus_rate", 0.0) or 0.0) * float(c.get("achievability_probability", 0.0))
    return round(v, 4)


def expected_rate(base_rate, max_rate, conds):
    base = float(base_rate or 0.0)
    maxr = float(max_rate if max_rate is not None else base)
    exp_bonus = expected_bonus_rate(conds)
    rate = min(maxr, base + exp_bonus)

    if len(conds) >= 5:
        rate -= 0.05
    unclear = sum(1 for c in conds if c.get("condition_category") == "unclear")
    if unclear:
        rate -= 0.05 + 0.03 * unclear
    hard = sum(1 for c in conds if c.get("condition_category") in {"salary_transfer", "card_spending"})
    if hard >= 2:
        rate -= 0.03

    return max(0.0, round(rate, 4))
