const products = [
  {
    id: 1,
    name: "金鑽紅仁花生",
    subtitle: "嚴選在地頂級紅仁花生，外皮晶瑩細緻，富含高營養價值，口感加倍甘甜深邃。",
    price: 180,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    image: "source/produce/produce_2.jpg"
  },
  {
    id: 2,
    name: "焙炒椒麻花生",
    subtitle: "經典香脆焙炒，特選椒麻微辣風味，微麻微辣，佐茶下酒、聚會休閒的絕配良伴。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    image: "source/produce/produce_2.jpg"
  },
  {
    id: 3,
    name: "焙炒五香花生",
    subtitle: "五香濃郁溫潤，顆顆飽滿香脆，遵循古法精心焙炒，保留最純粹的經典花生香氣。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    image: "source/photo/photo_1.jpg"
  },
  {
    id: 4,
    name: "手工花生糖",
    subtitle: "職人純手工精心製作，獨門麥芽糖黃金比例。酥脆濃郁，香醇持久不黏牙，精裝禮盒最宜大器送禮。",
    price: 200,
    tag: "手工花生糖",
    spec: "規格：禮盒14入",
    image: "source/produce/produce_1.jpg"
  },
  {
    id: 5,
    name: "家常小包裝",
    subtitle: "小份量包裝方便保存，適合辦公室、下午茶與日常分享，想吃就開一包。",
    price: 120,
    tag: "日常分享",
    spec: "規格：輕巧包",
    image: "source/photo/photo_3.jpg"
  }
];

const money = value => `NT$${value.toLocaleString("zh-TW")}`;
const discountRules = window.discountRules || [];
const cart = new Map();
const catalog = document.querySelector("[data-shop-products]");
const cartList = document.querySelector("[data-cart-list]");
const cartTotal = document.querySelector("[data-cart-total]");
const orderForm = document.querySelector("[data-order-form]");
const orderResult = document.querySelector("[data-order-result]");
const bankTransfer = document.querySelector("[data-bank-transfer]");
const copyAccountButton = document.querySelector("[data-copy-account]");

function productDiscount(product) {
  return discountRules.find(rule => rule.productId === product.id && rule.enabled);
}

function sortedTiers(product) {
  const rule = productDiscount(product);
  if (!rule) return [];
  return [...rule.tiers].sort((a, b) => a.minQuantity - b.minQuantity);
}

function unitPriceFor(product, quantity) {
  const matchedTier = sortedTiers(product)
    .filter(tier => quantity >= tier.minQuantity)
    .at(-1);
  return matchedTier ? matchedTier.unitPrice : product.price;
}

function promoMarkup(product) {
  const tiers = sortedTiers(product);
  if (!tiers.length) return `<span>目前無多件優惠</span>`;
  return tiers
    .map(tier => `<span>滿 ${tier.minQuantity} 件起 → ${money(tier.unitPrice)}</span>`)
    .join("");
}

function refreshPreviewPrice(index) {
  const product = products[index];
  const input = catalog.querySelector(`[data-product-quantity="${index}"]`);
  const preview = catalog.querySelector(`[data-preview-price="${index}"]`);
  if (!input || !preview) return;
  const quantity = Math.max(1, Number(input.value || 1));
  preview.textContent = money(unitPriceFor(product, quantity));
}

catalog.innerHTML = products.map((product, index) => `
  <article class="catalog-card">
    <header class="catalog-card-head">
      <span>${product.tag}</span>
      <span>${product.spec}</span>
    </header>
    <div class="catalog-photo"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>
    <div class="catalog-copy">
      <h3>${product.name}</h3>
      <p>${product.subtitle}</p>
      <div class="promo-box">
        <strong>多件特惠方案：</strong>
        ${promoMarkup(product)}
      </div>
      <div class="unit-price"><span>目前單價：</span><strong data-preview-price="${index}">${money(product.price)}</strong></div>
      <div class="catalog-actions">
        <span>選購數量：</span>
        <div class="product-quantity">
          <button type="button" data-product-step="${index}" data-step="-1" aria-label="減少 ${product.name} 數量">−</button>
          <input type="number" min="1" value="1" inputmode="numeric" data-product-quantity="${index}" aria-label="${product.name} 數量">
          <button type="button" data-product-step="${index}" data-step="1" aria-label="增加 ${product.name} 數量">＋</button>
        </div>
        <button type="button" data-add-product="${index}">加入訂購單</button>
      </div>
    </div>
  </article>
`).join("");

function renderCart() {
  if (!cart.size) {
    cartList.innerHTML = `<p class="cart-empty">尚未選擇商品。</p>`;
    cartTotal.textContent = money(0);
    return;
  }

  let total = 0; 
  cartList.innerHTML = [...cart.entries()].map(([index, quantity]) => {
    const product = products[index];
    const unitPrice = unitPriceFor(product, quantity);
    const subtotal = unitPrice * quantity;
    total += subtotal;
    return `
      <article class="cart-item">
        <div>
          <strong>${product.name}</strong>
          <span>${money(unitPrice)} / 份，小計 ${money(subtotal)}</span>
        </div>
        <div class="quantity-control">
          <button type="button" data-change-quantity="${index}" data-step="-1" aria-label="減少 ${product.name} 數量">−</button>
          <output>${quantity}</output>
          <button type="button" data-change-quantity="${index}" data-step="1" aria-label="增加 ${product.name} 數量">＋</button>
        </div>
      </article>
    `;
  }).join("");
  cartTotal.textContent = money(total);
}

