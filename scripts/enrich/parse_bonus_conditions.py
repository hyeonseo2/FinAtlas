from __future__ import annotations

import re

CATEGORY_RULES = {
    "marketing_agree": [r"마케팅", r"수신동의", r"이용동의"],
    "app_signup": [r"앱", r"모바일", r"비대면", r"인터넷"],
    "auto_transfer": [r"자동이체", r"자동 이체"],
    "first_customer": [r"첫\s*거래", r"신규", r"최초"],
    "salary_transfer": [r"급여이체", r"급여"],
    "pension_transfer": [r"연금", r"연금수령", r"연금이체"],
    "card_spending": [r"카드", r"결제\s*실적", r"이용금액", r"지출"],
    "bundle_product": [r"동시", r"번들", r"패키지"],
    "event_participation": [r"이벤트", r"참여", r"추첨"],
}

BASE_PROB = {
    "marketing_agree": 0.95,
    "app_signup": 0.90,
    "auto_transfer": 0.85,
    "first_customer": 0.35,
    "salary_transfer": 0.20,
    "card_spending": 0.30,
    "pension_transfer": 0.10,
    "bundle_product": 0.15,
    "event_participation": 0.25,
    "unclear": 0.20,
}

P_RATE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%\s*p")


def split_conditions(text: str) -> list[str]:
    raw = re.sub(r"\s+", " ", text).strip()
    if not raw:
        return []
    parts = re.split(r"[;,\n]", raw)
    return [p.strip() for p in parts if p.strip()]


def classify(sentence: str) -> str:
    for category, pats in CATEGORY_RULES.items():
        for p in pats:
            if re.search(p, sentence):
                return category
    return "unclear"


def parse_bonus(v: str) -> float:
    m = P_RATE_RE.search(v)
    return float(m.group(1)) if m else 0.0


def parse_bonus_conditions(base_products: list[dict]) -> list[dict]:
    out = []
    for p in base_products:
        text = str(p.get("special_condition_text", ""))
        pid = p["product_id"]
        for idx, s in enumerate(split_conditions(text)):
            cat = classify(s)
            difficulty_level = int((1 - BASE_PROB.get(cat, BASE_PROB["unclear"])) * 100)

            out.append(
                {
                    "condition_id": f"{pid}_{idx:03d}",
                    "product_id": pid,
                    "condition_text": s,
                    "condition_category": cat,
                    "bonus_rate": parse_bonus(s),
                    "difficulty_level": difficulty_level,
                    "requires_existing_relationship": cat in {"first_customer", "salary_transfer", "pension_transfer"},
                    "requires_recurring_action": cat in {"auto_transfer", "card_spending"},
                    "is_uncertain_parse": cat == "unclear",
                    "achievability_probability": BASE_PROB.get(cat, BASE_PROB["unclear"]),
                }
            )
    return out
