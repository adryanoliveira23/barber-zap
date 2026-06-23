-- =====================================================
-- BARBERZAP - SCHEMA COMPLETO E IDEMPOTENTE
-- Execute no SQL Editor do Supabase.
-- Seguro para rodar mesmo se as tabelas já existirem.
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABELA: barbershops
-- =====================================================
CREATE TABLE IF NOT EXISTS public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  instagram TEXT,
  whatsapp TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barbershops_user_id ON public.barbershops(user_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_slug ON public.barbershops(slug);

-- =====================================================
-- TABELA: services
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas que podem faltar em bancos mais antigos
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- =====================================================
-- TABELA: schedules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  weekly_hours JSONB DEFAULT '{}'::jsonb,
  special_dates JSONB DEFAULT '[]'::jsonb,
  interval_minutes INTEGER DEFAULT 30,
  break_times JSONB DEFAULT '[{"start": "12:00", "end": "13:00"}]'::jsonb,
  blocked_dates JSONB DEFAULT '[]'::jsonb,
  whatsapp_config JSONB DEFAULT '{"apiUrl": "", "apiKey": "", "instanceName": "", "sendConfirmation": false, "sendReminder24h": false, "sendReminder2h": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas que podem faltar em bancos mais antigos
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS break_times JSONB DEFAULT '[{"start": "12:00", "end": "13:00"}]'::jsonb;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS blocked_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{"apiUrl": "", "apiKey": "", "instanceName": "", "sendConfirmation": false, "sendReminder24h": false, "sendReminder2h": false}'::jsonb;

-- =====================================================
-- TABELA: appointments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price DECIMAL(10,2) NOT NULL,
  total_duration INTEGER DEFAULT 0,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  loyalty_applied BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas que podem faltar em bancos mais antigos
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_duration INTEGER DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS loyalty_applied BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;

-- =====================================================
-- TABELA: customers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visits_count INTEGER DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas que podem faltar em bancos mais antigos
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS visits_count INTEGER DEFAULT 0;

-- =====================================================
-- TABELA: loyalty
-- =====================================================
CREATE TABLE IF NOT EXISTS public.loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  visits_count INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas que podem faltar em bancos mais antigos
ALTER TABLE public.loyalty ADD COLUMN IF NOT EXISTS visits_count INTEGER DEFAULT 0;
ALTER TABLE public.loyalty ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- =====================================================
-- TABELA: landing_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.landing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_events_created_at ON public.landing_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_events_event_name ON public.landing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_landing_events_session_id ON public.landing_events(session_id);

-- =====================================================
-- TRIGGER: Criar perfil ao registrar usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES (Drop antes de recriar para evitar conflito)
-- =====================================================

-- profiles
DROP POLICY IF EXISTS "public_select_profiles" ON public.profiles;
CREATE POLICY "public_select_profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_update_profiles" ON public.profiles;
CREATE POLICY "auth_update_profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- barbershops
DROP POLICY IF EXISTS "public_select_barbershops" ON public.barbershops;
CREATE POLICY "public_select_barbershops" ON public.barbershops FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_insert_barbershops" ON public.barbershops;
CREATE POLICY "auth_insert_barbershops" ON public.barbershops FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_update_barbershops" ON public.barbershops;
CREATE POLICY "auth_update_barbershops" ON public.barbershops FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_barbershops" ON public.barbershops;
CREATE POLICY "auth_delete_barbershops" ON public.barbershops FOR DELETE USING (auth.uid() = user_id);

-- services
DROP POLICY IF EXISTS "public_select_services" ON public.services;
CREATE POLICY "public_select_services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_services" ON public.services;
CREATE POLICY "auth_manage_services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.user_id = auth.uid())
  );

-- schedules
DROP POLICY IF EXISTS "public_select_schedules" ON public.schedules;
CREATE POLICY "public_select_schedules" ON public.schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_schedules" ON public.schedules;
CREATE POLICY "auth_manage_schedules" ON public.schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = schedules.barbershop_id AND barbershops.user_id = auth.uid())
  );

-- appointments
DROP POLICY IF EXISTS "public_select_appointments" ON public.appointments;
CREATE POLICY "public_select_appointments" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_appointments" ON public.appointments;
CREATE POLICY "public_insert_appointments" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "auth_manage_appointments" ON public.appointments;
CREATE POLICY "auth_manage_appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.user_id = auth.uid())
  );

-- customers
DROP POLICY IF EXISTS "public_select_customers" ON public.customers;
CREATE POLICY "public_select_customers" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_customers" ON public.customers;
CREATE POLICY "auth_manage_customers" ON public.customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = customers.barbershop_id AND barbershops.user_id = auth.uid())
  );

-- loyalty
DROP POLICY IF EXISTS "public_select_loyalty" ON public.loyalty;
CREATE POLICY "public_select_loyalty" ON public.loyalty FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_loyalty" ON public.loyalty;
CREATE POLICY "public_insert_loyalty" ON public.loyalty FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "auth_manage_loyalty" ON public.loyalty;
CREATE POLICY "auth_manage_loyalty" ON public.loyalty
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = loyalty.barbershop_id AND barbershops.user_id = auth.uid())
  );

-- landing_events
DROP POLICY IF EXISTS "public_insert_landing_events" ON public.landing_events;
CREATE POLICY "public_insert_landing_events" ON public.landing_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_select_landing_events" ON public.landing_events;
CREATE POLICY "public_select_landing_events" ON public.landing_events FOR SELECT USING (true);

-- =====================================================
-- Recarregar cache do schema do PostgREST
-- =====================================================
NOTIFY pgrst, 'reload schema';
