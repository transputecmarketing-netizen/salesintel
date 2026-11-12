"""Build one LinkedIn post from a content module and render it.

usage: python3 build.py content/<name>.py [--no-render] [--video] [--fps 30]

The content module defines:
  SERIES   header tag, e.g. "FinOps · Week 2"
  SLIDES   list of layouts (cover, statement, point, cta, compare, quote, myth, framework, checklist, raw)
  CAPTION  the LinkedIn post text (hook, value lines, CTA, hashtags)
optional:
  NAME     output name (default: the module file name)
  TITLE    plain title for the PDF and review pack (default: cover title)
  A4       True (derive from slides), a dict of a4.onepager arguments, or False (default True when there is a cover)
  VIDEO    True (derive scenes from slides) or a list of (seconds, html) scenes; rendered only with --video
  NOTES    posting notes for the review pack
Outputs go to out/<NAME>/.
"""
import importlib.util, json, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from kit import page  # noqa: E402
import a4, video  # noqa: E402

BANNED = ["in today's fast-paced", "unlock", "delve", "game-changer", "game changer", "revolutionise", "revolutionize",
          "harness the power", "landscape is evolving", "seamless", "robust", "elevate", "supercharge", "cutting-edge"]


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def lint(text, where):
    warn = []
    if re.search("[–—]", text):
        warn.append(f"{where}: em or en dash found; use a comma, colon, full stop or 'to'")
    low = text.lower()
    warn += [f"{where}: avoid '{w}'" for w in BANNED if w in low]
    for us, uk in [("optimiz", "optimis"), ("organiz", "organis"), ("prioritiz", "prioritis"), ("color", "colour"), ("center", "centre"), ("analyz", "analys")]:
        if us in text:  # case-sensitive, so product names such as "Compute Optimizer" pass
            warn.append(f"{where}: US spelling '{us}', use '{uk}'")
    return warn


def lint_caption(c):
    w = lint(c, "caption")
    lines = [l for l in c.strip().splitlines() if l.strip()]
    if lines and len(lines[0]) > 150:
        w.append("caption: hook (first line) is over 150 characters; LinkedIn cuts it at 'see more'")
    tags = re.findall(r"#\w+", c)
    if not 3 <= len(tags) <= 5:
        w.append(f"caption: {len(tags)} hashtags, use 3 to 5")
    if len(c) > 3000:
        w.append(f"caption: {len(c)} characters, LinkedIn limit is 3000")
    return w


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    src = Path(args[0]).resolve()
    spec = importlib.util.spec_from_file_location("content", src)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    name = getattr(m, "NAME", src.stem)
    series, slides, caption = m.SERIES, m.SLIDES, getattr(m, "CAPTION", "")
    out = HERE / "out" / name
    out.mkdir(parents=True, exist_ok=True)
    total = len(slides)
    html = [s(series, i + 1, total) for i, s in enumerate(slides)]
    cover = next((getattr(s, "meta", {}) for s in slides if getattr(s, "meta", {}).get("kind") == "cover"), None)
    title = getattr(m, "TITLE", plain(cover["title"]) if cover else name)
    (out / "slides.html").write_text(page(html, title), encoding="utf8")

    warns = []
    for i, h in enumerate(html):
        warns += lint(plain(h), f"slide {i + 1}")
    if caption:
        (out / "caption.txt").write_text(caption.strip() + "\n", encoding="utf8")
        warns += lint_caption(caption)
    else:
        warns.append("no CAPTION in the content module")

    job = {"name": name, "slides": total, "pdf": total >= 3, "a4": False, "review": True, "video": False,
           "fps": int(args[args.index("--fps") + 1]) if "--fps" in args else 30}
    a4spec = getattr(m, "A4", cover is not None)
    if a4spec:
        kw = a4spec if isinstance(a4spec, dict) else a4.from_slides(slides)
        if kw:
            kw.setdefault("series", series)
            (out / "a4.html").write_text(a4.onepager(**kw), encoding="utf8")
            job["a4"] = True
    pngs = [f"{name}-{i + 1:02d}.png" for i in range(total)]
    fmt = f"Carousel, {total} slides (PDF document post)" if total >= 3 else ("Single image" if total == 1 else f"{total} images")
    (out / "review.html").write_text(a4.review(series, title, pngs, caption or "(no caption)", getattr(m, "NOTES", ""), fmt), encoding="utf8")
    vspec = getattr(m, "VIDEO", None)
    if "--video" in args:
        scenes = vspec if isinstance(vspec, list) else video.from_slides(slides)
        vh, T = video.page(scenes, series)
        (out / "video.html").write_text(vh, encoding="utf8")
        job["video"] = True
    (out / "job.json").write_text(json.dumps(job), encoding="utf8")

    for w in warns:
        print("WARN", w)
    if "--no-render" in args:
        print(f"HTML written to {out}")
        return
    r = subprocess.run(["node", str(HERE / "render.js"), str(out)])
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
