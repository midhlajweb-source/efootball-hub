# Design Brief

## Direction

Stadium Night — a broadcast-grade eFootball tournament control room: floodlit pitch-black surfaces, acid-lime scoreboard accents, and dense tabular match data.

## Tone

Dark, high-contrast, and industrial-sporting — an esports broadcast overlay rather than a friendly club website; every surface reads like a lit scoreboard in a dark arena.

## Differentiation

The acid-lime "live LED" accent against deep pitch-green charcoal, plus a faint pitch-line grid texture behind hero and section anchors — the app looks like a stadium scoreboard, not a generic dark dashboard.

## Color Palette

| Token      | OKLCH         | Role                                        |
| ---------- | ------------- | ------------------------------------------- |
| background | 0.16 0.018 165 | Pitch-black-green arena base                |
| foreground | 0.95 0.012 150 | Primary text on dark surfaces               |
| card       | 0.2 0.02 165   | Elevated panels, tables, bracket nodes      |
| primary    | 0.86 0.21 128  | Acid-lime: CTAs, active nav, leader rows    |
| accent     | 0.72 0.19 52   | Amber: LIVE badges, in-play urgency         |
| muted      | 0.24 0.02 165  | Section bands, inactive chips, table stripes |
| success    | 0.72 0.17 148  | Completed / win indicators                  |
| warning    | 0.78 0.16 82   | Upcoming / pending fixtures                 |
| destructive| 0.58 0.21 22   | Delete actions, wrong-credentials error     |

## Typography

- Display: Space Grotesk — tournament name, page headings, scoreline numerals, bracket team names
- Body: DM Sans — paragraphs, labels, form fields, table cells
- Mono: JetBrains Mono — matchday codes, kickoff times, tabular GF/GA/Pts columns
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base`

## Elevation & Depth

Two-tier surfaces: `bg-background` for the arena floor and `bg-card` + `border-border` for all panels; depth comes from borders and layered translucency, not heavy shadows — `shadow-subtle` for resting cards, `shadow-elevated` for modals and the bracket viewport.

## Structural Zones

| Zone    | Background        | Border      | Notes                                                          |
| ------- | ----------------- | ----------- | -------------------------------------------------------------- |
| Header  | `bg-card/95` blur | `border-b`  | Sticky public nav; lime underline marks the active route        |
| Content | `bg-background`   | —           | Alternating sections use `bg-muted/30`; hero carries pitch grid |
| Footer  | `bg-muted/40`     | `border-t`  | Compact, muted text, tournament meta only                       |
| Admin   | `bg-sidebar`      | `border-r`  | Distinct dark sidebar shell + amber "ADMIN" chip to separate it |

## Spacing & Rhythm

Sections separated by `py-16 md:py-24`; content max-width `container` with `max-w-6xl` for reading views and full-bleed for bracket/table; micro-spacing in dense tables is `px-3 py-2` with `text-sm`.

## Component Patterns

- Buttons: `rounded-md`, lime `bg-primary` for primary actions, `variant="outline"` for secondary, `variant="destructive"` for deletes; hover brightens and lifts 1px
- Cards: `rounded-lg`, `bg-card`, 1px `border-border`, `shadow-subtle`; hover raises border to `border-primary/40`
- Badges: pill `rounded-full`, `text-xs uppercase tracking-wider` — lime for LIVE-adjacent, amber for LIVE, `bg-muted` for Upcoming, `bg-success/15` for Completed
- Tables: zebra via `bg-muted/20` on even rows, mono tabular numerals, lime left rail on the leader row

## Motion

- Entrance: `animate-fade-up` 0.4s ease-out on section headers and cards, staggered by 60ms
- Hover: `transition-smooth` color/border shifts; table rows tint `bg-muted/40`
- Decorative: `animate-pulse-live` on the LIVE dot only — one motion story, no scattered animation

## Constraints

- Dark mode is the only mode; do not build a light theme
- No player-level stats or top-scorer surfaces anywhere in the layout
- No shareable per-match public link surface
- No neon glow shadows, no purple gradients, no raw hex or arbitrary color classes
- All scores, times, and table numerics use `font-mono tabular`

## Signature Detail

A faint 56px pitch-line grid (`bg-pitch-lines`) sits behind the hero and each section anchor, so the whole app reads as a lit pitch under floodlights — a texture category, not just a color choice.
