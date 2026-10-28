create function resource_private.invalidate_source_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.policy_url is distinct from old.policy_url or new.policy_note is distinct from old.policy_note
 or new.commercial is distinct from old.commercial or new.adaptation is distinct from old.adaptation then
 update resource_private.items set state='pending',updated_at=now() where source_id=new.id and state='published';
 insert into resource_private.audit(actor,action,target) values(auth.uid(),'source_recheck',new.id);
 end if;
 return new;
end $$;
revoke all on function resource_private.invalidate_source_review() from public,anon,authenticated,service_role;
create trigger resource_source_review_changed after update on resource_private.sources for each row execute function resource_private.invalidate_source_review();
