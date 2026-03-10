from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def dump(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def write_metadata(output_root: Path, raw_count: int, product_count: int, option_count: int, parse_rate: float) -> dict:
    md = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "last_success_at": datetime.now(timezone.utc).isoformat(),
        "raw_fetch_count": raw_count,
        "normalized_product_count": product_count,
        "normalized_option_count": option_count,
        "parse_success_rate": parse_rate,
        "data_version": "1.0.0",
    }
    dump(output_root / "metadata.json", md)
    dump(Path("docs/data/metadata.json"), md)
    dump(Path("frontend/public/data/metadata.json"), md)
    return md
