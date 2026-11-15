-- Wire Squad - Supabase schema for trust-mode online play.
--
-- Run this whole file once in the Supabase SQL editor. It creates the three
-- tables from the implementation plan (rooms, players, action_log) plus the
-- RPCs the browser uses. No Edge Function is needed in trust mode: every
-- client runs the same pure engine and posts the resulting state.
--
-- SECURITY NOTE - TRUST MODE
-- rooms.state contains every hand, including wire values. Row Level Security
-- only hides nothing here on purpose: anyone with the anon key can read the
-- full state. Play with friends only. The path to safe mode is documented in
-- Spec/BombBusters_05_Implementation_Plan.md section 3.2: move applyAction to
-- an Edge Function and split state into public_state + secret_wires.
--
-- The anon key is designed to be embedded in the client. Never embed the
-- service_role key.

-- ---------------------------------------------------------------------------
-- Tables

create table if not exists public.rooms (
  code text primary key check (code ~ '^[A-Z0-9]{4,8}$'),
  host_id uuid not null,
  status text not null default 'lobby'
    check (status in ('lobby', 'playing', 'paused', 'won', 'lost')),
  mission_id integer,
  max_players smallint not null default 5 check (max_players between 2 and 5),
  seed bigint,
  state jsonb,
  action_seq integer not null default 0 check (action_seq >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 24),
  seat smallint not null check (seat between 0 and 4),
  is_host boolean not null default false,
  ready boolean not null default false,
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  unique (room_code, seat)
);

-- Re-running this file upgrades a project created before P10a.
alter table public.rooms
  add column if not exists max_players smallint not null default 5
  check (max_players between 2 and 5);

alter table public.players
  add column if not exists ready boolean not null default false;

create table if not exists public.action_log (
  room_code text not null references public.rooms(code) on delete cascade,
  seq integer not null check (seq > 0),
  player_id uuid not null,
  action jsonb not null,
  created_at timestamptz not null default now(),
  primary key (room_code, seq)
);

create index if not exists players_room_seat
  on public.players (room_code, seat);

create index if not exists action_log_room_seq
  on public.action_log (room_code, seq);

-- ---------------------------------------------------------------------------
-- Trust-mode access: clients may read, but only the RPCs below may write.
-- Each RPC runs as the table owner (security definer) and validates its input.

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.action_log enable row level security;

drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select using (true);

drop policy if exists players_read on public.players;
create policy players_read on public.players
  for select using (true);

drop policy if exists action_log_read on public.action_log;
create policy action_log_read on public.action_log
  for select using (true);

-- ---------------------------------------------------------------------------
-- create_room: make a lobby and seat the host at 0.
--
-- The browser retries with a new code when the insert reports a collision
-- (SQLSTATE 23505 / PostgREST code 23505).

