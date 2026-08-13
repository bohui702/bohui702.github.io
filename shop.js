// Supabase 與商品設定分別集中在 config.js、products.js。
const { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY } = window.APP_CONFIG.supabase;

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


const products = window.PRODUCTS;

const money = value => `NT$${Number(value).toLocaleString("zh-TW")}`;

const cart = new Map();

const catalog = document.querySelector("[data-shop-products]");
const cartList = document.querySelector("[data-cart-list]");
const cartTotal = document.querySelector("[data-cart-total]");
const orderForm = document.querySelector("[data-order-form]");
const orderResult = document.querySelector("[data-order-result]");
const bankTransfer = document.querySelector("[data-bank-transfer]");
const copyAccountButton = document.querySelector("[data-copy-account]");


// ========================================
// 商品列表
// ========================================
catalog.innerHTML = products.map((product, index) => `
  <article class="catalog-card">
    <header class="catalog-card-head">
      <span>${product.tag}</span>
      <span>${product.spec}</span>
    </header>

    <div class="catalog-photo">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
    </div>

    <div class="catalog-copy">
      <h3>${product.name}</h3>
      <p>${product.subtitle}</p>

      <div class="promo-box">
        <strong>多件特惠方案：</strong>
        ${product.promos.map(promo => `<span>${promo}</span>`).join("")}
      </div>

      <div class="unit-price">
        <span>單價：</span>
        <strong>${money(product.price)}</strong>
      </div>

      <div class="catalog-actions">
        <span>選購數量：</span>

        <div class="product-quantity">
          <button
            type="button"
            data-product-step="${index}"
            data-step="-1"
            aria-label="減少 ${product.name} 數量"
          >−</button>

          <input
            type="number"
            min="1"
            value="1"
            inputmode="numeric"
            data-product-quantity="${index}"
            aria-label="${product.name} 數量"
          >

          <button
            type="button"
            data-product-step="${index}"
            data-step="1"
            aria-label="增加 ${product.name} 數量"
          >＋</button>
        </div>

        <button type="button" data-add-product="${index}">
          加入訂購單
        </button>
      </div>
    </div>
  </article>
`).join("");


// ========================================
// 前端優惠預覽
// 注意：這只是顯示用。
// 真正成交價由 Supabase create_order() 重新計算。
// ========================================
function getPreviewUnitPrice(product, quantity) {
  if (typeof window.getDiscountedPrice !== "function") {
    return product.price;
  }

  return window.getDiscountedPrice(
    product.id,
    quantity,
    product.price
  );
}


// ========================================
// 購物車
// ========================================
function renderCart() {
  if (!cart.size) {
    cartList.innerHTML = `<p class="cart-empty">尚未選擇商品。</p>`;
    cartTotal.textContent = money(0);
    return;
  }

  let total = 0;

  cartList.innerHTML = [...cart.entries()].map(([index, quantity]) => {
    const product = products[index];

    const originalPrice = product.price;
    const unitPrice = getPreviewUnitPrice(product, quantity);
    const subtotal = unitPrice * quantity;

    total += subtotal;

    const hasDiscount = unitPrice < originalPrice;

    return `
      <article class="cart-item">
        <div>
          <strong>${product.name}</strong>

          ${hasDiscount
        ? `
                <span>
                  <s>${money(originalPrice)}</s>
                  → <strong>${money(unitPrice)} / 份</strong>
                </span>
                <small>已套用數量優惠</small>
              `
        : `<span>${money(originalPrice)} / 份</span>`
      }

          <span>小計：${money(subtotal)}</span>
        </div>

        <div class="quantity-control">
          <button
            type="button"
            data-change-quantity="${index}"
            data-step="-1"
            aria-label="減少 ${product.name} 數量"
          >−</button>

          <output>${quantity}</output>

          <button
            type="button"
            data-change-quantity="${index}"
            data-step="1"
            aria-label="增加 ${product.name} 數量"
          >＋</button>
        </div>
      </article>
    `;
  }).join("");

  cartTotal.textContent = money(total);
}


function addProduct(index, quantity = 1) {
  cart.set(
    index,
    (cart.get(index) || 0) + quantity
  );

  renderCart();
}


