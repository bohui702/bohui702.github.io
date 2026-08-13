// ========================================
// 商品優惠規則
// ========================================
// 注意：
// 1. 這份檔案只負責「前端顯示 / 預覽優惠」。
// 2. 真正成交價格由 Supabase 的 get_product_price / create_order 重新計算。
// 3. productId 必須和 Supabase products.id 完全一致。
// ========================================

window.discountRules = [
  {
    productId: 1,
    enabled: true,
    tiers: [
      { minQuantity: 30, type: "fixed_price", value: 170 },
      { minQuantity: 50, type: "fixed_price", value: 160 }
    ]
  },

  {
    productId: 2,
    enabled: true,
    tiers: [
      { minQuantity: 30, type: "fixed_price", value: 140 },
      { minQuantity: 50, type: "fixed_price", value: 135 }
    ]
  },

  {
    productId: 3,
    enabled: true,
    tiers: [
      { minQuantity: 30, type: "fixed_price", value: 140 },
      { minQuantity: 50, type: "fixed_price", value: 135 }
    ]
  },

  {
    productId: 4,
    enabled: true,
    tiers: [
      { minQuantity: 20, type: "fixed_price", value: 180 }
    ]
  },

  {
    productId: 5,
    enabled: true,
    tiers: [
      { minQuantity: 10, type: "fixed_price", value: 110 }
    ]
  }
];


// ========================================
// 取得前端預覽優惠價
// ========================================
window.getDiscountedPrice = function (
  productId,
  quantity,
  originalPrice
) {

  const rule = window.discountRules.find(
    rule =>
      rule.productId === productId &&
      rule.enabled
  );

  if (!rule) {
    return originalPrice;
  }

  // 找「符合數量條件，而且門檻最高」的優惠
  const applicableTier = [...rule.tiers]
    .sort(
      (a, b) =>
        b.minQuantity - a.minQuantity
    )
    .find(
      tier =>
        quantity >= tier.minQuantity
    );

  if (!applicableTier) {
    return originalPrice;
  }

  // 固定優惠單價
  if (applicableTier.type === "fixed_price") {
    return applicableTier.value;
  }

  // 百分比折扣
  // 例如 value = 0.85 → 85 折
  if (applicableTier.type === "percentage") {
    return Math.round(
      originalPrice * applicableTier.value
    );
  }

  return originalPrice;
};
