create table if not exists public.conversations (
    id text primary key,
    workplace_id text not null,
    comparison_id text not null references public.comparisons(id) on delete cascade,
    status text not null default 'open' check (status in ('open', 'closed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists conversations_workplace_comparison_idx
    on public.conversations (workplace_id, comparison_id, status);

create table if not exists public.messages (
    id text primary key,
    conversation_id text not null references public.conversations(id) on delete cascade,
    sender text not null check (sender in ('assistant', 'employer')),
    original_text text not null,
    translated_text text,
    analysis_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
    on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.set_conversations_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;

create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_conversations_updated_at();
