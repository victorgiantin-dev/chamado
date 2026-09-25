import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Chamado } from '../types';
import { INITIAL_CHAMADOS } from '../data/seedData';

const LOCAL_STORAGE_KEY = 'sysmanut_chamados_v1';
const SUPABASE_CONFIG_KEY = 'sysmanut_supabase_config_v1';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
}

// SQL Script ready to execute in Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- ==============================================================================
-- SYSMANUT INDUSTRIAL - SCRIPT SQL COMPLETO COM POLÍTICAS DE ARMAZENAMENTO (RLS)
-- Execute este script no SQL Editor do seu projeto Supabase (supabase.com)
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE CHAMADOS (ORDENS DE SERVIÇO)
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

-- 2. ÍNDICES DE ALTA VELOCIDADE
create index if not exists idx_chamados_status on public.chamados (status);
create index if not exists idx_chamados_priority on public.chamados (priority);
create index if not exists idx_chamados_created_at on public.chamados (created_at desc);
create index if not exists idx_chamados_tag on public.chamados (tag);
create index if not exists idx_chamados_production_stopped on public.chamados (production_stopped) where production_stopped = true;

-- 3. TRIGGER AUTOMÁTICO PARA updated_at
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

-- 4. POLÍTICAS DE SEGURANÇA E ARMAZENAMENTO DA TABELA (RLS)
alter table public.chamados enable row level security;

-- Política 1: Leitura pública
drop policy if exists "sysmanut_select_policy" on public.chamados;
create policy "sysmanut_select_policy" on public.chamados for select using (true);

-- Política 2: Abertura pelo operador
drop policy if exists "sysmanut_insert_policy" on public.chamados;
create policy "sysmanut_insert_policy" on public.chamados for insert with check (true);

-- Política 3: Atualização e encerramento pelo mecânico
drop policy if exists "sysmanut_update_policy" on public.chamados;
create policy "sysmanut_update_policy" on public.chamados for update using (true) with check (true);

-- Política 4: Exclusão se necessário
drop policy if exists "sysmanut_delete_policy" on public.chamados;
create policy "sysmanut_delete_policy" on public.chamados for delete using (true);

-- 5. CRIAÇÃO DO BUCKET DE ARMAZENAMENTO DE FOTOS/EVIDÊNCIAS (SUPABASE STORAGE)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manutencao-evidencias',
  'manutencao-evidencias',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- 6. POLÍTICAS DE ARMAZENAMENTO PARA O STORAGE (storage.objects)
-- (Nunca execute alter table storage.objects pois é de propriedade de supabase_storage_admin)
-- Visualização pública das evidências fotográficas
drop policy if exists "sysmanut_storage_select_policy" on storage.objects;
create policy "sysmanut_storage_select_policy" on storage.objects for select
  using (bucket_id = 'manutencao-evidencias');

-- Upload de fotos e laudos de manutenção
drop policy if exists "sysmanut_storage_insert_policy" on storage.objects;
create policy "sysmanut_storage_insert_policy" on storage.objects for insert
  with check (bucket_id = 'manutencao-evidencias');

-- Atualização e exclusão de arquivos no storage
drop policy if exists "sysmanut_storage_update_policy" on storage.objects;
create policy "sysmanut_storage_update_policy" on storage.objects for update
  using (bucket_id = 'manutencao-evidencias') with check (bucket_id = 'manutencao-evidencias');

drop policy if exists "sysmanut_storage_delete_policy" on storage.objects;
create policy "sysmanut_storage_delete_policy" on storage.objects for delete
  using (bucket_id = 'manutencao-evidencias');

-- 7. SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chamados'
  ) then
    alter publication supabase_realtime add table public.chamados;
  end if;
end $$;
`;

// Retrieve saved config or fallback to env vars
export function getStoredSupabaseConfig(): SupabaseSettings {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase do localStorage', e);
  }

  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
}

export function saveSupabaseConfig(config: SupabaseSettings): void {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    // Clear cached client to re-instantiate
    cachedClient = null;
  } catch (e) {
    console.error('Erro ao salvar config do Supabase', e);
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey && config.url.startsWith('http')) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
      });
      return cachedClient;
    } catch (e) {
      console.warn('Falha ao inicializar cliente Supabase:', e);
      return null;
    }
  }
  return null;
}

// Test connection to Supabase
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL e Anon Key são obrigatórias.' };
    }
    const client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    
    // Attempt a light select on chamados
    const { error } = await client.from('chamados').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Relation does not exist
        return {
          success: false,
          message: 'Conectado ao Supabase! Porém a tabela "chamados" ainda não foi criada. Use o script SQL fornecido abaixo para criá-la.',
        };
      }
      return { success: false, message: `Erro do Supabase: ${error.message}` };
    }

    return { success: true, message: 'Conexão estabelecida com sucesso com a tabela chamados no Supabase!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Erro ao conectar: ${msg}` };
  }
}

