#!/usr/bin/env python3
"""
Generate 3-frame hero run cycle with visual coherence.
Each frame shows the same knight at a different point in the stride.
"""
import os
import sys
import io
from pathlib import Path

# Load API key from .env
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
    """Remove background by global color match against corner-sampled color."""
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


def generate_and_save(prompt, name, chroma="green"):
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


# Shared character description for consistency
char_desc = (
    "A side-view pixel art sprite of a small chibi knight character for a 2D platformer game. "
    "16-bit retro game style, clean pixel edges, black outline. "
    "The knight has: gray metal helmet with visor slit showing determined eyes, "
    "bright blue armor with silver trim on the chest and shoulders, "
    "a flowing red cape billowing behind him in the wind, "
    "brown leather boots with silver buckles, and a small silver sword at his hip. "
    "Facing right. The character has consistent proportions: large head, small body, "
    "stubby limbs in chibi style. "
    "Single character only, no text, no labels, no ground, no shadow."
)

print("=" * 60)
print("HERO RUN CYCLE - 3 Frames")
print("=" * 60)

# Frame 1: Right foot forward, left foot back (contact pose)
generate_and_save(
    char_desc +
    " Running pose frame 1 of 3: RIGHT leg extended forward with foot about to touch ground, "
    "LEFT leg extended behind. Arms in opposite position - left arm forward, right arm back. "
    "Cape is lifted and flowing straight back horizontally in the wind. "
    "Body leaning slightly forward with momentum.",
    "hero_run1", chroma="green"
)

# Frame 2: Both feet close together, passing position
generate_and_save(
    char_desc +
    " Running pose frame 2 of 3: Both legs close together passing each other mid-stride. "
    "Body is at its highest point, slightly more upright. "
    "Arms close to the body. "
    "Cape is flowing behind and slightly upward, catching the air.",
    "hero_run2", chroma="green"
)

# Frame 3: Left foot forward, right foot back (opposite contact)
generate_and_save(
    char_desc +
    " Running pose frame 3 of 3: LEFT leg extended forward with foot about to touch ground, "
    "RIGHT leg extended behind. Arms in opposite position - right arm forward, left arm back. "
    "Cape is lifted and flowing straight back horizontally in the wind. "
    "Body leaning slightly forward with momentum.",
    "hero_run3", chroma="green"
)

print("\n" + "=" * 60)
print("RUN CYCLE GENERATION COMPLETE")
print("=" * 60)
