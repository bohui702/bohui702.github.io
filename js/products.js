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
// shelf    保存期限（選購頁顯示）
// popular  true = 出現在首頁「本季熱門商品」（首頁最多顯示 3 個）
// comingSoon true = 即將上架：只展示，不能加入訂購單
// image    商品照片路徑
// ========================================
const products = [
  {
    id: 3,
    name: "焙炒五香花生",
    subtitle: "傳統工藝美味傳承、嚴選大顆14號花生、香氣濃郁口感爽脆。",
    short: "傳統工藝傳承，大顆14號花生，香氣濃郁。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    shelf: "3 個月",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    popular: true,
    image: "images/shop/roasted-peanuts.jpg"
  },
  {
    id: 2,
    name: "焙炒椒麻花生",
    subtitle: "嚴選台灣在地優質花生，嚴選大顆14號花生、香氣濃郁口感爽脆。",
    short: "台灣在地優質花生，椒麻香氣、口感爽脆。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    shelf: "3 個月",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    popular: true,
    image: "images/shop/roasted-peanuts.jpg"
  },
  {
    id: 1,
    name: "焙炒金鑽紅仁花生",
    subtitle: "115年農改場最新發表品種，具備高油酸與低油耗味特質，兼具健康營養與極佳口感。",
    short: "農改場最新品種，高油酸、低油耗味。",
    price: 180,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    shelf: "3 個月",
    promos: ["滿 30 罐起 → $170", "滿 50 罐起 → $160"],
    popular: true,
    image: "images/shop/roasted-peanuts.jpg"
  },
  {
    id: 6,
    name: "減糖配方花生糖",
    subtitle: "改良輕負擔配方甜度減少三分之一，更符合現代飲食需求。香甜不黏牙，內含獨立衛生封口包裝。",
    short: "甜度減少三分之一，香甜不黏牙。",
    price: 140,
    tag: "手工花生糖",
    spec: "規格：140g(±5%)",
    shelf: "2 個月",
    promos: [],
    popular: false,
    image: "images/shop/low-sugar-brittle.jpg"
  },
  {
    id: 4,
    name: "手工花生糖禮盒",
    subtitle: "御守造型精緻外盒，送禮首選。嚴選大顆花生仁，成分純粹，僅花生、麥芽、糖與鹽。",
    short: "御守造型外盒，成分純粹，送禮首選。",
    price: 200,
    tag: "手工花生糖",
    spec: "規格：禮盒14入",
    shelf: "3 個月",
    promos: ["滿 20 件起 → $180"],
    popular: false,
    image: "images/shop/gift-box-brittle.jpg"
  },
  {
    id: 7,
    name: "洽禮盒花生組",
    subtitle: "品牌旗艦雙享禮盒，包含2罐焙炒花生與6塊手工花生糖，大紅「洽」字斗方質感包裝。",
    short: "2罐焙炒花生＋6塊手工花生糖的旗艦禮盒。",
    price: 500,
    tag: "送禮首選",
    spec: "規格：花生2罐＋花生糖6份",
    shelf: "3 個月",
    promos: [],
    popular: false,
    image: "images/shop/hiap-gift-set.jpg"
  },
  {
    id: 9,
    name: "花生芽",
    subtitle: "商品資訊整理中，敬請期待。",
    short: "商品資訊整理中，敬請期待。",
    price: 0,
    tag: "即將上架",
    spec: "",
    promos: [],
    popular: false,
    comingSoon: true, // true = 只展示、不能加入訂購單；資料補齊後改成 false 並填上價格
    image: "images/shop/brand-bags.jpg"
  },
  {
    id: 8,
    name: "無添加純花生醬",
    subtitle: "無任何添加的純天然花生醬，選用含油量高品種花生，焙炒後製作成醬，天然無負擔。",
    short: "無任何添加，焙炒後製成的純天然花生醬。",
    price: 220,
    tag: "天然抹醬",
    spec: "規格：380g(±5g)",
    shelf: "2 個月",
    promos: [],
    popular: false,
    image: "images/shop/brand-bags.jpg"
  }
];

const money = value => `NT$${Number(value).toLocaleString("zh-TW")}`;
