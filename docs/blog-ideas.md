# Blog ideas

Signature features that make this blog distinct instead of a default Astro
starter. From a brainstorm with Codex on 2026-07-10, ranked by
distinctness-to-effort. Filed here so the ideas are not lost, not as a
commitment to build them.

## Done

- **AI-authorship receipt + telemetry footer** (ideas 1 and 2). Shipped as
  `src/components/TelemetryFooter.astro`, fed by
  `scripts/session-telemetry.mjs`. Each post shows the model, time to first
  publish, polish deploys, and the instruction / turn / tool-call counts pulled
  from the Claude Code session that authored it, scoped to the authoring window.
- **Light/dark toggle** in the header, persisted per reader.

## Backlog (not built)

3. **Daily ship quest log** (M). A pixel calendar where every day is a quest
   tile: shipped, skipped, revised, or boss fight. Clicking reveals the artifact
   and a short status note. Turns the daily shipping cadence into the site's
   main navigation.
4. **RPG post anatomy** (S). Recurring sections such as The Quest, The Boss
   Fight, What Claude Got Wrong, Loot, Next Save Point. Makes solo build stories
   read like lived gameplay instead of generic essays.
5. **Human/AI edit replay** (M). Expand a post's provenance: initial prompt,
   rough Claude output, the edits, deleted claims, final version.
6. **Avatar status system** (S/M). The pixel avatar changes with real post
   metadata: debugging, shipping, sleep-deprived, investigating, production on
   fire.
7. **Solo engineer character sheet** (M). A small persistent panel: current
   class, tools in inventory, active quests, ship streak, current boss fight,
   all sourced from reality.
8. **Terminal command palette** (M). Commands like `status`, `shiplog`,
   `claude`, `mistakes`, `roll-d20`, each revealing real notes, old failures, or
   playful telemetry. Claude Code users recognize the interface language.

## Microcopy worth stealing

- AI-assisted. Human-accountable.
- This post shipped with known uncertainty.
- Claude wrote the first pass. I owned the claims.
- No vibes were used in calculating this metric.
- Current quest: make the system boring.
- Last save: today.
- Boss defeated: unclear requirements.

## Decided against (for now)

Full retro / 16-bit visual themes for the site, and a reader-facing multi-theme
switcher. Explored 2026-07-10 (Stardew, Zelda, Chrono Trigger, terminal, arcade
home mocks). The blog stays clean editorial. The retro/16-bit themes live only
in the mermaid diagram kit (`mermaid-themes/`), used for diagrams, not the site.
