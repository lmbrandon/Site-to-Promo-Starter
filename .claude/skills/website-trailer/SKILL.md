---
name: website-trailer
description: Build a narrated trailer/promo video for any website, web app, product page, course, community or portfolio, end to end. Scans the site with playwright-cli (public pages, or logged-in pages after the user logs in), writes a script, generates the voiceover with Fish Audio Drama 3, writes a ready-to-paste Suno music prompt from the site and levels the resulting track, and builds + checks + renders a HyperFrames composition. Use for a new trailer, or to refresh an existing one when the site changes (new features, price, stats).
---

# Website trailer

Proven workflow (about 56s, 16:9, 8 scenes, real screenshots from the site). HyperFrames owns the composition rules: read `/hyperframes` first (it routes this to `/product-launch-video`), then `/hyperframes-core` before touching HTML. This skill adds the parts specific to scanning a site, Fish Audio voice, and user-supplied music.

`<skill>` below means `.claude/skills/website-trailer`; `<repo>` is the repo root.

## Inputs to confirm (ask only what is missing)

- Site URL, and whether the pages to feature need a login.
- Permission: the user owns the site or has written permission to feature it.
- Music file (the user keeps these in `music/`), and that they are licensed to use it. If they have none, you write them a Suno prompt from the site (step 4); do not ask them to invent one.
- Voice: default Adrian `bf322df2096a46f18c579d0baa36f41d`; others in `docs/drama-3-guide.md`.
- Length (default ~45-60s) and format (default 1920x1080; 9:16 for Shorts/Reels/TikTok).
- Run shape. If the user wants it hands-off, use `flow: automation`, `storyboard: no`; rendering is still gated on their approval.
- `FISH_API_KEY` in `<repo>/.env` (template: `.env.example`). Fish Audio's official link, which is an affiliate link, is https://fish.audio/?fpr=awzeir; use it whenever you point a user to Fish Audio (API endpoints stay on api.fish.audio).

## 1. Scan the site

**Public site (no login needed):** try HyperFrames' own capture first.

```bash
npx hyperframes capture "https://example.com" -o ./capture --json
```

If it exits non-zero, reports `ok: false`, or writes `capture/BLOCKED.md`, stop using it and fall back to playwright-cli below. Never fabricate pages from an unusable capture.

**Login-gated pages (dashboards, member areas, communities):** the user logs in themselves; never ask for credentials.

```bash
playwright-cli -s=site open https://example.com --headed --persistent
```

Tell the user to log in and wait until they say so. Never bypass access controls, CAPTCHAs or paywalls.

**Then, with `-s=site` (works for both):**

- **Text:** `goto <url>`, then `--raw eval "document.body.innerText.slice(0,3500)"` on the home, about/pricing, features/product, docs/courses, and testimonials pages. A large page is easier via `snapshot`.
- **Screenshots:** `resize 1920 1080`, then `screenshot --filename=capture/<page>.png` for 3-4 key pages. Use `--hires` only for a page you will zoom into.
- **Images:** `--raw eval "JSON.stringify([...document.querySelectorAll('img')].map(i=>i.src))"`; download with node `fetch` (python may be missing). Logos and hero art are often CSS `background-image`: `eval "[...document.querySelectorAll('*')].map(e=>getComputedStyle(e).backgroundImage).filter(b=>b.includes('url'))"`.
- **Identify files:** build a contact sheet (`ffmpeg -i img%d.jpg -vf "scale=480:-1,tile=5x2" sheet.png`) and look at it. Skip user avatars and any image of a private person.
- **Facts to capture:** the one-line value proposition, headline number (users, members, customers, rating), price and any scheduled change, 3-6 features/programs/products with one-line descriptions, proof (testimonials, logos, awards), the CTA and URL.
- Shell cwd resets between Bash calls on some machines: use absolute paths or `cd` in each command. Finish with `playwright-cli -s=site close`.

