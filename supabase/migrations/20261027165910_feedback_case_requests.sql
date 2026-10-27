-- Extend the existing private inbox. No submitted original is published.
alter table jsa_private.external_requests
 add column title text not null default '' check(length(title)<=200),
 add column contact_email text not null default '' check(length(contact_email)<=254),
 add column locale text not null default '' check(length(locale)<=20),
 add column country text not null default '' check(length(country)<=100),
 add column source_path text not null default '' check(length(source_path)<=500),
 add column context text not null default '' check(length(context)<=2000),
 add column internal_notes text not null default '' check(length(internal_notes)<=4000),
 add column linked_case_group text,
 add column linked_case_locale text,
 add column submitted_at timestamptz default now();
alter table jsa_private.external_requests drop constraint external_requests_category_check;
alter table jsa_private.external_requests add constraint external_requests_category_check check(category in ('general','suggestion','privacy','copyright','safety','spam','appeal','access','erasure','correction','case_request','bug'));
alter table jsa_private.external_requests drop constraint external_requests_detail_check;
alter table jsa_private.external_requests add constraint external_requests_detail_check check(length(detail)<=4000);
alter table jsa_private.external_requests drop constraint external_requests_status_check;
alter table jsa_private.external_requests add constraint external_requests_status_check check(status in ('draft','open','needs_info','reviewing','producing','resolved','on_hold','declined'));
create unique index external_requests_receipt_unique on jsa_private.external_requests(receipt_hash);
create index external_requests_inbox on jsa_private.external_requests(created_at desc,id) where status<>'draft';

create table jsa_private.feedback_attachments(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references jsa_private.external_requests(id) on delete cascade,
 position integer not null check(position between 0 and 2),
 original_name text not null check(length(original_name) between 1 and 180),
 mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg','image/webp')),
 expected_size integer not null check(expected_size between 1 and 5242880),
 storage_path text not null unique,
 created_at timestamptz not null default now(),
 unique(request_id,position)
);
alter table jsa_private.feedback_attachments enable row level security;
revoke all on jsa_private.feedback_attachments from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('feedback-attachments','feedback-attachments',false,5242880,array['application/pdf','image/png','image/jpeg','image/webp']);

create function jsa_private.feedback_upload_allowed(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from jsa_private.feedback_attachments a join jsa_private.external_requests r on r.id=a.request_id
 where a.storage_path=p_name and r.status='draft' and r.created_at>now()-interval '24 hours');
$$;
revoke all on function jsa_private.feedback_upload_allowed(text) from public;
grant execute on function jsa_private.feedback_upload_allowed(text) to anon,authenticated;
-- The random reserved object path is an upload-only capability. No listing, reading or overwrite.
create policy feedback_insert on storage.objects for insert to anon,authenticated
 with check(bucket_id='feedback-attachments' and jsa_private.feedback_upload_allowed(name));
create policy feedback_insert_boundary on storage.objects as restrictive for insert to anon,authenticated
 with check(bucket_id<>'feedback-attachments' or jsa_private.feedback_upload_allowed(name));
create policy feedback_read on storage.objects for select to authenticated
 using(bucket_id='feedback-attachments' and (select jsa_private.community_admin()));
create policy feedback_read_boundary on storage.objects as restrictive for select to anon,authenticated
 using(bucket_id<>'feedback-attachments' or (select jsa_private.community_admin()));
create policy feedback_no_update on storage.objects as restrictive for update to anon,authenticated
 using(bucket_id<>'feedback-attachments') with check(bucket_id<>'feedback-attachments');
create policy feedback_no_delete on storage.objects as restrictive for delete to anon,authenticated
 using(bucket_id<>'feedback-attachments');

create function jsa_private.feedback_manifest(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.original_name,'type',a.mime_type,'size',a.expected_size,'path',a.storage_path,
 'uploaded',o.id is not null) order by a.position),'[]'::jsonb)
 from jsa_private.feedback_attachments a left join storage.objects o on o.bucket_id='feedback-attachments' and o.name=a.storage_path where a.request_id=p_id;
$$;
revoke all on function jsa_private.feedback_manifest(uuid) from public,anon,authenticated;

