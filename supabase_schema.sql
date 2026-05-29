-- =============================================================
-- EFIN HR System — Full Database Schema
-- สร้างสำหรับ migration ไปยัง Supabase account ใหม่
-- วันที่: 2026-05-29
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =============================================================
-- HELPER: auto-update updated_at
-- =============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- 1. COMPANIES
-- =============================================================
create table if not exists hr_companies (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  name_th         text not null,
  name_en         text,
  is_active       boolean default true,
  tax_id          text,
  registration_no text,
  address_th      text,
  address_en      text,
  phone           text,
  fax             text,
  email           text,
  website         text,
  logo_url        text,
  authorized_signatory   text,
  signatory_position     text,
  social_security_no     text,
  social_security_branch text,
  bank_name        text,
  bank_branch      text,
  bank_account_no  text,
  bank_account_name text,
  provident_fund_name text,
  provident_fund_no   text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create trigger trg_hr_companies_updated_at
  before update on hr_companies
  for each row execute function update_updated_at();

-- =============================================================
-- 2. DEPARTMENTS
-- =============================================================
create table if not exists hr_departments (
  id        uuid primary key default uuid_generate_v4(),
  name_th   text not null,
  name_en   text,
  parent_id uuid references hr_departments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_hr_departments_updated_at
  before update on hr_departments
  for each row execute function update_updated_at();

-- =============================================================
-- 3. EMPLOYEES
-- =============================================================
create table if not exists hr_employees (
  id                    uuid primary key default uuid_generate_v4(),
  employee_code         text unique not null,
  prefix_th             text,
  first_name_th         text,
  last_name_th          text,
  first_name_en         text,
  last_name_en          text,
  nickname              text,
  email                 text,
  phone                 text,
  gender                text,                          -- 'M' | 'F' | 'other'
  date_of_birth         date,
  national_id           text,
  tax_id                text,
  department_id         uuid references hr_departments(id) on delete set null,
  position_th           text,
  position_en           text,
  level                 text,                          -- 'G3'..'G9'
  cost_center           text,
  bu                    text,
  hire_date             date,
  status                text default 'active',         -- 'active' | 'inactive' | 'resigned'
  employment_type       text,                          -- 'fulltime' | 'parttime' | 'contract'
  company_entity        text references hr_companies(code) on delete set null,
  base_salary           numeric(15,2),
  position_allowance    numeric(15,2),
  transport_allowance   numeric(15,2),
  housing_allowance     numeric(15,2),
  payroll_cycle         text,                          -- 'monthly' | 'bi-monthly'
  bank_name             text,
  bank_account          text,
  social_security_no    text,
  sso_hospital          text,
  sso_rate              numeric(5,4),
  pvd_employee_rate     numeric(5,4),
  pvd_employer_rate     numeric(5,4),
  tax_filing_status     text,
  num_dependents        integer default 0,
  registered_address    text,
  address               text,
  resignation_date      date,
  resignation_reason    text,
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,
  system_role           text default 'employee',       -- 'employee' | 'manager' | 'admin' | 'superuser'
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
create index idx_hr_employees_company on hr_employees(company_entity);
create index idx_hr_employees_department on hr_employees(department_id);
create index idx_hr_employees_status on hr_employees(status);
create trigger trg_hr_employees_updated_at
  before update on hr_employees
  for each row execute function update_updated_at();

-- =============================================================
-- 4. USER PROFILES  (linked to Supabase Auth users)
-- =============================================================
create table if not exists hr_user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  employee_id  uuid references hr_employees(id) on delete set null,
  role         text default 'employee',   -- 'employee' | 'manager' | 'admin' | 'superuser'
  display_name text,
  email        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create trigger trg_hr_user_profiles_updated_at
  before update on hr_user_profiles
  for each row execute function update_updated_at();

-- =============================================================
-- 5. LEAVE TYPES
-- =============================================================
create table if not exists hr_leave_types (
  id       uuid primary key default uuid_generate_v4(),
  name_th  text not null,
  name_en  text,
  created_at timestamptz default now()
);

-- =============================================================
-- 6. LEAVE REQUESTS
-- =============================================================
create table if not exists hr_leave_requests (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references hr_employees(id) on delete cascade,
  leave_type_id uuid references hr_leave_types(id) on delete set null,
  start_date    date not null,
  end_date      date not null,
  days          numeric(5,1),
  reason        text,
  status        text default 'pending',   -- 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by   uuid references hr_user_profiles(id) on delete set null,
  approved_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index idx_hr_leave_requests_employee on hr_leave_requests(employee_id);
create index idx_hr_leave_requests_status on hr_leave_requests(status);
create trigger trg_hr_leave_requests_updated_at
  before update on hr_leave_requests
  for each row execute function update_updated_at();

-- =============================================================
-- 7. LEAVE BALANCES
-- =============================================================
create table if not exists hr_leave_balances (
  id             uuid primary key default uuid_generate_v4(),
  employee_id    uuid not null references hr_employees(id) on delete cascade,
  leave_type_id  uuid references hr_leave_types(id) on delete cascade,
  entitled_days  numeric(5,1) default 0,
  used_days      numeric(5,1) default 0,
  remaining_days numeric(5,1) default 0,
  year           integer not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(employee_id, leave_type_id, year)
);
create trigger trg_hr_leave_balances_updated_at
  before update on hr_leave_balances
  for each row execute function update_updated_at();

-- =============================================================
-- 8. HOLIDAYS
-- =============================================================
create table if not exists hr_holidays (
  id       uuid primary key default uuid_generate_v4(),
  date     date not null unique,
  name_th  text not null,
  name_en  text,
  type     text,     -- 'national' | 'company' | 'optional'
  created_at timestamptz default now()
);

-- =============================================================
-- 9. TIME ATTENDANCE
-- =============================================================
create table if not exists hr_time_attendance (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references hr_employees(id) on delete cascade,
  date        date not null,
  check_in    time,
  check_out   time,
  source      text,    -- 'manual' | 'import' | 'biometric'
  notes       text,    -- key-value string: "ขาด: 0 | สาย: 1 | ..."
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(employee_id, date)
);
create index idx_hr_time_attendance_employee on hr_time_attendance(employee_id);
create index idx_hr_time_attendance_date on hr_time_attendance(date);
create trigger trg_hr_time_attendance_updated_at
  before update on hr_time_attendance
  for each row execute function update_updated_at();

-- =============================================================
-- 10. PAYROLL
-- =============================================================
create table if not exists hr_payroll (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references hr_employees(id) on delete cascade,
  pay_period      date not null,            -- first day of month: '2025-05-01'
  base_salary     numeric(15,2) default 0,
  position_allowance  numeric(15,2) default 0,
  transport_allowance numeric(15,2) default 0,
  housing_allowance   numeric(15,2) default 0,
  overtime_pay    numeric(15,2) default 0,
  other_income    numeric(15,2) default 0,
  sso_employee    numeric(15,2) default 0,
  pvd_employee    numeric(15,2) default 0,
  pvd_employer    numeric(15,2) default 0,
  withholding_tax numeric(15,2) default 0,
  other_deduction numeric(15,2) default 0,
  net_pay         numeric(15,2) default 0,
  status          text default 'calculated', -- 'calculated' | 'approved' | 'paid'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(employee_id, pay_period)
);
create index idx_hr_payroll_period on hr_payroll(pay_period);
create trigger trg_hr_payroll_updated_at
  before update on hr_payroll
  for each row execute function update_updated_at();

-- =============================================================
-- 11. RECRUITMENT
-- =============================================================
create table if not exists hr_recruitment (
  id              uuid primary key default uuid_generate_v4(),
  position_title  text not null,
  headcount       integer default 1,
  status          text default 'open',   -- 'open' | 'filled' | 'cancelled' | 'on_hold' | 'draft'
  employment_type text,
  open_date       date,
  close_date      date,
  job_description text,
  notes           text,    -- key-value: "WAMS: xxx | BU: xxx | ฝ่าย: xxx | ประเภท: เพิ่ม/ทดแทน"
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create trigger trg_hr_recruitment_updated_at
  before update on hr_recruitment
  for each row execute function update_updated_at();

-- =============================================================
-- 12. PERFORMANCE REVIEWS
-- =============================================================
create table if not exists hr_performance_reviews (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid references hr_employees(id) on delete cascade,
  employee_code text,
  period        text,       -- '2024-Q4'
  boss_score    numeric(4,2),
  self_score    numeric(4,2),
  avg_score     numeric(4,2),
  grade         text,       -- 'A' | 'B+' | 'B' | 'C+' | 'C'
  status        text default 'pending',  -- 'pending' | 'completed'
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index idx_hr_performance_employee on hr_performance_reviews(employee_id);
create trigger trg_hr_performance_updated_at
  before update on hr_performance_reviews
  for each row execute function update_updated_at();

-- =============================================================
-- 13. PROBATION EVALUATIONS
-- =============================================================
create table if not exists hr_probation_evaluations (
  id                uuid primary key default uuid_generate_v4(),
  employee_id       uuid references hr_employees(id) on delete set null,
  employee_name     text,
  employee_code     text,
  position_title    text,
  department        text,
  start_date        date,
  evaluator_name    text,
  evaluation_round  integer not null,   -- 1 | 2 | 3
  period_start      date,
  period_end        date,
  due_date          date,
  round_objectives  text,
  criteria          jsonb,   -- [{id, name, description, weight, score}]
  strengths         text,
  improvements      text,
  next_action       text,
  total_score       numeric(5,2),
  grade             text,    -- 'A' | 'B+' | 'B' | 'C'
  decision          text default 'pending',  -- 'pending' | 'passed' | 'extended' | 'failed'
  status            text default 'pending',  -- 'pending' | 'in_progress' | 'completed'
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index idx_hr_probation_employee on hr_probation_evaluations(employee_id);
create trigger trg_hr_probation_updated_at
  before update on hr_probation_evaluations
  for each row execute function update_updated_at();

-- =============================================================
-- 14. TRAINING COURSES
-- =============================================================
create table if not exists hr_training_courses (
  id             uuid primary key default uuid_generate_v4(),
  name_th        text not null,
  name_en        text,
  category       text,    -- 'Technical' | 'Soft Skills' | 'Leadership' | 'Compliance' | 'Digital'
  description    text,
  duration_hours numeric(6,1),
  is_active      boolean default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create trigger trg_hr_training_courses_updated_at
  before update on hr_training_courses
  for each row execute function update_updated_at();

-- =============================================================
-- 15. TRAINING (sessions)
-- =============================================================
create table if not exists hr_training (
  id                uuid primary key default uuid_generate_v4(),
  course_id         uuid references hr_training_courses(id) on delete set null,
  course_name       text,
  start_date        date,
  end_date          date,
  hours             numeric(6,1),
  participants_count integer default 0,
  budget            numeric(15,2),
  status            text default 'registering',  -- 'registering' | 'ongoing' | 'completed' | 'cancelled'
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create trigger trg_hr_training_updated_at
  before update on hr_training
  for each row execute function update_updated_at();

-- Training participants join table
create table if not exists hr_training_participants (
  id          uuid primary key default uuid_generate_v4(),
  training_id uuid not null references hr_training(id) on delete cascade,
  employee_id uuid not null references hr_employees(id) on delete cascade,
  status      text default 'registered',   -- 'registered' | 'attended' | 'passed' | 'failed'
  created_at  timestamptz default now(),
  unique(training_id, employee_id)
);

-- =============================================================
-- 16. ASSETS
-- =============================================================
create table if not exists hr_assets (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid references hr_employees(id) on delete set null,
  asset_code      text unique,
  name            text not null,
  category        text,    -- 'computer' | 'phone' | 'vehicle' | 'furniture' | etc.
  brand           text,
  model           text,
  serial_number   text,
  purchase_date   date,
  warranty_expire date,
  value           numeric(15,2),
  condition       text default 'good',    -- 'good' | 'fair' | 'poor' | 'damaged'
  status          text default 'in_use',  -- 'in_use' | 'available' | 'maintenance' | 'disposed'
  location        text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create trigger trg_hr_assets_updated_at
  before update on hr_assets
  for each row execute function update_updated_at();

-- =============================================================
-- 17. EXPENSES
-- =============================================================
create table if not exists hr_expenses (
  id           uuid primary key default uuid_generate_v4(),
  employee_id  uuid not null references hr_employees(id) on delete cascade,
  submitted_by uuid references hr_user_profiles(id) on delete set null,
  category     text,
  description  text,
  amount       numeric(15,2) not null,
  expense_date date,
  receipt_url  text,
  status       text default 'pending',   -- 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by  uuid references hr_user_profiles(id) on delete set null,
  approved_at  timestamptz,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create trigger trg_hr_expenses_updated_at
  before update on hr_expenses
  for each row execute function update_updated_at();

-- =============================================================
-- 18. ANNOUNCEMENTS
-- =============================================================
create table if not exists hr_announcements (
  id           uuid primary key default uuid_generate_v4(),
  title_th     text not null,
  title_en     text,
  body_th      text,
  body_en      text,
  category     text,
  is_active    boolean default true,
  publish_date date,
  expire_date  date,
  created_by   uuid references hr_user_profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create trigger trg_hr_announcements_updated_at
  before update on hr_announcements
  for each row execute function update_updated_at();

-- =============================================================
-- 19. ONBOARDING
-- =============================================================
create table if not exists hr_onboarding (
  id             uuid primary key default uuid_generate_v4(),
  employee_id    uuid not null references hr_employees(id) on delete cascade,
  checklist      jsonb,     -- [{id, label, done, due_date}]
  status         text default 'in_progress',  -- 'in_progress' | 'completed'
  start_date     date,
  completed_date date,
  assigned_to    uuid references hr_user_profiles(id) on delete set null,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create trigger trg_hr_onboarding_updated_at
  before update on hr_onboarding
  for each row execute function update_updated_at();

-- =============================================================
-- 20. OFFBOARDING
-- =============================================================
create table if not exists hr_offboarding (
  id                uuid primary key default uuid_generate_v4(),
  employee_id       uuid not null references hr_employees(id) on delete cascade,
  resignation_date  date,
  last_working_date date,
  reason            text,
  checklist         jsonb,
  status            text default 'in_progress',
  clearance_status  text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create trigger trg_hr_offboarding_updated_at
  before update on hr_offboarding
  for each row execute function update_updated_at();

-- =============================================================
-- 21. EMPLOYEE RELATIONS  (วินัย / ร้องทุกข์)
-- =============================================================
create table if not exists hr_employee_relations (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references hr_employees(id) on delete cascade,
  type          text,       -- 'disciplinary' | 'grievance' | 'counseling' | 'commendation'
  description   text,
  occurred_date date,
  resolved_date date,
  resolution    text,
  severity      text,       -- 'low' | 'medium' | 'high'
  status        text default 'open',   -- 'open' | 'investigating' | 'resolved' | 'closed'
  created_by    uuid references hr_user_profiles(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create trigger trg_hr_employee_relations_updated_at
  before update on hr_employee_relations
  for each row execute function update_updated_at();

-- =============================================================
-- 22. DOCUMENT REQUESTS  (คำขอเอกสาร)
-- =============================================================
create table if not exists hr_document_requests (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references hr_employees(id) on delete cascade,
  document_type text,   -- 'employment_cert' | 'salary_cert' | 'tax_form' | etc.
  purpose       text,
  request_date  date,
  required_date date,
  status        text default 'pending',   -- 'pending' | 'processing' | 'ready' | 'issued'
  issued_date   date,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create trigger trg_hr_document_requests_updated_at
  before update on hr_document_requests
  for each row execute function update_updated_at();

-- =============================================================
-- 23. WELFARE RECORDS
-- =============================================================
create table if not exists welfare_records (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references hr_employees(id) on delete cascade,
  type        text,   -- 'health' | 'dental' | 'vision' | 'life_insurance' | 'loan' | etc.
  amount      numeric(15,2),
  description text,
  date        date,
  status      text default 'active',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger trg_welfare_records_updated_at
  before update on welfare_records
  for each row execute function update_updated_at();

-- =============================================================
-- 24. COST EMPLOYEE (ต้นทุนต่อชั่วโมงรายบุคคล)
-- =============================================================
create table if not exists hr_cost_employee (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references hr_employees(id) on delete cascade,
  cost_per_hour numeric(12,4) not null,
  effective_date date,
  created_at    timestamptz default now(),
  unique(employee_id, effective_date)
);

-- =============================================================
-- 25. COST ALLOCATION  (การจัดสรรต้นทุนรายเดือน)
-- =============================================================
create table if not exists hr_cost_allocation (
  id            uuid primary key default uuid_generate_v4(),
  period_month  text not null,   -- 'YYYY-MM'
  employee_id   uuid references hr_employees(id) on delete cascade,
  department_id uuid references hr_departments(id) on delete set null,
  cost_type     text,
  cost_amount   numeric(15,2),
  notes         text,
  created_at    timestamptz default now()
);
create index idx_hr_cost_allocation_period on hr_cost_allocation(period_month);

-- =============================================================
-- 26. HOURS ALLOCATION  (การจัดสรรชั่วโมงรายเดือน)
-- =============================================================
create table if not exists hr_hours_allocation (
  id            uuid primary key default uuid_generate_v4(),
  period_month  text not null,   -- 'YYYY-MM'
  employee_id   uuid references hr_employees(id) on delete cascade,
  hours         numeric(8,2),
  project_code  text,
  notes         text,
  created_at    timestamptz default now()
);
create index idx_hr_hours_allocation_period on hr_hours_allocation(period_month);

-- =============================================================
-- 27. SETTINGS  (ค่าตั้งต่อระบบ)
-- =============================================================
create table if not exists hr_settings (
  id            uuid primary key default uuid_generate_v4(),
  setting_key   text unique not null,
  setting_value text,
  updated_at    timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- enable RLS — policies ต้องสร้างให้ตรงกับ roles ที่ใช้ในแอป
-- =============================================================
alter table hr_companies             enable row level security;
alter table hr_departments           enable row level security;
alter table hr_employees             enable row level security;
alter table hr_user_profiles         enable row level security;
alter table hr_leave_types           enable row level security;
alter table hr_leave_requests        enable row level security;
alter table hr_leave_balances        enable row level security;
alter table hr_holidays              enable row level security;
alter table hr_time_attendance       enable row level security;
alter table hr_payroll               enable row level security;
alter table hr_recruitment           enable row level security;
alter table hr_performance_reviews   enable row level security;
alter table hr_probation_evaluations enable row level security;
alter table hr_training_courses      enable row level security;
alter table hr_training              enable row level security;
alter table hr_training_participants enable row level security;
alter table hr_assets                enable row level security;
alter table hr_expenses              enable row level security;
alter table hr_announcements         enable row level security;
alter table hr_onboarding            enable row level security;
alter table hr_offboarding           enable row level security;
alter table hr_employee_relations    enable row level security;
alter table hr_document_requests     enable row level security;
alter table welfare_records          enable row level security;
alter table hr_cost_employee         enable row level security;
alter table hr_cost_allocation       enable row level security;
alter table hr_hours_allocation      enable row level security;
alter table hr_settings              enable row level security;

-- =============================================================
-- RLS POLICIES
-- แอปใช้ Service Role / Anon key — อนุญาตให้ authenticated users เข้าถึงได้
-- (ปรับ policies ตาม role หากต้องการ row-level security ละเอียดขึ้น)
-- =============================================================

-- Helper: ดึง role ของ user ปัจจุบันจาก hr_user_profiles
create or replace function get_my_role()
returns text language sql stable as $$
  select role from hr_user_profiles where id = auth.uid()
$$;

-- Policy template: authenticated users อ่านได้ทั้งหมด, เขียนได้เฉพาะ admin/superuser
-- (ปรับแต่งตามต้องการ)

do $policy$ begin

  -- hr_companies
  if not exists (select 1 from pg_policies where tablename='hr_companies' and policyname='allow_read') then
    execute 'create policy allow_read on hr_companies for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='hr_companies' and policyname='allow_write') then
    execute 'create policy allow_write on hr_companies for all to authenticated using (get_my_role() in (''admin'',''superuser''))';
  end if;

  -- hr_departments
  if not exists (select 1 from pg_policies where tablename='hr_departments' and policyname='allow_read') then
    execute 'create policy allow_read on hr_departments for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='hr_departments' and policyname='allow_write') then
    execute 'create policy allow_write on hr_departments for all to authenticated using (get_my_role() in (''admin'',''superuser''))';
  end if;

  -- hr_employees
  if not exists (select 1 from pg_policies where tablename='hr_employees' and policyname='allow_read') then
    execute 'create policy allow_read on hr_employees for select to authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where tablename='hr_employees' and policyname='allow_write') then
    execute 'create policy allow_write on hr_employees for all to authenticated using (get_my_role() in (''admin'',''superuser''))';
  end if;

  -- hr_user_profiles
  if not exists (select 1 from pg_policies where tablename='hr_user_profiles' and policyname='allow_own') then
    execute 'create policy allow_own on hr_user_profiles for select to authenticated using (id = auth.uid() or get_my_role() in (''admin'',''superuser''))';
  end if;
  if not exists (select 1 from pg_policies where tablename='hr_user_profiles' and policyname='allow_write') then
    execute 'create policy allow_write on hr_user_profiles for all to authenticated using (get_my_role() in (''admin'',''superuser''))';
  end if;

end $policy$;

-- สำหรับตารางที่เหลือ: อนุญาต authenticated users ทำทุกอย่าง (ปรับตามต้องการ)
create policy allow_all on hr_leave_types        for all to authenticated using (true) with check (true);
create policy allow_all on hr_leave_requests     for all to authenticated using (true) with check (true);
create policy allow_all on hr_leave_balances     for all to authenticated using (true) with check (true);
create policy allow_all on hr_holidays           for all to authenticated using (true) with check (true);
create policy allow_all on hr_time_attendance    for all to authenticated using (true) with check (true);
create policy allow_all on hr_payroll            for all to authenticated using (true) with check (true);
create policy allow_all on hr_recruitment        for all to authenticated using (true) with check (true);
create policy allow_all on hr_performance_reviews      for all to authenticated using (true) with check (true);
create policy allow_all on hr_probation_evaluations    for all to authenticated using (true) with check (true);
create policy allow_all on hr_training_courses         for all to authenticated using (true) with check (true);
create policy allow_all on hr_training                 for all to authenticated using (true) with check (true);
create policy allow_all on hr_training_participants    for all to authenticated using (true) with check (true);
create policy allow_all on hr_assets                   for all to authenticated using (true) with check (true);
create policy allow_all on hr_expenses                 for all to authenticated using (true) with check (true);
create policy allow_all on hr_announcements            for all to authenticated using (true) with check (true);
create policy allow_all on hr_onboarding               for all to authenticated using (true) with check (true);
create policy allow_all on hr_offboarding              for all to authenticated using (true) with check (true);
create policy allow_all on hr_employee_relations       for all to authenticated using (true) with check (true);
create policy allow_all on hr_document_requests        for all to authenticated using (true) with check (true);
create policy allow_all on welfare_records             for all to authenticated using (true) with check (true);
create policy allow_all on hr_cost_employee            for all to authenticated using (true) with check (true);
create policy allow_all on hr_cost_allocation          for all to authenticated using (true) with check (true);
create policy allow_all on hr_hours_allocation         for all to authenticated using (true) with check (true);
create policy allow_all on hr_settings                 for all to authenticated using (true) with check (true);

-- =============================================================
-- DEFAULT DATA
-- =============================================================

-- Leave types เริ่มต้น
insert into hr_leave_types (name_th, name_en) values
  ('ลาพักร้อน',    'Annual Leave'),
  ('ลาป่วย',       'Sick Leave'),
  ('ลากิจ',        'Personal Leave'),
  ('ลาคลอด',       'Maternity Leave'),
  ('ลาบวช',        'Ordination Leave'),
  ('ลาศึกษาต่อ',  'Study Leave'),
  ('ลาไม่รับเงิน', 'Unpaid Leave')
on conflict do nothing;

-- Settings เริ่มต้น
insert into hr_settings (setting_key, setting_value) values
  ('app_name',       'EFIN HR System'),
  ('default_lang',   'th'),
  ('fiscal_year_start', '01'),
  ('sso_rate',       '0.05'),
  ('sso_max',        '750')
on conflict (setting_key) do nothing;
