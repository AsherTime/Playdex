# Playdex design system

Rules established while redesigning the Genshin character guide. Apply them to other surfaces only after the guide look is approved.

## Typography

- Page title: `text-4xl sm:text-5xl font-semibold tracking-tight text-white`. One name, not a badge row pretending to be a title.
- Section labels: `text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500`. These replace boxed section headers.
- Card titles: `text-base` or `text-lg font-semibold text-white`.
- Body / kit text: `text-sm leading-6` or `leading-7 text-zinc-400`. Do not use `text-xs` for readable guide copy.
- Metrics: `tabular-nums`. Unit labels stay `text-[10px] uppercase tracking-[0.16em] text-zinc-500`.
- Rarity: star glyphs with wide tracking, amber at low opacity (`text-amber-200/85`). Do not write “5-Star” as a chip.

## Spacing

- Page stack: `space-y-6`.
- Major blocks: `space-y-5`.
- Inside a surface: `p-4 sm:p-5`.
- Related items (weapons, team members, calc rows): `gap-3` or `gap-4`.
- Do not nest padded boxes that each add another 12–16px of chrome.

## Colors

- Page sits on the existing site wash (`#070811`). Do not introduce a second black.
- Surfaces: `bg-white/[0.035]` to `bg-white/[0.04]`. Inset highlight: `shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]`.
- Body text: white / `zinc-300` / `zinc-400` / `zinc-500`. No extra gray scale.
- Game element color is an accent only: gradient wash at ~35% opacity, chip text, damage-bar fill. Never a neon background or glowing border.
- Writer/admin “Edit Guide” stays the existing cyan cue so it is visually separate from reader chrome.

## Cards

- Use `GuideSurface` for one layer of card. No card-inside-card-inside-card.
- Weapons / artifacts: one quiet row (`bg-black/20`, rank + 48px icon + name). Details open as text, not a second bordered panel.
- Teams: one surface per team; member portraits are not individually boxed.
- Stats and calculations share the same surface language as weapons and teams.

## Borders

- Prefer surface fill + inset highlight over `border border-white/10`.
- If a ring is needed (hero portrait), use `ring-1 ring-white/10`.
- Do not stack `rounded-xl border` rectangles to create hierarchy.

## Shadows

- Cards: soft drop `0 18px 40px -28px rgba(0,0,0,0.7)` plus the inset hairline.
- Hero portrait: slightly stronger drop so the artwork lifts off the wash.
- No colored glow on cards. Element glow is only a faint blur behind the portrait.

## Motion

- Hover: text/background opacity only (`hover:text-white`, `hover:bg-white/[0.1]`).
- Bars: `transition-[width] duration-500`, no bounce.
- Sticky nav: `backdrop-blur-md`, no slide animations.
- Do not add scale, shine, or looping gradients.

## Responsive rules

- Hero: stacked and centered below `sm`; row with left portrait and left-aligned type from `sm` up.
- Portrait sizes: 144px / 192px / 224px. Fill the frame (`object-cover`); do not leave a tiny icon in a tall empty well.
- Sticky section nav is horizontal and scrollable on small screens; `top-2` so it stays usable under the mobile header.
- Teams: 2 columns on mobile, 4 from `sm`.
- Calculations: stacked metric + bar on mobile; name / bar / percent on one row from `sm`.

## Charts

- Prefer horizontal comparison bars over tall neon columns.
- One stacked share bar for the team, then one thin bar per member.
- Fill with `getElementBarColors(element).primary` only. No extra bloom.
- Missing share renders `—`, not a fake 0% bar presented as fact.

## Icons

- Equipment and members: 48–64px, `rounded-xl` or `rounded-2xl`, `object-contain`.
- Hero uses the same character art the guide already has (portrait URL or resolved icon). Do not invent splash art.
- Rank is a tabular number, not a medal badge.

## Images

- Always `next/image` with `fill` and explicit `sizes`.
- Hero: `sizes="(max-width: 640px) 144px, 224px"`, `priority`.
- Decorative images use `alt=""`.
- Parent must be `relative` with a set width and height.

## Page layouts

- Guide page structure: breadcrumb → hero → sticky Kit / Build / Teams / Calculations.
- Calculations is a first-class section, not a nested toggle under Teams.
- Reader actions (All characters) are text. Writer actions stay visually distinct.
- Scope these rules to `.guide-page` until the rest of the site is redesigned.
- Do not change homepage, news, Valorant, admin, or database architecture to match this yet.
