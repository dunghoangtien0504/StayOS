-- StayOS Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor → New Query

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists properties (
  id            text primary key,
  name          text not null,
  address       text default '',
  check_in_time  text default '14:00',
  check_out_time text default '12:00'
);

create table if not exists rooms (
  id          text primary key,
  property_id text references properties(id) on delete cascade not null,
  name        text not null,
  room_type   text default 'Standard',
  status      text default 'clean',
  floor       integer default 1,
  base_price  integer default 0
);

create table if not exists guests (
  id          text primary key,
  name        text not null,
  phone       text default '',
  email       text,
  id_card     text,
  nationality text default 'Việt Nam',
  notes       text,
  created_at  timestamptz default now()
);

create table if not exists bookings (
  id               text primary key,
  property_id      text not null,
  room_id          text references rooms(id) not null,
  guest_name       text not null,
  guest_phone      text default '',
  source           text default 'direct',
  status           text default 'confirmed',
  check_in         timestamptz not null,
  check_out        timestamptz not null,
  actual_check_in  timestamptz,
  actual_check_out timestamptz,
  total_price      integer default 0,
  amount_paid      integer default 0,
  payments         jsonb default '[]'::jsonb,
  created_at       timestamptz default now()
);

create table if not exists staff (
  id         text primary key,
  name       text not null,
  role       text default 'housekeeping',
  phone      text default '',
  active     boolean default true,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id          text primary key,
  property_id text,
  amount      integer not null,
  category    text default 'other',
  date        date not null,
  note        text default '',
  recurring   text
);

create table if not exists cleaning_assignments (
  id           text primary key,
  room_id      text references rooms(id) not null,
  booking_id   text references bookings(id),
  staff_id     text,
  staff_name   text,
  status       text default 'pending',
  photos       jsonb default '[]'::jsonb,
  notes        text,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

-- Single-row settings table (id always = 'main')
create table if not exists settings (
  id   text primary key default 'main',
  data jsonb not null default '{}'::jsonb
);

create table if not exists custom_labels (
  id    text primary key,
  name  text not null,
  color text not null,
  emoji text
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_bookings_room_id   on bookings(room_id);
create index if not exists idx_bookings_check_in  on bookings(check_in);
create index if not exists idx_bookings_check_out on bookings(check_out);
create index if not exists idx_bookings_status    on bookings(status);
create index if not exists idx_rooms_property_id  on rooms(property_id);
create index if not exists idx_expenses_date      on expenses(date);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Disabled for now (single-admin app). Enable + add policies when adding auth.

alter table properties          disable row level security;
alter table rooms               disable row level security;
alter table guests              disable row level security;
alter table bookings            disable row level security;
alter table staff               disable row level security;
alter table expenses            disable row level security;
alter table cleaning_assignments disable row level security;
alter table settings            disable row level security;
alter table custom_labels       disable row level security;
