# .agents/

Agent skills that are **not** Claude-Code-specific, kept separate from `.claude/skills/` (the video-production skills).

## `skills/` - marketing skills

Ten skills from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT, commit `1efedbc`), copied without their `evals/` folders. The upstream license is in `skills/LICENSE-marketingskills.txt`.

| Skill | Use it in this repo for |
|---|---|
| `product-marketing` | Run first. Writes the positioning/audience context the others read. |
| `copywriting` | Hook, problem and CTA lines of your trailer script. |
| `copy-editing` | Tighten the script before you generate the voice. |
| `offers` | Frame price, bonuses and deadlines in the CTA honestly. |
| `marketing-psychology` | Pick which principles (social proof, scarcity) fit, and which to skip. |
| `community-marketing` | Build the audience around the product once the trailer lands. |
| `launch` | Plan where and when the trailer goes out. |
| `social` | Cut the trailer into posts, captions and short clips. |
| `video` | Video-production tactics beyond this repo's pipeline. |
| `lead-magnets` | Turn the trailer into a free-preview or email-capture funnel. |

Update with `npx skills add coreyhaines31/marketingskills --skill <name> -a universal`, or re-copy from upstream. Review any skill before you trust it: skills run with your agent's permissions.
