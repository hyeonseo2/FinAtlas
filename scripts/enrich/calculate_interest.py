from __future__ import annotations


def calc_simple_interest(monthly_payment: int, annual_rate: float, months: int) -> int:
    if monthly_payment <= 0 or months <= 0:
        return 0
    r = annual_rate / 100.0
    return int(round(monthly_payment * (r / 12.0) * (months * (months + 1) / 2.0)))


def add_interest_columns(options: list[dict], payment: int) -> list[dict]:
    rows = []
    for o in options:
        r = float(o.get("expected_rate") or 0.0)
        n = int(o.get("save_term_months") or 0)
        interest = calc_simple_interest(payment, r, n)
        rows.append({
            **o,
            "monthly_payment": payment,
            "estimated_interest_before_tax": interest,
            "estimated_maturity_amount": payment * n + interest,
        })
    return rows
