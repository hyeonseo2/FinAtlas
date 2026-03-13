from __future__ import annotations

import requests


class FinlifeError(RuntimeError):
    pass


class FinlifeClient:
    BASE_URL_SAVING = "https://finlife.fss.or.kr/finlifeapi/savingProductsSearch.json"
    BASE_URL_DEPOSIT = "https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json"

    def __init__(self, auth_key: str):
        self.auth_key = auth_key

    def request_page(self, top_fin_grp_no: str, page_no: int, product_type: str = "saving") -> dict:
        base_url = self.BASE_URL_DEPOSIT if product_type == "deposit" else self.BASE_URL_SAVING
        params = {
            "auth": self.auth_key,
            "topFinGrpNo": top_fin_grp_no,
            "pageNo": str(page_no),
        }
        r = requests.get(base_url, params=params, timeout=20)
        if r.status_code >= 400:
            raise FinlifeError(f"HTTP {r.status_code}: {r.text[:200]}")

        payload = r.json()
        err_cd = payload.get("result", {}).get("err_cd")
        if err_cd not in (None, "000", "0"):
            raise FinlifeError(f"API err_cd={err_cd}: {payload.get('result', {}).get('err_msg')}")
        return payload

    @staticmethod
    def get_max_page(payload: dict) -> int:
        return int(payload.get("result", {}).get("max_page_no") or 0)

    @staticmethod
    def get_total_count(payload: dict) -> int:
        return int(payload.get("result", {}).get("total_count") or 0)

    @staticmethod
    def base_list(payload: dict) -> list[dict]:
        return payload.get("result", {}).get("baseList", []) or []

    @staticmethod
    def option_list(payload: dict) -> list[dict]:
        return payload.get("result", {}).get("optionList", []) or []
