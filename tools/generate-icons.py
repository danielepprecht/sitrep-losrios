#!/usr/bin/env python3
"""
Genera los íconos PWA del proyecto SITREP en PNG usando Pillow.
No requiere SVG: dibuja directamente con primitivas.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUTPUT_DIR, exist_ok=True)

NAVY = (31, 56, 100)         # #1F3864
NAVY_LIGHT = (59, 111, 182)  # #3B6FB6
TEXT_BLUE = (154, 180, 217)  # #9AB4D9
WHITE = (255, 255, 255)


def find_font(size, bold=False):
    """Busca una fuente sans-serif del sistema."""
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold
        else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/Library/Fonts/Helvetica.ttc',
        'C:\\Windows\\Fonts\\arial.ttf',
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    return ImageFont.load_default()


def rounded_rectangle(draw, xy, radius, fill):
    """Dibuja un rectángulo con esquinas redondeadas."""
    x0, y0, x1, y1 = xy
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)


def draw_icon(size, maskable=False):
    """Dibuja el ícono SITREP a un tamaño dado."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Si es maskable, ocupar todo el lienzo y dejar margen interno (12% safe zone)
    if maskable:
        rounded_rectangle(d, (0, 0, size, size), radius=0, fill=NAVY)
        margin = int(size * 0.12)
    else:
        rounded_rectangle(d, (0, 0, size, size), radius=int(size * 0.19), fill=NAVY)
        margin = 0

    # Banda decorativa arriba
    band_h = max(2, int(size * 0.012))
    d.rectangle([margin, margin, size - margin, margin + band_h], fill=NAVY_LIGHT)

    # Texto "SR" centrado
    sr_size = int(size * 0.35)
    sr_font = find_font(sr_size, bold=True)
    text = "SR"
    bbox = d.textbbox((0, 0), text, font=sr_font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (size - text_w) / 2 - bbox[0]
    text_y = (size - text_h) / 2 - bbox[1] - int(size * 0.06)
    d.text((text_x, text_y), text, fill=WHITE, font=sr_font)

    # Subtítulo "SITREP"
    sub_size = max(8, int(size * 0.064))
    sub_font = find_font(sub_size, bold=True)
    subtext = "SITREP"
    sbbox = d.textbbox((0, 0), subtext, font=sub_font)
    sub_w = sbbox[2] - sbbox[0]
    sub_x = (size - sub_w) / 2 - sbbox[0]
    sub_y = text_y + text_h + int(size * 0.04)
    d.text((sub_x, sub_y), subtext, fill=TEXT_BLUE, font=sub_font)

    # Línea decorativa
    if size >= 192:
        line_w = int(size * 0.28)
        line_y = sub_y + int(size * 0.075)
        d.rectangle(
            [(size - line_w) / 2, line_y, (size + line_w) / 2, line_y + max(1, int(size * 0.005))],
            fill=NAVY_LIGHT
        )

        # "LOS RÍOS" abajo
        bottom_size = max(7, int(size * 0.044))
        bottom_font = find_font(bottom_size, bold=False)
        bottom_text = "LOS RÍOS"
        bbbox = d.textbbox((0, 0), bottom_text, font=bottom_font)
        bw = bbbox[2] - bbbox[0]
        bx = (size - bw) / 2 - bbbox[0]
        by = line_y + int(size * 0.025)
        d.text((bx, by), bottom_text, fill=TEXT_BLUE, font=bottom_font)

    return img


def main():
    print(f"[icons] generando en {OUTPUT_DIR}")
    sizes_normal = [192, 512]
    for s in sizes_normal:
        img = draw_icon(s, maskable=False)
        path = os.path.join(OUTPUT_DIR, f'icon-{s}.png')
        img.save(path, 'PNG')
        print(f"  ✓ icon-{s}.png")

    img_mask = draw_icon(512, maskable=True)
    path = os.path.join(OUTPUT_DIR, 'icon-maskable-512.png')
    img_mask.save(path, 'PNG')
    print(f"  ✓ icon-maskable-512.png")

    # Favicon
    fav = draw_icon(64, maskable=False)
    fav_path = os.path.join(OUTPUT_DIR, 'favicon.png')
    fav.save(fav_path, 'PNG')
    print(f"  ✓ favicon.png")


if __name__ == '__main__':
    main()
