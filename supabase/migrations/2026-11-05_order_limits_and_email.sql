-- ========================================
-- 2026-11-05｜下單防灌單檢查＋新訂單 Email 通知
-- ========================================
-- ✅ 這份「不會」刪除任何資料表或訂單，可以直接在 Supabase → SQL Editor 整份貼上 → Run。
--    只會：啟用 pg_net、新增一個索引、新增／替換函式。重複執行也沒關係。
--
-- 內容：
--   1. create_order() 加上檢查：欄位長度、電話格式、數量上限、商品不可重複、
--      同一支電話 10 分鐘內最多 3 張、全站 10 分鐘內最多 30 張（防止被程式灌單）。
--      錯誤訊息改成代碼（例如 ORDER_PHONE_INVALID），由 js/shop.js 翻成中文給顧客看。
--   2. 新訂單送出後寄 Email 通知店家（透過 Resend 寄信服務）。
--      寄信失敗不會影響下單；沒設定金鑰時就單純不寄。
--
-- Email 通知的一次性設定（API 金鑰與收件信箱只存在 Supabase Vault，不會出現在 GitHub）：
--   1) 到 https://resend.com 用「收通知的那個 Gmail」註冊，在 API Keys 建立一把金鑰（re_ 開頭）。
--      免費方案每天 100 封；沒有自己的網域時，只能寄給註冊時的那個信箱。
--   2) 在 SQL Editor 執行（把值換掉；這兩行不要存進任何檔案）：
--        select vault.create_secret('re_你的金鑰', 'resend_api_key');
--        select vault.create_secret('你的Gmail', 'order_notify_email');
--   3) 到網站實際下一張測試訂單，確認有收到信。
--   要換金鑰或信箱：select vault.update_secret(id, '新的值') from vault.secrets where name = 'resend_api_key';
--   寄送紀錄（排查用）：select id, status_code, content, created from net._http_response order by created desc limit 5;
-- ========================================

begin;

create extension if not exists pg_net with schema extensions;

-- 限流查詢用（查最近 10 分鐘的訂單）
create index if not exists orders_created_idx on public.orders (created_at desc);


