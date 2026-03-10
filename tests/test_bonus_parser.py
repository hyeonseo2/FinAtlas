from scripts.enrich.parse_bonus_conditions import parse_bonus_conditions

def test_parse_bonus_conditions() -> None:
    rows = [{"product_id":"p1","special_condition_text":"급여이체 월 50만원 이상 시 연 0.5%p, 자동이체 등록 +0.1%p, 마케팅 동의"}]
    c = parse_bonus_conditions(rows)
    cats = {x["condition_category"] for x in c}
    assert "salary_transfer" in cats
    assert "auto_transfer" in cats
    assert any(x["bonus_rate"] == 0.5 for x in c)
