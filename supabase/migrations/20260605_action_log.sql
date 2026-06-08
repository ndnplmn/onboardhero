-- Action log: records key events across the hire onboarding journey
-- Used to surface "your manager reviewed your progress" style signals to hires
-- and to give managers a lightweight audit trail.

create table if not exists action_log (
  id           uuid primary key default gen_random_uuid(),
  journey_id   uuid not null references journeys(id) on delete cascade,
  actor_id     uuid references profiles(id) on delete set null,
  actor_role   text not null check (actor_role in ('hire', 'manager', 'hr', 'system')),
  action_type  text not null,
  label        text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index action_log_journey_id_idx on action_log(journey_id, created_at desc);

alter table action_log enable row level security;

-- Hires can read logs for their own journey
create policy "hire_read_own_action_log" on action_log
  for select using (
    journey_id in (
      select id from journeys where employee_id = auth.uid()
    )
  );

-- Managers can read logs for journeys they manage
create policy "manager_read_team_action_log" on action_log
  for select using (
    journey_id in (
      select id from journeys where manager_id = auth.uid()
    )
  );

-- HR can read all
create policy "hr_read_all_action_log" on action_log
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'hr')
  );

-- Service role (admin client) can insert — all writes go through server actions
create policy "service_insert_action_log" on action_log
  for insert with check (true);