// Local Storage helpers
function getLocalChamados(): Chamado[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Erro ao ler do localStorage:', e);
  }
  // Initialize with seed data
  saveLocalChamados(INITIAL_CHAMADOS);
  return INITIAL_CHAMADOS;
}

function saveLocalChamados(list: Chamado[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

// High-level data operations that try Supabase first, fallback to LocalStorage
export async function fetchChamados(): Promise<{ chamados: Chamado[]; source: 'supabase' | 'local'; error?: string }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Map Supabase rows to Chamado interface (symptoms and parts_replaced handled as json)
        const mapped: Chamado[] = data.map((item: any) => ({
          ...item,
          symptoms: Array.isArray(item.symptoms) ? item.symptoms : [],
          parts_replaced: Array.isArray(item.parts_replaced) ? item.parts_replaced : [],
        }));
        // Update local cache
        saveLocalChamados(mapped);
        return { chamados: mapped, source: 'supabase' };
      } else {
        console.warn('Supabase query failed, falling back to local:', error?.message);
        return {
          chamados: getLocalChamados(),
          source: 'local',
          error: error?.message,
        };
      }
    } catch (e: any) {
      console.warn('Supabase network error, falling back to local:', e.message);
      return {
        chamados: getLocalChamados(),
        source: 'local',
        error: e.message,
      };
    }
  }

  return { chamados: getLocalChamados(), source: 'local' };
}

export async function createChamado(chamado: Chamado): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
  // Always persist locally
  const current = getLocalChamados();
  const updated = [chamado, ...current.filter((c) => c.id !== chamado.id)];
  saveLocalChamados(updated);

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('chamados').insert([chamado]);
      if (error) {
        console.error('Erro ao inserir no Supabase:', error);
        return { success: true, source: 'local', error: `Salvo localmente. Erro no Supabase: ${error.message}` };
      }
      return { success: true, source: 'supabase' };
    } catch (err: any) {
      console.error('Falha de rede Supabase:', err);
      return { success: true, source: 'local', error: `Salvo localmente (offline do Supabase: ${err.message})` };
    }
  }

  return { success: true, source: 'local' };
}

export async function updateChamado(chamadoId: string, updates: Partial<Chamado>): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
  // Update local cache
  const current = getLocalChamados();
  const index = current.findIndex((c) => c.id === chamadoId);
  if (index !== -1) {
    current[index] = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalChamados(current);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chamadoId);

      if (error) {
        console.error('Erro ao atualizar no Supabase:', error);
        return { success: true, source: 'local', error: `Atualizado localmente. Erro no Supabase: ${error.message}` };
      }
      return { success: true, source: 'supabase' };
    } catch (err: any) {
      console.error('Falha de rede Supabase:', err);
      return { success: true, source: 'local', error: `Atualizado localmente (offline do Supabase: ${err.message})` };
    }
  }

  return { success: true, source: 'local' };
}

export async function seedSupabaseWithInitialData(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase não está configurado.' };
  }

  try {
    const { error } = await supabase.from('chamados').upsert(INITIAL_CHAMADOS, { onConflict: 'id' });
    if (error) {
      return { success: false, message: `Erro ao enviar dados iniciais: ${error.message}` };
    }
    return { success: true, message: 'Dados de exemplo carregados no Supabase com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na requisição: ${err.message}` };
  }
}

// Upload de fotos/evidências para o bucket de Storage do Supabase
export async function uploadEvidenciaToSupabase(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase não conectado' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `evidencias/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('manutencao-evidencias')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Erro ao fazer upload no Supabase Storage:', uploadError);
      return { error: uploadError.message };
    }

    const { data } = supabase.storage
      .from('manutencao-evidencias')
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err.message };
  }
}

