// ===== 可修改內容區：產品資料 =====
// features 是讓顧客快速了解產品的特色標籤；未來可直接增刪。
const products = [
  {
    name: "經典原味花生", subtitle: "傳承滋味・嚴選好花生", price: "商品資訊準備中", tag: "經典", popular: true,
    features: ["嚴選原料", "經典風味", "適合分享"],
    image: "source/produce/produce_2.jpg"
  },
  {
    name: "新洽記風味花生", subtitle: "老商行精神・新時代風味", price: "商品資訊準備中", tag: "人氣", popular: true,
    features: ["獨家風味", "四代傳承", "日常點心"],
    image: "source/photo/photo_1.jpg"
  },
  {
    name: "傳承分享禮盒", subtitle: "一份滋味・一份真誠人情", price: "商品資訊準備中", tag: "送禮", popular: true,
    features: ["精緻包裝", "節慶送禮", "多種風味"],
    image: "source/produce/produce_1.jpg"
  }
];

// ===== 可修改內容區：最新消息 =====
const newsItems = [
  { date: "2026.04.18", category: "品牌消息", title: "新洽記商行品牌網站正式上線", detail: "我們把近百年的家族記憶與新洽記的品牌精神，整理進這個全新的網站。未來將在這裡分享商品資訊、活動消息，以及每一份滋味背後的故事。" },
  { date: "2026.03.26", category: "期間活動", title: "近期活動消息與參與方式，敬請期待", detail: "新洽記商行正在籌備更多能與大家見面的活動。活動日期、地點與參加方式確認後，將於網站與社群平台同步公布。" },
  { date: "2026.03.02", category: "品牌故事", title: "花生殼上的紋路：一個家族近百年的四代回憶", detail: "花生殼上的紋路是脈絡，也是承接一個家族將近百年的四代回憶。我們希望找回曾祖父創立商行時，對品質的堅持與信心，以及樂善好施的人情味。" }
];

// ===== 可修改內容區：活動相簿 =====
// images 陣列內可以放入同一場活動的多張照片。
const galleryItems = [
  { title: "新洽記品牌足跡", date: "品牌紀錄", images: [
    "source/produce/produce_2.jpg",
    "source/produce/produce_1.jpg",
    "source/photo/photo_2.jpg"
  ]},
  { title: "家族傳承記憶", date: "歷史影像", images: [
    "source/family.png",
    "source/photo/photo_3.jpg"
  ]},
  { title: "從一粒花生開始", date: "產品紀錄", images: [
    "source/photo/photo_1.jpg",
    "source/produce/produce_2.jpg"
  ]},
  { title: "商行日常風景", date: "日常紀錄", images: [
    "source/photo/photo_2.jpg",
    "source/produce/produce_1.jpg",
    "source/photo/photo_3.jpg"
  ]}
];

const icon = name => {
  const paths = {
    leaf: '<path d="M20 4C12 4 5 8 5 15c0 3 2 5 5 5 7 0 10-8 10-16Z"/><path d="M4 21c3-5 7-8 13-11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    heart: '<path d="M20.8 5.8c-2-2-5.2-2-7.2 0L12 7.4l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 21l8.8-8a5.1 5.1 0 0 0 0-7.2Z"/>'
  };
  return `<svg class="feature-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">${paths[name]}</svg>`;
};

const productContainer = document.querySelector("[data-products]");
// 首頁只呈現 popular 為 true 的前三項；選購視窗仍會顯示 products 內全部商品。
const featuredProducts = products
  .map((product, index) => ({ product, index }))
  .filter(({ product }) => product.popular)
  .slice(0, 3);

productContainer.innerHTML = featuredProducts.map(({ product, index }) => `
  <article class="product-card reveal" tabindex="0" data-product-index="${index}">
    <div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>
    <span class="product-tag">${product.tag}</span>
    <div class="product-info"><div><h3>${product.name}</h3><p>${product.subtitle}</p></div><span class="product-price">${product.price}</span></div>
  </article>
`).join("");

document.querySelector("[data-news]").innerHTML = newsItems.map((item, index) => `
  <button class="news-item reveal" type="button" data-news-index="${index}">
    <time>${item.date}</time><span class="news-category">${item.category}</span><h3>${item.title}</h3><span>＋</span>
  </button>
`).join("");

document.querySelector("[data-gallery]").innerHTML = galleryItems.map((item, index) => `
  <button class="gallery-item reveal" type="button" data-gallery-index="${index}">
    <img src="${item.images[0]}" alt="${item.title}" loading="lazy">
    <span class="gallery-count">▧ ${item.images.length} 張照片</span>
    <span class="gallery-caption">${item.title}</span>
  </button>
`).join("");

const modal = document.querySelector("[data-modal]");
const modalContent = document.querySelector("[data-modal-content]");
let selectedProducts = new Set();
let albumIndex = 0;
let currentAlbum = null;

