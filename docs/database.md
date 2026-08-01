# DB 및 Storage 구조

## 원칙

- 원본 파일은 Supabase Storage에 저장한다.
- DB에는 파일 위치와 추출된 정보만 저장한다.
- 사용자 원본 bucket은 private으로 설정한다.

## Storage 경로

```text
work-records/
  {user_id}/
    {workplace_id}/
      {record_id}/
        original.pdf
```

## 테이블

### workplaces

```text
id
user_id
display_name
job_type
started_at
created_at
```

### records

```text
id
workplace_id
record_type
storage_path
original_file_name
original_text
recorded_at
processing_status
created_at
```

`record_type`:

```text
job_posting
employment_contract
employer_message
verbal_memo
work_schedule
attendance
payslip
bank_deposit
workplace_notice
other
```

### extracted_conditions

```text
id
record_id
condition_type
value_text
value_number
unit
confidence
source_text
```

### comparisons

```text
id
workplace_id
condition_type
promised_record_id
contracted_record_id
actual_record_id
status
summary
created_at
```

### conversations

```text
id
workplace_id
comparison_id
status
created_at
```

### messages

```text
id
conversation_id
sender
original_text
translated_text
analysis_json
created_at
```

### legal_references

```text
id
topic
law_name
article_number
article_text
source_url
fetched_at
```

법령 API 응답은 `legal_references`에 캐시한다. 데모 중 외부 API가 실패하면
최근 캐시를 사용한다.

## MVP 비교 조건

```text
hourly_wage
working_hours
pay_date
probation
weekly_holiday_pay
weekly_working_hours
total_working_hours
overtime_hours
break_time
basic_pay
gross_pay
deductions
net_pay
```

은행 입금내역의 `deposit_date`는 비교 시 `pay_date`로, `deposit_amount`는
`net_pay`로 연결한다. 급여명세서 실수령액과 실제 입금액은 같은 비교 결과에 표시한다.
