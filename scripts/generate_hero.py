#!/usr/bin/env python3
"""
Generate ALL hero sprites from scratch with consistent character design.
Uses a 2-frame run cycle (classic NES style) for maximum contrast between poses.
Each sprite is generated individually with very specific pose descriptions.
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


def generate_and_save(prompt, name):
    full_prompt = (
        prompt + " "
        "Solid bright magenta chroma key background (#FF00FF). "
        "IMPORTANT: Do not use any pink, magenta, or purple colors anywhere in the sprite itself."
    )
    print(f"\n  Generating: {name}...")
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


# =============================================================
# Shared character identity — extremely specific to ensure
# consistency across all separately-generated sprites.
# =============================================================
CHAR = (
    "A single pixel art chibi knight character in side view, facing right. "
    "16-bit retro game style like classic SNES RPGs. Clean pixel edges, black outline around the whole character. "
    "Character design: "
    "- Oversized round gray steel helmet covering the top half of the head, with a rectangular visor slit showing two small white eyes "
    "- Small round body wearing bright blue tunic/armor with a brown leather belt "
    "- A short red cape attached at the shoulders, flowing behind "
    "- Simple stubby arms and legs (chibi proportions: big head, tiny body) "
    "- Brown boots on the feet "
    "- A small silver sword in a brown scabbard on the belt "
    "The character is about 3 heads tall (chibi style). "
    "No text, no labels, no ground, no shadow, no other characters. "
)

print("=" * 60)
print("HERO SPRITES - Full Character Set")
print("=" * 60)

# =============================================================
# RUN CYCLE — 2 frames, classic NES style
# Frame 1: legs spread wide apart in full stride
# Frame 2: legs crossed/together, passing each other
# =============================================================
print("\n--- RUN CYCLE (2 frames) ---")

generate_and_save(
    CHAR +
    "RUNNING POSE - FULL STRIDE: "
    "The knight is mid-run with legs spread WIDE apart like scissors. "
    "The right leg is stretched far forward with the foot extended ahead, "
    "the left leg is stretched far behind. "
    "The left arm is swinging forward, the right arm is swinging back. "
    "The red cape is blowing horizontally behind him. "
    "The body leans forward with running momentum. "
    "The legs should be very clearly spread apart — this is the extended stride pose.",
    "hero_run1"
)

generate_and_save(
    CHAR +
    "RUNNING POSE - LEGS TOGETHER: "
    "The knight is mid-run with both legs CLOSE TOGETHER directly under the body, "
    "knees slightly bent, feet almost touching as the legs pass each other. "
    "Both arms are close to the body at the sides. "
    "The red cape hangs down more loosely behind. "
    "The body is more upright than the stride pose. "
    "This is the passing/recovery pose between strides — legs bunched together under the torso.",
    "hero_run2"
)

# Also save run1 as hero_run (used as fallback key in some scenes)
import shutil
src = output_dir / "hero_run1.png"
dst = output_dir / "hero_run.png"
if src.exists():
    shutil.copy2(str(src), str(dst))
    print(f"\n  Copied hero_run1.png -> hero_run.png (fallback)")

# =============================================================
# JUMP POSE
# =============================================================
print("\n--- JUMP ---")

generate_and_save(
    CHAR +
    "JUMPING POSE: "
    "The knight is leaping upward through the air. "
    "Both legs are tucked up underneath the body with knees bent. "
    "Both arms are raised upward above the head triumphantly. "
    "The red cape is flowing downward and billowing below. "
    "The whole body conveys upward motion and energy.",
    "hero_jump"
)

# =============================================================
# CROUCH / SLIDE POSE
# =============================================================
print("\n--- CROUCH ---")

generate_and_save(
    CHAR +
    "CROUCHING/DUCKING POSE: "
    "The knight is crouched down very low to the ground, ducking under something. "
    "The body is compressed — knees deeply bent, torso hunched forward. "
    "The character should be about HALF the height of the standing pose. "
    "Arms are tucked in close to the body protectively. "
    "The helmet is tilted forward, looking down. "
    "The cape drapes over the back.",
    "hero_crouch"
)

# =============================================================
# HURT / DAMAGE POSE
# =============================================================
print("\n--- HURT ---")

generate_and_save(
    CHAR +
    "HURT/DAMAGED POSE: "
    "The knight has been hit and is recoiling backward. "
    "The body is leaning backward with arms flailing out to the sides. "
    "The head is tilted back. One foot is lifted off the ground. "
    "Small star/impact symbols near the head to show pain. "
    "The cape is flying forward from the backward momentum. "
    "The pose conveys being knocked back by an impact.",
    "hero_hurt"
)

print("\n" + "=" * 60)
print("ALL HERO SPRITES GENERATED")
print("=" * 60)