function openModal(content) {
  modalContent.innerHTML = content;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-panel").scrollTop = 0;
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function productShop() {
  currentAlbum = null;
  openModal(`<header class="modal-header"><p class="eyebrow">PRODUCT CATALOG</p><h2 id="modal-title">選擇你喜歡的產品</h2><p>快速查看特色並勾選有興趣的商品，之後可將選擇內容提供給我們詢問。</p></header>
    <div class="shop-list">${products.map((product, index) => `
      <article class="shop-item"><img src="${product.image}" alt="${product.name}"><div><h3>${product.name}</h3><p>${product.subtitle}</p><div class="feature-list">${product.features.map((feature, i) => `<span>${icon(["leaf","clock","heart"][i % 3])}${feature}</span>`).join("")}</div></div>
      <div class="shop-actions"><strong>${product.price}</strong><button class="select-product ${selectedProducts.has(index) ? "selected" : ""}" data-select-product="${index}">${selectedProducts.has(index) ? "✓ 已選擇" : "＋ 選擇"}</button></div></article>`).join("")}</div>
    <div class="selection-summary" data-selection-summary>已選擇 ${selectedProducts.size} 項產品</div>`);
}

function showNews(index) {
  currentAlbum = null;
  const item = newsItems[index];
  openModal(`<article class="news-detail"><time>${item.date}・${item.category}</time><h2 id="modal-title">${item.title}</h2><p class="modal-copy">${item.detail}</p><p class="modal-copy">更多即時資訊，也歡迎前往新洽記商行的 Instagram 與 Facebook 查看。</p></article>`);
}

function albumMarkup() {
  return `<header class="modal-header"><p class="eyebrow">EVENT ALBUM</p><h2 id="modal-title">${currentAlbum.title}</h2><p>${currentAlbum.date}・共 ${currentAlbum.images.length} 張照片，點擊照片可放大查看。</p></header><div class="album-overview">${currentAlbum.images.map((image, index) => `<button class="album-thumb" type="button" data-album-image="${index}" aria-label="放大第 ${index + 1} 張照片"><img src="${image}" alt="${currentAlbum.title}第 ${index + 1} 張照片"><span>${index + 1}</span></button>`).join("")}</div>`;
}

function albumViewerMarkup() {
  return `<button class="album-back" type="button" data-album-back>← 返回相簿總覽</button><div class="album-stage"><img src="${currentAlbum.images[albumIndex]}" alt="${currentAlbum.title}第 ${albumIndex + 1} 張照片"><button class="album-control prev" data-album-prev aria-label="上一張">‹</button><button class="album-control next" data-album-next aria-label="下一張">›</button></div><div class="album-meta"><span>${currentAlbum.title}</span><span>${albumIndex + 1} / ${currentAlbum.images.length}</span></div>`;
}

function showAlbum(index) {
  currentAlbum = galleryItems[index];
  albumIndex = 0;
  openModal(albumMarkup());
}

document.querySelector("[data-open-products]").addEventListener("click", productShop);
document.querySelectorAll("[data-product-index]").forEach(card => card.addEventListener("click", productShop));
document.querySelectorAll("[data-news-index]").forEach(item => item.addEventListener("click", () => showNews(Number(item.dataset.newsIndex))));
document.querySelectorAll("[data-gallery-index]").forEach(item => item.addEventListener("click", () => showAlbum(Number(item.dataset.galleryIndex))));
document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));

modal.addEventListener("click", event => {
  const selectButton = event.target.closest("[data-select-product]");
  if (selectButton) {
    const index = Number(selectButton.dataset.selectProduct);
    selectedProducts.has(index) ? selectedProducts.delete(index) : selectedProducts.add(index);
    selectButton.classList.toggle("selected", selectedProducts.has(index));
    selectButton.textContent = selectedProducts.has(index) ? "✓ 已選擇" : "＋ 選擇";
    modal.querySelector("[data-selection-summary]").textContent = `已選擇 ${selectedProducts.size} 項產品`;
  }
  const albumImage = event.target.closest("[data-album-image]");
  if (albumImage) {
    albumIndex = Number(albumImage.dataset.albumImage);
    modalContent.innerHTML = albumViewerMarkup();
  }
  if (event.target.closest("[data-album-back]")) {
    modalContent.innerHTML = albumMarkup();
  }
  if (event.target.closest("[data-album-prev]") || event.target.closest("[data-album-next]")) {
    const direction = event.target.closest("[data-album-next]") ? 1 : -1;
    albumIndex = (albumIndex + direction + currentAlbum.images.length) % currentAlbum.images.length;
    modalContent.innerHTML = albumViewerMarkup();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
  if (!modal.classList.contains("open") || !currentAlbum) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    albumIndex = (albumIndex + (event.key === "ArrowRight" ? 1 : -1) + currentAlbum.images.length) % currentAlbum.images.length;
    modalContent.innerHTML = albumViewerMarkup();
  }
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

document.querySelector("[data-subscribe-form]").addEventListener("submit", event => {
  event.preventDefault();
  event.currentTarget.classList.add("success");
  event.currentTarget.reset();
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