-- ========================================
-- HTML 跳脫：顧客填的內容放進 Email 前先轉義，避免信件內容被插入 HTML
-- ========================================
create or replace function public.html_escape(p_text text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(replace(coalesce(p_text, ''),
    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;');
$$;


-- ========================================
-- 寄出新訂單通知信
-- ========================================
create or replace function public.notify_new_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_api_key text;
  v_to      text;
  v_order   public.orders%rowtype;
  v_items   text;
  v_html    text;
begin
  select decrypted_secret into v_api_key from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into v_to      from vault.decrypted_secrets where name = 'order_notify_email';

  if v_api_key is null or v_to is null then
    return;  -- 尚未設定，不寄信
  end if;

  select * into v_order from public.orders where id = p_order_id;

  select string_agg(
           format('<tr><td style="padding:4px 12px 4px 0">%s</td><td style="padding:4px 12px">× %s</td><td style="padding:4px 0;text-align:right">NT$%s</td></tr>',
                  public.html_escape(product_name), quantity, to_char(subtotal, 'FM999,999,990')),
           '' order by id)
    into v_items
  from public.order_items
  where order_id = p_order_id;

  v_html := format(
    '<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#2a211c">'
    || '<h2 style="margin:0 0 8px">新訂單 %s</h2>'
    || '<p style="margin:0 0 16px;color:#6f625b">%s</p>'
    || '<table style="border-collapse:collapse;margin-bottom:8px">%s</table>'
    || '<p style="font-size:18px;margin:0 0 16px"><strong>總額 NT$%s</strong></p>'
    || '<p style="margin:0">顧客：%s %s<br>電話：%s<br>配送：%s<br>地址／取貨：%s<br>付款：%s<br>備註：%s</p>'
    || '<p style="margin:20px 0 0"><a href="https://bohui702.github.io/admin.html">前往訂單管理頁</a></p>'
    || '</div>',
    public.html_escape(v_order.order_number),
    to_char(v_order.created_at at time zone 'Asia/Taipei', 'YYYY/MM/DD HH24:MI'),
    coalesce(v_items, ''),
    to_char(v_order.total_amount, 'FM999,999,990'),
    public.html_escape(v_order.customer_name),
    public.html_escape(v_order.title),
    public.html_escape(v_order.phone),
    public.html_escape(v_order.delivery),
    public.html_escape(v_order.address),
    public.html_escape(v_order.payment),
    coalesce(nullif(public.html_escape(v_order.note), ''), '（無）')
  );

  -- pg_net 會在訂單交易成功（commit）之後才真的送出；下單失敗就不會寄
  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_api_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object(
      'from',    '新洽記訂單通知 <onboarding@resend.dev>',
      'to',      jsonb_build_array(v_to),
      'subject', format('【新訂單】%s %s　NT$%s', v_order.order_number, v_order.customer_name,
                        to_char(v_order.total_amount, 'FM999,999,990')),
      'html',    v_html
    )
  );
exception when others then
  -- 寄信出任何問題都不能讓顧客下單失敗
  raise warning 'notify_new_order failed for order %: %', p_order_id, sqlerrm;
end;
$$;


-- ========================================
-- 建立訂單（加上檢查與通知）
-- ========================================
-- 網站只傳商品 id 與數量，名稱與價格一律在這裡查，顧客無法竄改金額。
-- 錯誤訊息是代碼，中文說明在 js/shop.js 的 ORDER_ERRORS。
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
  v_order_id     bigint;
  v_order_number text;
  v_item         jsonb;
  v_product_id   bigint;
  v_quantity     integer;
  v_product_name text;
  v_unit_price   integer;
  v_total        integer := 0;
  v_items_result jsonb := '[]'::jsonb;
  v_phone_digits text;
  v_seen_ids     bigint[] := '{}';
begin
  -- ---------- 欄位檢查（上限要和 shop.html 的 maxlength 一致） ----------
  if nullif(trim(p_customer_name), '') is null then raise exception 'ORDER_NAME_REQUIRED'; end if;
  if length(trim(p_customer_name)) > 30         then raise exception 'ORDER_NAME_TOO_LONG'; end if;
  if length(coalesce(trim(p_title), '')) > 10   then raise exception 'ORDER_FIELD_TOO_LONG'; end if;

  if nullif(trim(p_phone), '') is null then raise exception 'ORDER_PHONE_REQUIRED'; end if;
  v_phone_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');
  if length(trim(p_phone)) > 20
     or trim(p_phone) !~ '^[0-9+()# -]+$'
     or length(v_phone_digits) not between 8 and 15 then
    raise exception 'ORDER_PHONE_INVALID';
  end if;

  if nullif(trim(p_address), '') is null           then raise exception 'ORDER_ADDRESS_REQUIRED'; end if;
  if length(trim(p_address)) > 120                  then raise exception 'ORDER_ADDRESS_TOO_LONG'; end if;
  if length(coalesce(trim(p_delivery), '')) > 30
     or length(coalesce(trim(p_payment), '')) > 30 then raise exception 'ORDER_FIELD_TOO_LONG'; end if;
  if length(coalesce(trim(p_note), '')) > 300       then raise exception 'ORDER_NOTE_TOO_LONG'; end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'ORDER_ITEMS_REQUIRED';
  end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'ORDER_TOO_MANY_ITEMS'; end if;

  -- ---------- 防灌單 ----------
  if (select count(*) from public.orders
      where created_at > now() - interval '10 minutes'
        and regexp_replace(phone, '[^0-9]', '', 'g') = v_phone_digits) >= 3 then
    raise exception 'ORDER_RATE_LIMIT_PHONE';
  end if;

  if (select count(*) from public.orders where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'ORDER_RATE_LIMIT_GLOBAL';
  end if;

  -- ---------- 建立訂單 ----------
  v_order_number := 'SHK' || to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDDHH24MISS')
                    || lpad(floor(random() * 1000)::text, 3, '0');

  insert into public.orders (order_number, customer_name, title, phone, delivery, address, payment, note)
  values (
    v_order_number,
    trim(p_customer_name),
    nullif(trim(p_title), ''),
    trim(p_phone),
    nullif(trim(p_delivery), ''),
    trim(p_address),
    nullif(trim(p_payment), ''),
    nullif(trim(p_note), '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::bigint;
      v_quantity   := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'ORDER_QUANTITY_INVALID';
    end;

    if v_quantity is null or v_quantity <= 0 then raise exception 'ORDER_QUANTITY_INVALID'; end if;
    if v_quantity > 999                       then raise exception 'ORDER_QUANTITY_TOO_LARGE'; end if;
    if v_product_id = any(v_seen_ids)         then raise exception 'ORDER_DUPLICATE_ITEM'; end if;
    v_seen_ids := v_seen_ids || v_product_id;

    select name into v_product_name
    from public.products
    where id = v_product_id and is_active;

    if v_product_name is null then raise exception 'ORDER_PRODUCT_UNAVAILABLE'; end if;

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

  perform public.notify_new_order(v_order_id);

  return jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'items',        v_items_result
  );
end;
$$;


-- ========================================
-- 權限：只有 create_order 能被顧客呼叫；寄信函式不開放，避免有人直接呼叫狂寄信
-- ========================================
-- Supabase 預設會把新函式開放給 anon / authenticated，所以要明確收回
revoke execute on function public.notify_new_order(bigint) from public, anon, authenticated;
revoke execute on function public.html_escape(text)        from public, anon, authenticated;

revoke execute on function public.create_order(text, text, text, text, text, text, text, jsonb) from public;
grant  execute on function public.create_order(text, text, text, text, text, text, text, jsonb) to anon, authenticated;

commit;
