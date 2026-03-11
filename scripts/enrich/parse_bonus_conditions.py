from __future__ import annotations

import re

CATEGORY_RULES = {
    "marketing_agree": [
        r"마케팅\s*동의",
        r"수신\s*동의",
        r"이용\s*동의",
        r"광고성\s*정보\s*수신",
        r"전화\s*및\s*문자\s*동의",
        r"sms\s*동의",
    ],
    "app_signup": [
        r"앱",
        r"모바일",
        r"비대면",
        r"인터넷\s*뱅킹",
        r"모바일\s*뱅킹",
        r"온라인",
    ],
    "auto_transfer": [
        r"자동\s*이체",
        r"자동이체",
        r"자동\s*납입",
        r"정기\s*이체",
        r"자동납부",
        r"자동납입횟수",
        r"이체\s*횟수",
        r"회 이상\s*납입",
        r"회\s*이상",
        r"회차",
    ],
    "first_customer": [
        r"첫\s*거래",
        r"최초",
        r"신규가입",
        r"신규고객",
        r"신규.*고객",
        r"신규일",
        r"신규\s*가입",
        r"신규\s*거래",
        r"첫\s*만남",
        r"입출\s*실적",
        r"계좌\s*거래",
        r"고객\s*경험",
        r"재신규",
        r"재\s*신규",
        r"미보유",
        r"해지\s*이력",
        r"재.*가입",
    ],
    "salary_transfer": [
        r"급여이체",
        r"급여\s*\/?\s*통장",
        r"급여\s*계좌",
        r"연봉",
        r"월급",
        r"급여\s*입금",
        r"급여이체",
        r"급여이체계좌",
    ],
    "pension_transfer": [
        r"연금\s*이체",
        r"연금\s*수령",
        r"연금",
    ],
    "card_spending": [
        r"카드",
        r"결제\s*실적",
        r"이용금액",
        r"지출",
        r"카드\s*이용",
        r"체크\s*카드",
        r"신용\(체크\)?\s*카드",
        r"결제\s*금액",
        r"적립\s*횟수",
        r"이용\s*실적",
        r"이용\s*금액",
        r"신용\s*카드",
    ],
    "bundle_product": [
        r"동시\s*가입",
        r"동시\s*보유",
        r"번들",
        r"패키지",
        r"교차\s*판매",
        r"동시\s*가입\s*시",
        r"동시\s*상품",
        r"패키지\s*혜택",
    ],
    "event_participation": [
        r"이벤트",
        r"참여",
        r"추첨",
        r"미션",
        r"출석\s*체크인",
        r"미션\s*",
        r"스탬프",
        r"인증\s*완료",
    ],
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

MARKETING_HINTS = ("마케팅", "수신동의", "이용동의", "광고성", "마케팅동의", "이벤트")

MULTI_RATE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%\s*p?", re.IGNORECASE)


def _normalize(text: str) -> str:
    raw = str(text or "")
    raw = raw.replace("\r", "\n")
    raw = re.sub(r"\((?P<idx>[가-하])\)", r" || ", raw)
    raw = re.sub(r"(?m)^[가-하]\.\s*", " || ", raw)
    raw = re.sub(r"(?m)^[가-하]\)\s*", " || ", raw)
    raw = re.sub(r"(?m)^[0-9]+[.)]\s*", " || ", raw)
    raw = re.sub(r"\s*[;,]\s*", " || ", raw)
    raw = re.sub(r"\(\d+\)", " || ", raw)
    raw = re.sub(r"\n+", " || ", raw)
    raw = re.sub(r"\s+", " ", raw)
    return raw.strip()



AUTO_TRANSFER_RATE = re.compile(r"(\d+)\s*회")
AUTO_TRANSFER_AMOUNT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(만원|천원)")
CARD_AMOUNT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(만원|천원)")


def normalize_amount(v: str, unit: str) -> float:
    n = float(v)
    if unit == "천원":
        return n * 1000
    return n * 10000


def infer_probability(sentence: str, category: str) -> float:
    if category == "auto_transfer":
        # Easy if only a few required transfers. Hard if many times required or no explicit info.
        m = AUTO_TRANSFER_RATE.findall(sentence)
        if m:
            try:
                n = max(int(x) for x in m)
                if n <= 3:
                    return 0.95
                if n <= 6:
                    return 0.9
                if n <= 12:
                    return 0.85
                if n <= 24:
                    return 0.75
            except Exception:
                pass

        m2 = AUTO_TRANSFER_AMOUNT_RE.findall(sentence)
        if m2:
            try:
                amt = max(normalize_amount(v, u) for v, u in m2)
                if amt <= 100000:
                    return 0.95
                if amt <= 300000:
                    return 0.9
                if amt <= 500000:
                    return 0.82
                if amt <= 1000000:
                    return 0.75
                return 0.65
            except Exception:
                pass
        # 기본
        return 0.70

    if category == "card_spending":
        # card spending requirement amount 기준으로 더 정교하게
        if re.search(r"\d", sentence):
            m = CARD_AMOUNT_RE.findall(sentence)
            if m:
                vals = []
                for v, u in m:
                    try:
                        vals.append(normalize_amount(v, u))
                    except Exception:
                        continue
                if vals:
                    amt = min(vals)
                    if amt <= 30000:
                        return 0.92
                    if amt <= 100000:
                        return 0.88
                    if amt <= 300000:
                        return 0.80
                    if amt <= 500000:
                        return 0.72
                    if amt <= 1000000:
                        return 0.65
                    return 0.55

        if re.search(r"(소액|소액|저금액|30만원|50만원|100만원)", sentence):
            return 0.8

        if re.search(r"(매우|고액|많이|대량|매월|월\s*|연\s*|매년)", sentence):
            return 0.75

        return 0.78

    return BASE_PROB.get(category, BASE_PROB["unclear"])

def split_conditions(text: str) -> list[str]:
    normalized = _normalize(text)
    if not normalized:
        return []

    parts = [p.strip() for p in normalized.split(" || ")]
    out: list[str] = []

    for p in parts:
        p = re.sub(r"^[-–—•·\s]+", "", p).strip()
        p = re.sub(r"^\|\|\s*", "", p).strip()
        if not p:
            continue
        lower = p.replace(" ", "").lower()
        if lower in {"없음", "해당없음", "없습니다", "해당사항없음", "미해당"}:
            continue

        # If one clause still contains obvious separators, split gently.
        for seg in re.split(r"(?<=[.])\s+", p):
            seg = re.sub(r"^[-–—•·\s]+", "", seg).strip()
            seg = seg.replace("가.", " ").replace("나.", " ").replace("다.", " ").strip()
            if not seg:
                continue
            seg = seg.strip()
            if not seg:
                continue
            seg = seg.replace("가.", "").replace("나.", "").replace("다.", "").strip()
            if seg.lower() in {"없음", "해당없음", "없습니다"}:
                continue
            out.append(seg)

    return out


def classify(sentence: str) -> str:
    # marketing 동의류가 강하게 들어가면 먼저 판단
    for kw in MARKETING_HINTS:
        if kw in sentence:
            return "marketing_agree"

    scored: dict[str, int] = {}
    for category, pats in CATEGORY_RULES.items():
        score = sum(len(re.findall(p, sentence)) for p in pats)
        if score:
            scored[category] = score

    if not scored:
        return "unclear"

    max_score = max(scored.values())
    winners = [k for k, v in scored.items() if v == max_score]

    for category in CATEGORY_RULES:
        if category in winners:
            return category
    return winners[0]


def parse_bonus(v: str) -> float:
    rates = [float(x) for x in MULTI_RATE_RE.findall(v)]
    if not rates:
        return 0.0
    return max(rates)


def parse_bonus_conditions(base_products: list[dict]) -> list[dict]:
    out = []
    for p in base_products:
        text = str(p.get("special_condition_text", ""))
        pid = p["product_id"]
        for idx, s in enumerate(split_conditions(text)):
            cat = classify(s)
            prob = infer_probability(s, cat)
            out.append(
                {
                    "condition_id": f"{pid}_{idx:03d}",
                    "product_id": pid,
                    "condition_text": s,
                    "condition_category": cat,
                    "bonus_rate": parse_bonus(s),
                    "difficulty_level": int((1 - prob) * 100),
                    "requires_existing_relationship": cat in {"first_customer", "salary_transfer", "pension_transfer"},
                    "requires_recurring_action": cat in {"auto_transfer", "card_spending"},
                    "is_unclear": cat == "unclear",
                    "is_uncertain_parse": cat == "unclear",
                    "achievability_probability": prob,
                }
            )
    return out


def parse_bonus_conditions_dedup(base_products: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for c in parse_bonus_conditions(base_products):
        key = (c["product_id"], c["condition_text"], c["condition_category"], c["bonus_rate"])
        if key in seen:
            continue
        seen.add(key)
        out.append(c)
    return out
