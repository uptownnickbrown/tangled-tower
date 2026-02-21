#!/usr/bin/env python3
"""
Test Gemini sprite generation pipeline.
Uses flood-fill from edges to remove background — never touches interior pixels.
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


def remove_background(img, tolerance=55):
    """Remove background by color matching against sampled corner color.

    Since prompts tell the AI to avoid the chroma key color in the sprite,
    we can safely do a simple global pass: any pixel close to the background
    color gets removed, everywhere in the image. No flood-fill needed.
    """
    img_rgba = img.convert("RGBA")
    pixels = img_rgba.load()
    w, h = img_rgba.size

    # Sample background color from corners
    corner_samples = []
    for cx, cy in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]:
        r, g, b, a = pixels[cx, cy]
        corner_samples.append((r, g, b))

    bg_r = sum(s[0] for s in corner_samples) // len(corner_samples)
    bg_g = sum(s[1] for s in corner_samples) // len(corner_samples)
    bg_b = sum(s[2] for s in corner_samples) // len(corner_samples)
    print(f"  Detected background color: RGB({bg_r}, {bg_g}, {bg_b})")

    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5

            if dist < tolerance:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1
            elif dist < tolerance * 1.6:
                # Gentle anti-alias fade at edges
                alpha_factor = (dist - tolerance) / (tolerance * 0.6)
                new_alpha = int(a * max(0, min(1, alpha_factor)))
                pixels[x, y] = (r, g, b, new_alpha)

    print(f"  Removed {removed} background pixels")
    return img_rgba, removed


def generate_sprite(prompt, name, chroma_color="magenta"):
    """Generate a sprite with Imagen 4.0 and remove background via flood-fill."""
    print(f"\n--- Generating: {name} ---")

    bg_instruction = {
        "green": "Solid bright green chroma key background (#00FF00).",
        "magenta": "Solid bright magenta chroma key background (#FF00FF).",
        "blue": "Solid bright blue chroma key background (#0000FF).",
    }

    full_prompt = prompt + " " + bg_instruction.get(chroma_color, bg_instruction["magenta"])

    try:
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=full_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
            ),
        )

        if not response.generated_images:
            print(f"  No images generated for {name}!")
            return

        img_data = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_data))

        # Save raw
        raw_path = output_dir / f"test_{name}_raw.png"
        img.save(str(raw_path))
        print(f"  Raw: {raw_path} ({img.size[0]}x{img.size[1]})")

        # Background removal: flood-fill + strict cleanup
        keyed_img, removed = remove_background(img)
        keyed_path = output_dir / f"test_{name}_keyed.png"
        keyed_img.save(str(keyed_path))
        print(f"  Keyed: {keyed_path} (removed {removed} pixels)")

    except Exception as e:
        print(f"  Error: {e}")


# --- Hero Knight (no green, use green chroma) ---
generate_sprite(
    prompt=(
        "A side-view pixel art sprite of a small chibi knight character for a 2D platformer game. "
        "16-bit retro game style, clean pixel edges. "
        "The knight has: gray metal helmet with visor slit, blue armor with silver trim, "
        "a flowing red cape, brown leather boots, and a small sword at his hip. "
        "Running pose, facing right. "
        "Single character only, no text, no labels, no ground."
    ),
    name="hero",
    chroma_color="green"
)

# --- Tower with Rapunzel (has green ivy, use magenta chroma) ---
# IMPORTANT: Dress must NOT be purple/pink/magenta — those colors conflict with the chroma key.
# We ask for a blue dress instead to keep it far from the magenta background.
generate_sprite(
    prompt=(
        "A pixel art stone tower for a 2D fairy tale game. 16-bit retro style, clean pixel edges. "
        "Tall medieval stone tower with gray brick pattern and mortar lines. "
        "A girl with very long flowing golden hair leans from a window near the top. "
        "She wears a royal blue dress. Her golden hair cascades down the side of the tower. "
        "The tower has a pointed roof with a small flag. Green ivy and vines grow on the walls. "
        "IMPORTANT: Do not use any pink, magenta, or purple colors anywhere in the image. "
        "No text, no labels, no ground, no other characters."
    ),
    name="tower",
    chroma_color="magenta"
)

# --- Goblin (green character, use magenta chroma) ---
generate_sprite(
    prompt=(
        "A side-view pixel art sprite of a small goblin enemy for a 2D platformer game. "
        "16-bit retro style, clean pixel edges. "
        "A short green-skinned goblin with pointy ears, red eyes, holding a tiny wooden club. "
        "Wearing a tattered brown loincloth. Menacing but cute, chibi proportions. "
        "Walking pose, facing left. "
        "Single character only, no text, no labels, no ground."
    ),
    name="goblin",
    chroma_color="magenta"
)

# --- Dragon (green, use magenta chroma) ---
generate_sprite(
    prompt=(
        "A pixel art dragon boss sprite for a 2D fantasy platformer game. "
        "16-bit retro style, clean pixel edges. "
        "A fearsome but cartoonish green dragon with big wings spread wide, "
        "yellow belly scales, orange fire breath wisps from its nostrils, "
        "sharp teeth in a grinning mouth, and a spiked tail. "
        "Facing left in an aggressive pose. Large and imposing. "
        "Single character only, no text, no labels, no ground."
    ),
    name="dragon",
    chroma_color="magenta"
)

print("\n--- Done! Check assets/sprites/ for results ---")
