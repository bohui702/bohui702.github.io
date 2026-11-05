"""
把原始照片轉成網站用的版本：縮小、轉成 jpg、去掉 EXIF（含 GPS 定位）。

原圖放在 originals/（不會上傳到 GitHub），轉好的檔案放到 images/（會上傳）。

用法（先啟用虛擬環境：.venv\\Scripts\\Activate.ps1）
    # 新增活動相簿：originals/gallery/<名稱>/ → images/gallery/<名稱>/01.jpg、02.jpg…
    python tools/process_photos.py 活動名稱

    # 相簿已經有照片，要接在後面加新照片（從下一個編號開始）
    python tools/process_photos.py 活動名稱 --append

    # 自己指定來源和輸出資料夾（例如商品照，保留原檔名）
    python tools/process_photos.py --src originals/shop --dst images/shop --keep-names --max 1400

    # 只檢查 images/ 底下有沒有照片含 GPS（不會改任何檔案）
    python tools/process_photos.py --check
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()  # 讓 Pillow 能讀 iPhone 的 .HEIC
except ImportError:
    register_heif_opener = None

ROOT = Path(__file__).resolve().parent.parent
INPUT_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
GPS_TAG = 0x8825  # EXIF 裡存放 GPS 資訊的欄位


def rel(path: Path) -> str:
    """顯示用：在專案內就顯示相對路徑，否則顯示完整路徑。"""
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path)


def has_gps(path: Path) -> bool:
    with Image.open(path) as img:
        exif = img.getexif()
        return GPS_TAG in exif and bool(exif.get_ifd(GPS_TAG))


def has_exif(path: Path) -> bool:
    with Image.open(path) as img:
        return len(img.getexif()) > 0


def convert(src: Path, dst: Path, max_side: int, quality: int) -> tuple[int, int]:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)  # 先依照 EXIF 轉正，不然去掉 EXIF 後照片會躺著
        icc = img.info.get("icc_profile")  # 色彩設定檔，不含個人資訊，保留讓顏色正確
        img = img.convert("RGB")
        img.thumbnail((max_side, max_side), Image.LANCZOS)
        # 沒有傳 exif= 參數，Pillow 就不會寫入任何 EXIF
        img.save(dst, "JPEG", quality=quality, optimize=True, progressive=True, icc_profile=icc)
        return img.size


def check(paths: list[Path]) -> int:
    found = []
    total = 0
    for base in paths:
        files = [base] if base.is_file() else sorted(base.rglob("*"))
        for f in files:
            if f.suffix.lower() not in INPUT_EXTS or not f.is_file():
                continue
            total += 1
            try:
                if has_gps(f):
                    found.append(f)
            except Exception as e:
                print(f"  ⚠ 無法讀取 {rel(f)}：{e}")
    if found:
        print(f"✗ 檢查 {total} 張，有 {len(found)} 張含 GPS 定位：")
        for f in found:
            print(f"  {rel(f)}")
        print("→ 請用這支腳本重新轉檔，不要直接上傳原圖。")
        return 1
    print(f"✓ 檢查 {total} 張照片，都沒有 GPS 定位資訊。")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="原圖 → 網站用照片（縮小＋去除 EXIF/GPS）")
    p.add_argument("name", nargs="?", help="活動相簿名稱（originals/gallery/<name> → images/gallery/<name>）")
    p.add_argument("--src", type=Path, help="自訂來源資料夾")
    p.add_argument("--dst", type=Path, help="自訂輸出資料夾")
    p.add_argument("--max", type=int, default=1200, help="最長邊像素（預設 1200，跟現有相簿一樣）")
    p.add_argument("--quality", type=int, default=85, help="jpg 品質 1–95（預設 85）")
    p.add_argument("--append", action="store_true", help="輸出資料夾已有照片時，從下一個編號接著加")
    p.add_argument("--keep-names", action="store_true", help="保留原檔名（只改副檔名為 .jpg），不用 01、02 編號")
    p.add_argument("--overwrite", action="store_true", help="允許覆蓋同名檔案")
    p.add_argument("--check", nargs="*", type=Path, metavar="PATH", help="只檢查有沒有 GPS（預設檢查 images/）")
    args = p.parse_args()

    if args.check is not None:
        return check([ROOT / c for c in args.check] or [ROOT / "images"])

    if args.name:
        src = args.src or ROOT / "originals" / "gallery" / args.name
        dst = args.dst or ROOT / "images" / "gallery" / args.name
    elif args.src and args.dst:
        src, dst = ROOT / args.src, ROOT / args.dst
    else:
        p.error("請給活動名稱，或同時給 --src 和 --dst")

    if not src.is_dir():
        print(f"✗ 找不到來源資料夾：{src}")
        print("  請先把原圖放進去（originals/ 不會上傳到 GitHub）。")
        return 1

    sources = sorted(f for f in src.iterdir() if f.suffix.lower() in INPUT_EXTS)
    if not sources:
        print(f"✗ {src} 裡沒有照片（支援 {', '.join(sorted(INPUT_EXTS))}）")
        return 1
    if register_heif_opener is None and any(f.suffix.lower() in {".heic", ".heif"} for f in sources):
        print("✗ 有 HEIC 照片，但沒有安裝 pillow-heif：pip install -r tools/requirements.txt")
        return 1

    dst.mkdir(parents=True, exist_ok=True)
    existing = sorted(dst.glob("*.jpg"))

    # 決定輸出檔名
    if args.keep_names:
        targets = [dst / (f.stem + ".jpg") for f in sources]
    else:
        start = 1
        if existing and not args.overwrite:
            if not args.append:
                print(f"✗ {rel(dst)} 已經有 {len(existing)} 張照片，為了不覆蓋，先停下來。")
                print("  要接在後面加 → 加上 --append；要全部重新產生 → 加上 --overwrite")
                return 1
            nums = [int(f.stem) for f in existing if f.stem.isdigit()]
            start = max(nums, default=0) + 1
        targets = [dst / f"{start + i:02d}.jpg" for i in range(len(sources))]

    clash = [t for t in targets if t.exists()]
    if clash and not args.overwrite:
        print("✗ 這些檔案已經存在，為了不覆蓋，先停下來（確定要覆蓋就加上 --overwrite）：")
        for t in clash:
            print(f"  {rel(t)}")
        return 1

    print(f"{rel(src)} → {rel(dst)}（最長邊 {args.max}px）")
    failed = 0
    for s, t in zip(sources, targets):
        try:
            w, h = convert(s, t, args.max, args.quality)
            if has_exif(t):  # 再檢查一次，確定真的乾淨
                raise RuntimeError("輸出檔仍含 EXIF")
            kb_in, kb_out = s.stat().st_size // 1024, t.stat().st_size // 1024
            print(f"  ✓ {s.name} → {t.name}  {w}x{h}  {kb_in}KB → {kb_out}KB")
        except Exception as e:
            failed += 1
            t.unlink(missing_ok=True)
            print(f"  ✗ {s.name}：{e}")

    print(f"\n完成 {len(sources) - failed} 張，失敗 {failed} 張。輸出的照片都不含 EXIF／GPS。")
    if args.name and not args.keep_names:
        all_nums = sorted(int(f.stem) for f in dst.glob("*.jpg") if f.stem.isdigit())
        print("\n在 js/content.js 的 galleryItems 這樣填（第一個編號是封面，可以自己調順序）：")
        print(f'  images: gallery("{args.name}", [{", ".join(map(str, all_nums))}]),')
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
