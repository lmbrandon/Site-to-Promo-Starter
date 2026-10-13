# Suno music prompt: <site name>

Write this after the script and voiceover are final, so the length and arc are known. Build every field from what you learned about THIS site (BRIEF.md, `capture/extracted/`, the script, the voice direction). Do not reuse the example below; it only shows the shape. Save the finished prompt as `MUSIC_PROMPT.md` in the project folder and also print it in chat so the user can copy each block.

## What to draw on

| Field | Take it from |
|---|---|
| Genre, instruments, mood | What the site sells and who it is for (a boutique reseller is not a dev tool). The brand's feel from its colors, fonts and copy tone. |
| Energy and tempo | The script's tone and the voice direction: whispered or intimate = sparse and slow (70-95 BPM); energetic or punchy = driving (100-125 BPM). |
| Arc | The script's scene order: hook, problem, intro, how it works, features, proof, call to action. |
| Length | The voiceover end from `assets/vo/timing.json` (`suggestedDuration`). Ask for that length plus a little, then trim and fade. |
| Space for the voice | Always instrumental, calm dynamics, nothing busy in the 1-4 kHz speech range. Fewer loudness swings also levels better. |

## Output (three blocks the user pastes into Suno)

**Style prompt** (one dense paragraph, keep under about 1000 characters; if Suno's field is shorter, keep the first 200):
```
<Instrumental, genre and feel for this site>. <Lead instruments and textures>. Tempo <N> BPM, <key/mood>. <Energy arc in one sentence>. Clean modern mix, leaves room for a narrator, no vocals, no big drops.
```

**Lyrics / structure box** (section tags only, no words; map them to the scenes):
```
[Instrumental]
[Intro: <how it opens under the hook>]
[Build: <enters as the problem/intro lands>]
[Lift: <features/how it works>]
[Swell: <proof / call to action>]
[Outro: <how it resolves>, soft fade out]
```

**Exclude styles**:
```
vocals, rap, aggressive drums, distorted guitar, dubstep, <anything that clashes with this brand>
```

**Length to request:** `<seconds>` (voiceover ends at `<seconds>`; trim and fade the rest).

## Shape example (a warm boutique shop with a whispered narrator; yours must differ)

Style prompt:
```
Instrumental, elegant boutique background music, soft and warm. Gentle felt piano and light harp arpeggios, airy strings, delicate celesta, soft brushed percussion. Tempo 92 BPM, major key, graceful and inviting. Slow build to a warm swell. Clean modern mix, leaves room for a narrator, no vocals, no heavy drums, no EDM drops.
```
Structure:
```
[Instrumental]
[Intro: soft solo piano, 4 bars]
[Build: harp and strings enter, light percussion]
[Swell: full warm strings, bright celesta]
[Outro: resolves gently, soft fade out]
```
Exclude: `vocals, rap, aggressive drums, distorted guitar, dubstep`

## After the user generates it

Ask for the file in `music/` and its filename, confirm they are licensed to use it, then level it (`level-music.sh`, step 4 of SKILL.md). The Suno plan tier decides commercial rights, so remind them to check theirs.
