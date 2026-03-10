from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Config:
    api_key: str
    groups: dict[str, str]
    output_root: Path = Path(__file__).resolve().parent.parent / "data"


def load() -> Config:
    import os

    api_key = os.getenv("FINLIFE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("FINLIFE_API_KEY 환경변수가 필요합니다.")

    # 금융감독원 API 권역 코드: 은행/저축은행
    groups = {
        "020000": "은행",
        "030300": "저축은행",
    }
    return Config(api_key=api_key, groups=groups)
