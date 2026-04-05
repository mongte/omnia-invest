# 키움 REST API - Ranking

## 국내주식 > 순위정보

### ka10020 - 호가잔량상위요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10020 |
| `authorization` | 접근토큰 | String | Y | 1000 | 토큰 지정시 토큰타입("Bearer") 붙혀서 호출 예) Bearer Egicyx... |
| `cont-yn` | 연속조회여부 | String | N | 1 | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 응답 Header의 연속조회여부값이 Y일 경우 다음데이터 요청시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 001:코스피, 101:코스닥 |
| `sort_tp` | 정렬구분 | String | Y | 1 | 1:순매수잔량순, 2:순매도잔량순, 3:매수비울순, 4:매도비율순 |
| `trde_qty_tp` | 거래량구분 | String | Y | 4 | 0000:장시작전(0주이상), 0010:만주이상, 0050:5만주이상, 00100:10만주이상 |
| `stk_cnd` | 종목조건 | String | Y | 1 | 0:전체조회, 1:관리종목제외, 5:증100제외, 6:증100만보기, 7:증40만보기, 8:증30만보기, 9:증20만보기 |
| `crd_cnd` | 신용조건 | String | Y | 1 | 0:전체조회, 1:신용융자A군, 2:신용융자B군, 3:신용융자C군, 4:신용융자D군, 7:신용융자E군, 9:신용융자전체 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `bid_req_upper` | 호가잔량상위 | LIST | N | | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- trde_qty` | 거래량 | String | N | 20 | |
| `- tot_sel_req` | 총매도잔량 | String | N | 20 | |
| `- tot_buy_req` | 총매수잔량 | String | N | 20 | |
| `- netprps_req` | 순매수잔량 | String | N | 20 | |
| `- buy_rt` | 매수비율 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "001",
    "sort_tp": "1",
    "trde_qty_tp": "0000",
    "stk_cnd": "0",
    "crd_cnd": "0",
    "stex_tp": "1"
}
```

---

### ka10021 - 호가잔량급증요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10021 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 001:코스피, 101:코스닥 |
| `trde_tp` | 매매구분 | String | Y | 1 | 1:매수잔량, 2:매도잔량 |
| `sort_tp` | 정렬구분 | String | Y | 1 | 1:급증량, 2:급증률 |
| `tm_tp` | 시간구분 | String | Y | 2 | 분 입력 |
| `trde_qty_tp` | 거래량구분 | String | Y | 4 | 1:천주이상, 5:5천주이상, 10:만주이상, 50:5만주이상, 100:10만주이상 |
| `stk_cnd` | 종목조건 | String | Y | 1 | 0:전체조회, 1:관리종목제외, 5:증100제외, 6:증100만보기, 7:증40만보기, 8:증30만보기, 9:증20만보기 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `bid_req_sdnin` | 호가잔량급증 | LIST | N | | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- int` | 기준률 | String | N | 20 | |
| `- now` | 현재 | String | N | 20 | |
| `- sdnin_qty` | 급증수량 | String | N | 20 | |
| `- sdnin_rt` | 급증률 | String | N | 20 | |
| `- tot_buy_qty` | 총매수량 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "001",
    "trde_tp": "1",
    "sort_tp": "1",
    "tm_tp": "30",
    "trde_qty_tp": "1",
    "stk_cnd": "0",
    "stex_tp": "3"
}
```

---

### ka10022 - 잔량율급증요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10022 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 001:코스피, 101:코스닥 |
| `rt_tp` | 비율구분 | String | Y | 1 | 1:매수/매도비율, 2:매도/매수비율 |
| `tm_tp` | 시간구분 | String | Y | 2 | 분 입력 |
| `trde_qty_tp` | 거래량구분 | String | Y | 1 | 5:5천주이상, 10:만주이상, 50:5만주이상, 100:10만주이상 |
| `stk_cnd` | 종목조건 | String | Y | 1 | 0:전체조회, 1:관리종목제외, 5:증100제외, 6:증100만보기, 7:증40만보기, 8:증30만보기, 9:증20만보기 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `req_rt_sdnin` | 잔량율급증 | LIST | N | | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- int` | 기준률 | String | N | 20 | |
| `- now_rt` | 현재비율 | String | N | 20 | |
| `- sdnin_rt` | 급증률 | String | N | 20 | |
| `- tot_sel_req` | 총매도잔량 | String | N | 20 | |
| `- tot_buy_req` | 총매수잔량 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "001",
    "rt_tp": "1",
    "tm_tp": "1",
    "trde_qty_tp": "5",
    "stk_cnd": "0",
    "stex_tp": "3"
}
```

---

