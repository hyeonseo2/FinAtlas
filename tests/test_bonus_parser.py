from scripts.enrich.parse_bonus_conditions import parse_bonus_conditions


def test_parse_bonus_conditions() -> None:
    rows = [{"product_id": "p1", "special_condition_text": "급여이체 월 50만원 이상 시 연 0.5%p, 자동이체 등록 +0.1%p, 마케팅 동의"}]
    c = parse_bonus_conditions(rows)
    cats = {x["condition_category"] for x in c}
    assert "salary_transfer" in cats
    assert "auto_transfer" in cats
    assert any(x["bonus_rate"] == 0.5 for x in c)


def test_noisy_condition_filter_basic() -> None:
    assert """이 적금을 우리꿈통장""".startswith("이 적금을 우리꿈통장")
    from scripts.enrich.parse_bonus_conditions import is_noisy_condition

    assert is_noisy_condition("이 적금을 우리꿈통장")
    assert is_noisy_condition("아래 각 항(가")
    assert is_noisy_condition("(단 ①②③항은 중복적용 불가)")
    assert is_noisy_condition("중복적용되지 않음")
    assert is_noisy_condition("제공조건")
    assert not is_noisy_condition("KB스타뱅크 앱으로 이체 시 연 0.2%")


def test_parse_maps_actionable_noisy_keywords() -> None:
    rows = [
        {"product_id": "p2", "special_condition_text": "해양플라스틱감축서약 : 0.1% (신규시)"},
        {"product_id": "p3", "special_condition_text": "봉사활동 또는 상품홍보 : 0.2% (만기시)"},
        {"product_id": "p4", "special_condition_text": "전자명함을 통한 신규 시 0.2%"},
        {"product_id": "p5", "special_condition_text": "아파트관리비 이체 (우대 0%)"},
        {"product_id": "p6", "special_condition_text": "KB스타뱅킹 이체 (우대 0%)"},
        {"product_id": "p7", "special_condition_text": "장기거래 (우대 0%)"},
    ]
    c = parse_bonus_conditions(rows)
    assert len(c) == 6
    cat_by_pid = {x["product_id"]: x["condition_category"] for x in c}
    assert cat_by_pid["p2"] == "event_participation"
    assert cat_by_pid["p3"] == "event_participation"
    assert cat_by_pid["p4"] == "app_signup"
    assert cat_by_pid["p5"] == "auto_transfer"
    assert cat_by_pid["p6"] == "auto_transfer"
    assert cat_by_pid["p7"] == "first_customer"


def test_classifier_priority_prefers_specified_category() -> None:
    rows = [
        {
            "product_id": "p5",
            "special_condition_text": "모바일 앱에서 이벤트 참여 시 0.1% 우대",
        }
    ]
    c = parse_bonus_conditions(rows)
    assert len(c) == 1
    # 앱/이벤트가 동시에 존재하면 우선순위로 app_signup가 먼저 적용
    assert c[0]["condition_category"] == "app_signup"


def test_bundle_takes_priority_for_concurrent_condition() -> None:
    rows = [{"product_id": "p8", "special_condition_text": "첫거래/신규 0.20% + 기존거래 및 동시 보유 0.20%"}]
    c = parse_bonus_conditions(rows)
    assert len(c) == 1
    assert c[0]["condition_category"] == "bundle_product"


def test_bundle_alias_cheyang_bo_yo() -> None:
    rows = [{"product_id": "p9", "special_condition_text": "청약보유 시 연 0.2% 추가"}]
    c = parse_bonus_conditions(rows)
    assert len(c) == 1
    assert c[0]["condition_category"] == "bundle_product"
