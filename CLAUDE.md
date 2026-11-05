# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概要

新洽記商行（幫朋友做的花生品牌網站），部署在 https://bohui702.github.io 。
純靜態 HTML / CSS / JavaScript，沒有建置工具、沒有 npm、沒有測試框架；訂單後端用 Supabase。
網站內容、註解、commit 訊息都用繁體中文。

## 常用指令

```bash
python -m http.server 8123     # 本機預覽 → http://localhost:8123（.claude/launch.json 也是這個設定）
```

- 沒有 build / lint / test。驗證方式是開本機實際點擊（首頁、shop.html 下單、admin.html 後台），並檢查手機寬度與 console。
- push 到 `main` 就會由 `.github/workflows/pages.yml` 自動發布到 GitHub Pages。

## 架構重點

### 三個頁面，各自載入不同 script（順序有依賴，全是全域變數，沒有 module）

| 頁面 | 載入順序 |
|---|---|
| `index.html` 首頁 | `content.js` → `products.js` → `common.js` → `home.js` |
| `shop.html` 選購／下單 | supabase-js CDN → `supabase.js` → `content.js` → `products.js` → `discount.js` → `common.js` → `shop.js` |
| `admin.html` 訂單管理後台 | supabase-js CDN → `supabase.js` → `products.js` → `admin.js` |

- `content.js`、`products.js`、`discount.js` 只放資料（`siteLinks`、`newsItems`、`galleryItems`、`products`、`discountRules`），由 `home.js` / `shop.js` 渲染。改內容優先改這些檔，不要改渲染程式。
- `common.js` 會用 `siteLinks` 套用所有 `data-link="xxx"` 的連結；`admin.html` 沒載入 `common.js`。
- DOM 以 `data-*` 屬性選取（例如 `[data-products]`、`[data-order-form]`），改 HTML 時別刪掉這些屬性。

### 價格與商品：前端只是顯示，Supabase 才是真的

- `js/products.js` 的 `id` 必須和 Supabase `products.id` 一致；`price` 與 `js/discount.js` 的優惠只用於畫面預覽。
- 實際成交價由 Supabase RPC `get_product_price` / `create_order`（security definer）重新計算。
- **改價格或優惠時三處要同步**：`js/products.js`、`js/discount.js`、Supabase `products` / `discount_rules` 表（以及 `supabase/schema.sql` 的初始資料）。
- `comingSoon: true` 的商品只展示不能下單，Supabase 不建立；`popular: true` 的前三個出現在首頁。

### Supabase

- `js/supabase.js` 放 URL 和 publishable key（前端公開用，可以 commit）。**絕對不可放 service_role / secret key**。
- `supabase/schema.sql` 是整個資料庫的完整定義，整份在 SQL Editor 重跑。**它會先 drop 所有資料表、清空訂單**——不要建議重跑，除非使用者明確要求並先匯出訂單。只改商品／價格用 Table Editor 即可。
- 權限：anon 只能讀 products / discount_rules 和呼叫 `create_order`、`get_product_price`；`admin.html` 用 email 密碼登入，且帳號必須在 `staff` 表裡（`is_staff()`）才能讀寫 orders。orders 有開 realtime。
- 訂單狀態流程：`new` → `confirmed` → `shipped` → `done`，另有 `cancelled`（定義在 `admin.js` 的 `STATUSES`）。
- `.github/workflows/supabase-keepalive.yml` 每週一、四呼叫 `get_product_price` 防止免費方案暫停；它用 grep 從 `js/supabase.js` 抓 `SUPABASE_URL = "..."` 和 `SUPABASE_PUBLISHABLE_KEY = "..."`，**改那兩行時要保持這個格式**。

### 快取版本號

HTML 引用 CSS/JS 一律寫成 `?v=dev`（例如 `js/home.js?v=dev`）。部署時 workflow 會把 `?v=dev` 換成 commit hash 來破除瀏覽器快取。**新增 CSS/JS 引用時也要加 `?v=dev`**，否則訪客會拿到舊檔案（曾經因此出過活動花絮無法滑動的問題）。

### 圖片

- 網站用的是縮小過的版本：`images/shop/`、`images/gallery/<活動>/01.jpg…`。
- 原始大圖在 `images/active/`、`images/photo/Shop/` 等，部分已在 `.gitignore` 中不上傳。新增相簿時先轉成 jpg 縮小放進 `images/gallery/`，再在 `content.js` 的 `galleryItems` 用 `gallery(folder, [編號])` 填入（第一個編號是封面）。

### CSS

`css/style.css` 依編號分區（0～19），第 0 區 `:root` 是主色與字體；找某區塊時搜尋編號標題（例如「7. 首頁｜本季熱門商品」）。`css/admin.css` 只給後台用。

## 客戶需求（docs/需求紀錄.txt）

`docs/` 已被 gitignore（含統編、電話等個資），只存在本機。重點需求：
- 主色調 `#CDA786`；內文字級最小不低於 28px（客戶原話，調整字級前參考）。
- 偏好溫暖、有底圖的感覺，但功能以實用為主，不要花俏。
- 設計依客戶喜好，改視覺前先問。

## 注意

`README.md` 是 UTF-16 編碼（用 PowerShell `Get-Content -Encoding Unicode` 讀）；內容有些過時：提到的 `supabase/order_functions.sql` 實際上是 `supabase/schema.sql`，也沒寫到 `admin.html`。
