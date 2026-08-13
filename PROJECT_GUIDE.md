# 新洽記商行網站維護入口

這是一個可部署到 GitHub Pages 等靜態主機的品牌網站，並透過 Supabase RPC 建立訂單。

## 從哪裡開始修改

| 想修改的內容 | 檔案 |
|---|---|
| 商品名稱、圖片、標價、首頁熱門商品 | `products.js` |
| 數量優惠的前端預覽 | `discount.js` |
| Supabase URL / Publishable Key | `config.js` |
| 首頁消息、活動相簿 | `script.js` 最上方 |
| 首頁文字與連結 | `index.html` |
| 商店表單、付款與銀行資訊 | `shop.html` |
| 顏色、桌機與手機排版 | `style.css` |
| 購物車與建立訂單流程 | `shop.js` |

詳細文件：

- `docs/WEBSITE_MAINTENANCE.md`：網站內容與檔案結構
- `docs/SUPABASE.md`：資料流、RPC 合約與安全要求
- `docs/RELEASE_CHECKLIST.md`：上線前檢查表

本機測試時請用 HTTP server 開啟，不建議直接雙擊 `file://`。例如安裝 Node.js 後執行 `npx serve .`。

`config.js` 中的 Publishable Key 是設計給瀏覽器使用的公開金鑰，安全性必須由 Supabase RLS 與 RPC 權限保護。絕對不要把 Secret Key 或 `service_role` key 放入此專案。

