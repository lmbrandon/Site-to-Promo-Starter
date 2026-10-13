# Using Fish Audio Drama 3 (`drama-3-preview`)

Drama 3 is Fish Audio's directable text-to-speech model. You write the script,
then describe *how* each line should be performed. It is in **preview**, so
behavior may change.

## Setup

1. Get a Fish Audio account and API key at https://fish.audio/?fpr=awzeir (affiliate link), then paste the key into `.env` (already created in the repo root):
   ```
   FISH_API_KEY=your_key_here
   ```
2. `.env` is git-ignored. `.env.example` is the shareable template.

## Making a request

Use the normal `POST https://api.fish.audio/v1/tts` endpoint and set the
**`model` header** to `drama-3-preview`.

> If the `model` header is missing or misspelled, the request does **not** fail —
> it silently falls back to `s2.1-pro`. Double-check the header if the
> directions seem to be ignored.

### curl (bash)

```bash
set -a; source .env; set +a

curl --fail --show-error --request POST https://api.fish.audio/v1/tts \
  --header "Authorization: Bearer $FISH_API_KEY" \
  --header "Content-Type: application/json" \
  --header "model: drama-3-preview" \
  --data '{
    "text": "[barely holding it together, forcing a smile] I'\''m fine. Really. Go on without me.",
    "reference_id": "f3a2b90078d54a65af4b95f63bc7798e",
    "format": "mp3"
  }' \
  --output out.mp3
```

### Node (18+)

```js
// node --env-file=.env tts.mjs
import { writeFile } from "node:fs/promises";

const res = await fetch("https://api.fish.audio/v1/tts", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.FISH_API_KEY}`,
    "Content-Type": "application/json",
    model: "drama-3-preview",
  },
  body: JSON.stringify({
    text: "I'm fine. [shaky breath] Really. [small laugh] Go on without me.",
    reference_id: "f3a2b90078d54a65af4b95f63bc7798e",
    format: "mp3",
  }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
await writeFile("out.mp3", Buffer.from(await res.arrayBuffer()));
```

### PowerShell

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item "env:$($Matches[1].Trim())" $Matches[2].Trim() }
}
$body = @{
  text = "[calm, measured storyteller voice] The ship had been silent for three days."
  reference_id = "c70cfb98867a4bfb9ae20d2401257b92"
  format = "mp3"
} | ConvertTo-Json
Invoke-WebRequest https://api.fish.audio/v1/tts -Method Post -Body $body `
  -ContentType "application/json" -OutFile out.mp3 `
  -Headers @{ Authorization = "Bearer $env:FISH_API_KEY"; model = "drama-3-preview" }
```

## Voices used in the docs

| Name   | Language       | `reference_id`                     |
| ------ | -------------- | ---------------------------------- |
| Adrian | EN-US, male    | `bf322df2096a46f18c579d0baa36f41d` |
| Delia  | EN-US, female  | `c70cfb98867a4bfb9ae20d2401257b92` |
| Sheila | EN-US, female  | `f3a2b90078d54a65af4b95f63bc7798e` |

Pick a voice that fits the role — it matters a lot. Cloned voices work too.

## Directing the performance

All directions are plain text inside `text`, and can be mixed freely.

| Technique | Syntax | Example |
| --- | --- | --- |
| Free-form direction | `[description]` before the words | `[forcing a smile] I'm fine.` |
| Sounds / pauses | `[sound]` where it happens | `I'm fine. [shaky breath] Really. [small laugh]` |
| Non-English directions | brackets in any language | `[像是在强忍着眼泪] I'm fine.` |
| Word-level delivery | paired tags | `<whisper>Go on without me.</whisper>` |
| Language switch (experimental) | `<french>…</french>` etc. | `She said <french>Bonjour</french>.` |
| Pinned pronunciation | phoneme tags | `<|phoneme_start|>EH1 N JH AH0 N IH0 R<|phoneme_end|>` |

- **Paired tags:** `whisper`, `emphasis`, `soft`, `fast`, `slow`, `stress`, `forceful`.
- **Language tags (experimental):** `french`, `spanish`, `german`, `japanese`,
  `chinese`, `korean`, `italian` shown in the docs. Wrap only the words that
  change language; best with a voice cloned from a bilingual speaker. Accuracy
  varies, and the model may switch language on its own in already-multilingual text.
- **Phonemes:** English uses CMU Arpabet (digit on a vowel = stress, `1` primary,
  `0` unstressed); Chinese uses pinyin; Japanese uses romaji.

Tips: write directions like a brief to a voice actor (emotion, intent, pacing,
who they're talking to); keep them short; change one thing at a time when iterating.

## Multi-speaker dialogue

Generate a whole scene in one request. Pass an **array** of voice IDs in
`reference_id`; start each turn with `<|speaker:N|>` (0 = first voice, 1 = second, …).
Directions and paired tags work inside each turn.

```json
{
  "text": "<|speaker:0|>[calm, measured storyteller voice] The ship had been silent for three days.<|speaker:1|>[low, gravelly, tired but in control] Status report.<|speaker:2|>[fast, nervous, stumbling over words] Uh, sir, the reactor is, it is not great.<|speaker:1|>[slow, dangerously quiet] Define \"not great.\"<|speaker:2|>[voice breaking, close to panic] It is going to <emphasis>blow</emphasis>.",
  "reference_id": [
    "c70cfb98867a4bfb9ae20d2401257b92",
    "bf322df2096a46f18c579d0baa36f41d",
    "f3a2b90078d54a65af4b95f63bc7798e"
  ],
  "format": "mp3"
}
```

## Using it with HyperFrames

Generate the narration to a file, then drop it into a composition as an audio clip:

```bash
node --env-file=.env tts.mjs   # writes out.mp3
```

Move the result into your project's assets folder and reference it from your
composition (see the `hyperframes-core` / `media-use` skills for placing audio
and syncing captions via `hyperframes transcribe`).

## Troubleshooting

- **Directions ignored / sounds like the default model** → check the `model` header spelling.
- **401** → `FISH_API_KEY` empty or not loaded; confirm `.env` is filled and sourced.
- **Wrong language on a tagged phrase** → try a bilingual cloned voice and wrap fewer words.

Further reading: https://docs.fish.audio/llms.txt · API reference:
https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
