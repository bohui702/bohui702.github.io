// ========================================
// 首頁程式（一般不需要修改）
// 文字、消息、相簿請改 js/content.js；商品請改 js/products.js
// ========================================

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
    <div class="product-info"><div><h3>${product.name}</h3><p>${product.short || product.subtitle}</p></div><span class="product-price">${money(product.price)}</span></div>
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

document.querySelectorAll("[data-product-index]").forEach(card => {
  const goToShop = () => { window.location.href = `shop.html?product=${card.dataset.productIndex}`; };
  card.addEventListener("click", goToShop);
  card.addEventListener("keydown", event => { if (event.key === "Enter") goToShop(); });
});
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

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