### ka10023 - 거래량급증요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10023 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 000:전체, 001:코스피, 101:코스닥 |
| `sort_tp` | 정렬구분 | String | Y | 1 | 1:급증량, 2:급증률, 3:급감량, 4:급감률 |
| `tm_tp` | 시간구분 | String | Y | 1 | 1:분, 2:전일 |
| `trde_qty_tp` | 거래량구분 | String | Y | 1 | 5:5천주이상, 10:만주이상, 50:5만주이상, 100:10만주이상, 200:20만주이상, 300:30만주이상, 500:50만주이상, 1000:백만주이상 |
| `tm` | 시간 | String | N | 2 | 분 입력 |
| `stk_cnd` | 종목조건 | String | Y | 1 | 0:전체조회, 1:관리종목제외, 3:우선주제외, 4:관리종목+우선주제외, 5:증100제외, 6:증100만보기, 7:증40만보기, 8:증30만보기, 9:증20만보기, 11:정리매매종목제외, 12:증50만보기, 13:증60만보기, 14:ETF제외, 17:ETN제외, 18:ETF+ETN제외, 15:스팩제외, 20:ETF+ETN+스팩제외 |
| `pric_tp` | 가격구분 | String | Y | 1 | 0:전체조회, 2:5만원이상, 5:1만원이상, 6:5천원이상, 8:1천원이상, 9:10만원이상 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `trde_qty_sdnin` | 거래량급증 | LIST | N | | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- flu_rt` | 등락률 | String | N | 20 | |
| `- prev_trde_qty` | 이전거래량 | String | N | 20 | |
| `- now_trde_qty` | 현재거래량 | String | N | 20 | |
| `- sdnin_qty` | 급증량 | String | N | 20 | |
| `- sdnin_rt` | 급증률 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "000",
    "sort_tp": "1",
    "tm_tp": "2",
    "trde_qty_tp": "5",
    "tm": "",
    "stk_cnd": "0",
    "pric_tp": "0",
    "stex_tp": "3"
}
```

---

### ka10027 - 전일대비등락률상위요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10027 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 000:전체, 001:코스피, 101:코스닥 |
| `sort_tp` | 정렬구분 | String | Y | 1 | 1:상승률, 2:상승폭, 3:하락률, 4:하락폭, 5:보합 |
| `trde_qty_cnd` | 거래량조건 | String | Y | 5 | 0000:전체조회, 0010:만주이상, 0050:5만주이상, 0100:10만주이상, 0150:15만주이상, 0200:20만주이상, 0300:30만주이상, 0500:50만주이상, 1000:백만주이상 |
| `stk_cnd` | 종목조건 | String | Y | 2 | 0:전체조회, 1:관리종목제외, 3:우선주제외, 4:우선주+관리주제외, 5:증100제외, 6:증100만보기, 7:증40만보기, 8:증30만보기, 9:증20만보기, 11:정리매매종목제외, 12:증50만보기, 13:증60만보기, 14:ETF제외, 15:스팩제외, 16:ETF+ETN제외 |
| `crd_cnd` | 신용조건 | String | Y | 1 | 0:전체조회, 1:신용융자A군, 2:신용융자B군, 3:신용융자C군, 4:신용융자D군, 7:신용융자E군, 9:신용융자전체 |
| `updown_incls` | 상하한포함 | String | Y | 1 | 0:불 포함, 1:포함 |
| `pric_cnd` | 가격조건 | String | Y | 2 | 0:전체조회, 1:1천원미만, 2:1천원~2천원, 3:2천원~5천원, 4:5천원~1만원, 5:1만원이상, 8:1천원이상, 10:1만원미만 |
| `trde_prica_cnd` | 거래대금조건 | String | Y | 4 | 0:전체조회, 3:3천만원이상, 5:5천만원이상, 10:1억원이상, 30:3억원이상, 50:5억원이상, 100:10억원이상, 300:30억원이상, 500:50억원이상, 1000:100억원이상, 3000:300억원이상, 5000:500억원이상 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `pred_pre_flu_rt_upper` | 전일대비등락률상위 | LIST | N | | |
| `- stk_cls` | 종목분류 | String | N | 20 | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- flu_rt` | 등락률 | String | N | 20 | |
| `- sel_req` | 매도잔량 | String | N | 20 | |
| `- buy_req` | 매수잔량 | String | N | 20 | |
| `- now_trde_qty` | 현재거래량 | String | N | 20 | |
| `- cntr_str` | 체결강도 | String | N | 20 | |
| `- cnt` | 횟수 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "000",
    "sort_tp": "1",
    "trde_qty_cnd": "0000",
    "stk_cnd": "0",
    "crd_cnd": "0",
    "updown_incls": "1",
    "pric_cnd": "0",
    "trde_prica_cnd": "0",
    "stex_tp": "3"
}
```

---

