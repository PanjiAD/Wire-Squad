-- Wire Squad - P10a migration (optional lobby upgrade).
--
-- Run this once in the Supabase SQL editor if your project was created with the
-- pre-P10a schema.sql. It only ADDS things; existing rooms and players are
-- untouched. Re-running it is safe.
--
-- What it adds:
--   * rooms.max_players  - the host's target crew size (2-5)
--   * players.ready      - per-player lobby ready toggle
--   * join_room / start_game re-created so both enforce max_players
--   * set_ready / set_max_players RPCs
--   * reset_room re-created so a new mission clears the ready flags
--
-- The browser works without this file: it falls back to "connected players
-- count as ready" and a default crew size of five. With it applied, the lobby
-- shows real ready switches and enforces the chosen crew size.

-- ---------------------------------------------------------------------------
-- Columns

alter table public.rooms
  add column if not exists max_players smallint not null default 5
  check (max_players between 2 and 5);

alter table public.players
  add column if not exists ready boolean not null default false;

-- ---------------------------------------------------------------------------
-- join_room: unchanged from schema.sql, now refuses joins past max_players.

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
-- start_game: unchanged from schema.sql, now checks max_players.

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
-- set_ready: one player toggles their lobby ready state.

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
-- reset_room: unchanged from schema.sql, now also clears ready flags.

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
-- Grants (same set as schema.sql; safe to repeat).

grant execute on function public.join_room(text, uuid, text) to anon, authenticated;
grant execute on function public.start_game(text, uuid, jsonb, integer, bigint) to anon, authenticated;
grant execute on function public.set_ready(text, uuid, boolean) to anon, authenticated;
grant execute on function public.set_max_players(text, uuid, smallint) to anon, authenticated;
grant execute on function public.reset_room(text, uuid) to anon, authenticated;

-- Done. The lobby now supports per-player ready switches and a host-chosen
-- crew size. Older rooms keep max_players = 5 and ready = false until touched.
