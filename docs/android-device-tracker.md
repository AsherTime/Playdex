# Android Device Game Tracker

Voluntary playtime tracking for supported games using Android's official `UsageStatsManager` API.

## Architecture

```
UsageStatsManager (Android)
  → GameUsagePlugin (Capacitor)
  → src/lib/game-usage/* (normalize + cache)
  → DeviceGameActivity (profile UI)
  → user_game_usage_daily (optional Supabase sync)
```

## Supported games

Package IDs live in `src/data/android-tracked-games.ts`. Only entries marked `verified: true` are queried. Add new games there after confirming the Play Store `applicationId` on a real device.

## Permissions

- `android.permission.PACKAGE_USAGE_STATS` — declared in the manifest; granted manually in **Settings → Apps → Special access → Usage access → Gamedex**.

No `QUERY_ALL_PACKAGES` is used. The plugin only queries usage for known package IDs from the registry.

## Local privacy

- Opt-in stored in `localStorage` (`gamedex-device-tracker-opt-in`).
- Declining sets `gamedex-device-tracker-declined` so the app does not nag.
- Cached summaries in `gamedex-device-tracker-cache`.
- No background service; data is read when the user opens Profile or taps Refresh.

## Sync

When signed in, Refresh upserts **today's summarized rows** into `user_game_usage_daily` using the public Supabase anon key and RLS (users can only write their own rows).

## Rebuild native app

After changing the Java plugin:

```bash
npm run cap:sync
```

Open `android/` in Android Studio and run on a device or emulator.

## Session counts

Session counts come from `UsageEvents` `MOVE_TO_FOREGROUND` events per package in the query window. OEM differences and Android version quirks can make this approximate — treat as indicative, not exact.

## Verifying package IDs on a real device

1. Install the game from the Play Store on your Android phone.
2. In Android Studio logcat or `adb shell pm list packages | grep -i <game>`, find the package name.
3. Add it to `src/data/android-tracked-games.ts` with `verified: false` first.
4. Enable tracker debug: open Profile with `?debug=tracker` on Android, or use a development build.
5. Play the game for a few minutes, tap Refresh, and confirm it appears in the debug panel.
6. Set `verified: true` only after confirmation.

Regional builds often use different package IDs — document the region in the `note` field and add multiple entries under the same game slug.

- Web profile shows an Android-only notice (no permission prompts on Vercel).
- Emulator usage stats may be empty unless apps are launched in the emulator.
- Regional game builds may use different package IDs than the global registry entry.
