create table if not exists public.comparisons (
    id text primary key,
    workplace_id text not null,
    condition_type text not null,
    promised_record_id text references public.records(id) on delete set null,
    contracted_record_id text references public.records(id) on delete set null,
    actual_record_id text references public.records(id) on delete set null,
    status text not null check (
        status in ('same', 'different', 'missing', 'needs_confirmation')
    ),
    summary text not null,
    confirmation_items jsonb not null default '[]'::jsonb,
    legal_reference jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (workplace_id, condition_type)
);

create index if not exists comparisons_workplace_id_idx
    on public.comparisons(workplace_id);

alter table public.comparisons enable row level security;

create or replace function public.set_comparisons_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists comparisons_set_updated_at on public.comparisons;

create trigger comparisons_set_updated_at
before update on public.comparisons
for each row
execute function public.set_comparisons_updated_at();
