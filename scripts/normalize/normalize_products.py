from __future__ import annotations

import re
from datetime import datetime


def _num(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).replace(",", "")
    m = re.findall(r"[-+]?\d*\.?\d+", s)
    return float(m[0]) if m else None


def _date_or_none(v):
    if not v or str(v).strip() in {"", "-", "0000-00-00"}:
        return None
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%Y%m%d", "%Y.%m.%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except Exception:
            pass
    return None


def normalize_products(rows: list[dict]) -> list[dict]:
    out = []
    now = datetime.utcnow().isoformat() + "Z"
    for row in rows:
        code = str(row.get("fin_prdt_cd", "")).strip()
        company = str(row.get("fin_co_no", "")).strip()
        grp = str(row.get("topFinGrpNo", "")).strip()
        if not code or not company:
            continue

        out.append(
            {
                "product_id": f"{grp}_{company}_{code}" if grp else f"{company}_{code}",
                "fin_group_code": grp,
                "fin_group_name": row.get("top_fin_grp_nm", row.get("topFinGrpNo", "")),
                "company_code": company,
                "company_name": row.get("fin_co_nm", ""),
                "product_code": code,
                "product_name": row.get("fin_prdt_nm", ""),
                "product_type": "saving",
                "saving_type": row.get("rsrv_type_nm", ""),
                "join_members": row.get("join_members", ""),
                "join_way": [x.strip() for x in str(row.get("join_way", "")).replace("/", ",").split(",") if x.strip()],
                "join_deny_level": int(row["join_deny"]) if str(row.get("join_deny", "")).strip().isdigit() else None,
                "max_limit": int(_num(row.get("join_limit")) or 0) or None,
                "special_condition_text": row.get("spcl_cnd", "") or "",
                "maturity_interest_text": row.get("mtrt_int", "") or "",
                "etc_note_text": row.get("etc_note", "") or "",
                "disclosure_start_date": _date_or_none(row.get("dcls_strt_day")),
                "disclosure_end_date": _date_or_none(row.get("dcls_end_day")),
                "is_active": str(row.get("dcls_end_day") or "").strip() == "",
                "source_updated_at": now,
            }
        )
    return out
