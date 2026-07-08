-- ============================================================
-- SCHEMA SIMPLIFICADO - BIZ-FLOW.CLOUD (WEB ONLY)
-- ============================================================
-- Focado em: Web PWA, sem Android, sem APIs externas
-- Tabelas: profiles, documents, transactions, saved_clients, saved_products
-- ============================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- 2.1 Profiles (perfil do usuário)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  nuit TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  currency TEXT DEFAULT 'MZN',
  language TEXT DEFAULT 'pt',
  theme TEXT DEFAULT 'light',
  plan TEXT DEFAULT 'FREE',
  is_admin BOOLEAN DEFAULT FALSE,
  email TEXT DEFAULT NULL,
  default_tax_rate NUMERIC DEFAULT 16,
  custom_stamp TEXT DEFAULT '',
  signature TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Documents (documentos: faturas, recibos, orçamentos)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RECEIPT', 'INVOICE', 'INVOICE_RECEIPT', 'QUOTE')),
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  currency TEXT DEFAULT 'MZN',
  language TEXT DEFAULT 'pt',
  client_name TEXT DEFAULT '',
  client_contact TEXT DEFAULT '',
  client_location TEXT DEFAULT '',
  client_nuit TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  stamp_text TEXT DEFAULT 'PAGO',
  signature_data TEXT DEFAULT '',
  document_theme TEXT DEFAULT 'color',
  pdf_url TEXT DEFAULT '',
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Transactions (transações financeiras)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  amount NUMERIC DEFAULT 0,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Outros',
  date TEXT NOT NULL,
  timestamp BIGINT DEFAULT 0,
  receipt_id TEXT
);

-- 2.4 Saved Clients (clientes salvos)
CREATE TABLE IF NOT EXISTS public.saved_clients (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  location TEXT DEFAULT '',
  nuit TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Saved Products (produtos/serviços salvos)
CREATE TABLE IF NOT EXISTS public.saved_products (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  unit_price NUMERIC DEFAULT 0,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_id ON public.transactions(receipt_id);
CREATE INDEX IF NOT EXISTS idx_saved_clients_user_id ON public.saved_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON public.saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- 4.1 Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4.2 Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- 4.3 Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 4.4 Saved Clients
ALTER TABLE public.saved_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clients"
  ON public.saved_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients"
  ON public.saved_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients"
  ON public.saved_clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients"
  ON public.saved_clients FOR DELETE USING (auth.uid() = user_id);

-- 4.5 Saved Products
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products"
  ON public.saved_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products"
  ON public.saved_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products"
  ON public.saved_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products"
  ON public.saved_products FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================================

-- 5.1 Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, currency, language, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(NEW.raw_user_meta_data->>'currency', 'MZN'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'pt'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
