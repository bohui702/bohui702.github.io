# tools／小工具

維護網站用的小程式，**網站本身不會用到這裡的檔案**。

| 檔案 | 用途 |
|---|---|
| `process_photos.py` | 原始照片 → 網站用照片（縮小、HEIC 轉 jpg、去除 GPS） |
| `requirements.txt` | 上面這支腳本需要的 Python 套件 |

---

## process_photos.py

手機拍的照片裡藏有 EXIF 資訊（拍攝地點的 GPS、時間、手機型號），原圖不能直接放上公開的網站。
這支腳本會把 `originals/` 裡的原圖轉成可以上傳的版本：

1. 依照手機拍攝方向把照片轉正
2. 縮小，最長邊預設 1200px，和現有相簿一樣
3. 轉成 jpg（iPhone 的 HEIC 也可以）
4. **去掉所有 EXIF**（保留色彩設定檔，所以顏色不會跑掉），轉完會再檢查一次確定乾淨

### 第一次使用

在**專案根目錄**執行：

```powershell
python -m venv .venv                    # 建立虛擬環境（只要做一次）
.venv\Scripts\Activate.ps1              # 啟用虛擬環境
pip install -r tools/requirements.txt   # 安裝 Pillow、pillow-heif
```

- **虛擬環境（.venv）**：專案自己的 Python 套件資料夾，不會裝到整台電腦。`.venv` 不會上傳到 GitHub。
- 之後每次開新的終端機，只要執行 `.venv\Scripts\Activate.ps1`，前面出現 `(.venv)` 就代表啟用了。
- 如果出現「因為這個系統上已停用指令碼執行」，先執行一次
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`。

### 常用指令

| 想做的事 | 指令 |
|---|---|
| 新增一本活動相簿 | `python tools/process_photos.py 相簿名稱` |
| 已有的相簿加新照片 | `python tools/process_photos.py 相簿名稱 --append` |
| 整本相簿重新產生（會覆蓋） | `python tools/process_photos.py 相簿名稱 --overwrite` |
| 商品照（保留檔名、1400px） | `python tools/process_photos.py --src originals/shop --dst images/shop --keep-names --max 1400` |
| 檢查 `images/` 有沒有照片含 GPS | `python tools/process_photos.py --check` |
| 檢查指定資料夾或檔案 | `python tools/process_photos.py --check originals/shop images/og-image.jpg` |

「相簿名稱」代表：從 `originals/gallery/相簿名稱/` 讀原圖，輸出到 `images/gallery/相簿名稱/01.jpg、02.jpg…`。
照片依**檔名**排序編號。轉完會印出要貼到 `js/content.js` 的 `galleryItems` 的那一行。

### 所有參數

| 參數 | 預設 | 說明 |
|---|---|---|
| `相簿名稱` | — | 活動相簿資料夾名稱（英文小寫加 `-`） |
| `--src` / `--dst` | — | 自訂來源／輸出資料夾，不用相簿名稱時兩個都要給 |
| `--max` | 1200 | 最長邊像素 |
| `--quality` | 85 | jpg 品質（1–95），數字越大檔案越大 |
| `--append` | 關 | 輸出資料夾已有照片時，從下一個編號接著加 |
| `--overwrite` | 關 | 允許覆蓋同名檔案 |
| `--keep-names` | 關 | 保留原檔名，不用 01、02 編號 |
| `--check [路徑…]` | `images/` | 只檢查有沒有 GPS，不改任何檔案；有 GPS 會回傳錯誤碼 1 |

### 安全設計

- **預設不覆蓋**：輸出資料夾已經有照片時會停下來，要明確加 `--append` 或 `--overwrite` 才會繼續。
- **不會動到原圖**：只讀取 `originals/`，不會修改或刪除原圖。
- 轉檔失敗的照片不會留下半成品。

### 常見問題

- **`ModuleNotFoundError: No module named 'PIL'`**：沒有啟用虛擬環境，或還沒安裝套件，請看「第一次使用」。
- **照片順序不對**：改 `originals/` 裡的檔名再轉一次（加 `--overwrite`），
  或直接在 `js/content.js` 調整編號順序，例如 `[3, 1, 2]`。
- **想要更小的檔案**：加 `--quality 75` 或 `--max 1000`。
