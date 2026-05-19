-- 口コミ・評価テーブル
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists idx_reviews_instructor on reviews(instructor_id);
create index if not exists idx_reviews_reviewer on reviews(reviewer_id);

-- RLS
alter table reviews enable row level security;

create policy "口コミは誰でも閲覧可"
  on reviews for select using (true);

create policy "予約したスイマーのみ口コミ投稿可"
  on reviews for insert with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from bookings
      where bookings.id = booking_id
        and bookings.swimmer_id = auth.uid()
        and bookings.status = 'confirmed'
    )
  );

create policy "自分の口コミのみ更新可"
  on reviews for update using (reviewer_id = auth.uid());

-- profiles の rating_avg / review_count を自動更新するトリガー
create or replace function update_instructor_rating()
returns trigger as $$
declare
  v_instructor_id uuid;
begin
  -- insert/update どちらでも instructor_id を取得
  v_instructor_id := coalesce(new.instructor_id, old.instructor_id);

  update profiles
  set
    rating_avg = (
      select coalesce(avg(rating), 0)
      from reviews
      where instructor_id = v_instructor_id
    ),
    review_count = (
      select count(*)
      from reviews
      where instructor_id = v_instructor_id
    )
  where id = v_instructor_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger after_review_change
  after insert or update or delete on reviews
  for each row execute function update_instructor_rating();