create function jsa_private.feedback_gateway(p_key text,p_actor uuid,p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsa_private.external_requests; f jsonb; n integer:=0; file_count integer; today date:=(now() at time zone 'UTC')::date; rate_kind text; ceiling integer; total integer; token bytea;
begin
 if p_key is null or length(p_key)<40 or not exists(select 1 from jsa_private.public_gateway_keys where enabled and key_hash=sha256(convert_to(p_key,'UTF8'))) then raise exception 'ACCESS_DENIED';end if;
 if p_actor is null or p_action is null or p_action not in ('feedback_prepare','feedback_resume','feedback_submit','feedback_status') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 or coalesce(p_payload->>'receipt','') !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST';end if;
 token:=sha256(convert_to(p_payload->>'receipt','UTF8'));
 perform pg_advisory_xact_lock(hashtextextended(encode(token,'hex'),819));
 if p_action='feedback_prepare' then select * into r from jsa_private.external_requests where receipt_hash=token;
 else select * into r from jsa_private.external_requests where id=(p_payload->>'id')::uuid and receipt_hash=token for update;end if;
 rate_kind:=case when p_action='feedback_prepare' and r.id is null then 'support_create' else 'support_status' end;
 ceiling:=case when rate_kind='support_create' then 5 else 100 end;
 perform pg_advisory_xact_lock(hashtextextended('gateway:'||rate_kind,618));
 delete from jsa_private.gateway_rate where day<today-2;
 select coalesce(sum(hits),0) into total from jsa_private.gateway_rate where day=today and kind=rate_kind;
 if total>=(case when rate_kind='support_create' then 500 else 100000 end) then return jsonb_build_object('error','RATE_LIMIT');end if;
 insert into jsa_private.gateway_rate values(p_actor,today,rate_kind,1) on conflict(actor,day,kind) do update set hits=jsa_private.gateway_rate.hits+1 where jsa_private.gateway_rate.hits<ceiling returning hits into total;
 if not found then return jsonb_build_object('error','RATE_LIMIT');end if;
 if p_action='feedback_prepare' and r.id is null then
  if p_payload->>'category' is null or p_payload->>'category' not in ('case_request','bug','suggestion','correction','general','privacy','copyright','safety','spam','appeal','access','erasure')
   or coalesce(p_payload->>'consent','')<>'true' or coalesce(p_payload->>'website','')<>'' or jsonb_typeof(p_payload->'files') is distinct from 'array' then raise exception 'INVALID_REQUEST';end if;
  file_count:=jsonb_array_length(p_payload->'files');
  if file_count>3 or (length(trim(coalesce(p_payload->>'title','')))=0 and length(trim(coalesce(p_payload->>'detail','')))=0 and file_count=0) then raise exception 'INVALID_REQUEST';end if;
  if coalesce(p_payload->>'email','')<>'' and (p_payload->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'INVALID_EMAIL';end if;
  if coalesce(p_payload->>'source_path','')<>'' and ((p_payload->>'source_path') !~ '^/[^/]' or (p_payload->>'source_path') ~ '[?#]') then raise exception 'INVALID_PATH';end if;
  insert into jsa_private.external_requests(receipt_hash,category,detail,evidence,status,title,contact_email,locale,country,source_path,context,submitted_at)
  values(token,p_payload->>'category',trim(coalesce(p_payload->>'detail','')),'','draft',trim(coalesce(p_payload->>'title','')),trim(coalesce(p_payload->>'email','')),coalesce(p_payload->>'locale',''),trim(coalesce(p_payload->>'country','')),coalesce(p_payload->>'source_path',''),trim(coalesce(p_payload->>'context','')),null) returning * into r;
  for f in select value from jsonb_array_elements(p_payload->'files') loop
   if jsonb_typeof(f)<>'object' then raise exception 'INVALID_FILE';end if;
   insert into jsa_private.feedback_attachments(request_id,position,original_name,mime_type,expected_size,storage_path)
   values(r.id,n,f->>'name',f->>'type',(f->>'size')::integer,r.id::text||'/'||gen_random_uuid()::text||gen_random_uuid()::text);
   n:=n+1;
  end loop;
 end if;
 if r.id is null then return jsonb_build_object('error','NOT_FOUND');end if;
 if p_action='feedback_status' then return jsonb_build_object('id',r.id,'status',r.status,'response',r.response,'created_at',r.created_at,'updated_at',r.updated_at,'case_group',r.linked_case_group,'case_locale',r.linked_case_locale);end if;
 if r.status='draft' and r.created_at<=now()-interval '24 hours' then return jsonb_build_object('error','EXPIRED');end if;
 if p_action='feedback_submit' and r.status='draft' then
  if exists(select 1 from jsa_private.feedback_attachments a left join storage.objects o on o.bucket_id='feedback-attachments' and o.name=a.storage_path
   where a.request_id=r.id and (o.id is null or coalesce((o.metadata->>'size')::bigint,-1)<>a.expected_size or coalesce(o.metadata->>'mimetype','')<>a.mime_type)) then return jsonb_build_object('error','UPLOAD_INCOMPLETE');end if;
  update jsa_private.external_requests set status='open',submitted_at=clock_timestamp(),updated_at=clock_timestamp() where id=r.id returning * into r;
 end if;
 return jsonb_build_object('id',r.id,'status',r.status,'files',jsa_private.feedback_manifest(r.id));
end $$;
revoke all on function jsa_private.feedback_gateway(text,uuid,text,jsonb) from public;
grant execute on function jsa_private.feedback_gateway(text,uuid,text,jsonb) to anon;
create function public.feedback_gateway(p_key text,p_actor uuid,p_action text,p_payload jsonb) returns jsonb
language sql set search_path='' as $$ select jsa_private.feedback_gateway(p_key,p_actor,p_action,p_payload); $$;
revoke all on function public.feedback_gateway(text,uuid,text,jsonb) from public;
grant execute on function public.feedback_gateway(text,uuid,text,jsonb) to anon;

create function jsa_private.feedback_admin(p_action text,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r jsa_private.external_requests; result jsonb; wanted_status text; response_text text; notes text; case_group text; case_locale text;
begin
 if not coalesce(jsa_private.community_admin(),false) then raise exception 'ACCESS_DENIED';end if;
 if p_action='list' then
  select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into result from
   (select id,category,title,locale,country,status,created_at,updated_at,(select count(*) from jsa_private.feedback_attachments a where a.request_id=e.id) as attachments
    from jsa_private.external_requests e where status<>'draft' and (coalesce(p_payload->>'category','')='' or category=p_payload->>'category')
    and (coalesce(p_payload->>'status','')='' or status=p_payload->>'status')
    order by created_at desc,id limit 50 offset least(100000,greatest(0,coalesce((p_payload->>'offset')::integer,0)))) q;
  return result;
 end if;
 select * into r from jsa_private.external_requests where id=(p_payload->>'id')::uuid and status<>'draft' for update;
 if r.id is null then raise exception 'NOT_FOUND';end if;
 if p_action='detail' then return (to_jsonb(r)-'receipt_hash')||jsonb_build_object('files',jsa_private.feedback_manifest(r.id));end if;
 if p_action<>'update' then raise exception 'INVALID_ACTION';end if;
 if r.updated_at is distinct from (p_payload->>'expected')::timestamptz then raise exception 'STALE_REQUEST';end if;
 wanted_status:=p_payload->>'status';response_text:=trim(coalesce(p_payload->>'response',''));notes:=trim(coalesce(p_payload->>'notes',''));
 if wanted_status is null or wanted_status not in ('open','needs_info','reviewing','producing','resolved','on_hold','declined') or length(response_text)>2000 or length(notes)>4000 then raise exception 'INVALID_DECISION';end if;
 case_group:=nullif(trim(p_payload->>'case_group'),'');case_locale:=nullif(p_payload->>'case_locale','');
 if case_group is not null and not exists(select 1 from public.case_studies where post_group_id=case_group and language_code=case_locale and length(trim(content_md))>0) then raise exception 'INVALID_CASE';end if;
 update jsa_private.external_requests set status=wanted_status,response=response_text,internal_notes=notes,linked_case_group=case_group,linked_case_locale=case when case_group is null then null else case_locale end,updated_at=clock_timestamp() where id=r.id;
 insert into jsa_private.external_request_audit(request_id,actor,action,response) values(r.id,auth.uid(),wanted_status,response_text);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function jsa_private.feedback_admin(text,jsonb) from public;
grant execute on function jsa_private.feedback_admin(text,jsonb) to authenticated;
create function public.feedback_admin(p_action text,p_payload jsonb default '{}') returns jsonb
language sql set search_path='' as $$ select jsa_private.feedback_admin(p_action,p_payload); $$;
revoke all on function public.feedback_admin(text,jsonb) from public,anon;
grant execute on function public.feedback_admin(text,jsonb) to authenticated;
