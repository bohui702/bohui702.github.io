// ========================================
// 商品資料（首頁與選購頁共用）
// ========================================
// 修改這裡，首頁「本季熱門商品」與 shop.html「商品列表」會一起更新。
//
// id       必須與 Supabase products.id 完全一致（訂單靠這個對應商品）
// name     商品名稱
// subtitle 商品介紹（選購頁顯示完整內容）
// short    首頁卡片用的短介紹（卡片較窄，建議 30 字以內）
// price    原價（數字）。真正成交價由 Supabase 計算，這裡改了也要同步改 Supabase
// tag      左上角紅色標籤
// spec     規格
// promos   多件優惠文字（只是顯示用；實際優惠規則在 js/discount.js 與 Supabase）
// popular  true = 出現在首頁「本季熱門商品」（首頁最多顯示 3 個）
// image    商品照片路徑
// ========================================
const products = [
  {
    id: 1,
    name: "金鑽紅仁花生",
    subtitle: "嚴選在地頂級紅仁花生，外皮晶瑩細緻，富含高營養價值，口感加倍甘甜深邃。",
    short: "在地頂級紅仁花生，口感甘甜深邃。",
    price: 180,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $170", "滿 50 罐起 → $160"],
    popular: true,
    image: "images/produce/produce_2.jpg"
  },
  {
    id: 2,
    name: "焙炒椒麻花生",
    subtitle: "經典香脆焙炒，椒麻香氣微麻微辣，佐茶、下酒、聚會分享都是絕配良伴。",
    short: "椒麻香氣微麻微辣，佐茶下酒都合適。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    popular: true,
    image: "images/produce/produce_2.jpg"
  },
  {
    id: 3,
    name: "焙炒五香花生",
    subtitle: "五香濃郁溫潤，遵循古法慢火焙炒，顆顆飽滿香脆，保留最純粹的花生香氣。",
    short: "古法慢火焙炒，五香濃郁、顆顆香脆。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    popular: true,
    image: "images/photo/photo_1.jpg"
  },
  {
    id: 4,
    name: "手工花生糖",
    subtitle: "職人純手工精心製作，獨門麥芽糖黃金比例。酥脆濃郁，香醇持久不黏牙，精裝禮盒最宜大器送禮。",
    short: "職人純手工，酥脆不黏牙，送禮大方。",
    price: 200,
    tag: "手工花生糖",
    spec: "規格：禮盒14入",
    promos: ["滿 20 件起 → $180"],
    popular: false,
    image: "images/produce/produce_1.jpg"
  },
  {
    id: 5,
    name: "家常小包裝",
    subtitle: "小份量包裝方便保存，適合辦公室、下午茶與日常分享，想吃就開一包。",
    short: "小份量好保存，想吃就開一包。",
    price: 120,
    tag: "日常分享",
    spec: "規格：輕巧包",
    promos: ["滿 10 包起 → $110"],
    popular: false,
    image: "images/photo/photo_3.jpg"
  }
];

const money = value => `NT$${Number(value).toLocaleString("zh-TW")}`;
