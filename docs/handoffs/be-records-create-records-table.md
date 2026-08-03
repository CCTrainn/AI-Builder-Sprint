# 변경 요청

- 상태: 완료
- 요청 역할: ROLE-BE-RECORDS
- 변경할 공통 영역: Supabase PostgreSQL `public.records`
- 필요한 이유: 업로드한 원본 파일의 Storage 경로와 처리 상태를 저장해야 함
- 연결되는 API: `POST /api/v1/records/upload`, `GET /api/v1/records/{record_id}`
- 확인 방법: 업로드 성공 후 `records` 테이블에 같은 `record_id`가 생성되는지 확인

## Supabase SQL Editor에서 실행할 SQL

```sql
create table if not exists public.records (
  id text primary key,
  workplace_id text not null,
  record_type text not null check (
    record_type in (
      'job_posting',
      'employment_contract',
      'employer_message',
      'verbal_memo',
      'work_schedule',
      'attendance',
      'payslip',
      'bank_deposit',
      'workplace_notice',
      'other'
    )
  ),
  storage_path text not null unique,
  original_file_name text not null,
  original_text text,
  recorded_at date not null,
  processing_status text not null default 'uploaded' check (
    processing_status in ('uploaded', 'processing', 'completed', 'failed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists records_workplace_id_idx
  on public.records (workplace_id);

alter table public.records enable row level security;
```

현재 업로드는 FastAPI 백엔드의 service role key로만 수행하므로 익명 사용자용
INSERT 또는 SELECT 정책을 만들지 않는다. service role key는 프론트엔드에
노출하거나 Git에 커밋하지 않는다.

## 처리 결과

- Supabase `public.records` 생성 완료
- 필수 열 PostgREST 조회 HTTP 200 확인
- 실제 데모 PDF 업로드 성공
- DB 행과 private Storage 객체 경로 일치 확인
