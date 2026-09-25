-- ==============================================================================
-- SYSMANUT INDUSTRIAL - SCRIPT SQL COMPLETO COM POLÍTICAS DE ARMAZENAMENTO (RLS)
-- Execute este script no SQL Editor do seu projeto Supabase (supabase.com)
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE CHAMADOS (ORDENS DE SERVIÇO)
-- ------------------------------------------------------------------------------
create table if not exists public.chamados (
  id text primary key,
  equipment text not null,
  tag text,
  sector text not null,
  priority text not null check (priority in ('baixa', 'media', 'alta', 'critica')),
  title text not null,
  description text not null,
  symptoms jsonb default '[]'::jsonb,
  production_stopped boolean default false,
  photo_url text,
  status text not null default 'aberto' check (status in ('aberto', 'em_atendimento', 'aguardando_pecas', 'concluido')),
  opened_by text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Campos de intervenção e encerramento do Mecânico
  assigned_to text,
  assigned_at timestamp with time zone,
  closed_by text,
  closed_at timestamp with time zone,
  resolution_notes text,
  maintenance_type text,
  parts_replaced jsonb default '[]'::jsonb,
  time_spent_minutes integer default 0,
  recommendations text
);

-- Comentários descritivos nas colunas
comment on table public.chamados is 'Ordens de serviço e chamados técnicos de manutenção industrial';
comment on column public.chamados.id is 'Código identificador único da OS (ex: OS-2026-0041)';
comment on column public.chamados.equipment is 'Nome da máquina ou equipamento industrial';
comment on column public.chamados.tag is 'Código de patrimônio ou TAG da máquina (ex: TNC-04, PR-12)';
comment on column public.chamados.production_stopped is 'Indica se a máquina causou parada total de linha';
comment on column public.chamados.resolution_notes is 'Descrição técnica detalhada do reparo executado pelo mecânico';
comment on column public.chamados.parts_replaced is 'JSON com peças e componentes trocados [{name, code, quantity}]';

-- 2. ÍNDICES DE PERFORMANCE PARA CONSULTAS RÁPIDAS NO CHÃO DE FÁBRICA
-- ------------------------------------------------------------------------------
create index if not exists idx_chamados_status on public.chamados (status);
create index if not exists idx_chamados_priority on public.chamados (priority);
create index if not exists idx_chamados_created_at on public.chamados (created_at desc);
create index if not exists idx_chamados_tag on public.chamados (tag);
create index if not exists idx_chamados_production_stopped on public.chamados (production_stopped) where production_stopped = true;

-- 3. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_chamados_updated_at on public.chamados;
create trigger trigger_chamados_updated_at
  before update on public.chamados
  for each row
  execute function public.handle_updated_at();

-- 4. POLÍTICAS DE SEGURANÇA E ARMAZENAMENTO DA TABELA (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
alter table public.chamados enable row level security;

-- Política 1: LEITURA (SELECT) - Permite consulta pública de todos os chamados
drop policy if exists "sysmanut_select_policy" on public.chamados;
create policy "sysmanut_select_policy"
  on public.chamados
  for select
  using (true);

-- Política 2: INSERÇÃO (INSERT) - Permite que operadores abram novos chamados
drop policy if exists "sysmanut_insert_policy" on public.chamados;
create policy "sysmanut_insert_policy"
  on public.chamados
  for insert
  with check (true);

-- Política 3: ATUALIZAÇÃO (UPDATE) - Permite que mecânicos assumam e encerrem chamados
drop policy if exists "sysmanut_update_policy" on public.chamados;
create policy "sysmanut_update_policy"
  on public.chamados
  for update
  using (true)
  with check (true);

-- Política 4: EXCLUSÃO (DELETE) - Permite cancelamento/remoção de chamados se necessário
drop policy if exists "sysmanut_delete_policy" on public.chamados;
create policy "sysmanut_delete_policy"
  on public.chamados
  for delete
  using (true);

-- 5. CRIAÇÃO DO BUCKET DE ARMAZENAMENTO DE ARQUIVOS (SUPABASE STORAGE)
-- ------------------------------------------------------------------------------
-- O bucket "manutencao-evidencias" armazena fotos e laudos técnicos de manutenção.
-- (RLS em storage.objects já vem habilitado por padrão pelo Supabase).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manutencao-evidencias',
  'manutencao-evidencias',
  true,
  10485760, -- 10MB máximo
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- 6. POLÍTICAS DE ARMAZENAMENTO (RLS) PARA ARQUIVOS NO STORAGE (storage.objects)
-- ------------------------------------------------------------------------------
-- NOTA: Nunca execute 'alter table storage.objects' pois a tabela pertence ao usuário supabase_storage_admin.
-- As políticas abaixo aplicam as permissões de leitura e gravação no bucket:

drop policy if exists "sysmanut_storage_select_policy" on storage.objects;
create policy "sysmanut_storage_select_policy"
  on storage.objects
  for select
  using (bucket_id = 'manutencao-evidencias');

drop policy if exists "sysmanut_storage_insert_policy" on storage.objects;
create policy "sysmanut_storage_insert_policy"
  on storage.objects
  for insert
  with check (bucket_id = 'manutencao-evidencias');

drop policy if exists "sysmanut_storage_update_policy" on storage.objects;
create policy "sysmanut_storage_update_policy"
  on storage.objects
  for update
  using (bucket_id = 'manutencao-evidencias')
  with check (bucket_id = 'manutencao-evidencias');

drop policy if exists "sysmanut_storage_delete_policy" on storage.objects;
create policy "sysmanut_storage_delete_policy"
  on storage.objects
  for delete
  using (bucket_id = 'manutencao-evidencias');

-- 7. ATIVAÇÃO DO SUPABASE REALTIME (ATUALIZAÇÃO EM TEMPO REAL NO CHÃO DE FÁBRICA)
-- ------------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'chamados'
  ) then
    alter publication supabase_realtime add table public.chamados;
  end if;
end $$;
