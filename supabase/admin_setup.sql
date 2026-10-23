-- ========================================
-- 新洽記商行｜訂單管理後台（admin.html）設定
-- ========================================
-- 使用方式：貼到 Supabase → SQL Editor 執行一次。重複執行也不會出錯。
--
-- 訂單狀態（orders.status）：
--   new        新訂單（顧客剛送出，還沒人處理）
--   confirmed  待出貨（已確認訂單，準備出貨）
--   shipped    已出貨
--   done       已完成
--   cancelled  已取消
--
-- 執行完後，還要做「新增管理人員」：見最下方說明。


-- ===== 1. 訂單表補上管理用欄位 =====
alter table public.orders add column if not exists created_at   timestamptz not null default now();
alter table public.orders add column if not exists updated_at   timestamptz not null default now();
alter table public.orders add column if not exists handled_by   text;         -- 處理人
alter table public.orders add column if not exists updated_by   text;         -- 最後更新的人
alter table public.orders add column if not exists is_paid      boolean not null default false;
alter table public.orders add column if not exists paid_at      timestamptz;
alter table public.orders add column if not exists tracking_number text;      -- 寄件單號
alter table public.orders add column if not exists staff_note   text;         -- 店家內部備註（顧客看不到）
alter table public.orders add column if not exists confirmed_at timestamptz;
alter table public.orders add column if not exists shipped_at   timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;


-- ===== 2. 管理人員名單 =====
create table if not exists public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

grant execute on function public.is_staff() to authenticated;


-- ===== 3. 權限（RLS）：只有管理人員能看與修改訂單 =====
-- 顧客下單仍然只透過 create_order()，不受影響。
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.staff       enable row level security;

drop policy if exists "staff read orders"   on public.orders;
drop policy if exists "staff update orders" on public.orders;
drop policy if exists "staff read items"    on public.order_items;
drop policy if exists "staff read self"     on public.staff;

create policy "staff read orders"   on public.orders      for select to authenticated using (public.is_staff());
create policy "staff update orders" on public.orders      for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff read items"    on public.order_items for select to authenticated using (public.is_staff());
create policy "staff read self"     on public.staff       for select to authenticated using (user_id = auth.uid());


-- ===== 4. 狀態改變時自動記錄時間 =====
create or replace function public.orders_track_changes()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    if new.status = 'confirmed' then new.confirmed_at := coalesce(new.confirmed_at, now()); end if;
    if new.status = 'shipped'   then new.shipped_at   := coalesce(new.shipped_at, now());   end if;
    if new.status = 'done'      then new.completed_at := coalesce(new.completed_at, now()); end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
  end if;

  if new.is_paid and not old.is_paid then new.paid_at := now(); end if;
  if not new.is_paid then new.paid_at := null; end if;

  return new;
end;
$$;

drop trigger if exists orders_track_changes on public.orders;
create trigger orders_track_changes
  before update on public.orders
  for each row execute function public.orders_track_changes();


-- ===== 5. 即時更新：新訂單進來時，後台畫面自動出現 =====
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;


-- ========================================
-- 新增管理人員（每位朋友做一次）
-- ========================================
-- 1. Supabase → Authentication → Users → Add user → Create new user
--    填 Email 與密碼，勾選 Auto Confirm User。
-- 2. 回到 SQL Editor，把下面的 Email 與名字換掉後執行：
--
-- insert into public.staff (user_id, display_name)
-- select id, '小明' from auth.users where email = 'friend@example.com';
--
-- 建議：Authentication → Sign In / Providers → 關閉「Allow new users to sign up」，
-- 這樣只有你手動新增的人能登入。
