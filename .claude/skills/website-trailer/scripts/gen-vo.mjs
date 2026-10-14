// Single-take voiceover for a trailer: ONE Fish Drama 3 request for the whole script, then cut into per-scene pieces.
//
// Usage (from the video project dir):
//   node --env-file=<repo>/.env <skill>/scripts/gen-vo.mjs script.json [--gap 0.35] [--reuse]
//
// script.json: { "voice": "<fish reference_id>", "lead": 0.3, "gap": 0.35, "lines": ["[direction] text", ...] }
//   lead  seconds of silence before the first piece (default 0.3)
//   gap   extra silence inserted between pieces when they are placed (default 0.35; --gap overrides)
//         Raise it when lines feel crowded / overlap (0.5-0.8), 0 keeps the take's own pacing. It depends on the video.
//   --reuse  skip the TTS request and the transcription: re-cut assets/vo/full.mp3 with a new gap/lead (free, instant)
//
// Why one request: the model keeps a consistent voice, tone and breathing across the whole take; separate per-line
// requests drift. Never call the TTS once per line.
//
// Writes: assets/vo/full.mp3, assets/vo/full-transcript.json, assets/vo/lineN.mp3 (the pieces),
//         assets/vo/timing.json (per line: placed start/duration, sceneStart, and every word with PLACED times).
// Build the composition from timing.json: <audio id="voN"> data-start = lines[N-1].start, data-duration = .duration;
// scene N data-start = lines[N-1].sceneStart; reveal an element at the placed start of the word being spoken.
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "script.json";
const flag = (n) => { const i = args.indexOf("--" + n); return i < 0 ? null : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true; };
const cfg = JSON.parse(await readFile(file, "utf8"));
const LEAD = Number(cfg.lead ?? 0.3);
const GAP = Number(flag("gap") !== null && flag("gap") !== true ? flag("gap") : cfg.gap ?? 0.35);
const reuse = flag("reuse") !== null;
const r = (n) => +n.toFixed(3);
await mkdir("assets/vo", { recursive: true });

// ---- 1. one request for the whole script
if (!reuse) {
  if (!process.env.FISH_API_KEY) throw new Error("FISH_API_KEY missing - run with node --env-file=<repo>/.env");
  const text = cfg.lines.join("\n\n");
  await writeFile("assets/vo/full-text.txt", text);
  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_API_KEY}`,
      "Content-Type": "application/json",
      model: "drama-3", // a missing/misspelled header silently falls back to s2.1-pro
    },
    body: JSON.stringify({ text, reference_id: cfg.voice, format: "mp3" }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status} ${await res.text()}`);
  await writeFile("assets/vo/full.mp3", Buffer.from(await res.arrayBuffer()));
}
if (!existsSync("assets/vo/full.mp3")) throw new Error("assets/vo/full.mp3 missing - run without --reuse first");
const CLIP = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "assets/vo/full.mp3"]).toString());

// ---- 2. word timestamps of the take
if (!reuse) {
  const t = spawnSync("npx", ["hyperframes", "transcribe", "assets/vo/full.mp3"], { encoding: "utf8", shell: true });
  if (!existsSync("assets/vo/transcript.json")) throw new Error("transcribe failed:\n" + t.stdout + t.stderr);
  await copyFile("assets/vo/transcript.json", "assets/vo/full-transcript.json");
}
const raw = JSON.parse(await readFile("assets/vo/full-transcript.json", "utf8"));
const words = raw.words || raw;

