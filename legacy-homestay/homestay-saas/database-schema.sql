-- ============================================
-- DATABASE SCHEMA - COMPLETE WITH TRIGGERS
-- Auto-connected system
-- ============================================

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_plan VARCHAR(20) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'investor')),
  color_code VARCHAR(7),
  status VARCHAR(20) DEFAULT 'active',
  assigned_property_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  note TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_code VARCHAR(50) NOT NULL,
  floor VARCHAR(20),
  note TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, property_id, room_code)
);

-- ============================================
-- BOOKINGS TABLE (Center of auto-update system)
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  source_id UUID,
  assigned_staff_id UUID NOT NULL REFERENCES users(id),
  room_type_id UUID,
  
  check_in_at TIMESTAMP NOT NULL,
  check_out_at TIMESTAMP NOT NULL,
  
  -- Auto-calculated pricing
  unit_price DECIMAL(12,2) NOT NULL,
  extra_fee DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (unit_price + extra_fee) STORED,
  
  -- Updated by trigger
  total_paid DECIMAL(12,2) DEFAULT 0,
  remaining DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - total_paid) STORED,
  
  note TEXT,
  booking_status VARCHAR(20) DEFAULT 'confirmed',
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_out_after_check_in CHECK (check_out_at > check_in_at)
);

CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_room_time ON bookings(room_id, check_in_at, check_out_at);
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  payment_no INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_type VARCHAR(50) DEFAULT 'cash',
  note TEXT,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(booking_id, payment_no)
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ============================================
-- CLEANING TASKS TABLE
-- ============================================
CREATE TABLE cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES rooms(id),
  
  cleaner_id UUID,
  cleaning_status VARCHAR(20) DEFAULT 'not_assigned',
  
  scheduled_at TIMESTAMP,
  finished_at TIMESTAMP,
  note TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cleaning_booking ON cleaning_tasks(booking_id);
CREATE INDEX idx_cleaning_status ON cleaning_tasks(cleaning_status);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),
  expense_group_id UUID,
  
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  note TEXT,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_property ON expenses(property_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================
-- CONFIG TABLES
-- ============================================
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRIGGERS - AUTO-UPDATE LOGIC
-- ============================================

-- Trigger 1: Update booking.total_paid when payment changes
CREATE OR REPLACE FUNCTION update_booking_total_paid()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bookings
  SET total_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_total_paid_insert
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();

CREATE TRIGGER trg_update_total_paid_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();

CREATE TRIGGER trg_update_total_paid_delete
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();

-- Trigger 2: Auto-create cleaning task when booking created
CREATE OR REPLACE FUNCTION create_cleaning_task_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cleaning_tasks (
    tenant_id,
    booking_id,
    room_id,
    scheduled_at,
    cleaning_status
  )
  VALUES (
    NEW.tenant_id,
    NEW.id,
    NEW.room_id,
    NEW.check_out_at,
    'not_assigned'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_cleaning_task
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_cleaning_task_on_booking();

-- Trigger 3: Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_cleaning_tasks_updated_at
  BEFORE UPDATE ON cleaning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- MATERIALIZED VIEW - Fast dashboard queries
-- ============================================
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  tenant_id,
  property_id,
  DATE(check_in_at) as date,
  
  COUNT(*) as booking_count,
  COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE booking_status = 'completed') as completed_count,
  
  SUM(total_amount) as potential_revenue,
  SUM(total_paid) as actual_revenue,
  SUM(remaining) as outstanding,
  
  AVG(total_amount) as avg_booking_value
FROM bookings
WHERE booking_status NOT IN ('cancelled')
GROUP BY tenant_id, property_id, DATE(check_in_at);

CREATE INDEX idx_dashboard_stats_tenant_date 
  ON dashboard_stats(tenant_id, date);

-- ============================================
-- ROW LEVEL SECURITY (Multi-tenancy)
-- ============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_bookings ON bookings
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_payments ON payments
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_cleaning ON cleaning_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_expenses ON expenses
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
-- Create tenant
INSERT INTO tenants (id, name, slug) VALUES 
('00000000-0000-0000-0000-000000000001', 'Test Hotel', 'test-hotel');

-- Create admin user
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
 'admin@test.com', '$2a$10$...', 'Admin User', 'admin');

-- Create property
INSERT INTO properties (id, tenant_id, name) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 
 'Main Building');

-- Create rooms
INSERT INTO rooms (tenant_id, property_id, room_code) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '101'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '102'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '103');

-- ============================================
-- TEST QUERIES
-- ============================================

-- Test 1: Create booking with payment
-- Expected: total_paid auto-updates, cleaning task auto-created

BEGIN;

-- Set tenant context
SET app.current_tenant_id = '00000000-0000-0000-0000-000000000001';

-- Insert booking
INSERT INTO bookings (
  tenant_id, booking_code, property_id, room_id,
  customer_name, phone, assigned_staff_id,
  check_in_at, check_out_at, unit_price, extra_fee,
  created_by
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'BK001',
  '00000000-0000-0000-0000-000000000003',
  (SELECT id FROM rooms WHERE room_code = '101' LIMIT 1),
  'Nguyen Van A',
  '0901234567',
  '00000000-0000-0000-0000-000000000002',
  '2026-06-01 10:00:00',
  '2026-06-01 14:00:00',
  500000,
  0,
  '00000000-0000-0000-0000-000000000002'
)
RETURNING id, total_amount, total_paid, remaining;

-- Check cleaning task auto-created
SELECT * FROM cleaning_tasks WHERE booking_id = (SELECT id FROM bookings WHERE booking_code = 'BK001');

-- Add payment
INSERT INTO payments (
  tenant_id, booking_id, payment_no, amount, created_by
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM bookings WHERE booking_code = 'BK001'),
  1,
  200000,
  '00000000-0000-0000-0000-000000000002'
);

-- Check total_paid updated
SELECT booking_code, total_amount, total_paid, remaining 
FROM bookings 
WHERE booking_code = 'BK001';
-- Expected: total_paid = 200000, remaining = 300000

COMMIT;

-- ============================================
-- REFRESH MATERIALIZED VIEW (run periodically)
-- ============================================
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
