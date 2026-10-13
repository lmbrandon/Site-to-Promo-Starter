# Site to Trailer Starter

*A starter project for HyperFrames, Fish Audio and your AI agent. Learn the workflow, then make it yours.*

**Turn any website into a cinematic, narrated trailer in an afternoon, with an AI agent doing the heavy lifting.**

Point your agent at a site. It scans the pages, writes the script, records a directed AI voiceover, mixes your music, and builds a polished 1-minute video from real screenshots of your own site. No timeline editing. No stock footage. No motion-design skills required.

Works for SaaS products, landing pages, online courses, communities, agencies, portfolios, stores, docs: if it has a URL, it can have a trailer.

> **Educational use only.** This repo teaches a workflow. It is not a product, a service, or professional advice. You are fully responsible for what you capture, publish and promote. See the [Disclaimer](#disclaimer) before you start.

[MIT licensed](LICENSE) · Works with [Claude Code](https://claude.com/claude-code) · Video by [HyperFrames](https://hyperframes.heygen.com) · Voice by [Fish Audio](https://fish.audio/?fpr=awzeir) *(affiliate link, I may earn a small commission at no cost to you)*

---

## What you end up with

A ~45-60 second, 16:9 trailer (9:16 works too) built from your site's own pages:

| Scene | What viewers see | Where it comes from |
|---|---|---|
| Hook | One big question that stops the scroll | Your core promise |
| Problem | The pain your audience feels | Your homepage / about copy |
| Intro | Logo, headline number, real page screenshot | Your scan |
| How it works | Step-by-step cards, timed to the narration | Your homepage / docs |
| Features (x2) | Real product, course or feature images sliding in | Your product pages |
| Proof / support | Testimonials, extras, guarantees | Your pricing / social-proof pages |
| CTA | Price, deadline, link | Your pricing page |

Everything is code (HTML + GSAP), so updating a price or a headline number later is a one-line change and a re-render.

---

## How it works

```
 point at site ──▶ scan ──▶ script ──▶ voiceover ──▶ music ──▶ build ──▶ preview ──▶ render
     (Step 1)     (Step 1)  (Step 3)    (Step 4)    (Step 5)  (Step 6)   (Step 7)    (Step 7)
```

The agent does the work. You make the decisions: what to say, how it should sound, and when to hit render.

---

## Step 0: Get set up (about 10 minutes, once)

You need:

| Tool | Why | Check it |
|---|---|---|
| [Node.js 22+](https://nodejs.org) | Runs HyperFrames and the voice script | `node -v` |
| [FFmpeg](https://ffmpeg.org/download.html) | Audio leveling and image tools | `ffmpeg -version` |
| [Claude Code](https://claude.com/claude-code) | The agent that drives the workflow | `claude --version` |
| [Playwright CLI](https://playwright.dev) | Opens a real browser to scan the site | `playwright-cli --version` (install in the commands below) |
| A [Fish Audio](https://fish.audio/?fpr=awzeir) API key (affiliate link; keys are under *API Keys* in your account) | The Drama 3 voice model | see below |

Then:

```bash
npm i -g @playwright/cli@latest     # the browser tool (skip if `playwright-cli --version` works)
git clone <this-repo-url> site-to-trailer-starter
cd site-to-trailer-starter

# 1. Add your Fish Audio key (this file is git-ignored)
cp .env.example .env
#    open .env and paste your key after FISH_API_KEY=

# 2. Install the HyperFrames skills the agent uses (one command; it also pulls the helper skills)
#    They are not bundled in this repo, so you always get the latest. Docs: https://hyperframes.heygen.com
npx hyperframes skills update product-launch-video

# 3. Install the Playwright browser skill into this folder (not bundled here either)
playwright-cli install --skills

# 4. Start your agent in this folder
claude
```

What's already in the box:

```
.claude/skills/website-trailer/  the end-to-end workflow (scripts + template)
(the HyperFrames and Playwright skills are installed by steps 2 and 3 above, not stored here)
.agents/skills/                  10 marketing skills, kept separate (see .agents/README.md)
docs/drama-3-guide.md            how to direct the Drama 3 voice
capture/  audio/  music/  videos/   your working folders (empty, git-ignored)
```

---

## Step 1: Scan your website

Tell your agent:

> Use the website-trailer skill. Make a trailer for https://**your-site.com**

- **Public site:** the agent scans it directly and saves 1920x1080 screenshots, your logo, hero art, product images and key copy into `capture/`.
- **Pages behind a login** (dashboard, members area, course platform): a real browser opens and **you** log in. Your password never touches the agent. Say "I'm in" and it continues.

**Rules of thumb:** only scan sites you own or have written permission to feature. Never bypass logins, paywalls or CAPTCHAs.

## Step 2: Lock the brief and the look

The agent writes a short `BRIEF.md` (message, audience, length, format) and builds a brand file from your site's colors and type. Check two things:

- The **one message** the video must communicate.
- The **look** (colors, fonts) feels like your brand.

## Step 3: Write the script (use the marketing skills)

Eight short lines, one per scene: **Hook → Problem → Intro → How it works → Features → Features → Proof → CTA.**

This is where the skills in `.agents/skills/` earn their keep. Try:

> Use the product-marketing skill to capture my positioning, then copywriting to draft the 8-line trailer script, then copy-editing to cut every word that isn't pulling weight.

Rules that make trailers work:
- Open with a question your audience is already asking.
- Use only facts from your real pages (numbers, price, features).
- One idea per line. If a line needs two breaths, split it.
- Put the deadline and the link in the last line, and mean it.

## Step 4: Record the voiceover (Fish Audio Drama 3)

Drama 3 is a *directable* voice: you describe the performance in `[brackets]`.

```json
"[warm and rising, welcoming] Meet Acme. <emphasis>One clear promise.</emphasis>"
```

The agent records the **whole script as one clip** (one request keeps the voice and tone consistent), then cuts it into one piece per scene and places each at its scene. Run this from your video project folder (`videos/<site>-trailer/`), with the key path adjusted (`--env-file=../../.env`):

```bash
node --env-file=.env .claude/skills/website-trailer/scripts/gen-vo.mjs script.json                  # one request, cut, place
node --env-file=.env .claude/skills/website-trailer/scripts/gen-vo.mjs script.json --reuse --gap 0.6  # same take, more space between lines
```

Lines feel crowded? Raise the gap between lines (`--gap`); it depends on the video. Don't like the take? Change the direction in brackets and regenerate the whole take. See [`docs/drama-3-guide.md`](docs/drama-3-guide.md) for every direction trick.

## Step 5: Add your music (and level it)

Drop a track you have the rights to use into `music/`. Then let the agent level it:

```bash
bash .claude/skills/website-trailer/scripts/level-music.sh music/your-track.mp3 music-leveled.mp3 60
```

> **Why level instead of just turning it down?** Most tracks swing several decibels, so a low fixed volume still "pumps" under speech. Leveling makes a steady bed about 10 dB under the voice.

## Step 6: Build the video

The agent starts from the proven template, fills it with your copy, screenshots and timings, then runs the checks:

```bash
npx hyperframes lint && npx hyperframes check
npx hyperframes snapshot --at 2,6,12,20,30,40,50   # contact sheet to eyeball every scene
```

## Step 7: Preview, tweak, render

```bash
npx hyperframes preview --background    # opens Studio in your browser
```

Click any text to edit it, drag clips on the timeline, listen to the mix. When you love it:

```bash
npx hyperframes render --quality high --output renders/video.mp4
```

## Step 8: Ship it

Use the rest of the marketing skills to get it seen:

> Use `launch` to plan where and when to post, `social` to cut a 15-second teaser and write captions, and `offers` to sanity-check how I'm presenting the price.

**Updating later?** Re-run Step 1, change only what moved (headline number, price, new features), regenerate just the affected voice lines, and re-render.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Voice sounds generic, directions ignored | The `model: drama-3-preview` header is missing or misspelled. The API silently falls back to another model. |
| `401` from Fish Audio | `FISH_API_KEY` is empty in `.env`, or you didn't pass `--env-file`. |
| Music still "goes up and down" | Level the track (Step 5), then check the music element in `index.html` for stray volume-automation points. Studio can add them if you drag the envelope. |
| Headline hides behind a card | Reduce its font size or move the card. Always read the snapshot contact sheet. |
| Preview won't stop / folder is "busy" | `npx hyperframes preview "<project-dir>" --stop` before moving or deleting the project. |
| Scan returns only public info | The pages need a login. Open the browser session (`--headed --persistent`) and log in first. |
| `hyperframes capture` is blocked | Some sites block automated capture. Use the Playwright scan from Step 1 instead (only where you have permission). |

---

## Disclaimer

**This repository is provided for educational and informational purposes only.** It demonstrates a creative workflow so you can learn the concepts and build your own.

- **No warranty.** The software, scripts, templates and documentation are provided "as is" under the [MIT License](LICENSE), without warranties of any kind. The authors and contributors are not liable for any claim, damages or other liability arising from their use.
- **You are responsible for your actions.** You alone are responsible for what you scan, record, generate, publish and promote, and for the results.
- **Respect website rules.** Every website and platform has its own Terms of Service and robots rules. Review them. Only access sites you own or have explicit permission to use, use your own account, and never bypass access controls or collect data you are not entitled to.
- **Protect other people's data.** Do not publish customers', users' or members' names, faces, messages or other personal information without consent. Follow privacy laws that apply to you (for example GDPR and CCPA).
- **Own your assets.** Use only images, logos, music and voices you own or are licensed to use. Check the license terms of any AI voice model, including Fish Audio's, before commercial use.
- **Marketing claims.** Make only truthful claims about your offer, pricing, results and deadlines. Follow advertising and endorsement rules (for example FTC guidance) in your jurisdiction. Nothing here guarantees income, growth or any outcome.
- **Third-party tools.** HyperFrames, Playwright, Fish Audio, FFmpeg, Claude Code and the marketing skills are owned by their respective creators. The Fish Audio links here are affiliate links. Otherwise, this project is not affiliated with or endorsed by any company named here.
- **Not professional advice.** Nothing here is legal, financial, tax or marketing advice. Consult a qualified professional for your situation.
- **AI output needs a human.** AI agents make mistakes. Review every script, claim, image and render before you publish.

By using this repository you accept these terms.

---

## Credits and licenses

- This repo: [MIT](LICENSE).
- Marketing skills in `.agents/skills/`: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), MIT, included with attribution (`.agents/skills/LICENSE-marketingskills.txt`).
- Video engine: [HyperFrames](https://hyperframes.heygen.com). Voice: [Fish Audio](https://fish.audio/?fpr=awzeir) (affiliate link). Browser automation: [Playwright](https://playwright.dev).

**Found this useful?** Star the repo, share your trailer, and open an issue with what you'd like the workflow to teach next. If you'd like to support the project, you can [buy me a coffee](https://buymeacoffee.com/brandonmelville). Totally optional, and always appreciated.
