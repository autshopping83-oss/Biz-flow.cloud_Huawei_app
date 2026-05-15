-- ============================================================
-- SCHEMA COMPLETO DO BIZ-FLOW.CLOUD PARA SUPABASE
-- ============================================================
-- Este script cria toda a estrutura necessária:
-- 1. Tabelas (profiles, documents, api_keys, webhooks, etc)
-- 2. Row Level Security (RLS)
-- 3. Funções e triggers
-- 4. Índices para performance
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- 2.1 Profiles (estendido)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company_name text default '',
  address text default '',
  contact text default '',
  nuit text default '',
  logo text default '',
  currency text default 'MZN',
  language text default 'pt',
  theme text default 'light',
  plan text default 'FREE',
  is_admin boolean default false,
  subscription_token text default null,
  email text default null,
  default_tax_rate numeric default 16,
  custom_stamp text default '',
  signature text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2 Documents (histórico de documentos)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('RECEIPT', 'INVOICE', 'INVOICE_RECEIPT', 'QUOTE')),
  number text not null,
  date text not null,
  currency text default 'MZN',
  language text default 'pt',
  client_name text default '',
  client_contact text default '',
  client_location text default '',
  client_nuit text default '',
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax_amount numeric default 0,
  discount numeric default 0,
  total numeric default 0,
  stamp_text text default 'PAGO',
  signature_data text default '',
  document_theme text default 'color',
  pdf_url text default '',
  synced boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.3 API Keys (para usuários gerarem chaves)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  key text unique not null default encode(gen_random_bytes(32), 'hex'),
  permissions jsonb default '["read"]'::jsonb,
  is_active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- 2.4 Webhooks (configurações de webhook por usuário)
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text not null,
  events jsonb default '[]'::jsonb,
  headers jsonb default '{}'::jsonb,
  is_active boolean default true,
  last_triggered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.5 Webhook Logs (histórico de disparos)
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references public.webhooks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  event text not null,
  status text not null check (status in ('success', 'error', 'pending')),
  request_body jsonb,
  response_body text,
  response_code int,
  error_message text,
  created_at timestamptz default now()
);

-- 2.6 Saved Clients
create table if not exists public.saved_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  contact text default '',
  location text default '',
  nuit text default '',
  created_at timestamptz default now()
);

-- 2.7 Saved Products
create table if not exists public.saved_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  description text not null,
  unit_price numeric default 0,
  category text default '',
  created_at timestamptz default now()
);

-- 2.8 N8N Webhook Config (configurações do n8n)
create table if not exists public.n8n_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  webhook_url text not null,
  service_type text not null check (service_type in ('email', 'whatsapp', 'chatbot', 'payment', 'document', 'custom')),
  is_active boolean default true,
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.9 Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Empresa',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  max_members int default 10,
  created_at timestamptz default now()
);

-- 2.10 Organization Members
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  name text default '',
  role text not null check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  invited_by text,
  last_login timestamptz,
  created_at timestamptz default now()
);

-- 2.11 Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  amount numeric default 0,
  description text default '',
  category text default 'Outros',
  date text not null,
  timestamp bigint default 0,
  receipt_id text
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_type on public.documents(type);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_key on public.api_keys(key);
create index if not exists idx_webhooks_user_id on public.webhooks(user_id);
create index if not exists idx_webhook_logs_user_id on public.webhook_logs(user_id);
create index if not exists idx_webhook_logs_created_at on public.webhook_logs(created_at desc);
create index if not exists idx_saved_clients_user_id on public.saved_clients(user_id);
create index if not exists idx_saved_products_user_id on public.saved_products(user_id);
create index if not exists idx_n8n_webhooks_user_id on public.n8n_webhooks(user_id);
create index if not exists idx_organizations_owner_id on public.organizations(owner_id);
create index if not exists idx_org_members_org_id on public.org_members(org_id);
create index if not exists idx_org_members_user_id on public.org_members(user_id);
create index if not exists idx_org_members_status on public.org_members(status);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_transactions_receipt_id on public.transactions(receipt_id);
create index if not exists idx_profiles_email on public.profiles(email);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- 4.1 Profiles
alter table public.profiles enable row level security;
create policy "Usuários podem ver próprio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Usuários podem atualizar próprio perfil"
  on public.profiles for update using (auth.uid() = id);
create policy "Usuários podem inserir próprio perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- 4.2 Documents
alter table public.documents enable row level security;
create policy "Usuários podem ver próprios documentos"
  on public.documents for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprios documentos"
  on public.documents for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios documentos"
  on public.documents for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios documentos"
  on public.documents for delete using (auth.uid() = user_id);

