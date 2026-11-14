create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80),
 role text not null default '' check(length(role)<=160),
 initials text not null default 'NM' check(length(initials)<=4),
 color text not null default 'peach' check(color in ('peach','lavender')),
 bio text not null default '' check(length(bio)<=1000)
);
create table public.progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 module_id text not null default 'phishing' check(module_id='phishing'),
 lessons integer[] not null default '{}', answers integer[] not null default '{}',
 submitted boolean not null default false,
 primary key(user_id,module_id),
 check(lessons <@ array[0,1,2] and cardinality(lessons)<=3 and array_position(lessons,null) is null),
 check(answers <@ array[0,1,2] and cardinality(answers)<=3 and array_position(answers,null) is null),
 check(not submitted or cardinality(answers)=3)
);
create table public.relations (
 id text primary key,
 requester uuid not null references public.profiles(id) on delete cascade,
 recipient uuid not null references public.profiles(id) on delete cascade,
 members uuid[] not null,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 blocked_by uuid[] not null default '{}',
 check(requester<>recipient),
 check(id=least(requester::text,recipient::text)||'__'||greatest(requester::text,recipient::text)),
 check(members=array[least(requester,recipient),greatest(requester,recipient)]),
 check(blocked_by <@ members and cardinality(blocked_by)<=2 and array_position(blocked_by,null) is null)
);
create index relations_requester_idx on public.relations(requester);
create index relations_recipient_idx on public.relations(recipient);
create index relations_members_idx on public.relations using gin(members);
create table public.messages (
 id uuid primary key,
 relation_id text not null references public.relations(id) on delete cascade,
 author uuid not null references public.profiles(id) on delete cascade,
 text text not null check(length(trim(text)) between 1 and 1000),
 created_at timestamptz not null default now()
);
create index messages_relation_created_idx on public.messages(relation_id,created_at desc);
create index messages_author_idx on public.messages(author);
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.relations enable row level security;
alter table public.messages enable row level security;
revoke all on public.profiles,public.progress,public.relations,public.messages from anon,authenticated;
grant select,insert on public.profiles to authenticated;
grant update(name,role,initials,color,bio) on public.profiles to authenticated;
grant select,insert,update on public.progress to authenticated;
grant select,insert on public.relations to authenticated;
grant update(status,blocked_by) on public.relations to authenticated;
grant select on public.messages to authenticated;
grant insert(id,relation_id,author,text) on public.messages to authenticated;
create policy profile_read on public.profiles for select to authenticated using(true);
create policy profile_create on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy progress_read on public.progress for select to authenticated using(user_id=(select auth.uid()));
create policy progress_create on public.progress for insert to authenticated with check(user_id=(select auth.uid()));
create policy progress_update on public.progress for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy relation_read on public.relations for select to authenticated using((select auth.uid())=any(members));
create policy relation_create on public.relations for insert to authenticated with check(requester=(select auth.uid()) and status='pending' and cardinality(blocked_by)=0);
create policy relation_update on public.relations for update to authenticated using((select auth.uid())=any(members)) with check((select auth.uid())=any(members));
create policy message_read on public.messages for select to authenticated using(exists(select 1 from public.relations r where r.id=relation_id and (select auth.uid())=any(r.members)));
create policy message_create on public.messages for insert to authenticated with check(author=(select auth.uid()) and exists(select 1 from public.relations r where r.id=relation_id and r.status='accepted' and cardinality(r.blocked_by)=0 and (select auth.uid())=any(r.members)));
create schema if not exists private;
create function private.check_relation_update() returns trigger language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or not(uid=any(old.members)) then raise exception 'Not a participant'; end if;
 if new.id<>old.id or new.requester<>old.requester or new.recipient<>old.recipient or new.members<>old.members then raise exception 'Immutable participants'; end if;
 if array_remove(new.blocked_by,uid)<>array_remove(old.blocked_by,uid) then raise exception 'Cannot alter another member block'; end if;
 if new.blocked_by<>old.blocked_by then
  if uid=any(old.blocked_by) then
   if uid=any(new.blocked_by) or new.status<>'declined' then raise exception 'Unblocking must decline relation'; end if;
  elsif new.status<>old.status then raise exception 'Blocking cannot change status'; end if;
 elsif new.status<>old.status and not(old.status='pending' and uid=old.recipient and cardinality(old.blocked_by)=0 and new.status in ('accepted','declined')) then
  raise exception 'Invalid consent transition';
 end if;
 return new;
end $$;
revoke all on function private.check_relation_update() from public;
create trigger check_relation_update before update on public.relations for each row execute function private.check_relation_update();
create function private.check_message_insert() returns trigger language plpgsql security invoker set search_path='' as $$
declare r public.relations;
begin
 select * into r from public.relations where id=new.relation_id for share;
 if not found or new.author<>auth.uid() or not(auth.uid()=any(r.members)) or r.status<>'accepted' or cardinality(r.blocked_by)>0 then raise exception 'Discussion not authorized'; end if;
 new.created_at:=now();return new;
end $$;
revoke all on function private.check_message_insert() from public;
create trigger check_message_insert before insert on public.messages for each row execute function private.check_message_insert();
create function public.toggle_relation_block(relation_key text) returns void language plpgsql security invoker set search_path='' as $$
declare r public.relations;uid uuid:=auth.uid();
begin
 select * into r from public.relations where id=relation_key for update;
 if not found or uid is null or not(uid=any(r.members)) then raise exception 'Not a participant';end if;
 if uid=any(r.blocked_by) then
  update public.relations set blocked_by=array_remove(blocked_by,uid),status='declined' where id=relation_key;
 else
  update public.relations set blocked_by=array_append(blocked_by,uid) where id=relation_key;
 end if;
end $$;
revoke all on function public.toggle_relation_block(text) from public,anon;
grant execute on function public.toggle_relation_block(text) to authenticated;
alter publication supabase_realtime add table public.profiles,public.progress,public.relations,public.messages;