// ========================================
// 商品區按鈕
// ========================================
catalog.addEventListener("click", event => {
  const stepButton = event.target.closest("[data-product-step]");

  if (stepButton) {
    const index = Number(stepButton.dataset.productStep);

    const input = catalog.querySelector(
      `[data-product-quantity="${index}"]`
    );

    input.value = Math.max(
      1,
      Number(input.value || 1) + Number(stepButton.dataset.step)
    );

    return;
  }

  const button = event.target.closest("[data-add-product]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.addProduct);

  const input = catalog.querySelector(
    `[data-product-quantity="${index}"]`
  );

  addProduct(
    index,
    Math.max(1, Number(input.value || 1))
  );
});


// ========================================
// 購物車數量調整
// ========================================
cartList.addEventListener("click", event => {
  const button = event.target.closest("[data-change-quantity]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.changeQuantity);

  const nextQuantity =
    (cart.get(index) || 0) + Number(button.dataset.step);

  if (nextQuantity <= 0) {
    cart.delete(index);
  } else {
    cart.set(index, nextQuantity);
  }

  renderCart();
});


// ========================================
// 建立後端訂單
// ========================================
async function createOrder(formData) {

  // 只傳商品 id + quantity。
  // 不把前端 price 傳到後端。
  const items = [...cart.entries()].map(([index, quantity]) => ({
    product_id: products[index].id,
    quantity: quantity
  }));

  const payload = {
    p_customer_name: String(formData.get("name") || "").trim(),
    p_title: String(formData.get("title") || "").trim(),
    p_phone: String(formData.get("phone") || "").trim(),
    p_delivery: String(formData.get("delivery") || "").trim(),
    p_address: String(formData.get("address") || "").trim(),
    p_payment: String(formData.get("payment") || "").trim(),
    p_note: String(formData.get("note") || "").trim(),
    p_items: items
  };

  const { data, error } = await supabaseClient.rpc(
    "create_order",
    payload
  );

  if (error) {
    throw error;
  }

  return data;
}


// ========================================
// 表單送出
// ========================================
orderForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!cart.size) {
    orderResult.hidden = false;

    orderResult.innerHTML = `
      <h3>請先選擇商品</h3>
      <p>加入至少一項商品後，就可以送出訂單。</p>
    `;

    orderResult.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  const submitButton = orderForm.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  const originalButtonText =
    submitButton?.tagName === "INPUT"
      ? submitButton.value
      : submitButton?.textContent;

  try {

    // 避免使用者連點造成重複訂單
    if (submitButton) {
      submitButton.disabled = true;

      if (submitButton.tagName === "INPUT") {
        submitButton.value = "訂單送出中...";
      } else {
        submitButton.textContent = "訂單送出中...";
      }
    }

    orderResult.hidden = false;

    orderResult.innerHTML = `
      <h3>正在建立訂單...</h3>
      <p>請勿重複送出。</p>
    `;

    const formData = new FormData(orderForm);

    // 真正把訂單送進 Supabase
    const result = await createOrder(formData);

    // SQL function 預期回傳：
    // {
    //   order_number: "...",
    //   total_amount: 1234,
    //   items: [...]
    // }

    const orderNumber = result.order_number;
    const totalAmount = Number(result.total_amount || 0);
    const resultItems = Array.isArray(result.items)
      ? result.items
      : [];

    orderResult.innerHTML = `
      <h3>訂單已成功送出</h3>

      <p>
        訂單編號：
        <strong>${orderNumber}</strong>
      </p>

      ${resultItems.length
        ? `
            <ul>
              ${resultItems.map(item => `
                <li>
                  ${item.product_name}
                  × ${item.quantity}
                  ：${money(item.subtotal)}
                </li>
              `).join("")}
            </ul>
          `
        : ""
      }

      <p class="result-total">
        訂單總額：${money(totalAmount)}
      </p>

      <p>
        付款方式：${formData.get("payment")}。
        訂單已送進店家系統，請等候店家確認付款資料與出貨方式。
      </p>
    `;

    // 成功後清空購物車與表單
    cart.clear();
    renderCart();

    orderForm.reset();

    if (bankTransfer) {
      bankTransfer.hidden = true;
    }

  } catch (error) {

    console.error("Supabase create_order error:", error);

    orderResult.hidden = false;

    orderResult.innerHTML = `
      <h3>訂單送出失敗</h3>
      <p>目前無法建立訂單，請稍後再試。</p>
      <p><small>${error.message || "Unknown error"}</small></p>
    `;

  } finally {

    if (submitButton) {
      submitButton.disabled = false;

      if (submitButton.tagName === "INPUT") {
        submitButton.value = originalButtonText;
      } else {
        submitButton.textContent = originalButtonText;
      }
    }

    orderResult.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});


// ========================================
// 付款方式：銀行轉帳
// ========================================
orderForm
  .querySelectorAll('input[name="payment"]')
  .forEach(input => {
    input.addEventListener("change", () => {
      bankTransfer.hidden =
        orderForm.elements.payment.value !== "銀行轉帳";
    });
  });


// ========================================
// 複製銀行帳號
// ========================================
copyAccountButton.addEventListener("click", async () => {
  const account = document
    .querySelector("[data-account-number]")
    .textContent
    .trim();

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


// ========================================
// 手機選單
// ========================================
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-nav");

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuButton.setAttribute(
    "aria-expanded",
    isOpen
  );
});

navigation
  .querySelectorAll("a")
  .forEach(link =>
    link.addEventListener("click", () =>
      navigation.classList.remove("open")
    )
  );


// ========================================
// 公告 / 年份
// ========================================
document
  .querySelector("[data-close-announcement]")
  .addEventListener(
    "click",
    event => event.currentTarget.parentElement.remove()
  );

document.querySelector("[data-year]").textContent =
  new Date().getFullYear();


// ========================================
// 初始購物車
// ========================================
renderCart();


// ========================================
// URL 指定商品
// ========================================
const initialProduct =
  new URLSearchParams(window.location.search).get("product");

if (
  initialProduct !== null &&
  products[Number(initialProduct)]
) {
  addProduct(Number(initialProduct));

  document
    .querySelector("#cart")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}
