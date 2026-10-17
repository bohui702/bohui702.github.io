-- 新洽記商行 Supabase 訂單函式
-- 使用方式：貼到 Supabase SQL Editor 執行。
-- 注意：這份 SQL 依照目前資料表欄位命名：
-- products: id, name, price, is_active
-- discount_rules: product_id, min_quantity, discount_type, discount_value, active, start_at, end_at
-- orders: order_number, customer_name, phone, title, delivery, address, payment, note, status, total_amount
-- order_items: order_id, product_name, quantity, unit_price, subtotal
-- 注意：如果 subtotal 是 generated column，insert 時不可手動寫入 subtotal。

create or replace function public.get_product_price(
  p_product_id bigint,
  p_quantity integer
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
  v_original_price numeric;
  v_discount_type text;
  v_discount_value numeric;
  v_final_price numeric;
begin
  select price
  into v_original_price
  from public.products
  where id = p_product_id
    and is_active = true;

  if v_original_price is null then
    raise exception 'Product not found: %', p_product_id;
  end if;

  select
    discount_type,
    discount_value
  into
    v_discount_type,
    v_discount_value
  from public.discount_rules
  where product_id = p_product_id
    and active = true
    and min_quantity <= p_quantity
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at >= now())
  order by min_quantity desc
  limit 1;

  if v_discount_type is null then
    return v_original_price;
  end if;

  if v_discount_type = 'fixed_price' then
    v_final_price := v_discount_value;
  elsif v_discount_type = 'percentage' then
    v_final_price := round(v_original_price * v_discount_value);
  else
    v_final_price := v_original_price;
  end if;

  return v_final_price;
end;
$$;

create or replace function public.create_order(
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
  v_order_id bigint;
  v_order_number text;
  v_item jsonb;
  v_product_id bigint;
  v_quantity integer;
  v_product_name text;
  v_unit_price numeric;
  v_subtotal integer;
  v_total integer := 0;
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

  v_order_number := 'SHK' || to_char(now(), 'YYYYMMDDHH24MISS') || lpad(floor(random() * 1000)::text, 3, '0');

  insert into public.orders (
    order_number,
    customer_name,
    title,
    phone,
    delivery,
    address,
    payment,
    note,
    status,
    total_amount
  )
  values (
    v_order_number,
    trim(p_customer_name),
    nullif(trim(p_title), ''),
    trim(p_phone),
    nullif(trim(p_delivery), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_payment), ''),
    nullif(trim(p_note), ''),
    'new',
    0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::bigint;
    v_quantity := (v_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for product %', v_product_id;
    end if;

    select name
    into v_product_name
    from public.products
    where id = v_product_id
      and is_active = true;

    if v_product_name is null then
      raise exception 'Product not found: %', v_product_id;
    end if;

    v_unit_price := public.get_product_price(v_product_id, v_quantity);
    v_subtotal := round(v_unit_price * v_quantity)::integer;
    v_total := v_total + v_subtotal;

    insert into public.order_items (
      order_id,
      product_name,
      quantity,
      unit_price
    )
    values (
      v_order_id,
      v_product_name,
      v_quantity,
      round(v_unit_price)::integer
    );

    v_items_result := v_items_result || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product_id,
        'product_name', v_product_name,
        'quantity', v_quantity,
        'unit_price', round(v_unit_price)::integer,
        'subtotal', v_subtotal
      )
    );
  end loop;

  update public.orders
  set
    total_amount = v_total,
    updated_at = now()
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'items', v_items_result
  );
end;
$$;

grant execute on function public.get_product_price(bigint, integer) to anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

-- RLS 建議：
-- 前台只透過 security definer 的 create_order 建立訂單，所以不需要開放 orders/order_items insert policy。
-- 你可以在 Supabase Dashboard 直接查看 orders/order_items。
-- 若未來要做自己的 admin.html 後台，再另外加登入與管理者查詢 policy。
