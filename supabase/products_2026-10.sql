-- ========================================
-- 2026-10 商品更新：讓 Supabase products 與 js/products.js 一致
-- ========================================
-- 在 Supabase → SQL Editor 執行一次即可。
-- id 必須與 js/products.js 的 id 相同；價格以這裡為準（網站上的價格只是顯示用）。
-- 花生芽（id 9）目前是「即將上架」，網站不能下單，所以先不加入。

-- 既有商品：只更新名稱，價格維持原本設定
update public.products set name = '焙炒金鑽紅仁花生' where id = 1;
update public.products set name = '焙炒椒麻花生'     where id = 2;
update public.products set name = '焙炒五香花生'     where id = 3;
update public.products set name = '手工花生糖'   where id = 4;

-- 舊的「家常小包裝」下架
update public.products set is_active = false where id = 5;

-- 新商品（價格取自雲林文創展上架資訊表，如需調整請同步改 js/products.js）
insert into public.products (id, name, price, is_active) values
  (6, '減糖配方花生糖', 140, true),
  (7, '洽禮盒花生組',   500, true),
  (8, '無添加純花生醬', 220, true)
on conflict (id) do update
  set name = excluded.name, price = excluded.price, is_active = excluded.is_active;

-- id 5 的優惠規則一併停用
update public.discount_rules set active = false where product_id = 5;
