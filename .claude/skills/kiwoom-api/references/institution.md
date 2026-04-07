# 키움 REST API - Institution

## 국내주식 > 기관/외국인

### ka10059 - 종목별투자자기관별요청

**Method**: POST
**URL**: `/api/dostk/stkinfo`
**api-id**: `ka10059`
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)

**개요**: 특정 종목의 일자별 투자자 유형별(개인/외국인/기관계/금융투자/보험/투신/은행/연기금/사모/국가 등) 순매수 금액 반환. `invsr_tp` 없이 **전체 투자자 유형을 한번에 반환**하므로 종목당 1회 호출로 충분.

**Request**:

| 필드 | 한글명 | 필수 | 설명 |
|------|--------|------|------|
| `dt` | 일자 | Y | YYYYMMDD |
| `stk_cd` | 종목코드 | Y | 거래소별 종목코드 |
| `amt_qty_tp` | 금액수량구분 | Y | 1:금액, 2:수량 |
| `trde_tp` | 매매구분 | Y | 0:순매수, 1:매수, 2:매도 |
| `unit_tp` | 단위구분 | Y | 1000:천주, 1:단주 |

**Request Example**:
```json
{
    "dt": "20241107",
    "stk_cd": "005930",
    "amt_qty_tp": "1",
    "trde_tp": "0",
    "unit_tp": "1000"
}
```

**Response Body** (`stk_invsr_orgn[]`):

| 필드 | 한글명 | 예시 |
|------|--------|------|
| `dt` | 일자 | "20241107" |
| `cur_prc` | 현재가 | "+61300" |
| `flu_rt` | 등락율 | "+698" |
| `acc_trde_qty` | 누적거래량 | "1105968" |
| `ind_invsr` | 개인투자자 | "1584" |
| `frgnr_invsr` | 외국인투자자 | "-61779" |
| `orgn` | 기관계 | "60195" |
| `fnnc_invt` | 금융투자 | "25514" |
| `insrnc` | 보험 | "0" |
| `invtrt` | 투신 | "0" |
| `etc_fnnc` | 기타금융 | "34619" |
| `bank` | 은행 | "4" |
| `penfnd_etc` | 연기금등 | "-1" |
| `samo_fund` | 사모펀드 | "58" |
| `natn` | 국가 | "0" |
| `etc_corp` | 기타법인 | "0" |
| `natfor` | 내외국인 | "1" |

**Response Example**:
```json
{
    "stk_invsr_orgn": [
        {
            "dt": "20241107",
            "cur_prc": "+61300",
            "ind_invsr": "1584",
            "frgnr_invsr": "-61779",
            "orgn": "60195",
            "fnnc_invt": "25514",
            "insrnc": "0",
            "invtrt": "0",
            "etc_fnnc": "34619",
            "bank": "4",
            "penfnd_etc": "-1",
            "samo_fund": "58",
            "natn": "0",
            "etc_corp": "0",
            "natfor": "1"
        }
    ],
    "return_code": 0,
    "return_msg": "정상적으로 처리되었습니다"
}
```

**사용 용도**: 기관관심 점수 산출 — 기관(orgn)/외국인(frgnr_invsr)/연기금(penfnd_etc) 순매수 추세 스코어링

---

### ka10008 - 주식외국인종목별매매동향

**Method**: POST
**URL**: `/api/dostk/frgnistt`
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)

**Request Headers**:

| 필드 | 한글명 | 필수 | 설명 |
|------|--------|------|------|
| `authorization` | 접근토큰 | Y | 토큰 지정시 토큰타입("Bearer") 붙혀서 호출   예) Bearer Egicyx... |
| `cont-yn` | 연속조회여부 | N | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 con |
| `next-key` | 연속조회키 | N | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 nex |

**Response Body** (주요 필드):

| 필드 | 한글명 | 설명 |
|------|--------|------|
| `- dt` | 일자 |  |
| `- close_pric` | 종가 |  |
| `- pred_pre` | 전일대비 |  |
| `- trde_qty` | 거래량 |  |
| `- chg_qty` | 변동수량 |  |
| `- poss_stkcnt` | 보유주식수 |  |
| `- wght` | 비중 |  |
| `- gain_pos_stkcnt` | 취득가능주식수 |  |
| `- frgnr_limit` | 외국인한도 |  |
| `- frgnr_limit_irds` | 외국인한도증감 |  |
| `- limit_exh_rt` | 한도소진률 |  |

**Request Example**:
```json
{
    "stk_cd": "005930"
}
```

---

### ka10009 - 주식기관요청

**Method**: POST
**URL**: `/api/dostk/frgnistt`
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)

**Request Headers**:

| 필드 | 한글명 | 필수 | 설명 |
|------|--------|------|------|
| `authorization` | 접근토큰 | Y | 토큰 지정시 토큰타입("Bearer") 붙혀서 호출   예) Bearer Egicyx... |
| `cont-yn` | 연속조회여부 | N | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 con |
| `next-key` | 연속조회키 | N | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 nex |

**Response Body** (주요 필드):

| 필드 | 한글명 | 설명 |
|------|--------|------|
| `close_pric` | 종가 |  |
| `pre` | 대비 |  |
| `orgn_dt_acc` | 기관기간누적 |  |
| `orgn_daly_nettrde` | 기관일별순매매 |  |
| `frgnr_daly_nettrde` | 외국인일별순매매 |  |
| `frgnr_qota_rt` | 외국인지분율 |  |

**Request Example**:
```json
{
    "stk_cd": "005930"
}
```

---
