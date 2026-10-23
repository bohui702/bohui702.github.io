// ========================================
// 訂單管理後台（admin.html）
// ========================================
// 資料庫設定見 supabase/admin_setup.sql。
// 一般不需要修改；想改狀態名稱改下面的 STATUSES。

const STATUSES = [
  { key: "new",       label: "新訂單", next: "confirmed", action: "確認訂單，準備出貨" },
  { key: "confirmed", label: "待出貨", next: "shipped",   action: "標記為已出貨" },
  { key: "shipped",   label: "已出貨", next: "done",      action: "標記為已完成" },
  { key: "done",      label: "已完成" },
  { key: "cancelled", label: "已取消" }
];
const statusOf = key => STATUSES.find(status => status.key === key) || STATUSES[0];
const previousStatus = { confirmed: "new", shipped: "confirmed", done: "shipped" };

const loginView = document.querySelector("[data-login-view]");
const ordersView = document.querySelector("[data-orders-view]");
const loginForm = document.querySelector("[data-login-form]");
const loginError = document.querySelector("[data-login-error]");
const userBar = document.querySelector("[data-user-bar]");
const tabs = document.querySelector("[data-tabs]");
const list = document.querySelector("[data-order-list]");
const searchInput = document.querySelector("[data-search]");
const syncText = document.querySelector("[data-sync]");
const notifyButton = document.querySelector("[data-enable-notify]");
const toast = document.querySelector("[data-toast]");

let staffName = "";
let orders = [];
let itemsByOrder = new Map();
let currentTab = null;
let realtimeChannel = null;
let pollTimer = null;


// ===== 小工具 =====
// 訂單內容是顧客輸入的，顯示前一律跳脫，避免被塞入惡意程式碼
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
));

const timeFormat = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
});
const formatTime = value => value ? timeFormat.format(new Date(value)) : "";

