# 키움 REST API - Chart (차트)

## 국내주식 > 차트

### ka10081 - 주식일봉차트조회요청

**Method**: POST
**URL**: `/api/dostk/chart`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10081 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 next-key값 세팅 |
| `stk_cd` | 종목코드 | String | Y | 20 | 거래소별 종목코드 (KRX:039490, NXT:039490_NX, SOR:039490_AL) |
| `base_dt` | 기준일자 | String | Y | 8 | YYYYMMDD |
| `upd_stkpc_tp` | 수정주가구분 | String | Y | 1 | 0 or 1 (1: 수정주가 적용) |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `stk_cd` | 종목코드 | String | N | 6 | |
| `stk_dt_pole_chart_qry` | 주식일봉차트조회 | LIST | N | | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- trde_qty` | 거래량 | String | N | 20 | |
| `- trde_prica` | 거래대금 | String | N | 20 | |
| `- dt` | 일자 | String | N | 20 | YYYYMMDD |
| `- open_pric` | 시가 | String | N | 20 | |
| `- high_pric` | 고가 | String | N | 20 | |
| `- low_pric` | 저가 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | 현재가 - 전일종가 |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | 1:상한가, 2:상승, 3:보합, 4:하한가, 5:하락 |
| `- trde_tern_rt` | 거래회전율 | String | N | 20 | |

**특징**:
- 1회 호출로 **600건** 반환 (약 2.5년)
- **연속조회 지원** (cont-yn=Y, next-key) — 전체 상장 이력 조회 가능
- `base_dt` 기준으로 과거 방향 조회
- 1년치(~245거래일)는 1회 호출로 충분

**Request Example**:
```json
{
    "stk_cd": "005930",
    "base_dt": "20260405",
    "upd_stkpc_tp": "1"
}
```

**Response Example**:
```json
{
    "stk_cd": "005930",
    "stk_dt_pole_chart_qry": [
        {
            "cur_prc": "70100",
            "trde_qty": "9263135",
            "trde_prica": "648525",
            "dt": "20250908",
            "open_pric": "69800",
            "high_pric": "70500",
            "low_pric": "69600",
            "pred_pre": "+600",
            "pred_pre_sig": "2",
            "trde_tern_rt": "+0.16"
        }
    ],
    "return_code": 0,
    "return_msg": "정상적으로 처리되었습니다"
}
```

---
