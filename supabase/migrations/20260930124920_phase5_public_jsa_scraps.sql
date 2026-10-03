alter table public.jsa_projects add column if not exists public_locale text;

create schema if not exists jsa_private;
revoke all on schema jsa_private from public, anon;

-- Only public documents (or the user's own documents) can be newly scrapped.
create policy phase5_favorite_visible on public.user_favorites as restrictive
for insert to authenticated with check (
  user_id=auth.uid() and exists(select 1 from public.jsa_projects p where p.id=project_id and (p.is_public or p.author_id=auth.uid()))
);
create policy phase5_favorite_update_visible on public.user_favorites as restrictive
for update to authenticated with check (
  user_id=auth.uid() and exists(select 1 from public.jsa_projects p where p.id=project_id and (p.is_public or p.author_id=auth.uid()))
);

-- A private trigger maintains the aggregate, never exposing other users' saves.
create or replace function jsa_private.refresh_scrap_count()
returns trigger language plpgsql security definer set search_path='' as $$
declare affected uuid[];
begin
  if tg_op='INSERT' then affected=array[new.project_id];
  elsif tg_op='DELETE' then affected=array[old.project_id];
  else affected=array[old.project_id,new.project_id]; end if;
  perform 1 from public.jsa_projects where id=any(affected) order by id for update;
  update public.jsa_projects p set scrap_count=(select count(*) from public.user_favorites f where f.project_id=p.id) where p.id=any(affected);
  return null;
end $$;
revoke all on function jsa_private.refresh_scrap_count() from public,anon,authenticated;
create trigger phase5_favorite_count after insert or delete or update of project_id on public.user_favorites
for each row execute function jsa_private.refresh_scrap_count();

-- Backward-compatible no-op: old clients used to increment after inserting.
create or replace function public.increment_scrap_count(target_project_id uuid)
returns void language plpgsql security invoker set search_path='' as $$ begin return; end $$;
revoke all on function public.increment_scrap_count(uuid) from public,anon;
grant execute on function public.increment_scrap_count(uuid) to authenticated;