-- 4.3 API Keys
alter table public.api_keys enable row level security;
create policy "Usuários podem ver próprias chaves"
  on public.api_keys for select using (auth.uid() = user_id);
create policy "Usuários podem criar próprias chaves"
  on public.api_keys for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias chaves"
  on public.api_keys for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias chaves"
  on public.api_keys for delete using (auth.uid() = user_id);

-- 4.4 Webhooks
alter table public.webhooks enable row level security;
create policy "Usuários podem ver próprios webhooks"
  on public.webhooks for select using (auth.uid() = user_id);
create policy "Usuários podem criar próprios webhooks"
  on public.webhooks for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios webhooks"
  on public.webhooks for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios webhooks"
  on public.webhooks for delete using (auth.uid() = user_id);

-- 4.5 Webhook Logs
alter table public.webhook_logs enable row level security;
create policy "Usuários podem ver próprios logs"
  on public.webhook_logs for select using (auth.uid() = user_id);
create policy "Sistema pode inserir logs"
  on public.webhook_logs for insert with check (auth.uid() = user_id);

-- 4.6 Saved Clients
alter table public.saved_clients enable row level security;
create policy "Usuários podem ver próprios clientes"
  on public.saved_clients for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprios clientes"
  on public.saved_clients for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios clientes"
  on public.saved_clients for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios clientes"
  on public.saved_clients for delete using (auth.uid() = user_id);

-- 4.7 Saved Products
alter table public.saved_products enable row level security;
create policy "Usuários podem ver próprios produtos"
  on public.saved_products for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprios produtos"
  on public.saved_products for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios produtos"
  on public.saved_products for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios produtos"
  on public.saved_products for delete using (auth.uid() = user_id);

-- 4.8 N8N Webhooks
alter table public.n8n_webhooks enable row level security;
create policy "Usuários podem ver próprios n8n webhooks"
  on public.n8n_webhooks for select using (auth.uid() = user_id);
create policy "Usuários podem criar próprios n8n webhooks"
  on public.n8n_webhooks for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios n8n webhooks"
  on public.n8n_webhooks for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios n8n webhooks"
  on public.n8n_webhooks for delete using (auth.uid() = user_id);

-- 4.9 Organizations
alter table public.organizations enable row level security;
create policy "Usuários podem ver próprias organizações"
  on public.organizations for select using (auth.uid() = owner_id);
create policy "Usuários podem criar organizações"
  on public.organizations for insert with check (auth.uid() = owner_id);
create policy "Usuários podem atualizar próprias organizações"
  on public.organizations for update using (auth.uid() = owner_id);

-- 4.10 Organization Members
alter table public.org_members enable row level security;
create policy "Membros podem ver membros da própria org"
  on public.org_members for select using (
    exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id and om.user_id = auth.uid()
    )
  );
create policy "Admins podem inserir membros"
  on public.org_members for insert with check (
    exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id and om.user_id = auth.uid() and om.role = 'admin'
    )
  );
create policy "Admins podem atualizar membros"
  on public.org_members for update using (
    exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id and om.user_id = auth.uid() and om.role = 'admin'
    )
  );
create policy "Admins podem deletar membros"
  on public.org_members for delete using (
    exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id and om.user_id = auth.uid() and om.role = 'admin'
    )
  );

-- 4.11 Transactions
alter table public.transactions enable row level security;
create policy "Usuários podem ver próprias transações"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias transações"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias transações"
  on public.transactions for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias transações"
  on public.transactions for delete using (auth.uid() = user_id);

-- ============================================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================================

-- 5.1 Trigger para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_documents
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_webhooks
  before update on public.webhooks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_n8n_webhooks
  before update on public.n8n_webhooks
  for each row execute function public.handle_updated_at();

