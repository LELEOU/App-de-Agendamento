-- Tabelas para o Sistema de Agendamento de Salão
-- Execute este SQL no Dashboard do Supabase (SQL Editor)

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- em minutos
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Funcionários
CREATE TABLE IF NOT EXISTS staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manicurist', -- 'admin' ou 'manicurist'
    email VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    commission_rate DECIMAL(3,2) DEFAULT 0.50, -- 50% por padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'no_show', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date, time) -- Evita conflitos de horário
);

-- 5. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) DEFAULT 'Agenda de Salão',
    business_phone VARCHAR(20),
    work_hours_start TIME DEFAULT '08:00',
    work_hours_end TIME DEFAULT '18:00',
    lunch_start TIME DEFAULT '12:00',
    lunch_end TIME DEFAULT '13:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- Array de dias da semana (0=Dom, 6=Sáb)
    appointment_duration INTEGER DEFAULT 40, -- minutos
    late_tolerance INTEGER DEFAULT 10, -- minutos
    commission_rate DECIMAL(3,2) DEFAULT 0.50,
    theme VARCHAR(20) DEFAULT 'light-mode',
    language VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir operações para usuários autenticados
CREATE POLICY "Users can manage their own data" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage services" ON services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage staff" ON staff
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage appointments" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their settings" ON settings
    FOR ALL USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de exemplo
INSERT INTO services (name, duration, price, description) VALUES
    ('Manicure Simples', 30, 25.00, 'Manicure básica com esmaltação'),
    ('Manicure com Nail Art', 45, 35.00, 'Manicure com decoração artística'),
    ('Pedicure', 40, 30.00, 'Cuidados completos para os pés'),
    ('Esmaltação em Gel', 60, 45.00, 'Esmaltação duradoura em gel'),
    ('Remoção de Cutícula', 20, 15.00, 'Cuidados especiais com cutículas');

-- Comentários nas tabelas
COMMENT ON TABLE clients IS 'Cadastro de clientes do salão';
COMMENT ON TABLE services IS 'Serviços oferecidos pelo salão';
COMMENT ON TABLE staff IS 'Funcionários do salão';
COMMENT ON TABLE appointments IS 'Agendamentos realizados';
COMMENT ON TABLE settings IS 'Configurações personalizadas do usuário';
