# Tangled Tower

A Rapunzel-themed auto-runner browser game for 5-7 year olds. Built with Phaser 3, targeting iPad landscape.

## Tech Stack

- **Phaser 3** from CDN (no build step)
- **Global namespace**: `var TangledTower = TangledTower || {};`
- **Native resolution**: 480x270, `pixelArt: true`, `Phaser.Scale.FIT`
- **No ES modules** — plain `<script>` tags loaded in order via `index.html`
- **Python virtualenv** at `scripts/.venv/` for asset generation only (not a runtime dependency)

## Project Structure

- `js/constants.js` — dimensions, physics, color palette
- `js/sprites.js` — procedural pixel art sprite generation
- `js/audio.js` — Web Audio API chiptune sequencer + SFX
- `js/input.js` — single-button input state machine (tap/hold/release)
- `js/levels.js` — 5 level configs with spawns, speeds, colors, bosses
- `js/scenes/` — Phaser scenes: Boot, Title, Cutscene, Game, Boss, UI, GameOver, Victory
- `js/main.js` — Phaser.Game config
- `scripts/` — Python sprite generation pipeline (not needed at runtime)
- `assets/sprites/` — AI-generated PNG sprites

## Running

```bash
npx serve .
```

## AI Sprite Generation Pipeline

Uses Google Gemini Imagen 4.0 via `scripts/.venv/`. API key stored in `.env` (gitignored).

### Chroma Key Rules

1. **Choose the right background color for each sprite:**
   - Use **green (#00FF00)** background for sprites with NO green content (e.g. the knight)
   - Use **magenta (#FF00FF)** background for sprites WITH green content (e.g. goblin, dragon, tower with ivy)

2. **Tell the AI to avoid the chroma key color in the sprite itself:**
   - For magenta backgrounds, add to prompt: `"IMPORTANT: Do not use any pink, magenta, or purple colors anywhere in the image."`
   - For green backgrounds, add to prompt: `"IMPORTANT: Do not use any bright green or lime colors anywhere in the image."`
   - Suggest an alternative color if the natural choice conflicts (e.g. "royal blue dress" instead of "purple dress")

3. **Background removal uses two phases:**
   - Phase 1: Flood-fill from image edges (generous tolerance=60) — removes connected background
   - Phase 2: Strict per-pixel pass (tolerance=25) — catches trapped pockets between wings/spikes
   - This combo preserves interior colors while cleaning trapped background between complex shapes

4. **Standard prompt suffix template:**
   - `"Single character only, no text, no labels, no ground."`
   - Then append the chroma key instruction

### Running sprite generation

```bash
source scripts/.venv/bin/activate
python3 scripts/test_gemini.py
```

## Secrets

- `.env` contains `GEMINI_API_KEY` — NEVER commit this file
- `.gitignore` already excludes `.env`
