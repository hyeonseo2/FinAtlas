from __future__ import annotations

import re


def _num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    m = re.findall(r"[-+]?\d*\.?\d+", str(v).replace(",", ""))
    return float(m[0]) if m else None


def normalize_options(rows: list[dict]) -> list[dict]:
    out: list[dict] = []
    for row in rows:
        grp = str(row.get("topFinGrpNo", "")).strip()
        company = str(row.get("fin_co_no", "")).strip()
        code = str(row.get("fin_prdt_cd", "")).strip()
        if not (company and code):
            continue

        product_id = f"{grp + '_' if grp else ''}{company}_{code}"
        m = re.findall(r"\d+", str(row.get("save_trm", "") or row.get("save_term", "")))
        if not m:
            continue
        term = int(m[0])

        base_rate = _num(row.get("intr_rate"))
        max_rate = _num(row.get("intr_rate2"))
        if max_rate is None:
            max_rate = base_rate

        option_id = f"{product_id}_{term}_{str(row.get('intr_rate_type', 'S'))[:1]}"
        out.append(
            {
                "option_id": option_id,
                "product_id": product_id,
                "save_term_months": term,
                "rate_type": row.get("intr_rate_type_nm", ""),
                "rate_type_code": row.get("intr_rate_type", ""),
                "base_rate": base_rate,
                "max_rate": max_rate,
                "rate_gap": round((max_rate - base_rate), 4) if base_rate is not None and max_rate is not None else None,
            }
        )
    return out
