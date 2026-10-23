-- ========================================
-- 新洽記商行｜Supabase 完整資料庫建置檔
-- ========================================
-- 這一份就是資料庫的「全部」：資料表、關聯、下單函式、權限、商品初始資料。
-- 使用方式：整份貼到 Supabase → SQL Editor → Run。
--
-- ⚠ 執行時會先刪除下面這些舊資料表，裡面的訂單資料會全部清空、無法復原。
--   有真實訂單請先到 Table Editor 把 orders、order_items 匯出成 CSV。
--   登入帳號（Authentication → Users）不會被刪除，但要重新加回 staff 名單（見最下方）。
--
-- 以後要修改資料庫，就改這份檔案再整份重跑（同樣會清空訂單）；
-- 只想改商品或價格的話，用 Table Editor 直接改 products 即可，不用重跑。
--
-- 資料表關聯：
--   products ──< discount_rules       一個商品可以有多個數量優惠
--   products ──< order_items >── orders  一張訂單有多項商品
--   auth.users ── staff               可以登入訂單管理頁的人
--
-- 訂單狀態 orders.status：
--   new 新訂單 → confirmed 待出貨 → shipped 已出貨 → done 已完成；cancelled 已取消

begin;


-- ========================================
-- 0. 清除舊的資料表與函式
-- ========================================
drop table if exists public.order_items    cascade;
drop table if exists public.orders         cascade;
drop table if exists public.discount_rules cascade;
drop table if exists public.products       cascade;
drop table if exists public.staff          cascade;

drop function if exists public.create_order(text, text, text, text, text, text, text, jsonb);
drop function if exists public.get_product_price(bigint, integer);
drop function if exists public.is_staff();
drop function if exists public.orders_track_changes();
drop function if exists public.touch_updated_at();


-- ========================================
-- 1. 資料表
-- ========================================

-- 商品：id 必須與 js/products.js 的 id 相同。價格以這裡為準（網站上的價格只是顯示用）。
create table public.products (
  id         bigint primary key,
  name       text    not null unique,
  price      integer not null check (price >= 0),
  is_active  boolean not null default true,   -- false = 下架，不能下單
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 數量優惠：買到 min_quantity 件以上，改用優惠價。
--   fixed_price：discount_value 是優惠單價（例如 140）
--   percentage ：discount_value 是折數（例如 0.85 = 85 折）
create table public.discount_rules (
  id             bigint generated always as identity primary key,
  product_id     bigint  not null references public.products (id) on delete cascade,
  min_quantity   integer not null check (min_quantity > 0),
  discount_type  text    not null check (discount_type in ('fixed_price', 'percentage')),
  discount_value numeric not null check (discount_value > 0),
  active         boolean not null default true,
  start_at       timestamptz,   -- 留空 = 不限開始時間
  end_at         timestamptz,   -- 留空 = 不限結束時間
  created_at     timestamptz not null default now(),
  unique (product_id, min_quantity)
);

-- 訂單
create table public.orders (
  id              bigint generated always as identity primary key,
  order_number    text not null unique,
  -- 顧客填寫
  customer_name   text not null,
  title           text,
  phone           text not null,
  delivery        text,
  address         text,
  payment         text,
  note            text,
  -- 金額由 create_order() 計算
  total_amount    integer not null default 0 check (total_amount >= 0),
  -- 店家管理（訂單管理頁使用）
  status          text not null default 'new'
                  check (status in ('new', 'confirmed', 'shipped', 'done', 'cancelled')),
  is_paid         boolean not null default false,
  handled_by      text,   -- 處理人
  updated_by      text,   -- 最後更新的人
  tracking_number text,   -- 寄件單號
  staff_note      text,   -- 店家內部備註（顧客看不到）
  -- 時間紀錄（狀態改變時自動填入）
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  paid_at         timestamptz,
  shipped_at      timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz
);

create index orders_status_created_idx on public.orders (status, created_at desc);

-- 訂單明細：product_name、unit_price 會保存下單當下的名稱與價格，之後改商品也不影響舊訂單。
create table public.order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint  not null references public.orders (id) on delete cascade,
  product_id   bigint  references public.products (id) on delete set null,
  product_name text    not null,
  quantity     integer not null check (quantity > 0),
  unit_price   integer not null check (unit_price >= 0),
  subtotal     integer generated always as (quantity * unit_price) stored,
  created_at   timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- 可以登入訂單管理頁的人
create table public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);


-- ========================================
-- 2. 自動更新時間
-- ========================================
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- 訂單：狀態或收款改變時，自動記錄時間
create function public.orders_track_changes()
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

create trigger orders_track_changes
  before update on public.orders
  for each row execute function public.orders_track_changes();


-- ========================================
-- 3. 函式
-- ========================================

-- 計算單價（含數量優惠）
create function public.get_product_price(
  p_product_id bigint,
  p_quantity integer
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_price numeric;
  v_rule  record;
begin
  select price into v_price
  from public.products
  where id = p_product_id and is_active;

  if v_price is null then
    raise exception 'Product not found: %', p_product_id;
  end if;

  select discount_type, discount_value into v_rule
  from public.discount_rules
  where product_id = p_product_id
    and active
    and min_quantity <= p_quantity
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now())
  order by min_quantity desc
  limit 1;

  if v_rule.discount_type = 'fixed_price' then
    return v_rule.discount_value;
  elsif v_rule.discount_type = 'percentage' then
    return round(v_price * v_rule.discount_value);
  end if;

  return v_price;
