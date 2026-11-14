-- Transactional fixtures: no accounts or messages remain after ROLLBACK.
begin;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002'),('10000000-0000-0000-0000-000000000003');
insert into public.profiles(id,name) select id,'RLS fixture' from auth.users where id::text like '10000000-0000-0000-0000-00000000000%';
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
insert into public.progress(user_id,lessons) values (auth.uid(),array[0]);
insert into public.relations(id,requester,recipient,members) values ('10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002',auth.uid(),'10000000-0000-0000-0000-000000000002',array[auth.uid(),'10000000-0000-0000-0000-000000000002'::uuid]);
do $$begin
 begin update public.relations set status='accepted';raise exception 'TEST FAILED: self acceptance';exception when raise_exception then if SQLERRM like 'TEST FAILED:%' then raise;end if;end;
 begin insert into public.messages(id,relation_id,author,text) values(gen_random_uuid(),'10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002',auth.uid(),'before acceptance');raise exception 'TEST FAILED: early message';exception when raise_exception then if SQLERRM like 'TEST FAILED:%' then raise;end if;end;
end $$;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000003';
do $$begin
 if exists(select 1 from public.progress) or exists(select 1 from public.relations) then raise exception 'TEST FAILED: third-party read';end if;
 begin insert into public.progress(user_id) values('10000000-0000-0000-0000-000000000001');raise exception 'TEST FAILED: third-party write';exception when insufficient_privilege then null;end;
end $$;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
update public.relations set status='accepted';
insert into public.messages(id,relation_id,author,text) values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002',auth.uid(),'accepted');
select public.toggle_relation_block('10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002');
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
do $$begin
 begin insert into public.messages(id,relation_id,author,text) values(gen_random_uuid(),'10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002',auth.uid(),'blocked');raise exception 'TEST FAILED: blocked send';exception when raise_exception then if SQLERRM like 'TEST FAILED:%' then raise;end if;end;
 begin update public.relations set blocked_by='{}';raise exception 'TEST FAILED: remove other block';exception when raise_exception then if SQLERRM like 'TEST FAILED:%' then raise;end if;end;
 begin update public.relations set recipient=auth.uid();raise exception 'TEST FAILED: identity mutation';exception when insufficient_privilege then null;end;
 if (select count(*) from public.messages)<>1 then raise exception 'TEST FAILED: participant read';end if;
end $$;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
select public.toggle_relation_block('10000000-0000-0000-0000-000000000001__10000000-0000-0000-0000-000000000002');
do $$begin if exists(select 1 from public.relations where status<>'declined' or cardinality(blocked_by)<>0) then raise exception 'TEST FAILED: unblock';end if;end $$;
set local request.jwt.claim.sub='10000000-0000-0000-0000-000000000003';
do $$begin if exists(select 1 from public.messages) then raise exception 'TEST FAILED: stranger messages';end if;end $$;
set local role anon;
do $$begin begin perform * from public.profiles;raise exception 'TEST FAILED: anonymous read';exception when insufficient_privilege then null;end;end $$;
reset role;
select 'PASS: isolation, consent, participant access, blocking, immutable identities, anonymous denial' as result;
rollback;
