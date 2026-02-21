#!/usr/bin/env python3
"""
Tangled Tower - Regenerate ALL AI Sprites at Correct Scale

Regenerates every game sprite via Gemini Imagen 4.0 with prompts that specify
the target display size and emphasize chunky pixel art. After generation:
1. Chroma-key background removal
2. Crop to content bounding box
3. Resize proportionally to target file height
4. Save both {name}_raw.png and {name}.png

Hero sprites share an identical base description for consistency, then get
placed on a uniform canvas (bottom-aligned) so all frames have the same
dimensions.
"""

import os
import sys
import io
import shutil
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


# ============================================================
# UTILITIES
# ============================================================

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


def crop_to_content(img):
    """Crop image to its non-transparent content bounding box."""
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def resize_to_height(img, target_height):
    """Resize image proportionally so height == target_height."""
    w, h = img.size
    if h == 0:
        return img
    ratio = target_height / h
    new_w = max(1, int(w * ratio))
    return img.resize((new_w, target_height), Image.NEAREST)


def generate_and_save(prompt, name, chroma="magenta", target_height=128):
    """Generate sprite, remove background, crop, resize, and save."""
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
    print(f"\n  Generating: {name} ({chroma} chroma, target {target_height}px)...")

    try:
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=full_prompt,
            config=types.GenerateImagesConfig(number_of_images=1),
        )

        if not response.generated_images:
            print(f"  ERROR: No images generated for {name}")
            return None

        img_data = response.generated_images[0].image.image_bytes
        img = Image.open(io.BytesIO(img_data))

        # Save raw
        raw_path = output_dir / f"{name}_raw.png"
        img.save(str(raw_path))

        # Remove background
        keyed_img, removed = remove_background(img)

        # Crop to content
        cropped = crop_to_content(keyed_img)

        # Resize to target height
        resized = resize_to_height(cropped, target_height)

        # Save final
        final_path = output_dir / f"{name}.png"
        resized.save(str(final_path))

        print(f"  Saved: {name}.png ({resized.size[0]}x{resized.size[1]}, "
              f"from {img.size[0]}x{img.size[1]}, {removed} bg pixels removed)")
        return resized

    except Exception as e:
        print(f"  ERROR generating {name}: {e}")
        return None


# ============================================================
# SCALE HINT TEMPLATE
# ============================================================

def scale_hint(display_px):
    """Generate the scale hint suffix for prompts."""
    return (
        f"This will be rendered at approximately {display_px}px tall in a 480x270 pixel game. "
        "Design with chunky pixel art style — bold black outlines, simple shapes, "
        "large readable details, minimal fine texture."
    )


# ============================================================
# HERO SPRITES — Shared base description for consistency
# ============================================================

HERO_BASE = (
    "A single pixel art chibi knight character in side view, facing right. "
    "16-bit retro game style like classic SNES RPGs. Clean pixel edges, bold black outline around the whole character. "
    "Chibi proportions: head is roughly 1/3 of total body height, about 3 heads tall total. "
    "Character design: "
    "- Oversized round gray steel helmet covering the top half of the head, with a rectangular visor slit showing two small white eyes "
    "- Small round body wearing bright blue tunic/armor with a brown leather belt "
    "- A short red cape attached at the shoulders, flowing behind "
    "- Simple stubby arms and legs (big head, tiny body) "
    "- Brown boots on the feet "
    "- A small silver sword in a brown scabbard on the belt "
    "No text, no labels, no ground, no shadow, no other characters. "
)

HERO_SCALE_HINT = scale_hint(40)
HERO_TARGET = 128