end;
$$;

-- 建立訂單：網站只傳商品 id 與數量，名稱與價格一律在這裡查，顧客無法竄改金額。
create function public.create_order(
  p_customer_name text,
  p_title text,
  p_phone text,
  p_delivery text,
  p_address text,
  p_payment text,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id     bigint;
  v_order_number text;
  v_item         jsonb;
  v_product_id   bigint;
  v_quantity     integer;
  v_product_name text;
  v_unit_price   integer;
  v_total        integer := 0;
  v_items_result jsonb := '[]'::jsonb;
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Customer name is required';
  end if;

  if nullif(trim(p_phone), '') is null then
    raise exception 'Phone is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  v_order_number := 'SHK' || to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDDHH24MISS')
                    || lpad(floor(random() * 1000)::text, 3, '0');

  insert into public.orders (order_number, customer_name, title, phone, delivery, address, payment, note)
  values (
    v_order_number,
    trim(p_customer_name),
    nullif(trim(p_title), ''),
    trim(p_phone),
    nullif(trim(p_delivery), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_payment), ''),
    nullif(trim(p_note), '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::bigint;
    v_quantity   := (v_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for product %', v_product_id;
    end if;

    select name into v_product_name
    from public.products
    where id = v_product_id and is_active;

    if v_product_name is null then
      raise exception 'Product not found: %', v_product_id;
    end if;

    v_unit_price := round(public.get_product_price(v_product_id, v_quantity))::integer;
    v_total := v_total + v_unit_price * v_quantity;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product_id, v_product_name, v_quantity, v_unit_price);

    v_items_result := v_items_result || jsonb_build_array(jsonb_build_object(
      'product_id',   v_product_id,
      'product_name', v_product_name,
      'quantity',     v_quantity,
      'unit_price',   v_unit_price,
      'subtotal',     v_unit_price * v_quantity
    ));
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'items',        v_items_result
  );
end;
$$;

-- 目前登入的人是否在 staff 名單裡
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;


-- ========================================
-- 4. 權限
-- ========================================
-- anon          = 一般訪客（顧客）
-- authenticated = 已登入訂單管理頁的人（還要在 staff 名單裡才看得到訂單）

alter table public.products       enable row level security;
alter table public.discount_rules enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.staff          enable row level security;

-- 先收回所有權限，再只開放需要的
revoke all on public.products, public.discount_rules, public.orders, public.order_items, public.staff
  from anon, authenticated;

grant select on public.products, public.discount_rules to anon, authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.staff to authenticated;

-- 顧客：可以看上架中的商品與優惠（訂單只能透過 create_order 建立）
create policy "public read active products" on public.products
  for select to anon, authenticated using (is_active);
create policy "public read active discounts" on public.discount_rules
  for select to anon, authenticated using (active);

-- 管理人員：可以看訂單、改訂單狀態，不能刪除訂單
create policy "staff read orders" on public.orders
  for select to authenticated using (public.is_staff());
create policy "staff update orders" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff read order items" on public.order_items
  for select to authenticated using (public.is_staff());
create policy "staff read self" on public.staff
  for select to authenticated using (user_id = auth.uid());

revoke execute on function public.create_order(text, text, text, text, text, text, text, jsonb) from public;
revoke execute on function public.get_product_price(bigint, integer) from public;
revoke execute on function public.is_staff() from public;
grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_product_price(bigint, integer) to anon, authenticated;
grant execute on function public.is_staff() to authenticated;


-- ========================================
-- 5. 即時更新：新訂單進來時，訂單管理頁自動出現
-- ========================================
alter publication supabase_realtime add table public.orders;


-- ========================================
-- 6. 商品與優惠初始資料（與 js/products.js、js/discount.js 一致）
-- ========================================
-- 花生芽（js/products.js 的 id 9）目前是「即將上架」，不能下單，所以先不建立。
insert into public.products (id, name, price) values
  (1, '焙炒金鑽紅仁花生', 180),
  (2, '焙炒椒麻花生',     150),
  (3, '焙炒五香花生',     150),
  (4, '手工花生糖禮盒',   200),
  (6, '減糖配方花生糖',   140),
  (7, '洽禮盒花生組',     500),
  (8, '無添加純花生醬',   220);

insert into public.discount_rules (product_id, min_quantity, discount_type, discount_value) values
  (1, 30, 'fixed_price', 170),
  (1, 50, 'fixed_price', 160),
  (2, 30, 'fixed_price', 140),
  (2, 50, 'fixed_price', 135),
  (3, 30, 'fixed_price', 140),
  (3, 50, 'fixed_price', 135),
  (4, 20, 'fixed_price', 180);

commit;


-- ========================================
-- 執行完之後：把管理人員加回 staff 名單（每個人一行）
-- ========================================
-- 帳號要先在 Authentication → Users → Add user 建立（已經建立過的不用重建）。
-- 把 Email 與名字換掉後，選取下面這行執行：
--
-- insert into public.staff (user_id, display_name)
-- select id, '小明' from auth.users where email = 'friend@example.com';
--
-- 查看目前的管理人員：
-- select s.display_name, u.email, u.last_sign_in_at
-- from public.staff s join auth.users u on u.id = s.user_id;
