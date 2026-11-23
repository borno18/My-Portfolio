alter table public.portfolio_project_settings
  add column repository jsonb,
  add constraint portfolio_project_repository_shape check (
    repository is null or (
      jsonb_typeof(repository) = 'object'
      and (repository->>'name') ~ '^[A-Za-z0-9_.-]{1,100}$'
      and char_length(repository::text) <= 2000
    )
  );

create schema portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;
create table portfolio_private.inbox_key (
  singleton boolean primary key default true check (singleton),
  digest bytea not null check (octet_length(digest) = 32)
);

create function public.portfolio_receive_message(
  delivery_key text, sender_fingerprint text, sender_name text, sender_email text, sender_message text
)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if delivery_key is null or char_length(delivery_key) <> 64 or not exists (
    select 1 from portfolio_private.inbox_key
    where digest = pg_catalog.sha256(pg_catalog.convert_to(delivery_key, 'UTF8'))
  ) then
    raise exception 'Inbox delivery unauthorized' using errcode = '42501';
  end if;
  return public.portfolio_receive_message(sender_fingerprint, sender_name, sender_email, sender_message);
end;
$$;
revoke execute on function public.portfolio_receive_message(text,text,text,text,text) from public, authenticated;
grant execute on function public.portfolio_receive_message(text,text,text,text,text) to anon;

insert into public.portfolio_posts (slug,title,description,body,status,published_at) values
('correcting-a-tournament-result', 'What happens when a tournament result changes?', 'How SWE Sports Week corrects a bracket without clearing its unrelated matches.', 'An organizer can enter the wrong winner even with a good interface. A tournament system needs a way to recover, because a result can determine who plays in the next round.

## A small example

Suppose team A advances from a semifinal. If the organizer later corrects the result to team B, the final can no longer use A as a participant. The corrected participant moves forward, and any downstream result that relied on the old winner is cleared. The other semifinal remains intact.

## Save the change together

The [SWE Sports Week project](/work/swe-sports-week) records the result, its propagation, and the change history in one transaction. A version check catches an edit from an out-of-date organizer screen. Public pages check a small revision endpoint so they only reload tournament content when there is a change.

The design question is whether each later result still makes sense after the edit. Testing with byes and different bracket sizes gives that rule more coverage than testing just a clean eight-team example.', 'published', '2026-01-03T00:00:00Z'),
('offline-attendance', 'Taking classroom attendance without Wi-Fi', 'How a nearby device session and on-device storage keep the classroom workflow moving.', 'Attendance has three parts: knowing who belongs to the class, recording check-ins, and giving the instructor a usable record afterwards. The [Smart Proximity Attendance app](/work/attendance-app) keeps those steps on the devices in the room.

## Start with the roster

An instructor can import a roster and use it again for later sessions. This separates the work of preparing the class list from the work of checking who arrived that day.

## Keep the session local

During class, the instructor’s device advertises a nearby session. Student devices connect locally, and the instructor can see check-ins accumulate without waiting on campus Wi-Fi.

## Make the record portable

The device retains session history in SQLite. A CSV export gives instructors a familiar format to inspect or take into another tool after the session ends.', 'published', '2026-01-02T00:00:00Z'),
('pookie-prep-offline', 'How Pookie Prep works offline', 'Bundled questions, local progress, and a Bengali-first practice interface.', '[Pookie Prep](/work/pookie-prep) is built for short study sessions on Android. The question bank ships with the app, so a learner can open a practice session on an unreliable connection after installation.

## Keep the practice loop on the device

Learners select topics and session length, then answer questions at their own pace or under a timer. Progress and missed questions are kept on-device. That lets the mistake notebook take a learner back to earlier answers without a server call.

## Match the practice context

The app uses Bengali labels and numerals and includes the exam’s negative marking in its practice scoring. Offline storage and Bengali typography are both part of making the app fit the people using it.', 'published', '2026-01-01T00:00:00Z')
on conflict (slug) do nothing;
