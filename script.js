// ===== 可修改內容區：產品資料 =====
// features 是讓顧客快速了解產品的特色標籤；未來可直接增刪。
const products = [
  {
    name: "經典原味花生", subtitle: "單純香氣・越吃越順口", price: "詢問商品資訊", tag: "招牌", popular: true,
    features: ["嚴選原料", "清爽原味", "日常點心"],
    image: "source/produce/produce_2.jpg"
  },
  {
    name: "椒麻花生", subtitle: "香、麻、脆的涮嘴風味", price: "詢問商品資訊", tag: "人氣", popular: true,
    features: ["香麻調味", "下酒合適", "送禮分享"],
    image: "source/photo/photo_1.jpg"
  },
  {
    name: "傳承分享禮盒", subtitle: "一份滋味・一份真誠人情", price: "詢問商品資訊", tag: "送禮", popular: true,
    features: ["精緻包裝", "節慶送禮", "多種風味"],
    image: "source/produce/produce_1.jpg"
  },
  {
    name: "活動分享包", subtitle: "擺攤、會議、聚會都適合", price: "詢問商品資訊", tag: "活動", popular: false,
    features: ["多人分享", "攜帶方便", "彈性搭配"],
    image: "source/photo/photo_2.jpg"
  },
  {
    name: "家常小包裝", subtitle: "放在家裡，想吃就開", price: "詢問商品資訊", tag: "日常", popular: false,
    features: ["小份量", "好保存", "下午茶"],
    image: "source/photo/photo_3.jpg"
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

const productContainer = document.querySelector("[data-products]");
// 首頁只呈現 popular 為 true 的前三項；完整選購流程在 shop.html。
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

document.querySelectorAll("[data-product-index]").forEach(card => card.addEventListener("click", () => {
  window.location.href = `shop.html?product=${card.dataset.productIndex}`;
}));
document.querySelectorAll("[data-news-index]").forEach(item => item.addEventListener("click", () => showNews(Number(item.dataset.newsIndex))));
document.querySelectorAll("[data-gallery-index]").forEach(item => item.addEventListener("click", () => showAlbum(Number(item.dataset.galleryIndex))));
document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeModal));

modal.addEventListener("click", event => {
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
