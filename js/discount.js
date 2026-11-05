// ========================================
// 商品價格與多件優惠（選購頁用）
// ========================================
// 價格與優惠規則一律以 Supabase 為準：
//   products.price           商品原價
//   discount_rules           多件優惠（Table Editor 改完，選購頁重新整理就會更新）
// 這裡只負責「讀取 Supabase → 在畫面上預覽優惠價」；
// 真正成交價仍由 Supabase 的 get_product_price / create_order 計算。
//
// 讀取失敗時（例如網路問題），選購頁會先用 js/products.js 的 price 顯示，不顯示優惠。
// ========================================

window.discountRules = [];

// 從 Supabase 讀取最新價格與優惠，套用到 products（js/products.js）
window.loadPricing = async function () {
  const [productResult, ruleResult] = await Promise.all([
    supabaseClient.from("products").select("id, price"),
    supabaseClient
      .from("discount_rules")
      .select("product_id, min_quantity, discount_type, discount_value, start_at, end_at")
  ]);

  if (productResult.error) throw productResult.error;
  if (ruleResult.error) throw ruleResult.error;

  const prices = new Map(productResult.data.map(row => [Number(row.id), Number(row.price)]));

  products.forEach(product => {
    if (product.comingSoon) return;

    if (prices.has(product.id)) {
      product.price = prices.get(product.id);
      product.unavailable = false;
    } else {
      // Supabase 裡沒有這個商品或已下架（is_active = false）→ 不能下單
      product.unavailable = true;
    }
  });

  const now = Date.now();
  window.discountRules = ruleResult.data
    .filter(rule =>
      (!rule.start_at || new Date(rule.start_at).getTime() <= now) &&
      (!rule.end_at || new Date(rule.end_at).getTime() >= now))
    .map(rule => ({
      productId: Number(rule.product_id),
      minQuantity: rule.min_quantity,
      type: rule.discount_type,
      value: Number(rule.discount_value)
    }));
};


// 某商品目前有效的優惠，依門檻由低到高
window.getProductTiers = function (productId) {
  return window.discountRules
    .filter(rule => rule.productId === productId)
    .sort((a, b) => a.minQuantity - b.minQuantity);
};


// 優惠說明文字，例如「滿 30 罐起 → NT$140」「滿 10 件起 → 85 折」
window.describeTier = function (tier, unit = "件") {
  if (tier.type === "percentage") {
    const fold = Math.round(tier.value * 100);
    return `滿 ${tier.minQuantity} ${unit}起 → ${fold % 10 === 0 ? fold / 10 : fold} 折`;
  }
  return `滿 ${tier.minQuantity} ${unit}起 → ${money(tier.value)}`;
};


// 預覽單價：找「符合數量、門檻最高」的優惠（和 Supabase get_product_price 相同邏輯）
window.getDiscountedPrice = function (productId, quantity, originalPrice) {
  const tier = window.getProductTiers(productId)
    .filter(rule => quantity >= rule.minQuantity)
    .pop();

  if (!tier) return originalPrice;
  if (tier.type === "fixed_price") return tier.value;
  if (tier.type === "percentage") return Math.round(originalPrice * tier.value);
  return originalPrice;
};