HERO_SPRITES = [
    {
        "name": "hero_run1",
        "pose": (
            "RUNNING POSE - FULL STRIDE: "
            "The knight is mid-run with legs spread WIDE apart like scissors. "
            "Right leg stretched far forward, left leg stretched far behind. "
            "Left arm swinging forward, right arm swinging back. "
            "Red cape blowing horizontally behind. Body leans forward with running momentum."
        ),
    },
    {
        "name": "hero_run2",
        "pose": (
            "RUNNING POSE - LEGS TOGETHER: "
            "The knight is mid-run with both legs CLOSE TOGETHER directly under the body, "
            "knees slightly bent, feet almost touching as legs pass each other. "
            "Both arms close to body at sides. Red cape hangs loosely behind. "
            "Body is more upright than stride pose."
        ),
    },
    {
        "name": "hero_jump",
        "pose": (
            "JUMPING POSE: "
            "The knight is leaping upward through the air. "
            "Both legs tucked up underneath with knees bent. "
            "Both arms raised upward above head triumphantly. "
            "Red cape flowing downward and billowing below. "
            "Whole body conveys upward motion and energy."
        ),
    },
    {
        "name": "hero_crouch",
        "pose": (
            "CROUCHING/DUCKING POSE: "
            "The knight is crouched down low, ducking under something. "
            "Body compressed — knees deeply bent, torso hunched forward. "
            "Character is about HALF the height of standing pose. "
            "Arms tucked in close protectively. Helmet tilted forward. "
            "Cape drapes over the back."
        ),
    },
    {
        "name": "hero_hurt",
        "pose": (
            "HURT/DAMAGED POSE: "
            "The knight has been hit and is recoiling backward. "
            "Body leaning backward with arms flailing out to sides. "
            "Head tilted back. One foot lifted off ground. "
            "Small star/impact symbols near head to show pain. "
            "Cape flying forward from backward momentum."
        ),
    },
]


# ============================================================
# ALL OTHER SPRITES
# ============================================================

