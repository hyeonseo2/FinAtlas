# finatlas

적금 비교의 현실성 MVP(적금 전용).

- 목표: `최고금리`가 아니라 **"실제로 받을 확률을 반영한 현실금리(추정치)"** 비교

## 현재 범위 (v0.2)
- 적금 상품 목록 비교(상품 + 기간 옵션 단위)
- 권역/은행/기간/금리/난이도/우대조건 카테고리 필터
- 난이도 점수/등급 + 우대조건 원문 기반 근거 출력
- 월 납입 기준 예상 이자(세전) 및 만기 예상액
- 상세 화면에서 기간별 옵션 비교 차트(간단 막대)

## 기술 스택
- Python (requests)
- React + TypeScript + Vite

## 실행 (현재 경로: `/home/g0525yhs/finatlas`)

### 1) 파이프라인 실행
```bash
cd /home/g0525yhs/finatlas
export FINLIFE_API_KEY=...
python scripts/run_pipeline.py
```

### 2) 프론트 실행
```bash
cd /home/g0525yhs/finatlas/frontend
npm install
npm run dev
```

### 3) 테스트
```bash
cd /home/g0525yhs/finatlas
pytest -q
```

## 산출물
- `data/normalized/products.json`
- `data/normalized/product_options.json`
- `data/normalized/bonus_conditions.json`
- `data/derived/ranked_options_100000.json`
- `data/derived/ranked_options_300000.json`
- `data/derived/ranked_options_500000.json`
- `data/derived/metadata.json`
- `frontend/public/data/{products,product_options,bonus_conditions,options_*.json,metadata.json}`

## 자동화
`.github/workflows/update-data.yml`
- 새벽(UTC 20:00) 배치 실행 + 수동 실행