-- 5.2 Trigger para criar profile automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, currency, language, email)
  values (
    new.id,
    new.raw_user_meta_data->>'company_name',
    coalesce(new.raw_user_meta_data->>'currency', 'MZN'),
    coalesce(new.raw_user_meta_data->>'language', 'pt'),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.3 Função para validar API Key
create or replace function public.validate_api_key(api_key text)
returns uuid as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id
  from public.api_keys
  where key = api_key
    and is_active = true
    and (expires_at is null or expires_at > now());
  
  if v_user_id is null then
    raise exception 'API key inválida ou expirada';
  end if;

  -- Atualizar last_used_at
  update public.api_keys set last_used_at = now()
  where key = api_key;

  return v_user_id;
end;
$$ language plpgsql security definer;

-- 5.4 Função para criar API Key
create or replace function public.create_api_key(
  key_name text,
  key_permissions jsonb default '["read"]'::jsonb,
  key_expires_at timestamptz default null
)
returns jsonb as $$
declare
  v_key text;
  v_id uuid;
begin
  v_key := encode(gen_random_bytes(32), 'hex');
  
  insert into public.api_keys (user_id, name, key, permissions, expires_at)
  values (auth.uid(), key_name, v_key, key_permissions, key_expires_at)
  returning id, key into v_id, v_key;

  return jsonb_build_object('id', v_id, 'key', v_key);
end;
$$ language plpgsql security definer;

-- 5.5 Função para registrar log de webhook
create or replace function public.log_webhook_event(
  p_webhook_id uuid,
  p_event text,
  p_status text,
  p_request_body jsonb default null,
  p_response_body text default null,
  p_response_code int default null,
  p_error_message text default null
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  insert into public.webhook_logs (webhook_id, user_id, event, status, request_body, response_body, response_code, error_message)
  values (p_webhook_id, auth.uid(), p_event, p_status, p_request_body, p_response_body, p_response_code, p_error_message)
  returning id into v_log_id;

  return v_log_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 6. API PÚBLICA (para acesso via API Key)
-- ============================================================

-- 6.1 Função para acessar documentos via API
create or replace function public.api_get_documents(
  api_key text,
  p_type text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_result jsonb;
begin
  -- Validar API key
  v_user_id := public.validate_api_key(api_key);

  -- Buscar documentos
  select jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'type', d.type,
      'number', d.number,
      'date', d.date,
      'client_name', d.client_name,
      'total', d.total,
      'currency', d.currency,
      'status', d.stamp_text,
      'created_at', d.created_at
    )
    order by d.created_at desc
  )
  into v_result
  from public.documents d
  where d.user_id = v_user_id
    and (p_type is null or d.type = p_type)
  limit p_limit
  offset p_offset;

  return coalesce(v_result, '[]'::jsonb);
end;
$$ language plpgsql security definer;

-- 6.2 Função para criar documento via API
create or replace function public.api_create_document(
  api_key text,
  p_document jsonb
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_doc_id uuid;
begin
  v_user_id := public.validate_api_key(api_key);

  insert into public.documents (
    user_id, type, number, date, currency, language,
    client_name, client_contact, client_location, client_nuit,
    items, subtotal, tax_rate, tax_amount, discount, total,
    stamp_text, document_theme
  ) values (
    v_user_id,
    p_document->>'type',
    p_document->>'number',
    coalesce(p_document->>'date', current_date::text),
    coalesce(p_document->>'currency', 'MZN'),
    coalesce(p_document->>'language', 'pt'),
    p_document->>'client_name',
    p_document->>'client_contact',
    p_document->>'client_location',
    p_document->>'client_nuit',
    coalesce(p_document->'items', '[]'::jsonb),
    (p_document->>'subtotal')::numeric,
    (p_document->>'tax_rate')::numeric,
    (p_document->>'tax_amount')::numeric,
    (p_document->>'discount')::numeric,
    (p_document->>'total')::numeric,
    coalesce(p_document->>'stamp_text', 'PAGO'),
    coalesce(p_document->>'document_theme', 'color')
  )
  returning id into v_doc_id;

  return jsonb_build_object('id', v_doc_id, 'status', 'created');
end;
$$ language plpgsql security definer;

-- 6.3 Função para disparar webhook via API
create or replace function public.api_trigger_webhook(
  api_key text,
  p_event text,
  p_data jsonb default '{}'::jsonb
)
returns jsonb as $$
declare
  v_user_id uuid;
  v_webhooks jsonb;
  v_result jsonb;
begin
  v_user_id := public.validate_api_key(api_key);

  -- Buscar webhooks ativos para o evento
  select jsonb_agg(
    jsonb_build_object('id', id, 'url', url, 'name', name)
  )
  into v_webhooks
  from public.webhooks
  where user_id = v_user_id
    and is_active = true
    and (events = '["*"]'::jsonb or events @> to_jsonb(array[p_event]));

  return jsonb_build_object(
    'triggered', v_webhooks is not null,
    'webhooks', coalesce(v_webhooks, '[]'::jsonb),
    'event', p_event
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- 7. DADOS INICIAIS (opcional)
-- ============================================================

-- Inserir um admin inicial se não existir (opcional)
-- Nota: O admin deve ser criado via auth primeiro
-- insert into public.profiles (id, company_name, is_admin, plan)
-- values ('SEU_USER_ID_AQUI', 'Biz-Flow Admin', true, 'PRO');
