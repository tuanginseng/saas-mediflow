-- ============================================================
-- Medical Clinic Marketing & Automation — Initial Schema
-- ============================================================
-- Run this in the Supabase SQL Editor or via supabase db push

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'marketer', 'telesale');
CREATE TYPE content_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'published');
CREATE TYPE content_stage AS ENUM ('stage_0', 'stage_2');
CREATE TYPE patient_status AS ENUM ('new', 'contacted', 'booked', 'treated', 'follow_up', 'lost');
CREATE TYPE lead_status AS ENUM ('new', 'calling', 'interested', 'booked', 'rejected', 'invalid');
CREATE TYPE campaign_channel AS ENUM ('facebook', 'google', 'tiktok', 'zalo', 'youtube', 'referral', 'organic', 'other');
CREATE TYPE booking_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- ============================================================
-- TABLE: clinics (multi-tenant support)
-- ============================================================

CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  website TEXT,
  tax_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'telesale',
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: patients
-- ============================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  source TEXT,                         -- e.g. 'facebook_ad', 'referral', 'walk_in'
  source_campaign_id UUID,             -- FK to campaigns (added later)
  status patient_status DEFAULT 'new',
  assigned_telesale_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: content (Trend & Content pipeline)
-- ============================================================

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  content_type TEXT DEFAULT 'post',    -- 'post', 'video_script', 'ad_copy', 'article'
  stage content_stage DEFAULT 'stage_0',
  status content_status DEFAULT 'draft',
  keywords TEXT[] DEFAULT '{}',
  platform TEXT[] DEFAULT '{}',        -- 'facebook', 'tiktok', 'website', etc.
  thumbnail_url TEXT,
  media_urls TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: content_reviews (Giai đoạn 1 — Medical & Legal Review)
-- ============================================================

CREATE TABLE content_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status content_status NOT NULL DEFAULT 'pending_review',
  medical_approved BOOLEAN,
  legal_approved BOOLEAN,
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: campaigns (Giai đoạn 4 — Campaign & Booking)
-- ============================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel campaign_channel DEFAULT 'facebook',
  budget NUMERIC(12, 2) DEFAULT 0,
  spent NUMERIC(12, 2) DEFAULT 0,
  cpl NUMERIC(12, 2) GENERATED ALWAYS AS (
    CASE WHEN total_leads > 0 THEN spent / total_leads ELSE 0 END
  ) STORED,
  cac NUMERIC(12, 2) DEFAULT 0,        -- updated via trigger/function
  total_leads INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from patients to campaigns
