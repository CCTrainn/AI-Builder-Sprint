# MVP API 계약

기본 prefix: `/api/v1`

모든 응답:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## 1. 근로자료 업로드

`POST /records/upload`

입력: `multipart/form-data`

- `workplace_id`
- `record_type`
- `recorded_at`
- `file`

성공 응답의 `data`:

```json
{
  "record_id": "rec_001",
  "workplace_id": "work_001",
  "record_type": "employment_contract",
  "file_name": "contract.pdf",
  "processing_status": "uploaded"
}
```

## 2. OCR 및 조건 추출 결과

`GET /records/{record_id}`

```json
{
  "success": true,
  "data": {
    "record_id": "rec_001",
    "record_type": "employment_contract",
    "processing_status": "completed",
    "original_text": "시간급 12,000원",
    "conditions": [
      {
        "type": "hourly_wage",
        "value": 12000,
        "unit": "KRW",
        "confidence": 0.96,
        "source_text": "시간급 12,000원"
      }
    ]
  },
  "error": null
}
```

`processing_status` 허용값:

```text
uploaded
processing
completed
failed
```

## 3. 사업장별 근로자료 목록

`GET /records?workplace_id={workplace_id}`

홈의 근로자료 현황과 근로 기록함에서 사용한다. 최신 `recorded_at` 순서로
반환하며 `condition_count`는 해당 자료에서 추출한 조건 개수다.

```json
{
  "success": true,
  "data": {
    "workplace_id": "work_001",
    "total": 2,
    "records": [
      {
        "record_id": "rec_payslip",
        "record_type": "payslip",
        "file_name": "payslip.pdf",
        "recorded_at": "2026-07-30",
        "processing_status": "completed",
        "condition_count": 9,
        "created_at": "2026-07-30T01:25:43+00:00"
      }
    ]
  },
  "error": null
}
```

## 4. 근로자료 삭제

`DELETE /records/{record_id}`

Storage의 원본 파일과 DB 기록, 연결된 추출 조건을 함께 삭제한다.

```json
{
  "success": true,
  "data": {
    "record_id": "rec_001",
    "deleted": true
  },
  "error": null
}
```

## 5. 근로자료 비교

`POST /workplaces/{workplace_id}/compare`

```json
{
  "success": true,
  "data": {
    "workplace_id": "work_001",
    "comparisons": [
      {
        "comparison_id": "cmp_001",
        "condition": "hourly_wage",
        "promised": {
          "value": 12000,
          "record_id": "rec_job"
        },
        "contracted": {
          "value": 12000,
          "record_id": "rec_contract"
        },
        "actual": {
          "value": 10000,
          "recorded_at": "2026-07-30",
          "record_id": "rec_payslip"
        },
        "status": "different",
        "summary": "계약 시급과 급여 계산 시급이 1,500원 다릅니다.",
        "confirmation_items": [
          "수습기간",
          "적용 기간",
          "계산 근거"
        ],
        "legal_reference": {
          "title": "관련 공식 정보",
          "article": null,
          "source_url": "https://www.law.go.kr/",
          "rights_check": {
            "status": "standard_mismatch",
            "rule_code": "minimum_wage_2026",
            "title": "2026년 최저임금 기준과 기록이 다름",
            "explanation": "기록된 시급이 2026년 최저임금보다 낮습니다. 수습 감액 등 적용 조건을 추가로 확인해야 합니다.",
            "basis": ["기록된 시급: 10,000원", "2026년 적용 최저임금: 10,320원"],
            "missing_information": ["계약기간", "수습 여부와 기간", "업무 종류"],
            "calculation": null
          }
        }
      }
    ]
  },
  "error": null
}
```

비교 결과는 DB에 저장된다. 같은 사업장의 같은 `condition`을 다시 비교하면
기존 결과를 갱신하므로 `comparison_id`가 유지된다.

`status` 허용값:

```text
same
different
missing
needs_confirmation
```

`legal_reference.rights_check.status` 허용값:

```text
standard_mismatch
needs_confirmation
insufficient_information
no_mismatch_detected
```

이 값은 Python 규칙이 정한다. LLM은 이를 쉬운 말로 설명하거나 번역할 수 있지만
상태, 수치 기준, 공식 법령 근거를 변경하거나 위법 여부를 확정하지 않는다.

