# FinAtlas

[🔗 FinAtlas - 금융 상품(예적금) 비교 분석 서비스](https://hyeonseo2.github.io/FinAtlas/)

**복잡한 금융상품 우대조건을 구조화하여
“실제로 받을 가능성이 높은 금리” 기준으로 비교하는 금융상품 분석 서비스**

![finatlas\_main.png](./docs/finatlas_main.png)


---

## Background

대부분의 금융상품 비교 서비스는 **최고금리 기준으로 상품을 비교**합니다.
하지만 실제 금융상품은 기본금리와 여러 **우대조건(급여이체, 카드실적 등)을** 충족해야 최고금리가 적용되는 구조입니다.

이 때문에 많은 경우 **공시된 최고금리를 실제로 받기 어렵습니다.**
따라서 금융상품 비교에서는 **현실적으로 달성 가능한 금리 기준의 비교**가 필요합니다.

---

## Solution

FinAtlas는 금융상품을 다음 기준으로 분석합니다.

* 기본금리
* 최고금리
* **현실금리 (Realistic Rate)**
* 우대조건 난이도
* 예상 수익

이를 통해 사용자가 **실제로 받을 가능성이 높은 금리 기준으로 상품을 비교**할 수 있도록 합니다.

---

# 핵심 기능

**금융상품 비교**

* 기본금리 / 최고금리 / 현실금리 기준 상품 비교
* 우대조건 난이도 및 가입기간 확인

**수익 계산**

* 납입금 기준 예상 이자 및 만기 예상 금액 계산
* 예금(일시납입) / 적금(월납입) 방식 구분 계산

**우대조건 분석**

* 우대조건을 해석 가능한 조건과 추가 확인 필요 조건으로 구분
* 조건 난이도를 직관적으로 확인 가능

**상품 비교 모드**

* 최대 4개 상품 동시 비교
* 현실금리, 난이도, 예상이자, 만기예상액 비교


---

# 데이터 출처

금융감독원 **금융상품통합비교공시 Open API**

---

# 기술 스택

Backend

* Python
* requests

Frontend

* React
* TypeScript
* Vite

---

# 실행

### 데이터 파이프라인

```bash
export FINLIFE_API_KEY=YOUR_API_KEY

python scripts/run_pipeline.py
```

---

### 프론트엔드

```bash
cd frontend

npm install
npm run dev
```

개발 서버

```
http://localhost:5173
```

---

### 테스트

```bash
pytest -q
```

---

# 배포

GitHub Actions

* `update-data.yml` : 금융상품 데이터 갱신
* `pages.yml` : GitHub Pages 정적 배포