// ---- 3. where each line starts (match the first words of each script line, in order)
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const spoken = (l) => l.replace(/\[[^\]]*\]/g, " ").replace(/<[^>]*>/g, " ").split(/\s+/).map(norm).filter(Boolean);
const exp = cfg.lines.map(spoken);
const starts = [0];
for (let n = 1; n < exp.length; n++) {
  const from = starts[n - 1] + 1, [a, b] = exp[n];
  let at = -1;
  for (let i = from; i < words.length && at < 0; i++) if (norm(words[i].text) === a && (!b || norm(words[i + 1]?.text ?? "").startsWith(b.slice(0, 3)))) at = i;
  for (let i = from; i < words.length && at < 0; i++) if (norm(words[i].text) === a) at = i;
  for (let i = from; i < words.length && at < 0; i++) if (norm(words[i].text).startsWith(a.slice(0, 3))) at = i;
  if (at < 0) throw new Error(`could not find the start of line ${n + 1} ("${exp[n].slice(0, 3).join(" ")}") in the transcript; check assets/vo/full-transcript.json`);
  starts.push(at);
}

// ---- 4. silences -> cut points (middle of the quiet gap at each boundary)
const sd = spawnSync("ffmpeg", ["-hide_banner", "-i", "assets/vo/full.mp3", "-af", "silencedetect=n=-32dB:d=0.05", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const sil = []; let cur = null;
for (const m of sd.matchAll(/silence_(start|end): ([0-9.]+)/g)) {
  if (m[1] === "start") cur = { s: +m[2] }; else if (cur) { cur.e = +m[2]; sil.push(cur); cur = null; }
}
// word starts reported by the transcriber can lead the real speech: snap to the end of a silence that finishes just after it
const onset = (t) => {
  const c = sil.filter((x) => x.e >= t - 0.05 && x.e <= t + 0.45 && x.s <= t + 0.05).map((x) => x.e);
  return c.length ? Math.min(...c) : t;
};
const cuts = [0];
for (let n = 1; n < exp.length; n++) {
  const b = words[starts[n]].start;
  const near = sil.filter((x) => x.s <= b + 0.12 && x.e >= b - 0.12).sort((p, q) => (q.e - q.s) - (p.e - p.s));
  cuts.push(near[0] ? (near[0].s + near[0].e) / 2 : b - 0.03);
}
cuts.push(CLIP);

// ---- 5. cut (atrim; `-ss/-to` after `-i` produced silent pieces on mp3) and place with the gap
const out = { clip: r(CLIP), lead: LEAD, gap: GAP, lines: [] };
for (let n = 0; n < exp.length; n++) {
  const a = cuts[n], b = cuts[n + 1], d = b - a;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", "assets/vo/full.mp3", "-af",
    `atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, d - 0.02).toFixed(3)}:d=0.02`,
    "-c:a", "libmp3lame", "-q:a", "2", `assets/vo/line${n + 1}.mp3`]);
  const shift = LEAD + n * GAP; // placed time = take time + shift
  const lw = words.slice(starts[n], starts[n + 1] ?? words.length);
  const firstOnset = r(onset(lw[0].start) + shift);
  const start = r(a + shift);
  out.lines.push({
    n: n + 1, file: `assets/vo/line${n + 1}.mp3`, start, duration: r(d),
    speechStart: firstOnset,
    sceneStart: n === 0 ? 0 : r(Math.max(start, firstOnset - 0.35)),
    words: lw.map((w) => ({ text: w.text, start: r(onset(w.start) + shift), end: r(w.end + shift) })),
  });
}
out.end = r(CLIP + LEAD + (exp.length - 1) * GAP);
out.suggestedDuration = r(out.end + 0.9);
await writeFile("assets/vo/timing.json", JSON.stringify(out, null, 2));

console.log(`single take ${CLIP.toFixed(2)}s, ${exp.length} pieces, lead ${LEAD}s, gap ${GAP}s`);
for (const l of out.lines) console.log(`line ${l.n}: audio start ${l.start.toFixed(2)}s  dur ${l.duration.toFixed(2)}s  scene start ${l.sceneStart.toFixed(2)}s  first word ${l.speechStart.toFixed(2)}s`);
console.log(`voice ends ${out.end}s -> root data-duration about ${out.suggestedDuration}s. Word times for reveals: assets/vo/timing.json`);
