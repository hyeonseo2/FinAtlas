from scripts.enrich.score_difficulty import score, grade

def test_difficulty_grade():
    assert grade(85) == "매우 쉬움"
    assert score([]) == 100
    assert score([{"condition_category":"salary_transfer"}, {"condition_category":"card_spending"}, {"condition_category":"first_customer"}]) < 70
