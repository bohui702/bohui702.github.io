// ========================================
// 首頁與選購頁共用的小功能
// ========================================

// 套用 js/content.js 裡的 siteLinks 到所有 data-link 連結
document.querySelectorAll("[data-link]").forEach(link => {
  const url = siteLinks[link.dataset.link];
  if (url) {
    link.href = url;
  } else {
    link.removeAttribute("href");
    link.classList.add("no-link");
  }
});

// 手機選單
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-nav");
menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => navigation.classList.remove("open")));

// 頂部公告關閉
document.querySelector("[data-close-announcement]").addEventListener("click", event => event.currentTarget.parentElement.remove());

// 頁尾年份
document.querySelector("[data-year]").textContent = new Date().getFullYear();
