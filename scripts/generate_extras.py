#!/usr/bin/env python3
"""
Generate extra sprites that make the game more visually interesting:
- Background trees/bushes for parallax layers
- Cloud sprite
- Fireball projectile
"""
import os
import sys
import io
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, val = line.strip().split("=", 1)
            os.environ[key] = val

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)

from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=api_key)
output_dir = Path(__file__).parent.parent / "assets" / "sprites"
output_dir.mkdir(parents=True, exist_ok=True)


def remove_background(img, tolerance=90):
    img_rgba = img.convert("RGBA")
    pixels = img_rgba.load()
    w, h = img_rgba.size
    corners = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    bg_r = sum(pixels[x, y][0] for x, y in corners) // 4
    bg_g = sum(pixels[x, y][1] for x, y in corners) // 4
    bg_b = sum(pixels[x, y][2] for x, y in corners) // 4
    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
            if dist < tolerance:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1
            elif dist < tolerance + 30:
                af = (dist - tolerance) / 30.0
                pixels[x, y] = (r, g, b, int(a * max(0, min(1, af))))
    return img_rgba, removed


def generate_and_save(prompt, name, chroma="magenta"):
    bg_suffix = {
        "green": (
            "Solid bright green chroma key background (#00FF00). "
            "IMPORTANT: Do not use any bright green or lime colors anywhere in the sprite itself."
        ),
        "magenta": (
            "Solid bright magenta chroma key background (#FF00FF). "
            "IMPORTANT: Do not use any pink, magenta, or purple colors anywhere in the sprite itself."
        ),
    }
    full_prompt = prompt + " " + bg_suffix[chroma]
    print(f"\n  Generating: {name} ({chroma} chroma)...")
    try:
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=full_prompt,
            config=types.GenerateImagesConfig(number_of_images=1),
        )
        if not response.generated_images:
            print(f"  ERROR: No images generated for {name}")
            return False
        img_data = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_data))
        raw_path = output_dir / f"{name}_raw.png"
        img.save(str(raw_path))
        keyed_img, removed = remove_background(img)
        keyed_path = output_dir / f"{name}.png"
        keyed_img.save(str(keyed_path))
        print(f"  Saved: {name}.png ({img.size[0]}x{img.size[1]}, {removed} bg pixels removed)")
        return True
    except Exception as e:
        print(f"  ERROR generating {name}: {e}")
        return False


print("=" * 60)
print("EXTRA SPRITES - Background & Effects")
print("=" * 60)

# Decorative tree for background parallax
generate_and_save(
    "A pixel art decorative tree for a 2D fairy tale platformer background. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A lush deciduous tree with brown trunk and bright green leafy canopy. "
    "Stylized and simple, suitable for a parallax background layer. "
    "No text, no labels, no ground.",
    "bg_tree", chroma="magenta"
)

# Bush/shrub
generate_and_save(
    "A pixel art bush for a 2D fairy tale platformer background. "
    "16-bit retro style, clean pixel edges. "
    "A round, fluffy green bush with small yellow flowers. "
    "Decorative ground-level element. "
    "No text, no labels, no ground.",
    "bg_bush", chroma="magenta"
)

# Rock/boulder
generate_and_save(
    "A pixel art rock for a 2D fairy tale platformer background. "
    "16-bit retro style, clean pixel edges. "
    "A gray boulder with moss growing on top, some darker cracks. "
    "Small decorative element. "
    "No text, no labels, no ground.",
    "bg_rock", chroma="magenta"
)

# Butterfly for ambiance
generate_and_save(
    "A pixel art butterfly for a 2D fairy tale platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A small colorful butterfly with blue and yellow wings spread open, "
    "cute and cheerful looking. "
    "No text, no labels, no ground.",
    "butterfly", chroma="magenta"
)

# Firefly for night levels
generate_and_save(
    "A pixel art glowing firefly for a 2D fairy tale game. "
    "16-bit retro style, clean pixel edges. "
    "A tiny bug with bright yellow-white glowing abdomen, small translucent wings. "
    "Magical and warm looking. "
    "No text, no labels, no ground.",
    "firefly", chroma="magenta"
)

print("\n" + "=" * 60)
print("EXTRA SPRITES COMPLETE")
print("=" * 60)