Write `capture/extracted/{tokens.json,visible-text.txt,asset-descriptions.md}` by hand from the scan when you used playwright-cli (the workflow's no-capture path). `tokens.json` = `{ "title": "", "description": "", "colors": [], "fonts": [] }`. Pull colors from the logo and the page's CSS (`getComputedStyle` on the header/CTA button).

## 2. Project setup

```bash
npx hyperframes init videos/<slug>-trailer --non-interactive --example=blank --skill=product-launch-video
```

Then write `BRIEF.md` (shape: `/hyperframes` `references/brief-format.md`), copy assets into `capture/` and `assets/`, put the music at the project root, and copy `<skill>/templates/fonts/` to `assets/fonts/` (Playfair Display 700/700i/900, Inter 500/700; a named `font-family` needs an in-file `@font-face` or lint fails). Swap fonts and the template's CSS variables (`--navy --navy2 --navy3 --gold --cream`) for the site's brand.

Design: `node <product-launch-video skill>/scripts/build-frame.mjs --preset <name> --hyperframes .` remaps a preset onto `capture/extracted/tokens.json`. The remap can produce a muddy color for a key (a dark preset color mapped to an accent), so check `frame.md` `colors:` afterward and hand-fix any key that came out wrong.

## 3. Script and voiceover (Fish Audio Drama 3)

Eight lines is the proven shape, one per scene: Hook (a question) -> Problem -> Intro (+ headline number) -> How it works -> Feature set 1 -> Feature set 2 -> Proof/support -> CTA (price + deadline + link). Use only facts from the scan. Write `SCRIPT.md` (format: `/hyperframes` `references/script-format.md`), then a `script.json` modeled on `<skill>/scripts/example-script.json`. Put directions in `[brackets]` at the start of each line and `<emphasis>…</emphasis>` around the one phrase that matters. The `.agents/skills` marketing skills (`product-marketing`, `copywriting`, `copy-editing`) are the right tools for drafting and tightening this.

**Always render the whole voiceover as ONE clip, then cut it. Never make one TTS request per line.** One request keeps the voice, tone and breathing consistent across the take; separate per-line requests drift and sound like different readings. This is a standing habit for every trailer, in any language.

```bash
node --env-file=<repo>/.env <skill>/scripts/gen-vo.mjs script.json                # one request, transcribe, cut, place
node --env-file=<repo>/.env <skill>/scripts/gen-vo.mjs script.json --reuse --gap 0.6   # re-cut the same take with a new gap (free, no new request)
```

What it does: sends the whole script (lines joined by blank lines, each with its own `[direction]`) in one request to `assets/vo/full.mp3`; transcribes it for word timestamps; finds where each line starts; cuts at the quietest point between lines (`atrim` with 20 ms edge fades; `-ss/-to` after `-i` gave silent pieces on mp3); writes `assets/vo/lineN.mp3` and `assets/vo/timing.json`. Build the composition from `timing.json`:
- `<audio id="voN">` `data-start` = `lines[N-1].start`, `data-duration` = `.duration`. The pieces tile the take, so they play back continuous.
- scene N `data-start` = `lines[N-1].sceneStart` (a hair before the first word); the scene runs until the next one starts.
- reveal each element at the placed `start` of the word being narrated (`lines[N-1].words`, times already include lead and gap). Match words by text; brand names are often mis-transcribed, so anchor on a neighbouring word or the word index.
- root `data-duration` = `suggestedDuration`.

**Gap between lines depends on the video.** `gap` (script.json, or `--gap`) is extra silence inserted between the pieces when placing them. The single take can run lines close together (a line starting as the last one ends feels like overlap). Default 0.35s; use 0.5-0.8 for slow, intimate or whispered reads or when lines feel crowded; 0 for punchy energetic trailers. After building, listen/snapshot and tune with `--reuse --gap N`, then update the timeline to the new `timing.json`. To change wording or direction, edit `script.json` and regenerate the whole take (do not patch single lines).

Verify the cut: transcribe each `lineN.mp3` and confirm it starts and ends on whole words; a piece that is silent or clipped means a bad cut point. Non-English: write the lines in the target language (direction brackets can stay English); an English voice may accent them and mangle brand names (e.g. "Vuitton"), so listen to the result and use a phonetic respelling if needed. The `model: drama-3` header is required: without it Fish silently falls back to another model. Do not use the workflow's `audio.mjs`; it only knows HeyGen and Kokoro.

## 4. Music: write the Suno prompt from the site, then level the track

**If the user has no track yet, give them a ready-to-paste Suno prompt built from this site.** Do it once the script and voiceover are final (you then know the length and the emotional arc). Fill `<skill>/templates/suno-prompt.template.md`: genre, instruments, tempo and mood come from what the site sells, who it is for, the brand's feel (colors, type, copy tone), the script's arc and the voice direction. Match the voiceover length from `assets/vo/timing.json`. Always instrumental, calm dynamics, room for the narrator. Save it as `MUSIC_PROMPT.md` in the project and print the three blocks (Style prompt, Lyrics/structure box, Exclude styles) in chat so the user can copy them into Suno. Never reuse a generic prompt; if it could describe any site, rewrite it. Then ask the user to drop the generated file into `music/`, give you the filename, and confirm they are licensed to use it (Suno's plan tier decides commercial rights). If they already have a track, skip the prompt.

Then level it, never just turn it down. Raw tracks swing several LU, so a fixed low volume still "goes up and down" under speech.

```bash
bash <skill>/scripts/level-music.sh music.mp3 music-leveled.mp3 60
```

The result is about -30 LUFS with about 1 LU of range; the voice sits around -21 LUFS. In the composition use `data-volume="0.7"` and a **flat** envelope in `data-automation`: `[{t:0,v:0},{t:1.2,v:1},{t:<end-3>,v:1},{t:<end>,v:0}]`. Do not also add `data-fade-out`.

## 5. Build the composition

Start from `<skill>/templates/index.template.html` (monolithic: 8 scenes as `.clip` divs, one GSAP timeline, fonts via `@font-face`, `<audio>` for each VO line plus the music). It expects: `assets/logo.jpg`, `assets/cover.jpg` (hero/cover art), `assets/img/page-1.png` and `page-3.png` (page screenshots), and `assets/img/img1..img5.jpg` (feature/product images). Replace the `[placeholders]`, image paths, timings and CTA; rename or add scenes to fit the story. Each scene: eyebrow + headline rise, real screenshots as `.card`s with a slow Ken Burns scale, reveals timed to when the narrator says each thing, an opacity fade-out at the scene end, and a final fade.

Rules learned the hard way:
- Root `data-duration` = last scene end + about 1s. Every cut piece of the single-take voiceover is its own `<audio id="voN">` with `data-start`/`data-duration` from `assets/vo/timing.json` (written by `gen-vo.mjs`). Retime scenes and reveals whenever the gap or the take changes.
- A headline beside a card can run under it (82px fit where 104px overflowed). Screenshot cards use `object-position: top left`.
- Never show private people's names, faces, emails or messages.
- Lint warnings `nested_structure_needs_subcomposition` and `timeline_track_too_dense` are expected for the monolithic form; only errors matter. Info `container_overflow` on Ken Burns images is intentional.

## 6. Verify, review, render

```bash
npx hyperframes lint && npx hyperframes check
npx hyperframes snapshot --at <scene midpoints, plus a frame after each reveal>
```

Read `snapshots/contact-sheet-*.jpg` for clipped text, overlaps and empty halves. Then `npx hyperframes preview --background` and ask: render now, or what changes? Render only after approval:

`npx hyperframes render --quality high --output renders/video.mp4`

Report the path and the actual duration, then stop the preview (`npx hyperframes preview "<dir>" --stop`) before moving or deleting the project folder.

**Re-read the file after the user has used Studio.** Studio rewrites `index.html` (adds `data-hf-id`, `data-fade-out`, extra `data-automation` points). When the user reports audio or timing oddities, inspect the `<audio>` elements first: a stray automation point once caused a "music goes up and down" report, on top of the track's own dynamics.

## Updating an existing trailer when the site changes

Re-scan (step 1), diff against the last `capture/extracted/visible-text.txt`, and change only what moved: the headline number (scene 3 counter target), price or deadline (scene 8 and line 8), new or renamed features (scenes 5-6 cards and captions). Edit the affected lines in `script.json` and regenerate the whole single take (`gen-vo.mjs script.json`; never patch one line, it would not match the rest), then update scene starts and reveals from the new `timing.json`, re-check and re-snapshot.
