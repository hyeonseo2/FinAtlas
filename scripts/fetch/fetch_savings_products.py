from __future__ import annotations

import json
from pathlib import Path

from scripts.config import load
from scripts.fetch.api_client import FinlifeClient


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def collect_group(client: FinlifeClient, group_no: str, out_dir: Path, max_pages: int = 0) -> tuple[list[dict], list[dict]]:
    first = client.request_page(group_no, 1)
    pages = max_pages if max_pages > 0 else client.get_max_page(first)
    if pages <= 0:
        pages = 1

    rows = [first]
    save_json(out_dir / "page_1.json", first)

    for p in range(2, pages + 1):
        payload = client.request_page(group_no, p)
        save_json(out_dir / f"page_{p}.json", payload)
        rows.append(payload)

    bases = []
    options = []
    for payload in rows:
        bases.extend(client.base_list(payload))
        options.extend(client.option_list(payload))
    return bases, options


def collect_all(raw_root: Path, max_pages: int = 0):
    cfg = load()
    client = FinlifeClient(cfg.api_key)

    all_bases: list[dict] = []
    all_options: list[dict] = []
    for group_no, group_name in cfg.groups.items():
        slug = "bank" if group_name == "은행" else "savings-bank"
        out_dir = raw_root / slug
        bases, options = collect_group(client, group_no, out_dir, max_pages=max_pages)
        all_bases.extend(bases)
        all_options.extend(options)

    return all_bases, all_options