### ka10032 - 거래대금상위요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka10032 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 000:전체, 001:코스피, 101:코스닥 |
| `mang_stk_incls` | 관리종목포함 | String | Y | 1 | 0:관리종목 미포함, 1:관리종목 포함 |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `trde_prica_upper` | 거래대금상위 | LIST | N | | |
| `- stk_cd` | 종목코드 | String | N | 20 | |
| `- now_rank` | 현재순위 | String | N | 20 | |
| `- pred_rank` | 전일순위 | String | N | 20 | |
| `- stk_nm` | 종목명 | String | N | 40 | |
| `- cur_prc` | 현재가 | String | N | 20 | |
| `- pred_pre_sig` | 전일대비기호 | String | N | 20 | |
| `- pred_pre` | 전일대비 | String | N | 20 | |
| `- flu_rt` | 등락률 | String | N | 20 | |
| `- sel_bid` | 매도호가 | String | N | 20 | |
| `- buy_bid` | 매수호가 | String | N | 20 | |
| `- now_trde_qty` | 현재거래량 | String | N | 20 | |
| `- pred_trde_qty` | 전일거래량 | String | N | 20 | |
| `- trde_prica` | 거래대금 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "001",
    "mang_stk_incls": "1",
    "stex_tp": "3"
}
```

---

### ka90009 - 외국인기관매매상위요청

**Method**: POST
**URL**: `/api/dostk/rkinfo`
**운영 도메인**: https://api.kiwoom.com
**모의투자**: https://mockapi.kiwoom.com(KRX만 지원가능)
**Content-Type**: application/json;charset=UTF-8

**개요**: 영4 [0785] 외국인기관매매 화면의 내용을 API로 제공합니다.

**Request**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | ka90009 |
| `authorization` | 접근토큰 | String | Y | 1000 | Bearer {token} |
| `cont-yn` | 연속조회여부 | String | N | 1 | 연속조회 시 응답 Header의 cont-yn값 세팅 |
| `next-key` | 연속조회키 | String | N | 50 | 연속조회 시 응답 Header의 next-key값 세팅 |
| `mrkt_tp` | 시장구분 | String | Y | 3 | 000:전체, 001:코스피, 101:코스닥 |
| `amt_qty_tp` | 금액수량구분 | String | Y | 1 | 1:금액(천만), 2:수량(천주) |
| `qry_dt_tp` | 조회일자구분 | String | Y | 1 | 0:조회일자 미포함, 1:조회일자 포함 |
| `date` | 날짜 | String | N | 8 | YYYYMMDD (연도4자리, 월 2자리, 일 2자리 형식) |
| `stex_tp` | 거래소구분 | String | Y | 1 | 1:KRX, 2:NXT 3.통합 |

**Response**:

| 필드 | 한글명 | type | Required | length | desc |
|------|--------|------|----------|--------|------|
| `api-id` | TR명 | String | Y | 10 | |
| `cont-yn` | 연속조회여부 | String | N | 1 | 다음 데이터가 있을시 Y값 전달 |
| `next-key` | 연속조회키 | String | N | 50 | 다음 데이터가 있을시 다음 키값 전달 |
| `frgnr_orgn_trde_upper` | 외국인기관매매상위 | LIST | N | | |
| `- for_netslmt_stk_cd` | 외인순매도종목코드 | String | N | 20 | |
| `- for_netslmt_stk_nm` | 외인순매도종목명 | String | N | 20 | |
| `- for_netslmt_amt` | 외인순매도금액 | String | N | 20 | |
| `- for_netslmt_qty` | 외인순매도수량 | String | N | 20 | |
| `- for_netprps_stk_cd` | 외인순매수종목코드 | String | N | 20 | |
| `- for_netprps_stk_nm` | 외인순매수종목명 | String | N | 20 | |
| `- for_netprps_amt` | 외인순매수금액 | String | N | 20 | |
| `- for_netprps_qty` | 외인순매수수량 | String | N | 20 | |
| `- orgn_netslmt_stk_cd` | 기관순매도종목코드 | String | N | 20 | |
| `- orgn_netslmt_stk_nm` | 기관순매도종목명 | String | N | 20 | |
| `- orgn_netslmt_amt` | 기관순매도금액 | String | N | 20 | |
| `- orgn_netslmt_qty` | 기관순매도수량 | String | N | 20 | |
| `- orgn_netprps_stk_cd` | 기관순매수종목코드 | String | N | 20 | |
| `- orgn_netprps_stk_nm` | 기관순매수종목명 | String | N | 20 | |
| `- orgn_netprps_amt` | 기관순매수금액 | String | N | 20 | |
| `- orgn_netprps_qty` | 기관순매수수량 | String | N | 20 | |

**Request Example**:
```json
{
    "mrkt_tp": "000",
    "amt_qty_tp": "1",
    "qry_dt_tp": "1",
    "date": "20241101",
    "stex_tp": "1"
}
```

---