create or replace function public.create_room(
  p_code text,
  p_host_id uuid,
  p_host_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  if p_code is null or p_code !~ '^[A-Z0-9]{4,8}$' then
    raise exception 'invalid room code' using errcode = '22023';
  end if;
  if p_host_name is null or char_length(btrim(p_host_name)) not between 1 and 24 then
    raise exception 'invalid player name' using errcode = '22023';
  end if;

  insert into public.rooms (code, host_id) values (p_code, p_host_id);

  insert into public.players (id, room_code, name, seat, is_host)
  values (p_host_id, p_code, btrim(p_host_name), 0, true);

  select * into v_room from public.rooms where code = p_code;

  return jsonb_build_object(
    'code', v_room.code,
    'status', v_room.status,
    'seat', 0,
    'rejoined', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- join_room: add a player to the first free seat, or let a known player back in.
--
-- Rejoining with the same player id works after the game started. Joining a new
-- id is only allowed while the room is still in the lobby.

create or replace function public.join_room(
  p_code text,
  p_player_id uuid,
  p_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_existing public.players;
  v_seat smallint;
  v_count integer;
begin
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then
    raise exception 'invalid player name' using errcode = '22023';
  end if;

  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  select * into v_existing
  from public.players
  where id = p_player_id and room_code = p_code;

  if found then
    update public.players
    set last_seen = now(), name = btrim(p_name)
    where id = p_player_id;
    return jsonb_build_object(
      'code', p_code,
      'status', v_room.status,
      'seat', v_existing.seat,
      'rejoined', true
    );
  end if;

  if v_room.status <> 'lobby' then
    raise exception 'game already started' using errcode = '55000';
  end if;

  select count(*) into v_count
  from public.players
  where room_code = p_code;

  if v_count >= coalesce(v_room.max_players, 5) then
    raise exception 'room is full' using errcode = '55000';
  end if;

  select min(candidate.seat) into v_seat
  from generate_series(0, 4) as candidate(seat)
  where candidate.seat not in (
    select seat from public.players where room_code = p_code
  );

  if v_seat is null then
    raise exception 'room is full' using errcode = '55000';
  end if;

  insert into public.players (id, room_code, name, seat)
  values (p_player_id, p_code, btrim(p_name), v_seat);

  return jsonb_build_object(
    'code', p_code,
    'status', v_room.status,
    'seat', v_seat,
    'rejoined', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- start_game: the host writes the initial engine state and the seed.
--
-- The host builds the state locally with newGame({ missionId, players, seed })
-- using the seated names, then sends it here.

create or replace function public.start_game(
  p_code text,
  p_player_id uuid,
  p_state jsonb,
  p_mission_id integer,
  p_seed bigint
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.host_id <> p_player_id then
    raise exception 'only the host can start the game' using errcode = '42501';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'game already started' using errcode = '55000';
  end if;
  if p_state is null then
    raise exception 'missing game state' using errcode = '22023';
  end if;
  if (select count(*) from public.players where room_code = p_code)
      not between 2 and coalesce(v_room.max_players, 5) then
    raise exception 'need 2-5 players to start' using errcode = '55000';
  end if;

  update public.rooms
  set status = 'playing',
      state = p_state,
      mission_id = p_mission_id,
      seed = p_seed,
      action_seq = 0,
      updated_at = now()
  where code = p_code;

  return jsonb_build_object('code', p_code, 'status', 'playing', 'action_seq', 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_action: append one action and replace the state, with optimistic
-- concurrency on action_seq.
--
-- The client sends the seq it based its move on. A mismatch means another
-- player acted first; the client refetches instead of overwriting. The RPC
-- also derives the room status from the new state so won/lost rooms stop
-- accepting moves.

create or replace function public.submit_action(
  p_code text,
  p_player_id uuid,
  p_base_seq integer,
  p_action jsonb,
  p_state jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_seq integer;
  v_phase text;
  v_status text;
begin
  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.status not in ('playing', 'paused') then
    raise exception 'room is not playing' using errcode = '55000';
  end if;
  if v_room.action_seq <> p_base_seq then
    -- PT409 makes PostgREST answer HTTP 409. Do not use SQLSTATE 40001 here:
    -- PostgREST automatically retries transactions that fail with
    -- serialization_failure, which would hang the request instead of telling
    -- the client to refetch.
    raise exception 'stale action: room is at seq %', v_room.action_seq
      using errcode = 'PT409';
  end if;
  if not exists (
    select 1 from public.players
    where id = p_player_id and room_code = p_code
  ) then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;
  if p_action is null or p_state is null then
    raise exception 'missing action or state' using errcode = '22023';
  end if;

  v_seq := v_room.action_seq + 1;
  v_phase := p_state ->> 'phase';
  v_status := case
    when v_phase in ('won', 'lost') then v_phase
    else 'playing'
  end;

  insert into public.action_log (room_code, seq, player_id, action)
  values (p_code, v_seq, p_player_id, p_action);

  update public.rooms
  set state = p_state,
      status = v_status,
      action_seq = v_seq,
      updated_at = now()
  where code = p_code;

  return jsonb_build_object('seq', v_seq, 'status', v_status, 'state', p_state);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_room_status: host pauses or resumes a room, for the disconnect flow.
--
-- The UI shows "Waiting for <name>" when a player's last_seen is stale; the
-- host can also pause explicitly. Starting or ending a game is not allowed
-- through this RPC.

create or replace function public.set_room_status(
  p_code text,
  p_player_id uuid,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  if p_status not in ('playing', 'paused') then
    raise exception 'status must be playing or paused' using errcode = '22023';
  end if;

  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.host_id <> p_player_id then
    raise exception 'only the host can change the room status' using errcode = '42501';
  end if;
  if v_room.status not in ('playing', 'paused') then
    raise exception 'room is not in a game' using errcode = '55000';
  end if;

  update public.rooms
  set status = p_status, updated_at = now()
  where code = p_code;

  return jsonb_build_object('code', p_code, 'status', p_status);
end;
$$;

-- ---------------------------------------------------------------------------
-- touch_player: heartbeat for presence. The client calls this every ~10s.

create or replace function public.touch_player(
  p_code text,
  p_player_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players;
begin
  update public.players
  set last_seen = now()
  where id = p_player_id and room_code = p_code
  returning * into v_player;

  if not found then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;

  return jsonb_build_object('seat', v_player.seat, 'last_seen', v_player.last_seen);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_ready: one player toggles their lobby ready state.
--
-- Optional P10a feature. A project running the older schema simply does not
-- have this RPC; the browser keeps working and treats connected players as
-- ready instead.

create or replace function public.set_ready(
  p_code text,
  p_player_id uuid,
  p_ready boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players;
begin
  update public.players
  set ready = coalesce(p_ready, false), last_seen = now()
  where id = p_player_id and room_code = p_code
  returning * into v_player;

  if not found then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;

  return jsonb_build_object('seat', v_player.seat, 'ready', v_player.ready);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_max_players: the host picks the target crew size (2-5) in the lobby.
-- New joins beyond that size are refused by join_room.

create or replace function public.set_max_players(
  p_code text,
  p_player_id uuid,
  p_max_players smallint
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  if p_max_players not between 2 and 5 then
    raise exception 'player count must be 2-5' using errcode = '22023';
  end if;

  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.host_id <> p_player_id then
    raise exception 'only the host can change the crew size' using errcode = '42501';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'the room is not in the lobby' using errcode = '55000';
  end if;
  if (select count(*) from public.players where room_code = p_code) > p_max_players then
    raise exception 'there are already more players in the room' using errcode = '55000';
  end if;

  update public.rooms
  set max_players = p_max_players, updated_at = now()
  where code = p_code;

  return jsonb_build_object('code', p_code, 'max_players', p_max_players);
end;
$$;

-- ---------------------------------------------------------------------------
-- leave_room: remove a player. The host may remove anyone in the lobby; in a
-- running game players remove themselves and the room waits for them.

create or replace function public.leave_room(
  p_code text,
  p_player_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
  v_new_host uuid;
begin
  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  -- In a running game nobody is removed: the room pauses and waits for the
  -- player to rejoin with the same player id, because their wires stay in the
  -- state. A leaving host hands the role to the lowest remaining seat.
  if v_room.status in ('playing', 'paused') then
    if v_room.host_id = p_player_id then
      select id into v_new_host
      from public.players
      where room_code = p_code and id <> p_player_id
      order by seat
      limit 1;
      if v_new_host is not null then
        update public.rooms set host_id = v_new_host where code = p_code;
      end if;
    end if;
    update public.players
    set last_seen = now() - interval '5 minutes'
    where room_code = p_code and id = p_player_id;
    update public.rooms
    set status = 'paused', updated_at = now()
    where code = p_code;
    return jsonb_build_object('code', p_code, 'closed', false, 'waiting', true);
  end if;

  -- In the lobby the host closes the room and anyone else just loses the seat.
  if v_room.host_id = p_player_id then
    delete from public.rooms where code = p_code;
    return jsonb_build_object('code', p_code, 'closed', true, 'waiting', false);
  end if;

  delete from public.players
  where room_code = p_code and id = p_player_id;

  return jsonb_build_object('code', p_code, 'closed', false, 'waiting', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- reset_room: after a won/lost mission the host returns the room to the lobby
-- so the same crew can play another mission without a new code.

create or replace function public.reset_room(
  p_code text,
  p_player_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  select * into v_room from public.rooms where code = p_code for update;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;
  if v_room.host_id <> p_player_id then
    raise exception 'only the host can reset the room' using errcode = '42501';
  end if;
  if v_room.status not in ('won', 'lost') then
    raise exception 'the mission is still running' using errcode = '55000';
  end if;

  delete from public.action_log where room_code = p_code;
  update public.players
  set ready = false
  where room_code = p_code;
  update public.rooms
  set status = 'lobby',
      state = null,
      mission_id = null,
      seed = null,
      action_seq = 0,
      updated_at = now()
  where code = p_code;

  return jsonb_build_object('code', p_code, 'status', 'lobby');
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: stream row changes to every subscribed client.
-- Wrapped because re-running this file must not fail on already-added tables.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.rooms;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.players;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.action_log;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Housekeeping: allow the browser to read the room list for debugging and
-- keep functions callable through PostgREST.

grant execute on function public.create_room(text, uuid, text) to anon, authenticated;
grant execute on function public.join_room(text, uuid, text) to anon, authenticated;
grant execute on function public.start_game(text, uuid, jsonb, integer, bigint) to anon, authenticated;
grant execute on function public.submit_action(text, uuid, integer, jsonb, jsonb) to anon, authenticated;
grant execute on function public.set_room_status(text, uuid, text) to anon, authenticated;
grant execute on function public.touch_player(text, uuid) to anon, authenticated;
grant execute on function public.set_ready(text, uuid, boolean) to anon, authenticated;
grant execute on function public.set_max_players(text, uuid, smallint) to anon, authenticated;
grant execute on function public.leave_room(text, uuid) to anon, authenticated;
grant execute on function public.reset_room(text, uuid) to anon, authenticated;
