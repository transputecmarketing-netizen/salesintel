"""Add a brand palette to palettes.json from a handful of brand colours.

  python3 make_palette.py NAME --bg #0F2A1F --ink #12261C --primary #2E8B57 --bright #5FD39A \
      --accent #F2B134 [--light #F4F7F2] [--grey #4A5A50] [--label "Acme"] [--stroke 1.4] [--force]

bg      the dark background the dark-variant PNGs will sit on (becomes the plate colour)
ink     darkest text colour (outlines in the light variant)
primary main brand colour (inner lines)
bright  a lighter, brighter brand tint (silhouettes in the dark variant)
accent  the ONE highlight colour (one part per figure is drawn in it). Use a strong contrast colour.
light   pale page tint for light-variant side faces (default #F5F5F7)
grey    neutral mid grey for light-variant inner lines (default #5B6475)

Prints the entry and writes it into palettes.json (next to this file, or --palettes PATH).
Edit the JSON by hand afterwards if a role needs tuning.
"""
import argparse, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02X}" for x, y in zip(a, b))


def build(c, stroke=1.4):
    W = "#FFFFFF"
    return {
        "figures": {
            "dark": {"plate": c.bg, "hi": c.accent, "edge": c.bright, "mid": c.primary, "lo": mix(c.bg, c.primary, .35), "stroke": stroke},
            "light": {"plate": W, "hi": c.accent, "edge": c.ink, "mid": c.grey, "lo": mix(W, c.grey, .3), "stroke": stroke},
        },
        "iso": {
            "dark": {"top": mix(c.bg, c.primary, .3), "side": c.bg, "side2": mix(c.bg, c.primary, .15), "edge": c.bright, "det": c.primary, "hi": c.accent, "lit": c.light},
            "light": {"top": W, "side": c.light, "side2": mix(c.light, c.ink, .06), "edge": c.ink, "det": c.primary, "hi": c.accent, "lit": c.ink},
        },
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name")
    for k in ("bg", "ink", "primary", "bright", "accent"): ap.add_argument("--" + k, required=True)
    ap.add_argument("--light", default="#F5F5F7"); ap.add_argument("--grey", default="#5B6475")
    ap.add_argument("--label", default=""); ap.add_argument("--stroke", type=float, default=1.4)
    ap.add_argument("--palettes", default=os.path.join(HERE, "palettes.json")); ap.add_argument("--force", action="store_true")
    c = ap.parse_args()
    for k in ("bg", "ink", "primary", "bright", "accent", "light", "grey"):
        v = getattr(c, k)
        if not (len(v) == 7 and v[0] == "#"): sys.exit(f"--{k} must be #RRGGBB, got {v}")
    pals = json.load(open(c.palettes))
    if c.name in pals and not c.force: sys.exit(f"palette {c.name} exists; pass --force to replace it")
    entry = {"label": c.label or c.name, **build(c, c.stroke)}
    pals[c.name] = entry
    json.dump(pals, open(c.palettes, "w"), indent=2)
    print(json.dumps(entry, indent=2)); print(f"saved to {c.palettes}")


if __name__ == "__main__":
    main()
