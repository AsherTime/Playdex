# WuWa Character and Comparison Import

The workbook is read-only. Extract its cached numeric values with
`extract-workbook.py <workbook-path>` using Python with openpyxl installed.
Generated source caches stay in `reports/wuwa-comparisons` and are ignored by Git.

Commands from the project root:

```powershell
node scripts/guides/wuwa/fetch-nanoka.mjs
node scripts/guides/wuwa/prepare-import.mjs
node --test scripts/guides/wuwa/parser.test.mjs
node --env-file=.env.local scripts/guides/wuwa/import.mjs --write
```

The importer currently verifies the supplied workbook at
`C:/Users/User/Downloads/DPR Calc Results.xlsx`. The environment requires
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
SUPABASE_SERVICE_ROLE_KEY. Never expose the service key to browser code.

Nanoka's manifest live version is used, not its preview default. Male/female
Rover source variants share an element-specific canonical character identity.
Completed Index rows are eligible; sheets explicitly marked WIP are excluded
even when the Index lists them as completed. Team and investment sections are
not imported. Missing and ambiguous Echo dimensions remain unresolved.

Preparation checks Augusta, Zani and Phrolova before any database write.
Stable source-derived IDs make unchanged-workbook reruns upserts. Each write
is verified field-by-field, alongside the workbook hash and snapshots of
existing Genshin records. The importer does not delete stale records if a
future workbook removes or relocates tables; review those changes explicitly.

See `reports/wuwa-comparisons/import-report.json` for counts, source version,
skipped sheets, unresolved details and the three complete verification samples.