function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value)) / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} 小時前`;
  return `${Math.round(minutes / 60 / 24)} 天前`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 4000);
}


// ===== 登入 / 登出 =====
loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.textContent = "";
  const form = new FormData(loginForm);
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: String(form.get("email")).trim(),
    password: String(form.get("password"))
  });
  if (error) loginError.textContent = "登入失敗：Email 或密碼不正確。";
});

document.querySelector("[data-logout]").addEventListener("click", () => supabaseClient.auth.signOut());

supabaseClient.auth.onAuthStateChange((event, session) => {
  // 延後執行，避免在 Supabase 的事件處理中再呼叫 Supabase
  setTimeout(() => (session ? enterAdmin(session) : showLogin()), 0);
});

function showLogin() {
  stopLive();
  staffName = "";
  orders = [];
  loginView.hidden = false;
  ordersView.hidden = true;
  userBar.hidden = true;
  document.title = "訂單管理｜新洽記商行";
}

async function enterAdmin(session) {
  if (staffName) return;

  const { data } = await supabaseClient
    .from("staff")
    .select("display_name")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!data) {
    loginError.textContent = "這個帳號沒有訂單管理權限，請聯絡店家。";
    await supabaseClient.auth.signOut();
    return;
  }

  staffName = data.display_name;
  document.querySelector("[data-user-name]").textContent = `${staffName}，你好`;
  loginView.hidden = true;
  ordersView.hidden = false;
  userBar.hidden = false;
  notifyButton.hidden = !("Notification" in window) || Notification.permission !== "default";

  await loadOrders();
  startLive();
}


// ===== 讀取訂單 =====
async function loadOrders() {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    syncText.textContent = `讀取訂單失敗：${error.message}`;
    return;
  }

  orders = data;
  itemsByOrder = new Map();

  if (orders.length) {
    const { data: items } = await supabaseClient
      .from("order_items")
      .select("order_id, product_name, quantity, unit_price")
      .in("order_id", orders.map(order => order.id));
    (items || []).forEach(item => {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(item);
    });
  }

  // 第一次進來：有新訂單就先看新訂單，否則看待出貨
  if (!currentTab) currentTab = countOf("new") ? "new" : "confirmed";

  syncText.textContent = `最後更新：${formatTime(new Date())}・新訂單會自動出現`;
  renderWhenIdle();
}

// 有人正在輸入寄件單號或備註時，先不要重畫，免得打到一半的字被清掉
let renderPending = false;
function renderWhenIdle() {
  if (list.contains(document.activeElement) && document.activeElement.matches("input[type='text']")) {
    renderPending = true;
    return;
  }
  render();
}
list.addEventListener("focusout", () => {
  if (renderPending) setTimeout(() => { renderPending = false; renderWhenIdle(); }, 300);
});

const countOf = key => orders.filter(order => order.status === key).length;


// ===== 畫面 =====
function render() {
  const newCount = countOf("new");
  document.title = newCount ? `(${newCount}) 新訂單｜新洽記商行` : "訂單管理｜新洽記商行";

  tabs.innerHTML = [...STATUSES, { key: "all", label: "全部" }].map(status => {
    const count = status.key === "all" ? orders.length : countOf(status.key);
    return `<button type="button" class="status-tab ${status.key === currentTab ? "active" : ""} ${status.key === "new" && count ? "has-new" : ""}" data-tab="${status.key}">
      ${status.label}<b>${count}</b></button>`;
  }).join("");

  const query = searchInput.value.trim().toLowerCase();
  const visible = orders.filter(order => {
    if (query) {
      return [order.customer_name, order.phone, order.order_number]
        .some(value => String(value || "").toLowerCase().includes(query));
    }
    return currentTab === "all" || order.status === currentTab;
  });

  list.innerHTML = visible.length
    ? visible.map(orderCard).join("")
    : `<p class="order-empty">${query ? "找不到符合的訂單。" : `目前沒有「${currentTab === "all" ? "任何" : statusOf(currentTab).label}」訂單。`}</p>`;
}

function orderCard(order) {
  const status = statusOf(order.status);
  const items = itemsByOrder.get(order.id) || [];
  const history = [
    ["下單", order.created_at],
    ["確認", order.confirmed_at],
    ["收款", order.paid_at],
    ["出貨", order.shipped_at],
    ["完成", order.completed_at],
    ["取消", order.cancelled_at]
  ].filter(([, time]) => time);

  return `
  <article class="order-card status-${status.key}" data-order-id="${order.id}">
    <div class="order-head">
      <span class="status-badge">${status.label}</span>
      <strong>${escapeHtml(order.order_number)}</strong>
      <time title="${formatTime(order.created_at)}">${timeAgo(order.created_at)}</time>
    </div>

    <div class="order-body">
      <section class="order-customer">
        <h3>${escapeHtml(order.customer_name)} ${escapeHtml(order.title)}</h3>
        <a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>
        <p>${escapeHtml(order.delivery)}｜${escapeHtml(order.address)}</p>
        <p>${escapeHtml(order.payment)}・<span class="${order.is_paid ? "paid" : "unpaid"}">${order.is_paid ? "已收款" : "尚未收款"}</span></p>
        ${order.note ? `<p class="customer-note">顧客備註：${escapeHtml(order.note)}</p>` : ""}
      </section>

      <section class="order-items">
        <ul>
          ${items.map(item => `<li><span>${escapeHtml(item.product_name)} × ${item.quantity}</span><span>${money(item.unit_price * item.quantity)}</span></li>`).join("")}
        </ul>
        <p class="order-total"><span>總額</span><strong>${money(order.total_amount)}</strong></p>
      </section>
    </div>

    <div class="order-staff">
      <label>寄件單號<input type="text" data-field="tracking_number" value="${escapeHtml(order.tracking_number)}" placeholder="出貨後填寫"></label>
      <label>店家備註（顧客看不到）<input type="text" data-field="staff_note" value="${escapeHtml(order.staff_note)}" placeholder="例如：匯款末五碼 12345"></label>
      <button type="button" class="admin-link" data-save>儲存</button>
    </div>

    <div class="order-actions">
      ${status.next ? `<button type="button" class="button primary" data-set-status="${status.next}">${status.action}</button>` : ""}
      ${order.status === "cancelled" ? `<button type="button" class="button outline" data-set-status="new">恢復為新訂單</button>` : ""}
      <label class="paid-toggle"><input type="checkbox" data-toggle-paid ${order.is_paid ? "checked" : ""}> 已收款</label>
      <span class="order-meta">
        ${order.handled_by ? `處理人：${escapeHtml(order.handled_by)}` : "尚無人處理"}
        ${order.updated_by ? `・最後更新：${escapeHtml(order.updated_by)} ${formatTime(order.updated_at)}` : ""}
      </span>
      <span class="order-more">
        ${previousStatus[order.status] ? `<button type="button" class="admin-link" data-set-status="${previousStatus[order.status]}">退回上一步</button>` : ""}
        ${["new", "confirmed"].includes(order.status) ? `<button type="button" class="admin-link danger" data-set-status="cancelled">取消訂單</button>` : ""}
      </span>
    </div>

    ${history.length > 1 ? `<p class="order-history">${history.map(([label, time]) => `${label} ${formatTime(time)}`).join(" → ")}</p>` : ""}
  </article>`;
}


// ===== 更新訂單 =====
async function updateOrder(id, changes, message) {
  const order = orders.find(item => item.id === id);
  const payload = { ...changes, updated_by: staffName };
  if (!order.handled_by) payload.handled_by = staffName;

  const { data, error } = await supabaseClient
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    showToast(`更新失敗：${error.message}`);
    return;
  }

  Object.assign(order, data);
  render();
  if (message) showToast(message);
}

tabs.addEventListener("click", event => {
  const tab = event.target.closest("[data-tab]");
  if (!tab) return;
  currentTab = tab.dataset.tab;
  searchInput.value = "";
  render();
});

searchInput.addEventListener("input", render);
document.querySelector("[data-refresh]").addEventListener("click", loadOrders);

list.addEventListener("click", event => {
  const card = event.target.closest("[data-order-id]");
  if (!card) return;
  const id = Number(card.dataset.orderId);

  const statusButton = event.target.closest("[data-set-status]");
  if (statusButton) {
    const next = statusButton.dataset.setStatus;
    if (next === "cancelled" && !confirm("確定要取消這張訂單嗎？")) return;
    updateOrder(id, { status: next }, `已改為「${statusOf(next).label}」`);
  }

  if (event.target.closest("[data-save]")) {
    const changes = {};
    card.querySelectorAll("[data-field]").forEach(input => { changes[input.dataset.field] = input.value.trim() || null; });
    updateOrder(id, changes, "已儲存");
  }
});

list.addEventListener("change", event => {
  const toggle = event.target.closest("[data-toggle-paid]");
  if (!toggle) return;
  const id = Number(toggle.closest("[data-order-id]").dataset.orderId);
  updateOrder(id, { is_paid: toggle.checked }, toggle.checked ? "已標記收款" : "已取消收款標記");
});


// ===== 新訂單即時通知 =====
function startLive() {
  stopLive();
  realtimeChannel = supabaseClient
    .channel("orders-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, payload => {
      // 只有別人造成的變動才需要重新讀取；新訂單另外提醒
      if (payload.eventType === "INSERT") announceNewOrder(payload.new);
      clearTimeout(startLive.reloadTimer);
      startLive.reloadTimer = setTimeout(loadOrders, 800);
    })
    .subscribe();

  // 備援：即使即時連線斷掉，每分鐘也會自動更新一次
  pollTimer = setInterval(loadOrders, 60000);
}

function stopLive() {
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel = null;
  clearInterval(pollTimer);
}

function announceNewOrder(order) {
  showToast(`有新訂單：${order.customer_name || ""}`);
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("新洽記商行｜新訂單", { body: `${order.customer_name || ""}・${order.order_number || ""}`, icon: "images/logo/logo-dark.png" });
  }
}

notifyButton.addEventListener("click", async () => {
  const result = await Notification.requestPermission();
  notifyButton.hidden = result !== "default";
  if (result === "granted") showToast("已開啟：有新訂單時電腦會跳出通知");
});

// 「幾分鐘前」每分鐘更新
setInterval(() => { if (orders.length) renderWhenIdle(); }, 60000);
