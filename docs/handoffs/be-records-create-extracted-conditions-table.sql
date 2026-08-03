create table if not exists public.extracted_conditions (
    id text primary key,
    record_id text not null references public.records(id) on delete cascade,
    condition_type text not null,
    value_text text,
    value_number double precision,
    unit text,
    confidence double precision,
    source_text text,
    created_at timestamptz not null default now()
);

create index if not exists extracted_conditions_record_id_idx
    on public.extracted_conditions(record_id);

alter table public.extracted_conditions enable row level security;
