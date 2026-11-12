#!/usr/bin/env python3
"""Contact sheet + automatic checks for rendered call backgrounds.

usage: python3 sheet.py [--mirror]
Reads build/manifest.json and out/<name>.png. Writes out/<prefix>-contact-sheet.png: every background
as a tile with a seated-person silhouette and faint centre-third guides, so you judge each one the way
it is used. --mirror draws the tiles mirrored (what you see of yourself in Teams self-view).
Checks: 1920x1080, overall darkness, and how busy / bright the centre third is behind the person.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps, ImageStat

HERE = os.path.dirname(os.path.abspath(__file__))
TW, TH, GAP, COLS = 640, 360, 28, 3
# centre third where the person sits (x 640..1280), from just above head height down
ZONE = (640, 220, 1280, 1080)


def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/System/Library/Fonts/Helvetica.ttc', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default(size=sz)


def check(im):
    notes = []
    if im.size != (1920, 1080):
        notes.append(f"size {im.size}, must be 1920x1080")
    g = im.convert('L')
    lum = ImageStat.Stat(g).mean[0] / 255
    z = g.crop(ZONE)
    zlum = ImageStat.Stat(z).mean[0] / 255
    edges = ImageStat.Stat(z.filter(ImageFilter.GaussianBlur(2)).filter(ImageFilter.FIND_EDGES)).mean[0]  # blur first so grain and scanlines do not count
    if lum > .45:
        notes.append(f"light overall ({lum:.2f}); dark variants are preferred")
    if edges > 2:
        notes.append(f"centre third busy (edge {edges:.1f} > 2): move detail to the outer thirds")
    if zlum > .5:
        notes.append(f"centre third bright ({zlum:.2f}): faces read better against a darker area")
    return lum, zlum, edges, notes


def silhouette(tile):
    s = tile.width / 1920
    ov = Image.new('RGBA', tile.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.ellipse([(960 - 130) * s, (420 - 150) * s, (960 + 130) * s, (420 + 150) * s], fill=(150, 160, 178, 150))
    d.rounded_rectangle([(960 - 330) * s, 640 * s, (960 + 330) * s, 1180 * s], radius=int(260 * s), fill=(150, 160, 178, 150))
    for x in (640, 1280):
        for y in range(0, 1080, 30):
            d.line([(x * s, y * s), (x * s, (y + 14) * s)], fill=(255, 255, 255, 60), width=1)
    return Image.alpha_composite(tile.convert('RGBA'), ov)


def main():
    mirror = '--mirror' in sys.argv
    man = json.load(open(os.path.join(HERE, 'build', 'manifest.json')))
    items = [it for it in man['items'] if os.path.exists(os.path.join(HERE, 'out', it['name'] + '.png'))]
    if not items:
        sys.exit('no PNGs in out/; run node render.js first')
    rows = (len(items) + COLS - 1) // COLS
    cap = 46; top = 110
    sheet = Image.new('RGB', (GAP + COLS * (TW + GAP), top + rows * (TH + cap + GAP)), (12, 14, 20))
    d = ImageDraw.Draw(sheet)
    d.text((GAP, 30), f"{man['brand']} call backgrounds" + ("  (mirrored self-view)" if mirror else ""), font=font(34), fill=(240, 244, 250))
    d.text((GAP, 76), "Silhouette shows where the person sits; dashed lines mark the centre third.", font=font(16), fill=(150, 160, 178))
    print(f"{'name':44} {'lum':>5} {'centre':>6} {'edges':>6}  notes")
    warn = 0
    for i, it in enumerate(items):
        im = Image.open(os.path.join(HERE, 'out', it['name'] + '.png')).convert('RGB')
        lum, zlum, edges, notes = check(im)
        if it.get('reference'):
            notes = ['reference sheet, not a background']
        else:
            warn += bool(notes)
        print(f"{it['name']:44} {lum:5.2f} {zlum:6.2f} {edges:6.1f}  {'; '.join(notes) or 'ok'}")
        t = im.resize((TW, TH), Image.LANCZOS)
        if mirror:
            t = ImageOps.mirror(t)
        if not it.get('reference'):
            t = silhouette(t)
        x = GAP + (i % COLS) * (TW + GAP); y = top + (i // COLS) * (TH + cap + GAP)
        sheet.paste(t.convert('RGB'), (x, y))
        d.text((x, y + TH + 10), f"{it['id']}  ·  {it['family']} / {it['design']}", font=font(18), fill=(220, 226, 236))
        if notes and not it.get('reference'):
            d.ellipse([x + TW - 18, y + TH + 14, x + TW - 6, y + TH + 26], fill=(255, 170, 40))
    name = f"{man['prefix']}-contact-sheet{'-mirrored' if mirror else ''}.png"
    sheet.save(os.path.join(HERE, 'out', name))
    print(f"\ncontact sheet: out/{name}   ({warn} background(s) with warnings; amber dot on the sheet)")


if __name__ == '__main__':
    main()