function addProduct(index, quantity = 1) {
  cart.set(index, (cart.get(index) || 0) + quantity);
  renderCart();
}

catalog.addEventListener("click", event => {
  const stepButton = event.target.closest("[data-product-step]");
  if (stepButton) {
    const index = Number(stepButton.dataset.productStep);
    const input = catalog.querySelector(`[data-product-quantity="${index}"]`);
    input.value = Math.max(1, Number(input.value || 1) + Number(stepButton.dataset.step));
    refreshPreviewPrice(index);
    return;
  }

  const button = event.target.closest("[data-add-product]");
  if (!button) return;
  const index = Number(button.dataset.addProduct);
  const input = catalog.querySelector(`[data-product-quantity="${index}"]`);
  addProduct(index, Math.max(1, Number(input.value || 1)));
});

catalog.addEventListener("input", event => {
  const input = event.target.closest("[data-product-quantity]");
  if (!input) return;
  const index = Number(input.dataset.productQuantity);
  input.value = Math.max(1, Number(input.value || 1));
  refreshPreviewPrice(index);
});

cartList.addEventListener("click", event => {
  const button = event.target.closest("[data-change-quantity]");
  if (!button) return;
  const index = Number(button.dataset.changeQuantity);
  const nextQuantity = (cart.get(index) || 0) + Number(button.dataset.step);
  if (nextQuantity <= 0) cart.delete(index);
  else cart.set(index, nextQuantity);
  renderCart();
});

orderForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.size) {
    orderResult.hidden = false;
    orderResult.innerHTML = `<h3>請先選擇商品</h3><p>加入至少一項商品後，就可以產生訂單摘要。</p>`;
    orderResult.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const data = new FormData(orderForm);
  const items = [...cart.entries()].map(([index, quantity]) => {
    const product = products[index];
    const unitPrice = unitPriceFor(product, quantity);
    return { ...product, quantity, unitPrice, subtotal: unitPrice * quantity };
  });
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const orderNo = `SHK${Date.now().toString().slice(-8)}`;
  const summaryLines = items.map(item => `${item.name} x ${item.quantity}（${money(item.unitPrice)} / 份）= ${money(item.subtotal)}`).join("\n");
  const mailBody = encodeURIComponent(
    `訂單編號：${orderNo}\n\n${summaryLines}\n小計：${money(total)}\n\n姓名：${data.get("name")} ${data.get("title")}\n電話：${data.get("phone")}\n配送方式：${data.get("delivery")}\n地址或取貨資訊：${data.get("address")}\n付款方式：${data.get("payment")}\n備註：${data.get("note") || "無"}`
  );

  orderResult.hidden = false;
  orderResult.innerHTML = `
    <h3>訂單摘要已產生</h3>
    <p>訂單編號：<strong>${orderNo}</strong></p>
    <ul>${items.map(item => `<li>${item.name} × ${item.quantity}（${money(item.unitPrice)} / 份）：${money(item.subtotal)}</li>`).join("")}</ul>
    <p class="result-total">小計：${money(total)}</p>
    <p>付款方式：${data.get("payment")}。送出後不會直接扣款，請等候店家確認付款資料與出貨方式。</p>
    <a class="button primary" href="mailto:sinhiapki.1928@gmail.com?subject=${encodeURIComponent(`新洽記商行訂單 ${orderNo}`)}&body=${mailBody}">用 Email 送出訂單</a>
`;
  orderResult.scrollIntoView({ behavior: "smooth", block: "start" });
});

orderForm.querySelectorAll('input[name="payment"]').forEach(input => {
  input.addEventListener("change", () => {
    bankTransfer.hidden = orderForm.elements.payment.value !== "銀行轉帳";
  });
});

copyAccountButton.addEventListener("click", async () => {
  const account = document.querySelector("[data-account-number]").textContent.trim();
  try {
    await navigator.clipboard.writeText(account);
    copyAccountButton.textContent = "已複製";
  } catch {
    copyAccountButton.textContent = account;
  }
  window.setTimeout(() => {
    copyAccountButton.textContent = "複製";
  }, 1800);
});

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-nav");
menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => navigation.classList.remove("open")));
document.querySelector("[data-close-announcement]").addEventListener("click", event => event.currentTarget.parentElement.remove());
document.querySelector("[data-year]").textContent = new Date().getFullYear();

renderCart();

const initialProduct = new URLSearchParams(window.location.search).get("product");
if (initialProduct !== null && products[Number(initialProduct)]) {
  addProduct(Number(initialProduct));
  document.querySelector("#cart").scrollIntoView({ behavior: "smooth", block: "start" });
}
