# 키움 REST API - Short Lending (대차거래)

## 국내주식 > 대차거래

### ka10068 - 대차거래추이요청

**Method**: POST
**URL**: `/api/dostk/slb`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10068 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `strt_dt` | 시작일자 | String | Y | 8 | YYYYMMDD |
| `end_dt` | 종료일자 | String | Y | 8 | YYYYMMDD |
| `all_tp` | 전체구분 | String | Y | 1 | 1:전체표시 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `dbrt_trde_trnsn` | 대차거래추이 | LIST | N | | |
| `- dt` | 일자 | String | N | 8 | YYYYMMDD |
| `- dbrt_trde_cntrcnt` | 대차거래체결수량 | String | N | 20 | |
| `- dbrt_trde_rpy` | 대차거래상환 | String | N | 20 | |
| `- dbrt_trde_irds` | 대차거래증감 | String | N | 20 | |
| `- rmnd` | 잔고 | String | N | 20 | |
| `- remn_amt` | 잔고금액 | String | N | 20 | |

**Request Example**:
```json
{
    "strt_dt": "20250401",
    "end_dt": "20250430",
    "all_tp": "1"
}
```

---

### ka10069 - 대차거래상위10종목요청

**Method**: POST
**URL**: `/api/dostk/slb`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10069 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `strt_dt` | 시작일자 | String | Y | 8 | YYYYMMDD |
| `end_dt` | 종료일자 | String | Y | 8 | YYYYMMDD |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 001:코스피, 101:코스닥 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `dbrt_trde_cntrcnt_sum` | 체결수량합계 | String | N | 20 | |
| `dbrt_trde_rpy_sum` | 상환합계 | String | N | 20 | |
| `rmnd_sum` | 잔고합계 | String | N | 20 | |
| `remn_amt_sum` | 잔고금액합계 | String | N | 20 | |
| `dbrt_trde_cntrcnt_rt` | 체결수량비율 | String | N | 20 | |
| `dbrt_trde_rpy_rt` | 상환비율 | String | N | 20 | |
| `rmnd_rt` | 잔고비율 | String | N | 20 | |
| `remn_amt_rt` | 잔고금액비율 | String | N | 20 | |
| `dbrt_trde_upper_10stk` | 대차거래상위10종목 | LIST | N | | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- dbrt_trde_cntrcnt` | 체결수량 | String | N | 20 | |
| `- dbrt_trde_rpy` | 상환 | String | N | 20 | |
| `- rmnd` | 잔고 | String | N | 20 | |
| `- remn_amt` | 잔고금액 | String | N | 20 | |

**Request Example**:
```json
{
    "strt_dt": "20241110",
    "end_dt": "20241125",
    "mrkt_tp": "001"
}
```

---
