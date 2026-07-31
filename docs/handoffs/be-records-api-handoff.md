# 기록·비교 백엔드 API 인계

## 현재 완성된 흐름

```text
파일 업로드
→ private Storage 저장
→ Upstage OCR
→ 문서 유형별 조건 추출
→ records 및 extracted_conditions 저장
→ 사업장 기록 목록
→ 약속·계약·실제 기록 비교
→ 관련 공식 법령 조회
→ comparisons 저장
→ comparison_id로 상세 조회
```

## 프론트 기록·비교 담당 연결

### 홈과 근로 기록함

```http
GET /api/v1/records?workplace_id={workplace_id}
```

사용 필드:

- `total`: 업로드된 자료 수
- `records[].record_type`: 자료 종류
- `records[].processing_status`: OCR 처리 상태
- `records[].condition_count`: 읽어낸 조건 수
- `records[].recorded_at`: 타임라인 날짜

### 기록 추가하기

```http
POST /api/v1/records/upload
```

업로드 응답은 `uploaded`다. 이후 목록 또는 상세 조회를 다시 호출해
`processing → completed` 상태 변화를 표시한다.

### 기록 상세

```http
GET /api/v1/records/{record_id}
```

`original_text` 전체를 기본 화면에 그대로 노출하기보다 `conditions`를 먼저 보여준다.
원문은 사용자가 펼쳤을 때만 표시하는 것을 권장한다.

### 기록 삭제

```http
DELETE /api/v1/records/{record_id}
```

삭제 전 확인창을 표시한다. 성공 후 기록 목록과 비교 결과를 다시 불러온다.

### 기록 비교하기

```http
POST /api/v1/workplaces/{workplace_id}/compare
```

화면 표현:

- `same`: 기록이 같음
- `different`: 기록이 다름
- `missing`: 비교할 자료가 더 필요함
- `needs_confirmation`: 값 확인이 필요함

`불법`, `거짓말`로 바꾸어 표시하지 않는다.

## 백엔드 확인 대화 담당 연결

확인 문장 생성 요청을 받으면 먼저 다음 API를 호출한다.

```http
GET /api/v1/comparisons/{comparison_id}
```

응답에서 사용:

- `condition`: 질문할 조건
- `promised`, `contracted`, `actual`: 기록별 값과 원본 기록 ID
- `summary`: 사용자에게 보여줄 쉬운 설명
- `confirmation_items`: 고용주에게 확인할 항목
- `legal_reference`: 공식 법령명, 조문 본문, 출처 링크

LLM에는 원본 문서 전체보다 이 구조화된 값을 우선 전달한다. 필요한 경우에만
각 `record_id`의 기록 상세를 추가 조회한다.

## 데모 시나리오

```text
workplace_id: demo-e2e
계약서 적용 시급: 12,000원
임금명세서 적용 시급: 10,500원
비교 상태: different
공식 근거: 최저임금법 제6조
```

이 데모는 위법을 확정하는 시나리오가 아니다. 계약서와 실제 급여 기록의 값이
다르므로 계산 기준과 수습기간 적용 근거를 확인하도록 돕는 시나리오다.

## 오류 코드

- `INVALID_WORKPLACE_ID`: 사업장 ID 형식 오류
- `RECORD_LIST_FAILED`: 기록 목록 조회 실패
- `RECORD_NOT_FOUND`: 기록 없음
- `COMPARISON_LOOKUP_FAILED`: 비교 조회 실패
- `COMPARISON_SAVE_FAILED`: 비교 저장 실패
- `COMPARISON_NOT_FOUND`: comparison_id 없음

모든 오류는 공통 응답의 `error.code`와 `error.message`를 사용한다.