OTHER_SPRITES = [
    # --- Enemies ---
    {
        "name": "goblin",
        "target": 160,
        "chroma": "magenta",
        "prompt": (
            "A side-view pixel art sprite of a small goblin enemy for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A short green-skinned goblin with pointy ears, red eyes, holding a tiny wooden club. "
            "Wearing a tattered brown loincloth. Menacing but cute, chibi proportions. "
            "Walking pose, facing left. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(50)
        ),
    },
    {
        "name": "bat",
        "target": 160,
        "chroma": "magenta",
        "prompt": (
            "A pixel art bat enemy sprite for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A dark brown bat with wings spread wide, red glowing eyes, small fangs. "
            "Cartoonish and slightly menacing. Facing left in flight. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(50)
        ),
    },
    # --- Vines ---
    {
        "name": "vine",
        "target": 200,
        "chroma": "magenta",
        "prompt": (
            "A pixel art thorny vine obstacle for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A vertical thorny vine growing from the ground with sharp red thorns, "
            "dark green stem, and small curling tendrils. Dangerous looking. "
            "No text, no labels, no ground, no background elements. "
            + scale_hint(60)
        ),
    },
    # --- Bosses ---
    {
        "name": "boss_troll",
        "target": 300,
        "chroma": "magenta",
        "prompt": (
            "A pixel art troll boss sprite for a 2D fantasy platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A large, muscular brown-skinned troll with a big belly, "
            "beady yellow eyes, huge wooden club raised overhead, tattered cloth around waist. "
            "Aggressive stance, facing left. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(90)
        ),
    },
    {
        "name": "boss_vine",
        "target": 300,
        "chroma": "magenta",
        "prompt": (
            "A pixel art vine monster boss for a 2D fantasy platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A massive living plant creature made of twisted green vines and thorns, "
            "with a gaping mouth of thorns, glowing red eyes, and long vine tentacles. "
            "Menacing pose, facing left. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(90)
        ),
    },
    {
        "name": "boss_bat",
        "target": 300,
        "chroma": "magenta",
        "prompt": (
            "A pixel art giant bat boss sprite for a 2D fantasy platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "An enormous dark brown bat with massive wings spread wide, "
            "glowing red eyes, large fangs, and a furry body. "
            "Menacing flying pose, facing left. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(90)
        ),
    },
    {
        "name": "boss_knight",
        "target": 300,
        "chroma": "magenta",
        "prompt": (
            "A pixel art dark knight boss sprite for a 2D fantasy platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A tall menacing knight in dark black and gray armor, "
            "glowing red eyes through the visor, wielding a large dark sword, "
            "tattered dark cape. Aggressive battle stance, facing left. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(90)
        ),
    },
    {
        "name": "boss_dragon",
        "target": 300,
        "chroma": "magenta",
        "prompt": (
            "A pixel art dragon boss sprite for a 2D fantasy platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A fearsome but cartoonish green dragon with big wings spread wide, "
            "yellow belly scales, orange fire breath wisps from nostrils, "
            "sharp teeth in a grinning mouth, and a spiked tail. "
            "Facing left in an aggressive pose. Large and imposing. "
            "Single character only, no text, no labels, no ground. "
            + scale_hint(90)
        ),
    },
    # --- Tower ---
    {
        "name": "tower",
        "target": 600,
        "chroma": "magenta",
        "prompt": (
            "A pixel art stone tower for a 2D fairy tale game. 16-bit retro style, clean pixel edges. "
            "Tall medieval stone tower with gray brick pattern and mortar lines. "
            "A girl with very long flowing golden hair leans from a window near the top. "
            "She wears a royal blue dress. Her golden hair cascades down the side of the tower. "
            "The tower has a pointed roof with a small flag. Green ivy and vines grow on the walls. "
            "No text, no labels, no ground, no other characters. "
            + scale_hint(180)
        ),
    },
    # --- Power-ups ---
    {
        "name": "powerup_shield",
        "target": 100,
        "chroma": "magenta",
        "prompt": (
            "A pixel art magic shield power-up item for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A glowing cyan-blue magical shield with a star emblem, sparkling particles around it. "
            "Small collectible item, centered. "
            "No text, no labels, no ground. "
            + scale_hint(30)
        ),
    },
    {
        "name": "powerup_boots",
        "target": 100,
        "chroma": "magenta",
        "prompt": (
            "A pixel art speed boots power-up item for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A pair of glowing orange-red winged boots with speed lines, magical aura. "
            "Small collectible item, centered. "
            "No text, no labels, no ground. "
            + scale_hint(30)
        ),
    },
    {
        "name": "powerup_sword",
        "target": 100,
        "chroma": "green",
        "prompt": (
            "A pixel art golden sword power-up item for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A gleaming golden sword with a jeweled hilt, magical sparkle effect. "
            "Small collectible item, centered. "
            "No text, no labels, no ground. "
            + scale_hint(30)
        ),
    },
    # --- Coin ---
    {
        "name": "coin",
        "target": 64,
        "chroma": "magenta",
        "prompt": (
            "A pixel art gold coin collectible for a 2D platformer game. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A shiny gold coin with a star or crown emblem, sparkling highlight. "
            "Small round item, centered. "
            "No text, no labels, no ground. "
            + scale_hint(20)
        ),
    },
    # --- Heart ---
    {
        "name": "heart",
        "target": 48,
        "chroma": "green",
        "prompt": (
            "A pixel art heart icon for a game health indicator. "
            "16-bit retro style, clean pixel edges, bold black outline. "
            "A bright red heart shape with a lighter red highlight, classic game heart. "
            "Centered, no text, no labels, no ground. "
            + scale_hint(16)
        ),
    },
    # --- Background elements ---
    {
        "name": "bg_tree",
        "target": 128,
        "chroma": "magenta",
        "prompt": (
            "A pixel art decorative tree for a 2D platformer background. "
            "16-bit retro style, clean pixel edges. "
            "A simple stylized tree with a brown trunk and green leafy canopy. "
            "Cartoon style, suitable for parallax background scenery. "
            "No text, no labels, no ground. "
            + scale_hint(40)
        ),
    },
    {
        "name": "bg_bush",
        "target": 64,
        "chroma": "magenta",
        "prompt": (
            "A pixel art decorative bush for a 2D platformer background. "
            "16-bit retro style, clean pixel edges. "
            "A small round green bush, simple shape, cartoon style. "
            "Suitable for parallax background scenery. "
            "No text, no labels, no ground. "
            + scale_hint(20)
        ),
    },
    {
        "name": "bg_rock",
        "target": 48,
        "chroma": "magenta",
        "prompt": (
            "A pixel art decorative rock for a 2D platformer background. "
            "16-bit retro style, clean pixel edges. "
            "A small gray stone/boulder, simple shape, cartoon style. "
            "Suitable for background scenery. "
            "No text, no labels, no ground. "
            + scale_hint(15)
        ),
    },
    # --- Ambient creatures ---
    {
        "name": "butterfly",
        "target": 40,
        "chroma": "magenta",
        "prompt": (
            "A pixel art butterfly sprite for a 2D game. "
            "16-bit retro style, clean pixel edges. "
            "A tiny colorful butterfly with spread wings, orange and yellow coloring. "
            "Very simple, minimal detail. "
            "No text, no labels, no ground. "
            + scale_hint(12)
        ),
    },
    {
        "name": "firefly",
        "target": 32,
        "chroma": "magenta",
        "prompt": (
            "A pixel art firefly sprite for a 2D game. "
            "16-bit retro style, clean pixel edges. "
            "A tiny glowing firefly with small wings and a bright yellow-green glowing body. "
            "Very simple, minimal detail, small insect. "
            "No text, no labels, no ground. "
            + scale_hint(10)
        ),
    },
]


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("TANGLED TOWER - Regenerate ALL Sprites at Correct Scale")
    print("=" * 60)

    # --- HERO SPRITES ---
    print("\n--- HERO SPRITES (5 poses) ---")
    hero_images = {}
    for hero in HERO_SPRITES:
        prompt = HERO_BASE + hero["pose"] + " " + HERO_SCALE_HINT
        result = generate_and_save(prompt, hero["name"], chroma="green", target_height=HERO_TARGET)
        if result:
            hero_images[hero["name"]] = result

    # Post-process hero frames: uniform canvas, bottom-aligned
    if hero_images:
        print("\n  Post-processing hero frames: uniform canvas...")
        max_w = max(img.size[0] for img in hero_images.values())
        max_h = max(img.size[1] for img in hero_images.values())
        print(f"  Uniform canvas: {max_w}x{max_h}")

        for name, img in hero_images.items():
            canvas = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
            # Bottom-align: place at bottom, centered horizontally
            x_offset = (max_w - img.size[0]) // 2
            y_offset = max_h - img.size[1]
            canvas.paste(img, (x_offset, y_offset))
            final_path = output_dir / f"{name}.png"
            canvas.save(str(final_path))
            print(f"  Placed {name} on {max_w}x{max_h} canvas (offset y={y_offset})")

    # Copy hero_run1 -> hero_run
    src = output_dir / "hero_run1.png"
    dst = output_dir / "hero_run.png"
    if src.exists():
        shutil.copy2(str(src), str(dst))
        print(f"\n  Copied hero_run1.png -> hero_run.png (fallback key)")

    # --- ALL OTHER SPRITES ---
    print("\n--- OTHER SPRITES ---")
    for sprite in OTHER_SPRITES:
        generate_and_save(
            sprite["prompt"],
            sprite["name"],
            chroma=sprite["chroma"],
            target_height=sprite["target"],
        )

    print("\n" + "=" * 60)
    print("REGENERATION COMPLETE — all sprites saved to assets/sprites/")
    print("=" * 60)


if __name__ == "__main__":
    main()
