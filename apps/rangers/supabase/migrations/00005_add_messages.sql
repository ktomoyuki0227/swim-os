-- メッセージテーブル（コーチ↔スイマーのやり取り）
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_messages_conversation on messages(sender_id, receiver_id);

-- RLS
alter table messages enable row level security;

create policy "自分が送受信したメッセージのみ閲覧可"
  on messages for select using (
    sender_id = auth.uid() or receiver_id = auth.uid()
  );

create policy "ログインユーザーはメッセージ送信可"
  on messages for insert with check (sender_id = auth.uid());

create policy "受信者のみ既読更新可"
  on messages for update using (receiver_id = auth.uid());

-- 日程リクエストテーブル
create table if not exists schedule_requests (
  id uuid primary key default gen_random_uuid(),
  swimmer_id uuid not null references profiles(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  message text not null,
  preferred_dates text[],
  status text not null check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_schedule_requests_swimmer on schedule_requests(swimmer_id);
create index if not exists idx_schedule_requests_instructor on schedule_requests(instructor_id);

-- RLS
alter table schedule_requests enable row level security;

create policy "自分のリクエストのみ閲覧可"
  on schedule_requests for select using (
    swimmer_id = auth.uid() or instructor_id = auth.uid()
  );

create policy "スイマーのみリクエスト作成可"
  on schedule_requests for insert with check (swimmer_id = auth.uid());

create policy "指導員のみリクエスト更新可"
  on schedule_requests for update using (instructor_id = auth.uid());
