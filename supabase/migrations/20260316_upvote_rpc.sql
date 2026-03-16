-- Atomic upvote RPC with duplicate protection

create or replace function public.upvote_publication(p_publication_id uuid)
returns table(applied boolean, upvote_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_inserted_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.upvotes (user_id, publication_id)
  values (v_user_id, p_publication_id)
  on conflict do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 1 then
    update public.publications
    set upvote_count = upvote_count + 1
    where id = p_publication_id
    returning publications.upvote_count into upvote_count;

    applied := true;
    return next;
    return;
  end if;

  select publications.upvote_count
  into upvote_count
  from public.publications
  where id = p_publication_id;

  applied := false;
  return next;
end;
$$;

grant execute on function public.upvote_publication(uuid) to authenticated;
