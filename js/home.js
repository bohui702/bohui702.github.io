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

// ===== 活動花絮：可左右滑動、無限循環的相簿輪播 =====
// 做法：在真正的相簿前後各多放幾本「複製品」，滑到複製品時瞬間跳回對應的真正相簿，看起來就像沒有盡頭。
const galleryCarousel = document.querySelector("[data-gallery]");
const galleryViewport = document.querySelector("[data-gallery-viewport]");
const galleryTrack = document.querySelector("[data-gallery-track]");
const galleryCounter = document.querySelector("[data-gallery-counter]");
const galleryDots = document.querySelector("[data-gallery-dots]");
const albumCount = galleryItems.length;
const pad2 = number => String(number).padStart(2, "0");

let perView = 0;      // 一次顯示幾本（由 CSS 的 --per-view 決定）
let cloneCount = 0;   // 前後各放幾本複製品
let position = 0;     // 目前最左邊那張卡片在軌道上的位置（含複製品）
let slideWidth = 0;   // 一張卡片加間距的寬度

const albumCard = (index, isClone) => {
  const item = galleryItems[index];
  return `
  <button class="gallery-item" type="button" data-gallery-index="${index}" ${isClone ? 'tabindex="-1" aria-hidden="true"' : ""}>
    <img src="${item.images[0]}" alt="${item.title}" loading="lazy" draggable="false">
    <span class="gallery-number">No.${pad2(index + 1)}</span>
    <span class="gallery-count">▧ ${item.images.length} 張照片</span>
    <span class="gallery-caption">${item.title}<small>${item.date}</small></span>
  </button>`;
};

const activeAlbumIndex = () => ((position - cloneCount) % albumCount + albumCount) % albumCount;

function buildGallery() {
  const keepIndex = galleryTrack.children.length ? activeAlbumIndex() : 0;
  perView = Number(getComputedStyle(galleryCarousel).getPropertyValue("--per-view")) || 1;
  const loops = albumCount > perView;
  cloneCount = loops ? perView + 1 : 0;

  const cards = [];
  for (let i = -cloneCount; i < albumCount + cloneCount; i++) {
    cards.push(albumCard((i % albumCount + albumCount) % albumCount, i < 0 || i >= albumCount));
  }
  galleryTrack.innerHTML = cards.join("");
  galleryCarousel.querySelectorAll(".gallery-nav").forEach(button => { button.hidden = !loops; });
  galleryDots.innerHTML = loops
    ? galleryItems.map((item, index) => `<button type="button" data-gallery-dot="${index}" aria-label="第 ${index + 1} 本：${item.title}">${index + 1}</button>`).join("")
    : "";

  measureGallery();
  moveGallery(keepIndex + cloneCount, false);
}

function measureGallery() {
  const first = galleryTrack.children[0];
  if (!first) return;
  const gap = parseFloat(getComputedStyle(galleryTrack).columnGap) || 0;
  slideWidth = first.getBoundingClientRect().width + gap;
  galleryCarousel.style.setProperty("--photo-height", `${first.querySelector("img").getBoundingClientRect().height}px`);
}

function moveGallery(nextPosition, animate = true, dragOffset = 0) {
  position = nextPosition;
  galleryTrack.classList.toggle("no-anim", !animate);
  galleryTrack.style.transform = `translateX(${-position * slideWidth + dragOffset}px)`;
  galleryCounter.textContent = albumCount > perView ? `${pad2(activeAlbumIndex() + 1)} / ${pad2(albumCount)}` : "";
  galleryDots.querySelectorAll("[data-gallery-dot]").forEach(dot => {
    dot.classList.toggle("active", Number(dot.dataset.galleryDot) === activeAlbumIndex());
  });
}

// 停在複製品上時，瞬間換成對應的真正相簿（沒有動畫，看不出來）
function settleGallery() {
  if (!cloneCount) return;
  if (position >= cloneCount + albumCount) moveGallery(position - albumCount, false);
  else if (position < cloneCount) moveGallery(position + albumCount, false);
  void galleryTrack.offsetWidth; // 讓瀏覽器先套用上面的瞬間移動，下一步的動畫才會正確
}

function stepGallery(steps) {
  if (!cloneCount) return;
  settleGallery();
  moveGallery(position + steps);
}

galleryTrack.addEventListener("transitionend", settleGallery);
document.querySelector("[data-gallery-prev]").addEventListener("click", () => stepGallery(-1));
document.querySelector("[data-gallery-next]").addEventListener("click", () => stepGallery(1));
galleryDots.addEventListener("click", event => {
  const dot = event.target.closest("[data-gallery-dot]");
  if (!dot) return;
  settleGallery();
  moveGallery(Number(dot.dataset.galleryDot) + cloneCount);
});

// 手指滑動 / 滑鼠拖曳
let dragStartX = null;
let dragDistance = 0;
let justDragged = false;

galleryViewport.addEventListener("pointerdown", event => {
  if (!cloneCount || event.button > 0) return;
  settleGallery();
  dragStartX = event.clientX;
  dragDistance = 0;
});

galleryViewport.addEventListener("pointermove", event => {
  if (dragStartX === null) return;
  dragDistance = event.clientX - dragStartX;
  if (Math.abs(dragDistance) > 6 && !galleryViewport.classList.contains("dragging")) {
    galleryViewport.classList.add("dragging");
    galleryViewport.setPointerCapture(event.pointerId);
  }
  if (galleryViewport.classList.contains("dragging")) moveGallery(position, false, dragDistance);
});

function endDrag() {
  if (dragStartX === null) return;
  const wasDragging = galleryViewport.classList.contains("dragging");
  galleryViewport.classList.remove("dragging");
  dragStartX = null;
  if (!wasDragging) return;
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 0);
  // 拖超過卡片寬度的 15% 就換頁；拖得遠可以一次換好幾本
  const steps = Math.abs(dragDistance) < slideWidth * 0.15 ? 0
    : -Math.sign(dragDistance) * Math.max(1, Math.round(Math.abs(dragDistance) / slideWidth));
  moveGallery(position + steps);
}
galleryViewport.addEventListener("pointerup", endDrag);
galleryViewport.addEventListener("pointercancel", endDrag);

// 點相簿打開（剛拖曳完的那一下不算點擊）
galleryTrack.addEventListener("click", event => {
  const card = event.target.closest("[data-gallery-index]");
  if (card && !justDragged) showAlbum(Number(card.dataset.galleryIndex));
});

// 視窗大小改變：一次顯示的本數變了就重建，否則只重新計算寬度
let galleryResizeFrame = null;
window.addEventListener("resize", () => {
  cancelAnimationFrame(galleryResizeFrame);
  galleryResizeFrame = requestAnimationFrame(() => {
    const nextPerView = Number(getComputedStyle(galleryCarousel).getPropertyValue("--per-view")) || 1;
    if (nextPerView !== perView) buildGallery();
    else { measureGallery(); moveGallery(position, false); }
  });
});

if (albumCount) buildGallery();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
