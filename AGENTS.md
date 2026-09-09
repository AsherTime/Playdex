<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Game reference material

For Genshin Impact and Wuthering Waves calculations, character data, and team logic, read `reference/` (especially `reference/genshin-impact/` and `reference/wuthering-waves/`) before inventing formulas or metadata.

# Public UI copy rules

- Never expose backend, database, provider, importer, scraping, collector, API, or debug implementation details in public UI.
- Avoid explanatory subtitles that describe internal filtering, tracking, storage, or data pipelines.
- Do not add filler text just because a component has space.
- Prefer no subtitle over meaningless copy.
- Admin/debug terminology belongs only in admin/internal interfaces.
- Public copy should describe content, privacy-relevant behavior, or an action useful to the visitor.
<!-- END:nextjs-agent-rules -->
