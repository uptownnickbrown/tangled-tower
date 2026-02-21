#!/usr/bin/env python3
"""
Generate 3-frame hero run cycle as a SINGLE SPRITE SHEET for visual consistency.
All 3 poses are generated in one image, then split into individual frames.
This ensures the knight's colors, proportions, and style remain identical across frames.
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


def center_crop_frame(img, target_w, target_h):
    """Crop a frame to center on its non-transparent content, padded to target size."""
    # Find bounding box of non-transparent pixels
    bbox = img.getbbox()
    if not bbox:
        return img.resize((target_w, target_h))

    # Crop to content
    content = img.crop(bbox)
    cw, ch = content.size

    # Scale to fit target while maintaining aspect ratio
    scale = min(target_w / cw, target_h / ch) * 0.85  # 85% fill
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    content = content.resize((new_w, new_h), Image.NEAREST)

    # Center on target canvas
    result = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    paste_x = (target_w - new_w) // 2
    paste_y = target_h - new_h  # Align to bottom (feet on ground)
    result.paste(content, (paste_x, paste_y))
    return result


print("=" * 60)
print("HERO RUN CYCLE - Sprite Sheet Approach")
print("=" * 60)

# Generate a sprite sheet with all 3 frames in one image for consistency
prompt = (
    "A pixel art sprite sheet showing exactly 3 running animation frames of the SAME small chibi knight character, "
    "arranged horizontally in a single row, evenly spaced. "
    "16-bit retro game style, clean pixel edges, black outline around the character. "
    "\n\n"
    "The knight has: a gray metal helmet with a T-shaped visor slit showing determined eyes, "
    "bright blue armor with silver trim on the chest and shoulders, "
    "a flowing red cape billowing behind him, "
    "brown leather boots with silver buckles, and a small silver sword sheathed at his hip. "
    "Facing right. Large head, small body, stubby limbs in chibi/cute style. "
    "\n\n"
    "Frame 1 (left): Right foot forward touching ground, left foot behind, arms swinging opposite to legs. "
    "Frame 2 (center): Both feet close together mid-stride, body at highest point, slightly upright. "
    "Frame 3 (right): Left foot forward touching ground, right foot behind, mirror of frame 1. "
    "\n\n"
    "All 3 frames must show the EXACT SAME character with identical colors, helmet, armor, cape, and sword. "
    "Only the leg and arm positions change between frames. "
    "Each frame occupies roughly 1/3 of the image width. "
    "No text, no labels, no ground line, no numbers. "
    "Solid bright magenta chroma key background (#FF00FF). "
    "IMPORTANT: Do not use any pink, magenta, or purple colors anywhere in the sprites themselves."
)

print("\n  Generating sprite sheet with 3 run cycle frames...")
try:
    response = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=prompt,
        config=types.GenerateImagesConfig(number_of_images=1),
    )

    if not response.generated_images:
        print("  ERROR: No images generated")
        sys.exit(1)

    img_data = response.generated_images[0].image.image_bytes
    sheet = Image.open(io.BytesIO(img_data))

    # Save raw sprite sheet
    raw_path = output_dir / "hero_run_sheet_raw.png"
    sheet.save(str(raw_path))
    print(f"  Raw sprite sheet saved: {sheet.size[0]}x{sheet.size[1]}")

    # Remove background from full sheet
    keyed_sheet, removed = remove_background(sheet)
    sheet_path = output_dir / "hero_run_sheet.png"
    keyed_sheet.save(str(sheet_path))
    print(f"  Background removed: {removed} pixels")

    # Split into 3 equal frames
    w, h = keyed_sheet.size
    frame_w = w // 3

    frame_names = ["hero_run1", "hero_run2", "hero_run3"]
    for i, name in enumerate(frame_names):
        left = i * frame_w
        right = left + frame_w
        frame = keyed_sheet.crop((left, 0, right, h))

        # Center-crop each frame to consistent size, feet aligned
        frame = center_crop_frame(frame, frame_w, h)

        frame_path = output_dir / f"{name}.png"
        frame.save(str(frame_path))
        print(f"  Saved: {name}.png ({frame_w}x{h})")

    print("\n  SUCCESS: 3 run cycle frames extracted from sprite sheet")

except Exception as e:
    print(f"  ERROR: {e}")
    print("\n  Falling back to individual frame generation...")

    # Fallback: generate each frame individually with very detailed shared description
    char_desc = (
        "A side-view pixel art sprite of a small chibi knight character for a 2D platformer game. "
        "16-bit retro game style, clean pixel edges, black outline. "
        "The knight has: a gray metal helmet with a T-shaped visor slit, "
        "bright blue armor with silver trim, a flowing red cape behind him, "
        "brown leather boots with silver buckles, a small silver sword at his hip. "
        "Facing right. Large head, small body, stubby limbs. "
        "Single character only, no text, no labels, no ground, no shadow. "
        "Solid bright magenta chroma key background (#FF00FF). "
        "IMPORTANT: Do not use any pink, magenta, or purple in the sprite."
    )

    poses = [
        (" Running pose: Right leg forward, left leg back, left arm forward, right arm back. "
         "Cape flowing straight back. Body leaning forward.", "hero_run1"),
        (" Running pose: Both legs together mid-stride, body upright at highest point. "
         "Arms close to body. Cape floating slightly up.", "hero_run2"),
        (" Running pose: Left leg forward, right leg back, right arm forward, left arm back. "
         "Cape flowing straight back. Body leaning forward.", "hero_run3"),
    ]

    for pose_desc, name in poses:
        full_prompt = char_desc + pose_desc
        print(f"\n  Generating: {name}...")
        try:
            resp = client.models.generate_images(
                model="imagen-4.0-generate-001",
                prompt=full_prompt,
                config=types.GenerateImagesConfig(number_of_images=1),
            )
            if not resp.generated_images:
                print(f"  ERROR: No image for {name}")
                continue
            img = Image.open(io.BytesIO(resp.generated_images[0].image.image_bytes))
            img.save(str(output_dir / f"{name}_raw.png"))
            keyed, rem = remove_background(img)
            keyed.save(str(output_dir / f"{name}.png"))
            print(f"  Saved: {name}.png ({rem} bg pixels removed)")
        except Exception as ex:
            print(f"  ERROR generating {name}: {ex}")

print("\n" + "=" * 60)
print("RUN CYCLE GENERATION COMPLETE")
print("=" * 60)
