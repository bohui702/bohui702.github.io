// 商品優惠規則設定
// 調整方式：
// 1. productId 對應 shop.js 裡每個商品的 id
// 2. minQuantity 是達到幾件/幾罐開始套用
// 3. unitPrice 是達到門檻後的單件價格
// 4. enabled 改成 false 可以暫停該優惠
window.discountRules = [
  {
    productId: 1,
    enabled: true,
    tiers: [
      { minQuantity: 30, unitPrice: 170 },
      { minQuantity: 50, unitPrice: 160 }
    ]
  },
  {
    productId: 2,
    enabled: true,
    tiers: [
      { minQuantity: 30, unitPrice: 140 },
      { minQuantity: 50, unitPrice: 135 }
    ]
  },
  {
    productId: 3,
    enabled: true,
    tiers: [
      { minQuantity: 30, unitPrice: 140 },
      { minQuantity: 50, unitPrice: 135 }
    ]
  },
  {
    productId: 4,
    enabled: true,
    tiers: [
      { minQuantity: 20, unitPrice: 180 }
    ]
  },
  {
    productId: 5,
    enabled: true,
    tiers: [
      { minQuantity: 10, unitPrice: 110 }
    ]
  }
];

window.getDiscountedPrice = function (productId, quantity, originalPrice) {

  const rule = window.discountRules.find(
    rule => rule.productId === productId && rule.enabled
  );

  if (!rule) {
    return originalPrice;
  }

  const applicableTier = [...rule.tiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find(tier => quantity >= tier.minQuantity);

  if (!applicableTier) {
    return originalPrice;
  }

  return applicableTier.unitPrice;
};