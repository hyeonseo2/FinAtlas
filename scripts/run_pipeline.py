from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from scripts.config import load
from scripts.fetch.fetch_savings_products import collect_all
from scripts.normalize.normalize_products import normalize_products
from scripts.normalize.normalize_options import normalize_options
from scripts.enrich.parse_bonus_conditions import parse_bonus_conditions
from scripts.enrich.score_difficulty import group_score, grade
from scripts.enrich.estimate_real_rate import expected_bonus_rate, expected_rate
from scripts.enrich.calculate_interest import add_interest_columns
from scripts.export.export_json import dump, write_metadata


def run(max_pages: int = 0):
    cfg = load()
    raw_root = cfg.output_root / "raw"
    raw_root.mkdir(parents=True, exist_ok=True)

    bases_raw, options_raw = collect_all(raw_root, max_pages=max_pages)

    products = normalize_products(bases_raw)
    options = normalize_options(options_raw)

    normalized_root = cfg.output_root / "normalized"
    dump(normalized_root / "products.json", products)
    dump(normalized_root / "product_options.json", options)

    bonus = parse_bonus_conditions(products)
    dump(normalized_root / "bonus_conditions.json", bonus)

    by_product = defaultdict(list)
    for c in bonus:
        by_product[c["product_id"]].append(c)

    score_map = group_score(bonus)

    derived = []
    for o in options:
        conds = by_product.get(o["product_id"], [])
        eb = expected_bonus_rate(conds)
        er = expected_rate(o.get("base_rate"), o.get("max_rate"), conds)
        derived.append(
            {
                **o,
                "expected_bonus_rate": eb,
                "expected_rate": er,
                "difficulty_score": score_map.get(o["product_id"], 100),
                "difficulty_grade": grade(score_map.get(o["product_id"], 100)),
                "condition_count": len(conds),
            }
        )

    derived_100 = add_interest_columns([d.copy() for d in derived], 100_000)
    derived_300 = add_interest_columns([d.copy() for d in derived], 300_000)
    derived_500 = add_interest_columns([d.copy() for d in derived], 500_000)

    for bucket in (derived_100, derived_300, derived_500):
        bucket.sort(key=lambda x: x["estimated_interest_before_tax"], reverse=True)

    derived_root = cfg.output_root / "derived"
    dump(derived_root / "ranked_options_100000.json", derived_100)
    dump(derived_root / "ranked_options_300000.json", derived_300)
    dump(derived_root / "ranked_options_500000.json", derived_500)

    # Frontend public copy
    dump(Path("frontend/public/data/options_100000.json"), derived_100)
    dump(Path("frontend/public/data/options_300000.json"), derived_300)
    dump(Path("frontend/public/data/options_500000.json"), derived_500)
    dump(Path("frontend/public/data/products.json"), products)
    dump(Path("frontend/public/data/product_options.json"), options)
    dump(Path("frontend/public/data/bonus_conditions.json"), bonus)

    parse_success = 1.0
    if products:
        parse_success = round(len([1 for p in by_product.keys() if by_product.get(p)]) / max(1, len(products)), 3)

    metadata = write_metadata(derived_root, len(bases_raw) + len(options_raw), len(products), len(options), parse_success)
    dump(Path("frontend/public/data/metadata.json"), metadata)

    return {
        "products": len(products),
        "options": len(options),
        "bonus_conditions": len(bonus),
    }


if __name__ == "__main__":
    run()
