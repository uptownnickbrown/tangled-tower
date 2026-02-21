#!/usr/bin/env python3
"""Normalize hero sprite PNGs so heads are consistent across animation frames.

1. Load all hero_*.png files (excluding *_raw.png)
2. Find bounding box of non-transparent content in each
3. Crop to content, resize proportionally to match the tallest
4. Bottom-align (feet) and center horizontally on a consistent canvas
5. Save back to same filenames
"""

import glob
import os
from PIL import Image

SPRITE_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sprites')

def get_content_bbox(img):
    """Get bounding box of non-transparent pixels."""
    alpha = img.getchannel('A')
    bbox = alpha.getbbox()
    return bbox

def normalize_heroes():
    pattern = os.path.join(SPRITE_DIR, 'hero_*.png')
    files = sorted(glob.glob(pattern))
    # Exclude raw files
    files = [f for f in files if '_raw' not in f]

    if not files:
        print('No hero sprite files found.')
        return

    print(f'Found {len(files)} hero sprites:')
    for f in files:
        print(f'  {os.path.basename(f)}')

    # Load images and find content bounds
    images = {}
    bboxes = {}
    for f in files:
        img = Image.open(f).convert('RGBA')
        images[f] = img
        bbox = get_content_bbox(img)
        if bbox:
            bboxes[f] = bbox
            content_w = bbox[2] - bbox[0]
            content_h = bbox[3] - bbox[1]
            print(f'  {os.path.basename(f)}: content {content_w}x{content_h} at ({bbox[0]},{bbox[1]})')
        else:
            print(f'  {os.path.basename(f)}: empty/fully transparent, skipping')

    if not bboxes:
        print('No content found in any sprites.')
        return

    # Find the tallest and widest content
    max_h = max(bbox[3] - bbox[1] for bbox in bboxes.values())
    max_w = max(bbox[2] - bbox[0] for bbox in bboxes.values())

    # Canvas size: use the largest dimensions with some padding
    canvas_w = max_w + 20
    canvas_h = max_h + 20

    print(f'\nNormalizing to canvas {canvas_w}x{canvas_h}, max content {max_w}x{max_h}')

    for f, bbox in bboxes.items():
        img = images[f]
        # Crop to content
        cropped = img.crop(bbox)
        content_w, content_h = cropped.size

        # Scale proportionally so height matches max_h
        if content_h < max_h:
            scale = max_h / content_h
            new_w = int(content_w * scale)
            new_h = max_h
            cropped = cropped.resize((new_w, new_h), Image.LANCZOS)
        else:
            new_w, new_h = content_w, content_h

        # Create new canvas and paste bottom-aligned, horizontally centered
        result = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
        paste_x = (canvas_w - new_w) // 2
        paste_y = canvas_h - new_h  # bottom-align
        result.paste(cropped, (paste_x, paste_y))

        result.save(f)
        print(f'  Saved {os.path.basename(f)}: {new_w}x{new_h} on {canvas_w}x{canvas_h} canvas')

    print('\nDone! All hero sprites normalized.')

if __name__ == '__main__':
    normalize_heroes()
