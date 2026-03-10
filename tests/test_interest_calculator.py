from scripts.enrich.calculate_interest import calc_simple_interest

def test_interest_works() -> None:
    a = calc_simple_interest(500_000, 3.0, 12)
    b = calc_simple_interest(500_000, 4.0, 12)
    assert b > a
    c = calc_simple_interest(500_000, 3.0, 24)
    assert c > a
