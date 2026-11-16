#!/usr/bin/env python3
"""Compose Recojo brand rasters from the store's own fruit photos + flat mark."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path("/workspace")
OUT = ROOT / ".grok"
W, H = 1200, 630
INK = (0x1C, 0x1C, 0x1E)
ORANGE = (0xFF, 0x6A, 0x00)
PAPER = (0xF2, 0xF2, 0xF4)
MAGENTA = (0xFF, 0x3B, 0x7A)
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def cover(path, tw, th, focus=(0.5, 0.45)):
    im = Image.open(path).convert("RGB")
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = max(tw, int(sw * scale) + 1), max(th, int(sh * scale) + 1)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    cx, cy = int(nw * focus[0]), int(nh * focus[1])
    left = max(0, min(nw - tw, cx - tw // 2))
    top = max(0, min(nh - th, cy - th // 2))
    return im.crop((left, top, left + tw, top + th))


def tracked_width(font, text, tracking):
    widths = [font.getlength(ch) for ch in text]
    return sum(widths) + tracking * (len(text) - 1), widths


def fit_tracked(text, target, tracking_ratio, font_path=FONT_BOLD):
    best = 40
    lo, hi = 16, 420
    while lo <= hi:
        mid = (lo + hi) // 2
        font = ImageFont.truetype(font_path, mid)
        tracking = max(1, int(mid * tracking_ratio))
        total, _ = tracked_width(font, text, tracking)
        if total <= target:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    font = ImageFont.truetype(font_path, best)
    tracking = max(1, int(best * tracking_ratio))
    return font, tracking


def draw_tracked(base, text, font, y, fill, tracking, shadow=0):
    total, widths = tracked_width(font, text, tracking)
    x = (W - total) / 2
    if shadow:
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        sx = x
        for ch, w in zip(text, widths):
            d.text((sx, y), ch, font=font, fill=(0, 0, 0, 170))
            sx += w + tracking
        layer = layer.filter(ImageFilter.GaussianBlur(shadow))
        base.alpha_composite(layer)
    draw = ImageDraw.Draw(base)
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking
    return total


def paste_circle(base, path, cx, cy, r, focus, ring_color, ring=7):
    outer = r + ring
    # ring
    ring_img = Image.new("RGBA", base.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_img)
    rd.ellipse((cx - outer, cy - outer, cx + outer, cy + outer), fill=ring_color + (255,))
    base.alpha_composite(ring_img)
    photo = cover(path, r * 2, r * 2, focus).convert("RGBA")
    mask = Image.new("L", (r * 2, r * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, r * 2 - 1, r * 2 - 1), fill=255)
    photo.putalpha(mask)
    base.alpha_composite(photo, (cx - r, cy - r))


def make_card():
    left = cover(ROOT / "attachments/3428.webp", 900, H, (0.5, 0.46))
    right = cover(ROOT / "attachments/3433.jpg", 900, H, (0.62, 0.42))
    canvas = Image.new("RGB", (W, H), INK)
    canvas.paste(left, (-20, 0))
    canvas.paste(right, (W - 880, 0))

    # Lift the fruit so the wings stay juicy; the lockup still sits on a dark center.
    canvas = ImageEnhance.Color(canvas).enhance(1.18)
    canvas = ImageEnhance.Brightness(canvas).enhance(1.08)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.06)

    arr = np.asarray(canvas).astype(np.float32)
    xs = np.linspace(0, 1, W)
    ys = np.linspace(0, 1, H)
    vx = np.exp(-((xs - 0.5) ** 2) / (2 * 0.145**2))
    vy = np.exp(-((ys - 0.46) ** 2) / (2 * 0.55**2))
    scrim = np.clip((vx[None, :] * vy[:, None]) * 0.9, 0, 0.9)
    ink = np.array(INK, dtype=np.float32)
    arr = arr * (1 - scrim)[..., None] + ink * scrim[..., None]
    base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")

    # Bookend fruit medallions, clear of the centered lockup.
    paste_circle(base, ROOT / "attachments/3432.jpg", 118, 330, 88, (0.5, 0.48), PAPER, 7)
    paste_circle(base, ROOT / "attachments/3431.jpg", W - 118, 330, 88, (0.5, 0.42), PAPER, 7)

    title = "RECOJO"
    font, tracking = fit_tracked(title, int(W * 0.58), 0.045)
    # Optical center: title + rule + badge as one block.
    badge_text = "FRUTAS HOY"
    badge_font = ImageFont.truetype(FONT_BOLD, 26)
    bt_w = badge_font.getlength(badge_text)
    pad_x, pad_y = 22, 10
    badge_w, badge_h = bt_w + pad_x * 2, 26 + pad_y * 2
    title_h = font.size
    gap = 22
    rule_h = 4
    block_h = title_h + gap + rule_h + 18 + badge_h
    top = (H - block_h) / 2 - 6

    draw_tracked(base, title, font, top, PAPER, tracking, shadow=10)

    rule_w = 148
    rule_y = top + title_h + gap
    rule = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(rule).rounded_rectangle(
        ((W - rule_w) / 2, rule_y, (W + rule_w) / 2, rule_y + rule_h),
        radius=2,
        fill=ORANGE + (255,),
    )
    base.alpha_composite(rule)

    badge_x = (W - badge_w) / 2
    badge_y = rule_y + rule_h + 18
    badge = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(badge).rounded_rectangle(
        (badge_x, badge_y, badge_x + badge_w, badge_y + badge_h),
        radius=badge_h / 2,
        fill=MAGENTA + (255,),
    )
    base.alpha_composite(badge)
    draw = ImageDraw.Draw(base)
    draw.text(
        (badge_x + pad_x, badge_y + pad_y - 2),
        badge_text,
        font=badge_font,
        fill=PAPER,
    )

    rgb = base.convert("RGB")
    raw = OUT / "card-raw.png"
    rgb.save(raw, "PNG")
    print("title_font", font.size, "tracking", tracking, "block_top", round(top), "badge", round(badge_w))
    return raw


def fruit_mark(size, rounded=False):
    """Orange tile, paper flesh, magenta seed. Glyph stays inside the maskable safe zone."""
    im = Image.new("RGB", (size, size), ORANGE)
    draw = ImageDraw.Draw(im)
    if rounded:
        # Favicon-style squircle preview only; PWA rasters stay full-bleed.
        im = Image.new("RGB", (size, size), INK)
        draw = ImageDraw.Draw(im)
        r = int(size * 0.25)
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=ORANGE)
    # Flesh circle centered slightly low, ~56% of the tile (inside the 80% mask safe zone).
    d = size * 0.56
    cx, cy = size / 2, size * 0.53
    draw.ellipse((cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2), fill=PAPER)
    s = d * 0.36
    draw.ellipse((cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2), fill=MAGENTA)
    return im


def main():
    make_card()
    fruit_mark(192).save(OUT / "icon-192.png", "PNG")
    fruit_mark(512).save(OUT / "icon-512.png", "PNG")
    fruit_mark(32, rounded=True).resize((16, 16), Image.Resampling.LANCZOS).save(OUT / "favicon-16.png")
    fruit_mark(64, rounded=True).save(OUT / "favicon-64.png")
    print("icons ok")


if __name__ == "__main__":
    main()