`rights_check.calculation`은 계산 가능한 자료가 있을 때만 반환한다. `expected_amount`는
추출된 시급·근로시간으로 만든 단순 예상액이며 주휴수당, 별도 수당, 공제와 법적 예외가
모두 반영된 최종 급여 확정값이 아니다.

## 6. 비교 결과 상세 조회

`GET /comparisons/{comparison_id}`

확인 대화 백엔드가 추천 문장과 근거를 만들 때 사용한다.

```json
{
  "success": true,
  "data": {
    "workplace_id": "work_001",
    "comparison": {
      "comparison_id": "cmp_001",
      "condition": "hourly_wage",
      "promised": null,
      "contracted": {
        "value": 12000,
        "unit": "KRW",
        "record_id": "rec_contract"
      },
      "actual": {
        "value": 10500,
        "unit": "KRW",
        "record_id": "rec_payslip"
      },
      "status": "different",
      "summary": "시급 조건이 기록 사이에서 다릅니다. 적용 기준을 확인해 보세요.",
      "confirmation_items": [
        "어느 기록의 조건이 현재 적용되는지",
        "조건이 달라진 시점과 이유"
      ],
      "legal_reference": {
        "title": "최저임금법 제6조 (최저임금의 효력)",
        "article": "공식 조문 본문",
        "source_url": "https://www.law.go.kr/",
        "rights_check": {
          "status": "no_mismatch_detected",
          "rule_code": "minimum_wage_2026",
          "title": "최저임금 수치 차이 발견 안 됨",
          "explanation": "기록된 시급은 2026년 최저임금 이상입니다.",
          "basis": ["기록된 시급: 10,500원", "2026년 적용 최저임금: 10,320원"],
          "missing_information": []
        }
      }
    }
  },
  "error": null
}
```

## 7. 확인 문장 생성

`POST /conversations/message`

요청:

```json
{
  "workplace_id": "work_001",
  "comparison_id": "cmp_001",
  "tone": "polite",
  "user_language": "vi"
}
```

응답 `data`:

```json
{
  "message_id": "msg_001",
  "korean_text": "계약서와 급여명세서의 시급이 다른데 계산 근거를 확인해 주실 수 있을까요?",
  "translated_text": "Bản dịch tiếng Việt",
  "basis": [
    "계약서 시급 12,000원",
    "급여명세서 시급 10,500원"
  ]
}
```

`tone` 허용값:

```text
polite
clear
firm
```

## 8. 고용주 답변 분석

`POST /conversations/reply-analysis`

요청:

```json
{
  "comparison_id": "cmp_001",
  "reply_text": "수습기간이라 원래 그렇게 계산해요.",
  "original_language": "ko"
}
```

응답 `data`:

```json
{
  "reply_id": "reply_001",
  "classification": "partly_answered",
  "answered_items": [
    "수습기간을 적용했다는 주장"
  ],
  "unanswered_items": [
    "수습기간의 시작일과 종료일",
    "어디에서 합의했는지",
    "10,500원의 계산 근거",
    "채용공고와 다른 이유"
  ],
  "follow_up_korean": "수습기간의 적용 기간과 계약상 합의된 위치를 확인해 주실 수 있을까요?",
  "translated_follow_up": "Bản dịch tiếng Việt"
}
```

`classification` 허용값:

```text
fully_answered
partly_answered
not_answered
unclear
new_condition
more_evidence_needed
```

## 9. 실제로 보낸 확인 문장 기록

`POST /conversations/sent-message`

말투 선택과 추천 문장 생성만으로는 대화 기록을 만들지 않는다. 사용자가 실제
카카오톡에 보낸 문장을 확인한 뒤 이 API로 명시적으로 기록한다.

```json
{
  "workplace_id": "work_001",
  "comparison_id": "cmp_001",
  "original_text": "계약서와 급여명세서의 시급이 달라 계산 근거를 확인하고 싶습니다.",
  "translated_text": "Bản dịch tiếng Việt",
  "tone": "polite"
}
```

대화 이력은 `comparison_id`별로 분리하지 않고 같은 `workplace_id`의 실제 발송
문장과 고용주 답변을 하나의 시간순 타임라인으로 반환한다. AI 추천 초안과 아직
보내지 않은 후속 문장은 이력에 포함하지 않는다.
