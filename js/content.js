// ========================================
// 網站內容設定（最常修改的地方）
// ========================================
// 這個檔案只放「資料」，不放程式邏輯。改文字、連結、照片都從這裡改。
// 商品資料在 js/products.js。


// ===== 社群與聯絡連結 =====
// 網頁上所有 data-link="xxx" 的連結都會套用這裡的網址。
// linktree：首頁主視覺右下的 Linktree 方塊（網址取自 images/Link_tree.png 的 QR Code）。
const siteLinks = {
  email: "mailto:sinhiapki.1928@gmail.com",
  instagram: "https://www.instagram.com/sinhiapki_1928",
  facebook: "https://www.facebook.com/profile.php?id=61574707400729",
  linktree: "https://linktr.ee/qr/6caf9351-1929-4e68-ba37-50c286980690"
};


// ===== 最新消息 =====
// 點擊後會跳出視窗顯示 detail 的完整內容。最新的放最上面。
const newsItems = [
  { date: "2026.04.18", category: "品牌消息", title: "新洽記商行品牌網站正式上線", detail: "我們把近百年的家族記憶與新洽記的品牌精神，整理進這個全新的網站。未來將在這裡分享商品資訊、活動消息，以及每一份滋味背後的故事。" },
  { date: "2026.03.26", category: "期間活動", title: "近期活動消息與參與方式，敬請期待", detail: "新洽記商行正在籌備更多能與大家見面的活動。活動日期、地點與參加方式確認後，將於網站與社群平台同步公布。" },
  { date: "2026.03.02", category: "品牌故事", title: "花生殼上的紋路：一個家族近百年的四代回憶", detail: "花生殼上的紋路是脈絡，也是承接一個家族將近百年的四代回憶。我們希望找回曾祖父創立商行時，對品質的堅持與信心，以及樂善好施的人情味。" }
];


// ===== 活動花絮（相簿） =====
// 每一個 { } 是一本相簿；images 放同一場活動的多張照片，第一張會當封面。最新的放最上面。
// 照片放在 images/gallery/ 資料夾（原始照片在 images/active/，不會上傳到 GitHub）。
const gallery = (folder, numbers) => numbers.map(n => `images/gallery/${folder}/${String(n).padStart(2, "0")}.jpg`);

const galleryItems = [
  { title: "國道西湖休息區雜糧節", date: "2026.09.19", images: gallery("xihu-grain-festival", [1]) },
  { title: "潮市集・端午擺攤", date: "2026.06.20", images: gallery("chao-market-dragon-boat", [2, 1, 3, 4, 5, 6, 7, 8, 9, 10]) },
  { title: "媽祖遶境擺攤", date: "2025.04・2026.04", images: gallery("mazu-pilgrimage", [9, 7, 8, 1, 2, 3, 4, 5, 6]) },
  { title: "過年・萬得醫院擺攤", date: "2026.02", images: gallery("lunar-new-year-hospital", [1, 2, 3]) },
  { title: "台中農糧署國產雜糧農產品特賣", date: "2025.09.28", images: gallery("taichung-grain-market", [1, 2, 3, 4]) }
];
