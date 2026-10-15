// ========================================
// 網站內容設定（最常修改的地方）
// ========================================
// 這個檔案只放「資料」，不放程式邏輯。改文字、連結、照片都從這裡改。
// 商品資料在 js/products.js。


// ===== 社群與聯絡連結 =====
// 網頁上所有 data-link="xxx" 的連結都會套用這裡的網址。
// linktree 留空 ""：首頁右下的「1928」方塊就不會變成連結。
const siteLinks = {
  email: "mailto:sinhiapki.1928@gmail.com",
  instagram: "https://www.instagram.com/sinhiapki_1928",
  facebook: "https://www.facebook.com/profile.php?id=61574707400729",
  linktree: ""
};


// ===== 最新消息 =====
// 點擊後會跳出視窗顯示 detail 的完整內容。最新的放最上面。
const newsItems = [
  { date: "2026.04.18", category: "品牌消息", title: "新洽記商行品牌網站正式上線", detail: "我們把近百年的家族記憶與新洽記的品牌精神，整理進這個全新的網站。未來將在這裡分享商品資訊、活動消息，以及每一份滋味背後的故事。" },
  { date: "2026.03.26", category: "期間活動", title: "近期活動消息與參與方式，敬請期待", detail: "新洽記商行正在籌備更多能與大家見面的活動。活動日期、地點與參加方式確認後，將於網站與社群平台同步公布。" },
  { date: "2026.03.02", category: "品牌故事", title: "花生殼上的紋路：一個家族近百年的四代回憶", detail: "花生殼上的紋路是脈絡，也是承接一個家族將近百年的四代回憶。我們希望找回曾祖父創立商行時，對品質的堅持與信心，以及樂善好施的人情味。" }
];


// ===== 活動花絮（相簿） =====
// 每一個 { } 是一本相簿；images 放同一場活動的多張照片，第一張會當封面。
const galleryItems = [
  {
    title: "新洽記品牌足跡", date: "品牌紀錄", images: [
      "images/produce/produce_2.jpg",
      "images/produce/produce_1.jpg",
      "images/photo/photo_2.jpg"
    ]
  },
  {
    title: "家族傳承記憶", date: "歷史影像", images: [
      "images/family.png",
      "images/photo/photo_3.jpg"
    ]
  },
  {
    title: "從一粒花生開始", date: "產品紀錄", images: [
      "images/photo/photo_1.jpg",
      "images/produce/produce_2.jpg"
    ]
  },
  {
    title: "商行日常風景", date: "日常紀錄", images: [
      "images/photo/photo_2.jpg",
      "images/produce/produce_1.jpg",
      "images/photo/photo_3.jpg"
    ]
  }
];
