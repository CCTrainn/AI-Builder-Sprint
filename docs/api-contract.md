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

## 3. 근로자료 비교

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
          "value": 10500,
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
          "source_url": "https://www.law.go.kr/"
        }
      }
    ]
  },
  "error": null
}
```

`status` 허용값:

```text
same
different
missing
needs_confirmation
```

## 4. 확인 문장 생성

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

## 5. 고용주 답변 분석

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