ALTER TABLE patients ADD CONSTRAINT fk_patient_campaign
  FOREIGN KEY (source_campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE: leads (Giai đoạn 4)
-- ============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status lead_status DEFAULT 'new',
  source TEXT,
  utm_data JSONB DEFAULT '{}',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  call_count INTEGER DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: bookings (Giai đoạn 4 & 5)
-- ============================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status booking_status DEFAULT 'scheduled',
  service TEXT,
  service_fee NUMERIC(12, 2),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_clinic ON profiles(clinic_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_telesale ON patients(assigned_telesale_id);
CREATE INDEX idx_content_clinic ON content(clinic_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_stage ON content(stage);
CREATE INDEX idx_campaigns_clinic ON campaigns(clinic_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_bookings_clinic ON bookings(clinic_id);
CREATE INDEX idx_bookings_patient ON bookings(patient_id);
CREATE INDEX idx_bookings_doctor ON bookings(doctor_id);
CREATE INDEX idx_bookings_booked_at ON bookings(booked_at);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Get current user's clinic_id
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid()
$$;

-- Check if current user has a given role
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = check_role
  )
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS — updated_at
-- ============================================================

CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT := '';
  avatar_val TEXT := NULL;
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    IF NEW.raw_user_meta_data ? 'full_name' THEN
      name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    END IF;
    IF NEW.raw_user_meta_data ? 'avatar_url' THEN
      avatar_val := NEW.raw_user_meta_data->>'avatar_url';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    name_val,
    avatar_val
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- CLINICS policies
-- ──────────────────────────────────────────────
CREATE POLICY "clinics_select" ON clinics FOR SELECT
  USING (id = get_my_clinic_id());

CREATE POLICY "clinics_admin_all" ON clinics FOR ALL
  USING (get_my_role() = 'admin');

-- ──────────────────────────────────────────────
-- PROFILES policies
-- ──────────────────────────────────────────────
CREATE POLICY "profiles_select_own_clinic" ON profiles FOR SELECT
  USING (clinic_id = get_my_clinic_id() OR id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (get_my_role() = 'admin');

-- ──────────────────────────────────────────────
-- PATIENTS policies
-- ──────────────────────────────────────────────
CREATE POLICY "patients_admin_all" ON patients FOR ALL
  USING (get_my_role() = 'admin' AND clinic_id = get_my_clinic_id());

CREATE POLICY "patients_telesale_own" ON patients FOR ALL
  USING (
    get_my_role() = 'telesale'
    AND clinic_id = get_my_clinic_id()
    AND assigned_telesale_id = auth.uid()
  );

CREATE POLICY "patients_doctor_read" ON patients FOR SELECT
  USING (
    get_my_role() = 'doctor'
    AND clinic_id = get_my_clinic_id()
  );

CREATE POLICY "patients_marketer_read" ON patients FOR SELECT
  USING (
    get_my_role() = 'marketer'
    AND clinic_id = get_my_clinic_id()
  );

-- ──────────────────────────────────────────────
-- CONTENT policies
-- ──────────────────────────────────────────────
CREATE POLICY "content_admin_all" ON content FOR ALL
  USING (get_my_role() = 'admin' AND clinic_id = get_my_clinic_id());

CREATE POLICY "content_marketer_all" ON content FOR ALL
  USING (get_my_role() = 'marketer' AND clinic_id = get_my_clinic_id());

CREATE POLICY "content_doctor_read" ON content FOR SELECT
  USING (
    get_my_role() = 'doctor'
    AND clinic_id = get_my_clinic_id()
    AND status IN ('pending_review', 'approved', 'rejected', 'published')
  );

-- ──────────────────────────────────────────────
-- CONTENT_REVIEWS policies
-- ──────────────────────────────────────────────
CREATE POLICY "reviews_admin_all" ON content_reviews FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "reviews_doctor_all" ON content_reviews FOR ALL
  USING (get_my_role() = 'doctor' AND reviewer_id = auth.uid());

CREATE POLICY "reviews_marketer_read" ON content_reviews FOR SELECT
  USING (get_my_role() = 'marketer');

-- ──────────────────────────────────────────────
-- CAMPAIGNS policies
-- ──────────────────────────────────────────────
CREATE POLICY "campaigns_admin_all" ON campaigns FOR ALL
  USING (get_my_role() = 'admin' AND clinic_id = get_my_clinic_id());

CREATE POLICY "campaigns_marketer_all" ON campaigns FOR ALL
  USING (get_my_role() = 'marketer' AND clinic_id = get_my_clinic_id());

CREATE POLICY "campaigns_telesale_read" ON campaigns FOR SELECT
  USING (get_my_role() = 'telesale' AND clinic_id = get_my_clinic_id());

-- ──────────────────────────────────────────────
-- LEADS policies
-- ──────────────────────────────────────────────
CREATE POLICY "leads_admin_all" ON leads FOR ALL
  USING (get_my_role() = 'admin' AND clinic_id = get_my_clinic_id());

CREATE POLICY "leads_marketer_read" ON leads FOR SELECT
  USING (get_my_role() = 'marketer' AND clinic_id = get_my_clinic_id());

CREATE POLICY "leads_telesale_own" ON leads FOR ALL
  USING (
    get_my_role() = 'telesale'
    AND clinic_id = get_my_clinic_id()
    AND assigned_to = auth.uid()
  );

-- ──────────────────────────────────────────────
-- BOOKINGS policies
-- ──────────────────────────────────────────────
CREATE POLICY "bookings_admin_all" ON bookings FOR ALL
  USING (get_my_role() = 'admin' AND clinic_id = get_my_clinic_id());

CREATE POLICY "bookings_doctor_own" ON bookings FOR SELECT
  USING (get_my_role() = 'doctor' AND doctor_id = auth.uid());

CREATE POLICY "bookings_telesale_clinic" ON bookings FOR ALL
  USING (
    get_my_role() = 'telesale'
    AND clinic_id = get_my_clinic_id()
    AND created_by = auth.uid()
  );

CREATE POLICY "bookings_marketer_read" ON bookings FOR SELECT
  USING (get_my_role() = 'marketer' AND clinic_id = get_my_clinic_id());

-- ============================================================
-- SEED: Default clinic (for development)
-- ============================================================

INSERT INTO clinics (id, name, address, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Phòng khám Demo',
  'Hà Nội, Việt Nam',
  'admin@clinic.demo'
) ON CONFLICT DO NOTHING;
