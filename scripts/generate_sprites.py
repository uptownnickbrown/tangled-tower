#!/usr/bin/env python3
"""
Tangled Tower - AI Sprite Generation Pipeline
Generates all game sprites using Google Gemini Imagen 4.0.
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


def generate_and_save(prompt, name, chroma="magenta"):
    """Generate sprite, remove background, save both raw and keyed versions."""
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


# ============================================================
# SPRITE DEFINITIONS
# ============================================================

print("=" * 60)
print("TANGLED TOWER - Sprite Generation")
print("=" * 60)

# --- HERO KNIGHT ---
# Multiple poses as separate images for consistency
print("\n--- HERO KNIGHT ---")

hero_base = (
    "A side-view pixel art sprite of a small chibi knight character for a 2D platformer game. "
    "16-bit retro game style, clean pixel edges, black outline. "
    "The knight has: gray metal helmet with visor slit, blue armor with silver trim, "
    "a flowing red cape, brown leather boots, and a small sword at his hip. "
    "Facing right. Single character only, no text, no labels, no ground."
)

generate_and_save(
    hero_base + " Running pose with legs mid-stride, cape flowing behind.",
    "hero_run", chroma="green"
)
generate_and_save(
    hero_base + " Jumping pose with knees tucked up, cape billowing upward.",
    "hero_jump", chroma="green"
)
generate_and_save(
    hero_base + " Crouching pose, ducking low with cape draped over, compact body.",
    "hero_crouch", chroma="green"
)
generate_and_save(
    hero_base + " Hurt pose, recoiling backward with arms up, surprised expression visible through visor.",
    "hero_hurt", chroma="green"
)

# --- TOWER WITH RAPUNZEL ---
print("\n--- TOWER ---")

generate_and_save(
    "A pixel art stone tower for a 2D fairy tale game. 16-bit retro style, clean pixel edges. "
    "Tall medieval stone tower with gray brick pattern and mortar lines. "
    "A girl with very long flowing golden hair leans from a window near the top. "
    "She wears a royal blue dress. Her golden hair cascades down the side of the tower. "
    "The tower has a pointed roof with a small flag. Green ivy and vines grow on the walls. "
    "No text, no labels, no ground, no other characters.",
    "tower", chroma="magenta"
)

# --- ENEMIES ---
print("\n--- ENEMIES ---")

generate_and_save(
    "A side-view pixel art sprite of a small goblin enemy for a 2D platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A short green-skinned goblin with pointy ears, red eyes, holding a tiny wooden club. "
    "Wearing a tattered brown loincloth. Menacing but cute, chibi proportions. "
    "Walking pose, facing left. "
    "Single character only, no text, no labels, no ground.",
    "goblin", chroma="magenta"
)

generate_and_save(
    "A pixel art bat enemy sprite for a 2D platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A dark brown bat with wings spread wide, red glowing eyes, small fangs. "
    "Cartoonish and slightly menacing. Facing left in flight. "
    "Single character only, no text, no labels, no ground.",
    "bat", chroma="magenta"
)

generate_and_save(
    "A pixel art thorny vine obstacle for a 2D platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A vertical thorny vine growing from the ground with sharp red thorns, "
    "dark green stem, and small curling tendrils. Dangerous looking. "
    "No text, no labels, no ground, no background elements.",
    "vine", chroma="magenta"
)

# --- BOSSES ---
print("\n--- BOSSES ---")

boss_suffix = "Single character only, no text, no labels, no ground."

generate_and_save(
    "A pixel art troll boss sprite for a 2D fantasy platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A large, muscular brown-skinned troll with a big belly, "
    "beady yellow eyes, huge wooden club raised overhead, tattered cloth around waist. "
    "Aggressive stance, facing left. " + boss_suffix,
    "boss_troll", chroma="magenta"
)

generate_and_save(
    "A pixel art vine monster boss for a 2D fantasy platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A massive living plant creature made of twisted green vines and thorns, "
    "with a gaping mouth of thorns, glowing red eyes, and long vine tentacles. "
    "Menacing pose, facing left. " + boss_suffix,
    "boss_vine", chroma="magenta"
)

generate_and_save(
    "A pixel art giant bat boss sprite for a 2D fantasy platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "An enormous dark brown bat with massive wings spread wide, "
    "glowing red eyes, large fangs, and a furry body. "
    "Menacing flying pose, facing left. " + boss_suffix,
    "boss_bat", chroma="magenta"
)

generate_and_save(
    "A pixel art dark knight boss sprite for a 2D fantasy platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A tall menacing knight in dark black and gray armor, "
    "glowing red eyes through the visor, wielding a large dark sword, "
    "tattered dark cape. Aggressive battle stance, facing left. " + boss_suffix,
    "boss_knight", chroma="magenta"
)

generate_and_save(
    "A pixel art dragon boss sprite for a 2D fantasy platformer game. "
    "16-bit retro style, clean pixel edges, black outline. "
    "A fearsome but cartoonish green dragon with big wings spread wide, "
    "yellow belly scales, orange fire breath wisps from its nostrils, "
    "sharp teeth in a grinning mouth, and a spiked tail. "
    "Facing left in an aggressive pose. Large and imposing. " + boss_suffix,
    "boss_dragon", chroma="magenta"
)

# --- POWER-UPS ---
print("\n--- POWER-UPS ---")

generate_and_save(
    "A pixel art magic shield power-up item for a 2D platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A glowing cyan-blue magical shield with a star emblem, sparkling particles around it. "
    "Small collectible item, centered. "
    "No text, no labels, no ground.",
    "powerup_shield", chroma="magenta"
)

generate_and_save(
    "A pixel art speed boots power-up item for a 2D platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A pair of glowing orange-red winged boots with speed lines, magical aura. "
    "Small collectible item, centered. "
    "No text, no labels, no ground.",
    "powerup_boots", chroma="magenta"
)

generate_and_save(
    "A pixel art golden sword power-up item for a 2D platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A gleaming golden sword with a jeweled hilt, magical sparkle effect. "
    "Small collectible item, centered. "
    "No text, no labels, no ground.",
    "powerup_sword", chroma="green"
)

generate_and_save(
    "A pixel art gold coin collectible for a 2D platformer game. "
    "16-bit retro style, clean pixel edges. "
    "A shiny gold coin with a star or crown emblem, sparkling highlight. "
    "Small round item, centered. "
    "No text, no labels, no ground.",
    "coin", chroma="magenta"
)

# --- BACKGROUND ELEMENTS ---
print("\n--- BACKGROUND ---")

generate_and_save(
    "A pixel art heart icon for a game health indicator. "
    "16-bit retro style, clean pixel edges. "
    "A bright red heart shape with a lighter red highlight, classic game heart. "
    "Centered, no text, no labels, no ground.",
    "heart", chroma="green"
)

print("\n" + "=" * 60)
print("GENERATION COMPLETE")
print("=" * 60)
