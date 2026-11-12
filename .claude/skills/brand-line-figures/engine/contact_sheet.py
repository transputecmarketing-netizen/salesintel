"""Contact sheet: every PNG in a folder on one labelled grid, on the background it will be used on.

  python3 contact_sheet.py out/figures/acme/dark [--bg #0F2A1F] [--cols 6] [--cell 360] [--out sheet.png]
  python3 contact_sheet.py out/figures/acme/dark out/iso/acme/dark --bg auto     # several folders in one sheet

--bg auto (default) uses the palette plate colour when the path looks like <palette>/dark, else white.
Look at the sheet: check lines are visible against the background, the accent is used once per figure,
nothing is clipped, and dark and light variants both read.
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))


def auto_bg(folder):
    parts = os.path.normpath(os.path.abspath(folder)).split(os.sep)
    theme, pal = parts[-1], parts[-2]
    try:
        p = json.load(open(os.path.join(HERE, "palettes.json")))[pal]["figures"][theme]["plate"]
        return p
    except Exception:
        return "#FFFFFF" if theme != "dark" else "#111111"


def font(sz):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def lum(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5)); return .2126 * r + .7152 * g + .0722 * b


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folders", nargs="+"); ap.add_argument("--bg", default="auto")
    ap.add_argument("--cols", type=int, default=6); ap.add_argument("--cell", type=int, default=360)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    files = [os.path.join(d, f) for d in a.folders for f in sorted(os.listdir(d)) if f.lower().endswith(".png") and not f.startswith("_")]
    if not files: sys.exit("no PNGs found")
    bg = auto_bg(a.folders[0]) if a.bg == "auto" else a.bg
    W, H, lab = a.cell, round(a.cell * .8), 26
    rows = (len(files) + a.cols - 1) // a.cols
    sheet = Image.new("RGB", (W * a.cols, (H + lab) * rows), bg); dr = ImageDraw.Draw(sheet)
    fg = "#FFFFFF" if lum(bg) < 128 else "#222222"; ft = font(14)
    for i, f in enumerate(files):
        im = Image.open(f).convert("RGBA"); im.thumbnail((W - 16, H - 16), Image.LANCZOS)
        x, y = (i % a.cols) * W, (i // a.cols) * (H + lab)
        sheet.paste(im, (x + (W - im.width) // 2, y + (H - im.height) // 2), im)
        dr.text((x + 10, y + H + 4), os.path.splitext(os.path.basename(f))[0], fill=fg, font=ft)
    out = a.out or os.path.join(a.folders[0], "_contact_sheet.png")
    sheet.save(out); print("wrote", out, f"({len(files)} images)")


if __name__ == "__main__":
    main()
