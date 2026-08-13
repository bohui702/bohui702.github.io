// 全站唯一的商品資料來源。
// 修改商品名稱、圖片、前端標價或首頁熱門狀態時，只需修改此檔案。
// 注意：id 必須與 Supabase public.products.id 完全一致；真正成交價仍由後端計算。
window.PRODUCTS = Object.freeze([
  {
    id: 1,
    name: "金鑽紅仁花生",
    subtitle: "嚴選在地頂級紅仁花生，外皮晶瑩細緻，富含高營養價值，口感加倍甘甜深邃。",
    price: 180,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $170", "滿 50 罐起 → $160"],
    features: ["嚴選原料", "甘甜香脆", "日常點心"],
    popular: true,
    image: "source/produce/produce_2.jpg"
  },
  {
    id: 2,
    name: "焙炒椒麻花生",
    subtitle: "經典香脆焙炒，特選椒麻微辣風味，微麻微辣，佐茶下酒、聚會休閒的絕配良伴。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    features: ["香麻調味", "下酒合適", "送禮分享"],
    popular: true,
    image: "source/produce/produce_2.jpg"
  },
  {
    id: 3,
    name: "焙炒五香花生",
    subtitle: "五香濃郁溫潤，顆顆飽滿香脆，遵循古法精心焙炒，保留最純粹的經典花生香氣。",
    price: 150,
    tag: "頂級焙炒花生",
    spec: "規格：280g/罐",
    promos: ["滿 30 罐起 → $140", "滿 50 罐起 → $135"],
    features: ["經典五香", "古法焙炒", "顆顆飽滿"],
    popular: true,
    image: "source/photo/photo_1.jpg"
  },
  {
    id: 4,
    name: "手工花生糖",
    subtitle: "職人純手工精心製作，獨門麥芽糖黃金比例。酥脆濃郁，香醇持久不黏牙，精裝禮盒最宜大器送禮。",
    price: 200,
    tag: "手工花生糖",
    spec: "規格：禮盒14入",
    promos: ["滿 20 件起 → $180"],
    features: ["純手工", "香脆不黏牙", "精裝送禮"],
    popular: false,
    image: "source/produce/produce_1.jpg"
  },
  {
    id: 5,
    name: "家常小包裝",
    subtitle: "小份量包裝方便保存，適合辦公室、下午茶與日常分享，想吃就開一包。",
    price: 120,
    tag: "日常分享",
    spec: "規格：輕巧包",
    promos: ["滿 10 包起 → $110"],
    features: ["小份量", "好保存", "下午茶"],
    popular: false,
    image: "source/photo/photo_3.jpg"
  },
]);

