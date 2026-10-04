-- Operator-only, read-only inventory. Run with a privileged database connection.
-- Candidates are NOT authorization to delete. Registered originals/outputs are retained.
-- Storage bytes must only be deleted through the Storage API, never SQL.
begin read only;
select split_part(o.name,'/',1) as owner_id, o.name as object_path,
       o.created_at, o.updated_at, o.metadata->>'size' as bytes,
       case
         when exists(select 1 from public.work_drawings d where d.object_path=o.name)
           or exists(select 1 from public.work_outputs p where p.object_path=o.name) then 'registered_keep'
         when greatest(o.created_at,o.updated_at)>now()-interval '7 days' then 'recent_keep'
         when o.name !~ '^[0-9a-f-]{36}/(drawings/[0-9a-f-]{36}/source\.(pdf|png|jpg)|outputs/[0-9a-f-]{36}/output\.pdf)$' then 'unknown_path_keep'
         else 'unregistered_review'
       end as disposition
from storage.objects o where o.bucket_id='work-bundle-assets'
order by o.created_at;
rollback;
