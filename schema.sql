-- SCRIPT SQL PARA O SUPABASE (SQL EDITOR)
-- Copie este script e execute-o no editor SQL do Supabase.

-- Habilitar a extensão uuid-ossp (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA PROFILES (Viculada ao Auth do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são públicos para leitura" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABELA BARBERSHOPS (Perfil da barbearia)
CREATE TABLE IF NOT EXISTS public.barbershops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
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

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbearias são públicas para leitura" ON public.barbershops
    FOR SELECT USING (true);

CREATE POLICY "Dono pode gerenciar sua barbearia" ON public.barbershops
    FOR ALL USING (auth.uid() = user_id);


-- 3. TABELA SERVICES (Serviços)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration INTEGER NOT NULL, -- em minutos
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Serviços são públicos para leitura" ON public.services
    FOR SELECT USING (true);

CREATE POLICY "Dono pode gerenciar serviços da sua barbearia" ON public.services
    FOR ALL USING (auth.uid() = user_id);


-- 4. TABELA SCHEDULES (Configuração de Horários)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops ON DELETE CASCADE UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    weekly_hours JSONB NOT NULL DEFAULT '{
        "monday": {"active": true, "open": "09:00", "close": "18:00"},
        "tuesday": {"active": true, "open": "09:00", "close": "18:00"},
        "wednesday": {"active": true, "open": "09:00", "close": "18:00"},
        "thursday": {"active": true, "open": "09:00", "close": "20:00"},
        "friday": {"active": true, "open": "09:00", "close": "20:00"},
        "saturday": {"active": true, "open": "08:00", "close": "17:00"},
        "sunday": {"active": false, "open": "09:00", "close": "12:00"}
    }'::jsonb,
    interval_minutes INTEGER DEFAULT 30,
    break_times JSONB NOT NULL DEFAULT '[{"start": "12:00", "end": "13:00"}]'::jsonb,
    blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    whatsapp_config JSONB NOT NULL DEFAULT '{
        "apiUrl": "",
        "apiKey": "",
        "instanceName": "",
        "sendConfirmation": false,
        "sendReminder24h": false,
        "sendReminder2h": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações de horários são públicas para leitura" ON public.schedules
    FOR SELECT USING (true);

CREATE POLICY "Dono pode gerenciar configurações de horários" ON public.schedules
    FOR ALL USING (auth.uid() = user_id);


-- 5. TABELA APPOINTMENTS (Agendamentos)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL, -- ex: "14:30"
    service_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de UUIDs de serviços
    total_price NUMERIC(10, 2) NOT NULL,
    total_duration INTEGER NOT NULL, -- em minutos
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
    loyalty_applied BOOLEAN DEFAULT false,
    reminder_24h_sent BOOLEAN DEFAULT false,
    reminder_2h_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Agendamentos podem ser criados publicamente por qualquer cliente
CREATE POLICY "Qualquer um pode criar agendamentos" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- Leitura de agendamentos: dono ou qualquer pessoa (para checar horários ocupados)
CREATE POLICY "Leitura pública de agendamentos" ON public.appointments
    FOR SELECT USING (true);

-- Apenas o barbeiro dono do agendamento pode atualizar ou deletar
CREATE POLICY "Dono pode gerenciar agendamentos" ON public.appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.id = appointments.barbershop_id AND b.user_id = auth.uid()
        )
    );


-- 6. TABELA CUSTOMERS (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    visits_count INTEGER DEFAULT 0,
    last_visit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_barbershop_phone UNIQUE (barbershop_id, phone)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode criar/atualizar CRM ao fazer agendamento
CREATE POLICY "Qualquer um pode criar/atualizar clientes no CRM" ON public.customers
    FOR ALL USING (true);

CREATE POLICY "Dono da barbearia lê e altera clientes" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.id = customers.barbershop_id AND b.user_id = auth.uid()
        )
    );


-- 7. TABELA LOYALTY (Cartão Fidelidade)
CREATE TABLE IF NOT EXISTS public.loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id UUID REFERENCES public.barbershops ON DELETE CASCADE NOT NULL,
    customer_phone TEXT NOT NULL,
    visits_count INTEGER DEFAULT 0, -- quantidade geral histórica
    progress INTEGER DEFAULT 0, -- progresso atual de 0 a 10
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_loyalty_barbershop_phone UNIQUE (barbershop_id, customer_phone)
);

ALTER TABLE public.loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cartão fidelidade é público para leitura" ON public.loyalty
    FOR SELECT USING (true);

CREATE POLICY "Qualquer um pode atualizar cartão fidelidade" ON public.loyalty
    FOR ALL USING (true);

CREATE POLICY "Dono da barbearia tem controle total de fidelidade" ON public.loyalty
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.barbershops b
            WHERE b.id = loyalty.barbershop_id AND b.user_id = auth.uid()
        )
    );


-- FUNÇÃO TRIGGER PARA ATUALIZAR O CAMPO updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicando triggers de updated_at para todas as tabelas
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON public.barbershops FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE OR REPLACE TRIGGER update_loyalty_updated_at BEFORE UPDATE ON public.loyalty FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


-- 8. TABELA LANDING_EVENTS (Analytics da Landing)
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

ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer visitante pode registrar evento da landing" ON public.landing_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura pública de eventos agregáveis" ON public.landing_events
    FOR SELECT USING (true);
