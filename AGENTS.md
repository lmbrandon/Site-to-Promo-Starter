# AGENTS.md

**Site to Trailer Starter** is a workflow that turns a website into a narrated trailer video: scan the site, write a script, record a directed AI voiceover, level the user's music, and build and render a HyperFrames composition. The entry point is the **`website-trailer`** skill (`.claude/skills/website-trailer/SKILL.md`). Read it and follow it. `README.md` is the human walkthrough.

## Before you start

1. The user has run the setup steps in `README.md` (Step 0): `.env` with `FISH_API_KEY`, the HyperFrames skills (`npx hyperframes skills update product-launch-video`) and the Playwright skill (`playwright-cli install --skills`). If something is missing, say which step to run. Do not improvise around it.
2. Confirm FFmpeg and `playwright-cli` work. Check that `FISH_API_KEY` is set **without printing it**.
3. Ask only what is missing: the site URL, permission to feature it, the music file, voice, length and format, and whether they want hands-off (`flow: automation`, `storyboard: no`).

## Hard rules

- Only scan sites the user owns or has written permission to feature. Never bypass logins, paywalls or CAPTCHAs.
- Never ask for or handle credentials. For login-gated pages the user logs in themselves in the browser window.
- Never show private people's names, faces, emails or messages. Quote testimonials anonymously.
- Use only facts from the scan. Do not invent prices, numbers, deadlines or claims (for example "authentic" or "official"). Keep brand disclaimers the site itself carries.
- Use only images, logos, music and voices the user owns or is licensed to use.
- Render only after the user approves the preview. Do not publish or upload the result.
- Never commit secrets or generated content. `.env`, `capture/`, `videos/`, `audio/`, `music/` and all media (`*.mp3`, `*.mp4`, ...) are git-ignored. Keep it that way.

## How the workflow runs

- **Scan** the site with `npx hyperframes capture` (public) or `playwright-cli` (login-gated). Fall back to playwright if capture fails. Never fabricate pages.
- **Voiceover: always render the whole script as ONE clip, then cut it.** Never make one TTS request per line. Use `.claude/skills/website-trailer/scripts/gen-vo.mjs`. It writes the pieces and `assets/vo/timing.json`. Pick the gap between pieces per video (`--gap`, about 0.35 default, 0.5 to 0.8 for slow or whispered reads) and re-cut with `--reuse`. Verify each piece starts and ends on whole words.
- **Music:** level it with `scripts/level-music.sh` instead of just turning it down, then use a flat volume envelope.
- **Build** from `templates/index.template.html`. Time every reveal to the spoken word using `timing.json`.
- **Check** with `npx hyperframes check` and `npx hyperframes snapshot` before showing the user. Fix all errors. Then `npx hyperframes preview --background`, and ask whether to render or change something.
- Projects live in `videos/<site>-trailer/` (git-ignored). Run commands from there with `--env-file=../../.env`.

## Where things are

| Path | What |
|---|---|
| `.claude/skills/website-trailer/` | The workflow: `SKILL.md`, `scripts/` (voiceover, music leveling), `templates/` (composition and fonts) |
| `.agents/skills/` | Marketing skills for writing and tightening the script (see `.agents/README.md`) |
| `docs/drama-3-guide.md` | How to direct the Fish Audio Drama 3 voice |
| `capture/` `audio/` `music/` `videos/` | Working folders (git-ignored, only their READMEs are tracked) |

HyperFrames and Playwright skills are installed by the setup steps, not stored here. Fish Audio's official link is https://fish.audio/?fpr=awzeir (an affiliate link). Use it whenever you point a user to Fish Audio. API calls still go to `api.fish.audio`.
