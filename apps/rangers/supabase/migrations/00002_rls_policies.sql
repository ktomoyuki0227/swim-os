-- RLS ポリシー設定

-- profiles
alter table profiles enable row level security;

create policy "プロフィールは誰でも閲覧可"
  on profiles for select using (true);

create policy "自分のプロフィールのみ更新可"
  on profiles for update using (auth.uid() = id);

-- lessons
alter table lessons enable row level security;

create policy "公開レッスンは誰でも閲覧可"
  on lessons for select using (
    status = 'published' or instructor_id = auth.uid()
  );

create policy "指導員のみレッスン作成可"
  on lessons for insert with check (
    instructor_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and role = 'instructor'
    )
  );

create policy "自分のレッスンのみ更新可"
  on lessons for update using (instructor_id = auth.uid());

create policy "自分のレッスンのみ削除可"
  on lessons for delete using (instructor_id = auth.uid());

-- bookings
alter table bookings enable row level security;

create policy "自分の予約は閲覧可"
  on bookings for select using (
    swimmer_id = auth.uid()
    or exists (
      select 1 from lessons where lessons.id = bookings.lesson_id and lessons.instructor_id = auth.uid()
    )
  );

create policy "スイマーのみ予約作成可"
  on bookings for insert with check (
    swimmer_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and role = 'swimmer'
    )
  );

create policy "自分の予約のみ更新可"
  on bookings for update using (swimmer_id = auth.uid());
