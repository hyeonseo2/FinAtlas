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
        r"전자명함",
        r"앱",
        r"모바일",
        r"비대면",
        r"인터넷\s*뱅킹",
        r"모바일\s*뱅킹",
        r"온라인",
        r"오픈뱅킹",
        r"오픈\s*뱅킹",
        r"타행\s*계좌\s*등록",
        r"타행\s*계좌",
        r"연동",
        r"간편\s*인증",
    ],
    "auto_transfer": [
        r"자동\s*이체",
        r"아파트관리비\s*이체",
        r"KB스타\s*뱅킹\s*이체",
        r"KB스타뱅크\s*이체",
        r"KB\s*스타\s*뱅킹",
        r"자동이체",
        r"자동\s*납입",
        r"정기\s*이체",
        r"자동납부",
        r"자동납입횟수",
        r"이체\s*횟수",
        r"회 이상\s*납입",
        r"회\s*이상",
        r"회차",
        r"월\s*부금",
        r"월납입액",
        r"월\s*입금",
        r"월\s*최소",
        r"평잔",
        r"유지",
        r"연\s*최대",
    ],
    "first_customer": [
        r"장기거래",
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
        r"주거래",
        r"주거래통장",
        r"주거래우대",
        r"주거래계좌",
        r"자녀",
        r"영업점",
        r"가입.*예치",
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
        r"월\s*실적",
        r"이용\s*횟수",
        r"신용카드",
        r"신용\s*카드",
    ],
    "bundle_product": [
        r"동시\s*가입",
        r"동시\s*보유",
        r"청약\s*보유",
        r"청약보유",
        r"번들",
        r"패키지",
        r"교차\s*판매",
        r"동시\s*가입\s*시",
        r"동시\s*상품",
        r"패키지\s*혜택",
    ],
    "bonus_rate_notice": [
        r"우대금리",
        r"우대이율",
        r"최고우대금리",
        r"최대우대금리",
        r"우대 금리",
        r"연0",
        r"연 0",
        r"최고\s*연",
        r"우대\s*이율",
        r"우대금리\s*최대",
    ],

    "event_participation": [
        r"이벤트",
        r"봉사활동",
        r"상품홍보",
        r"해양플라스틱\s*감축\s*서약",
        r"감축\s*서약",
        r"자원봉사",
        r"봉사",
        r"참여",
        r"추첨",
        r"미션",
        r"출석\s*체크인",
        r"미션\s*",
        r"스탬프",
        r"인증\s*완료",
        r"VIP",
        r"VVIP",
        r"VVIP등급",
    ],
}

BASE_PROB = {
    "marketing_agree": 0.95,
    "app_signup": 0.90,
    "bonus_rate_notice": 0.96,
    "auto_transfer": 0.85,
    "first_customer": 0.35,
    "salary_transfer": 0.20,
    "card_spending": 0.30,
    "pension_transfer": 0.10,
    "bundle_product": 0.15,
    "event_participation": 0.25,
    "unclear": 0.20,
}
# 분류 동률일 때 카테고리 우선순위 (좌측이 더 우선)
CATEGORY_PRIORITY = ("marketing_agree", "app_signup", "auto_transfer", "bundle_product", "first_customer", "salary_transfer", "pension_transfer", "card_spending", "event_participation")



NOISE_KEYWORDS: list[str] = [
    "제공조건",
    "유의사항",
    "주의사항",
    "안내사항",
    "중복적용",
    "중복 적용",
    "계약기간별차등적용",
    "중복적용되지 않음",
    "최고우대금리",
    "최대우대금리",
    "우대금리 적용조건",
    "우대금리 적용",
    "우대이율",
    "조건①",
    "조건②",
    "조건③",
    "조건(가)",
    "조건(나)",
]

MARKETING_HINTS = ("마케팅", "수신동의", "이용동의", "광고성", "마케팅동의")

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
        # 기본: 구체 숫자(횟수/금액) 미기재이면 보수적으로 어려움 처리
        return 0.25

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

        # 기본: 금액/규모 정보 미기재이면 보수적으로 어려움 처리
        return 0.25

    return BASE_PROB.get(category, BASE_PROB["unclear"])

def is_noisy_condition(sentence: str) -> bool:
    if not sentence:
        return True

    text = sentence.strip()
    compact = re.sub(r"\s+", "", text)

    # 빈칸/짧은 라벨은 제외
    if len(compact) <= 2:
        return True

    # 순번/조문 토큰은 본문이 없으면 노이즈
    if re.fullmatch(r"[가-하]|[0-9]+[-–—]?[0-9]*|[0-9]+\)\s*|[가-하]\)", compact):
        return True

    # 헤더/메타성 문구는 제외
    for keyword in NOISE_KEYWORDS:
        if keyword in text:
            return True

    if re.search(r"^\(?(?:단\s*)?\d*항", compact):
        return True
    if re.fullmatch(r".*\*.*", compact):
        return True

    # 수치/퍼센트가 전혀 없고 너무 추상적인 문장은 제외 (실행 조건으로 추정 불가)
    if not re.search(r"\d|%|회|개월|만원|천원|원|세전|세후", text):
        if not any(k in text for k in ["월", "입금", "이체", "가입", "거래", "카드", "유지", "목표", "이용"]):
            return True

    return False


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

    # 동시성/동시가입/번들 성격 문구는 번들조건으로 우선 분류
    if (
        re.search(r"동시\s*(가입|보유|이용|개설|신규|등록)?", sentence)
        or "번들" in sentence
        or "패키지" in sentence
        or "동시상품" in sentence
        or re.search(r"청약\s*보유|청약보유|보유\s*\+\s*청약|청약\s*\+\s*보유", sentence)
    ):
        return "bundle_product"

    scored: dict[str, int] = {}
    for category, pats in CATEGORY_RULES.items():
        score = sum(len(re.findall(p, sentence)) for p in pats)
        if score:
            scored[category] = score

    if not scored:
        return "unclear"

    max_score = max(scored.values())
    winners = {k for k, v in scored.items() if v == max_score}

    for category in CATEGORY_PRIORITY:
        if category in winners:
            return category

    for category in winners:
        if category in CATEGORY_RULES:
            return category
    return winners.pop()


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
            if is_noisy_condition(s):
                continue

            bonus = parse_bonus(s)
            cat = classify(s)
            if cat == "bonus_rate_notice":
                continue
            prob = infer_probability(s, cat)
            out.append(
                {
                    "condition_id": f"{pid}_{idx:03d}",
                    "product_id": pid,
                    "condition_text": s,
                    "condition_category": cat,
                    "bonus_rate": bonus,
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
