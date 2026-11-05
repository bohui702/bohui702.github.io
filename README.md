# 新洽記商行 官方網站

網址：https://bohui702.github.io

純 HTML / CSS / JavaScript 靜態網站，放在 GitHub Pages；訂單後端使用 Supabase。

## 資料夾結構

```
index.html              首頁（各區塊的文字直接寫在這裡）
shop.html               商品選購頁（購物車、訂購表單、匯款資訊）
admin.html              訂單管理後台（只有 Supabase staff 名單裡的帳號能登入）

css/style.css           所有排版與顏色（檔案內有 0～19 編號分區）
css/admin.css           訂單管理後台專用樣式

js/content.js           ★ 最常改：社群連結、Linktree、最新消息、活動相簿
js/products.js          ★ 商品資料（首頁熱門商品＋選購頁共用）
js/discount.js          從 Supabase 讀取價格與多件優惠，選購頁預覽優惠價
js/supabase.js          Supabase 連線設定（只能放 publishable key）
js/common.js            兩頁共用的小功能（選單、公告、連結套用），一般不用改
js/home.js              首頁程式，一般不用改
js/shop.js              選購頁程式＋Supabase 下單，一般不用改
js/admin.js             訂單管理後台程式

images/logo/            logo.jpg 原始商標；logo-dark.png 頁首用；logo-light.png 頁尾深色底用
images/icon/            瀏覽器分頁小圖示（favicon）、手機主畫面圖示
images/og-image.jpg     分享到 LINE / Facebook 時顯示的縮圖（1200×630）
images/shop/            商品照
images/gallery/         活動相簿（網站用的縮小版）
images/produce/         商品氛圍照
images/photo/           一般照片
images/family.jpg       品牌故事的老照片

supabase/schema.sql     資料庫完整建置檔（⚠ 重跑會清空訂單，一般不要動）
supabase/migrations/    之後的資料庫修改（只新增、不清空，依日期順序執行）
docs/                   需求紀錄、網站修正 Excel（不會上傳到 GitHub）
```

## 想改什麼，去哪裡改

| 想改的東西 | 檔案 | 怎麼找 |
|---|---|---|
| 頂部紅色公告、主視覺標題／副標、三件事、送禮橫幅、品牌故事、聯絡我們的文字 | `index.html` | 每一區上方有 `<!-- ===== 區塊名稱 ===== -->` 註解 |
| 選單項目 | `index.html` | 搜尋 `site-nav` |
| IG、FB、Email、Linktree 網址 | `js/content.js` | 最上面的 `siteLinks`（全站會一起更新） |
| 新增／修改最新消息 | `js/content.js` | `newsItems` |
| 新增活動相簿、換照片 | `js/content.js` | `galleryItems`，照片放進 `images/gallery/` 後填資料夾與編號 |
| 商品名稱、介紹、照片、首頁要顯示哪三個 | `js/products.js` | `popular: true` 的會出現在首頁 |
| **商品價格** | Supabase `products` 表 **和** `js/products.js` 的 `price` | 選購頁讀 Supabase；首頁顯示 `products.js` 的價格，兩邊改成一樣 |
| **多件優惠** | Supabase `discount_rules` 表 | 只改這裡，選購頁會自動顯示 |
| 下架商品 | Supabase `products` 表把 `is_active` 改成 false | 選購頁會顯示「目前暫停販售」 |
| 主色調、字體 | `css/style.css` | 第 0 區 `:root` |
| 某一區的排版、大小、間距 | `css/style.css` | 搜尋編號標題，例如「7. 首頁｜本季熱門商品」 |
| 分享縮圖、分享標題 | `index.html`、`shop.html` 的 `og:` 標籤；圖片 `images/og-image.jpg` | |

## 新訂單通知（⏸ 尚未啟用，待和店家討論）

目前有新訂單時，只能打開 `admin.html` 才看得到。之後可以加上「有新訂單就主動通知店家」的功能，
需要先和店家討論想用哪一種方式：

| 方式 | 說明 | 需要準備 |
|---|---|---|
| Email（Resend） | 程式已寫好，只差設定。每天免費 100 封 | 到 resend.com 註冊、建立 API Key |
| Email（用店家自己的 Gmail 寄） | 不用註冊新服務 | Gmail 應用程式密碼＋另寫一支 Supabase Edge Function |
| Telegram / Discord 通知 | 免費、手機即時跳通知，不會被歸到垃圾郵件 | 店家要使用 Telegram 或 Discord |

討論時可以順便確認：
- 通知要寄給誰（一個人或多人）？
- 通知內容需要哪些資訊（訂單編號、金額、商品、顧客資料……）？
- 除了新訂單，還需要其他通知嗎（例如顧客取消、每日訂單統計）？
- 要不要也寄「訂單確認信」給顧客？（需要自己的網域，設定會多一些）

**技術備註**：Email（Resend）的程式已經包含在 `supabase/migrations/2026-11-05_order_limits_and_email.sql`，
沒有設定金鑰時不會寄信、也不影響下單。啟用方式寫在該檔案開頭（金鑰存在 Supabase Vault，不要寫進程式碼）。
寄信一定要透過寄信服務：GitHub Pages 和 Supabase 資料庫都不能直接寄 Email，金鑰也不能放在網頁裡。

## 本機預覽

在專案資料夾執行：

```bash
python -m http.server 8123
```

再用瀏覽器開 http://localhost:8123

## 發布

push 到 `main` 後，GitHub Actions 會自動發布網站（`.github/workflows/pages.yml`），
並把 HTML 裡的 `?v=dev` 換成版本編號，避免訪客的瀏覽器用到舊的 CSS / JS。
新增 CSS / JS 檔案時，引用網址記得也加上 `?v=dev`。
