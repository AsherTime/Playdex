# Character detail performance investigation

Measured locally on 2026-09-10 using Next.js 16.2.6 development mode,
the live Supabase database, and signed-out requests. Baseline commit:
`b1aed44cd8455565e6b62c96fdeb789d4c0aa0af`.

## Findings

The loader made six uncached REST requests in three dependent stages:
character lookup; parallel kit/build/teams/source records; then team members.
Only after all of those finished did the page start its auth/profile check.
Each REST request took approximately 178-536 ms including transport and body
download. Fast SQL execution does not include these application round trips.
The Supabase project reports region `ap-northeast-2` (Seoul). We did not measure
the deployed Vercel region or isolate DNS, TLS, gateway and SQL timings.

Representative baseline request, milliseconds:

| Operation | Time |
| --- | ---: |
| Middleware, no auth cookie | 0.1 |
| Character lookup | 255.5 |
| Kit (parallel group) | 292.6 |
| Build (parallel group) | 178.8 |
| Teams (parallel group) | 183.4 |
| Source records (parallel group) | 189.5 |
| Team members, after parallel group | 187.7 |
| Assets and normalization | 0.3 |
| Guide loader total | 746.0 |
| Auth/profile, signed out | 16.4 |
| Page function total | 762.6 |
| Complete RSC response | 793.5 |

Do not sum the parallel group. Assets were indexed locally and were not the
bottleneck. The root layout has no server data requests; the display component
does not fetch data. There were no duplicate guide queries within these requests.
Signed-in middleware and page both call getUser in the code, followed by a profile
lookup in the page; their signed-in latency was not measured in this test.

## Fix

Fetch the character and related kit, builds, teams, members and source records
in one nested REST select using the existing foreign keys and anon client/RLS.
Keep manual published build/team precedence and sort teams/members as before.
Start the independent role lookup concurrently with the guide loader.
No persistent cache or auth caching was introduced, so published changes retain
the existing freshness behavior. Next.js's default dynamic fetch behavior
previously repeated the waterfall on each navigation.

## Before and after

Same signed-out RSC request, isolated dev server, instrumented in both versions:
`curl.exe -s -o NUL -H "RSC: 1" -w "%{time_total}" "http://localhost:3001/games/genshin-impact/characters/aino?_rsc=test"`

| Request | Before | After |
| --- | ---: | ---: |
| First, includes compilation | 2848 ms | 2266 ms |
| Warm 1 | 1360 ms | 233 ms |
| Warm 2 | 794 ms | 231 ms |
| Warm 3 | 967 ms | 553 ms |
| Warm median | 967 ms | 233 ms |

Warm median improved about 76%. After-fix joined requests measured 197, 207 and
525 ms; page totals measured 203, 212 and 530 ms. Middleware was 0.1 ms and local
asset processing 0.1-0.2 ms. First-request Next.js compilation was approximately
1.7-1.8 seconds in both versions.

The exact reported 4.05-second Chrome request was NOT reproduced. These results
identify and fix a measured round-trip bottleneck, but cannot assign the entire
reported delay to it without a trace of that original signed-in/deployed request.

## Verification

Run `node scripts/test-guide-detail-performance.mjs b1aed44cd8455565e6b62c96fdeb789d4c0aa0af`.
This transpiles and executes the baseline and current real loaders in memory,
using read-only requests. It compares the entire returned guide object, treating
source-record and missing-asset arrays as unordered. It checks Aino, Mavuika and
a missing slug. No credentials or guide content are printed.

Final comparison: Aino 1206 -> 180 ms (12 teams); Mavuika 1091 -> 188 ms
(43 teams); identical returned content, and identical missing-character behavior.
These sequential loader measurements supplement, rather than replace, the RSC
measurements above. Network latency varies between requests.

TypeScript, targeted ESLint and git diff whitespace checks passed. No unrelated
browser routes were tested. Temporary timing instrumentation was removed.
The temporary servers were stopped. Generated diagnostic caches remain under
the ignored `.next` directory; no source material was deleted.

An additional check on the user's existing port-3000 server returned 1118 ms
(first request) and 318 ms (warm). Its next request stalled while its server log
reported EPIPE/broken stdout pipe, so that run was interrupted and excluded.
