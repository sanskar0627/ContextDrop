-- Atomic follow/unfollow RPC and profile counters

alter table public.profiles
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0,
  add column if not exists publication_count integer not null default 0;

create or replace function public.refresh_profile_publication_count(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set publication_count = (
    select count(*)::integer from public.publications where user_id = p_user_id
  )
  where id = p_user_id;
end;
$$;

create or replace function public.on_publication_counter_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_profile_publication_count(new.user_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_profile_publication_count(old.user_id);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists publications_counter_trigger on public.publications;
create trigger publications_counter_trigger
after insert or delete on public.publications
for each row execute procedure public.on_publication_counter_change();

create or replace function public.follow_user(p_following_id uuid)
returns table(applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_id uuid;
  v_inserted_count integer;
begin
  v_follower_id := auth.uid();

  if v_follower_id is null then
    raise exception 'Authentication required';
  end if;

  if v_follower_id = p_following_id then
    raise exception 'Cannot follow yourself';
  end if;

  insert into public.follows (follower_id, following_id)
  values (v_follower_id, p_following_id)
  on conflict do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 1 then
    update public.profiles set following_count = following_count + 1 where id = v_follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = p_following_id;
    applied := true;
  else
    applied := false;
  end if;

  return next;
end;
$$;

grant execute on function public.follow_user(uuid) to authenticated;

create or replace function public.unfollow_user(p_following_id uuid)
returns table(applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_follower_id uuid;
  v_deleted_count integer;
begin
  v_follower_id := auth.uid();

  if v_follower_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.follows
  where follower_id = v_follower_id and following_id = p_following_id;

  get diagnostics v_deleted_count = row_count;

  if v_deleted_count = 1 then
    update public.profiles set following_count = greatest(0, following_count - 1) where id = v_follower_id;
    update public.profiles set follower_count = greatest(0, follower_count - 1) where id = p_following_id;
    applied := true;
  else
    applied := false;
  end if;

  return next;
end;
$$;

grant execute on function public.unfollow_user(uuid) to authenticated;
