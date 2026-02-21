#!/usr/bin/env python3
"""
Test Gemini sprite generation pipeline.
Generates a single hero knight sprite to evaluate quality.
"""

import os
import sys
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

print(f"API key loaded ({len(api_key)} chars)")

from google import genai
from google.genai import types
from PIL import Image
import io

client = genai.Client(api_key=api_key)

output_dir = Path(__file__).parent.parent / "assets" / "sprites"
output_dir.mkdir(parents=True, exist_ok=True)

# --- Test 1: Static sprite with Imagen 4.0 ---
print("\n--- Test 1: Generating hero knight sprite with Imagen 4.0 ---")

hero_prompt = (
    "A side-view pixel art sprite of a small knight character for a 2D platformer game. "
    "16-bit retro game style, clean pixel edges. "
    "The knight has: gray metal helmet with visor slit, blue armor with silver trim, "
    "a flowing red cape, brown leather boots, and a small sword at his hip. "
    "Running pose, facing right. "
    "Solid bright green chroma key background (#00FF00). "
    "Single character only, no text, no labels, no ground."
)

try:
    response = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=hero_prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
        ),
    )

    if response.generated_images:
        img_data = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_data))

        # Save raw version
        raw_path = output_dir / "test_hero_raw.png"
        img.save(str(raw_path))
        print(f"Saved raw image: {raw_path} ({img.size[0]}x{img.size[1]})")

        # Chroma key: remove green background
        img_rgba = img.convert("RGBA")
        pixels = img_rgba.load()
        w, h = img_rgba.size

        removed = 0
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                green_dominance = g - max(r, b)

                if green_dominance > 20 and g > 100:
                    pixels[x, y] = (0, 0, 0, 0)
                    removed += 1
                elif green_dominance > 5 and g > 80:
                    alpha_factor = 1 - (green_dominance / 100)
                    new_alpha = int(a * max(0, min(1, alpha_factor)))
                    pixels[x, y] = (r, g, b, new_alpha)

        keyed_path = output_dir / "test_hero_keyed.png"
        img_rgba.save(str(keyed_path))
        print(f"Saved chroma-keyed image: {keyed_path} (removed {removed} green pixels)")
    else:
        print("No images generated!")

except Exception as e:
    print(f"Imagen error: {e}")

# --- Test 2: Tower with Rapunzel ---
print("\n--- Test 2: Generating tower with Rapunzel ---")

tower_prompt = (
    "A pixel art stone tower for a 2D fairy tale game. 16-bit retro style, clean pixel edges. "
    "Tall medieval stone tower with gray brick pattern and mortar lines. "
    "A girl with very long flowing golden hair leans from a window near the top. "
    "She wears a purple dress. Her golden hair cascades down the side of the tower. "
    "The tower has a pointed roof with a small flag. Ivy grows on the lower walls. "
    "Solid bright green chroma key background (#00FF00). "
    "No text, no labels, no ground, no other characters."
)

try:
    response = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=tower_prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
        ),
    )

    if response.generated_images:
        img_data = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_data))

        raw_path = output_dir / "test_tower_raw.png"
        img.save(str(raw_path))
        print(f"Saved raw image: {raw_path} ({img.size[0]}x{img.size[1]})")

        # Chroma key
        img_rgba = img.convert("RGBA")
        pixels = img_rgba.load()
        w, h = img_rgba.size

        removed = 0
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                green_dominance = g - max(r, b)
                if green_dominance > 20 and g > 100:
                    pixels[x, y] = (0, 0, 0, 0)
                    removed += 1
                elif green_dominance > 5 and g > 80:
                    alpha_factor = 1 - (green_dominance / 100)
                    new_alpha = int(a * max(0, min(1, alpha_factor)))
                    pixels[x, y] = (r, g, b, new_alpha)

        keyed_path = output_dir / "test_tower_keyed.png"
        img_rgba.save(str(keyed_path))
        print(f"Saved chroma-keyed image: {keyed_path} (removed {removed} green pixels)")
    else:
        print("No images generated!")

except Exception as e:
    print(f"Imagen error: {e}")

print("\n--- Done! Check assets/sprites/ for results ---")
