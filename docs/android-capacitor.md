# Gamedex Android (Capacitor)

This repo ships **one codebase** for:

- **Web** → Next.js on Vercel (unchanged)
- **Android** → Capacitor shell in `android/` that loads the deployed website

## Architecture (hosted web shell)

The Android app is **not** a static export of Next.js. It opens your live Vercel deployment inside a native WebView so these keep working:

- Supabase SSR auth + cookies
- Middleware
- API routes (`/api/collectors/*`, `/api/news/latest`, …)
- Server components & server actions
- Admin collector controls

```
Next.js (Vercel)  ←── HTTPS ──  Capacitor WebView (Android app)
        │
        └── Supabase (same project, same users)
```

**Trade-off:** The installed app needs network access to your Vercel URL. This avoids breaking server features and avoids maintaining a second frontend.

**Play Store note:** Google may scrutinize pure website wrappers. This project adds native value: back button handling, status bar, splash screen, bottom navigation, external link handling, device game tracking (Usage Access), and deep-link scaffolding.

See also: [Android Device Game Tracker](./android-device-tracker.md).

## Package ID

Locked as **`com.gamedex.app`**. Changing it after Play Store publish is painful — only change before first upload if Play Console rejects the ID.

## Environment variables

Add to `.env.local` (never commit secrets):

```bash
NEXT_PUBLIC_APP_URL=https://YOUR-PRODUCTION-URL.vercel.app
CAPACITOR_SERVER_URL=https://YOUR-PRODUCTION-URL.vercel.app
```

Only **public** Supabase keys belong in the client (`NEXT_PUBLIC_SUPABASE_*`). Never put `SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET` in the Android app — those stay on Vercel only.

## Supabase auth (same project)

Works because the WebView loads your real site origin.

1. **Supabase Dashboard → Authentication → URL configuration**
   - Site URL: `https://YOUR-PRODUCTION-URL`
   - Redirect URLs:
     - `https://YOUR-PRODUCTION-URL/auth/callback`
     - `https://YOUR-PRODUCTION-URL/auth/reset-password`
     - `gamedex://app/auth/callback` (optional custom scheme fallback)

2. Email confirmation & password reset links must use the production domain (already handled via `window.location.origin` in auth forms).

3. **Deep links (HTTPS):** Before Play release, set `deep_link_host` in  
   `android/app/src/main/res/values/strings.xml`  
   and host `/.well-known/assetlinks.json` on that domain.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run android:sync:prod` | Sync Android shell → production Vercel URL from `.env.local` |
| `npm run android:sync:dev` | Sync for emulator → `http://10.0.2.2:3000` |
| `npm run android:open` | Open project in Android Studio |
| `npm run android:run` | Build & run on connected device/emulator |
| `npm run cap:sync` | Raw Capacitor sync (uses env vars if set) |

## Local workflow

### Production-like Android build

```bash
# 1. Deploy website to Vercel first
# 2. Set CAPACITOR_SERVER_URL in .env.local
npm run android:sync:prod
npm run android:open
```

In Android Studio: Run ▶ on emulator or USB device.

### Dev live reload (emulator)

```bash
npm run dev
npm run android:sync:dev
npm run android:open
```

Physical device on Wi‑Fi: use your PC LAN IP instead:

```bash
set CAPACITOR_SERVER_URL=http://192.168.1.50:3000
npm run android:sync:dev
```

## Android Studio setup (install yourself)

1. **Android Studio** (latest stable) — https://developer.android.com/studio  
2. **Android SDK Platform 36** (Android 16) via SDK Manager  
3. **Android SDK Build-Tools** (latest)  
4. **Android SDK Command-line Tools**  
5. **JDK 17** (Android Studio bundled Jest JDK is fine)  
6. Create an **AVD** (Pixel device, API 36) or enable **USB debugging** on a phone

Set `ANDROID_HOME` if Gradle cannot find the SDK (Studio usually configures this).

## Debug APK

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Windows:

```powershell
cd android
.\gradlew.bat assembleDebug
```

## Production AAB (Google Play)

1. Create a upload keystore locally (one-time):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore gamedex-release.jks -alias gamedex -keyalg RSA -keysize 2048 -validity 10000
```

2. Copy `android/keystore.properties.example` → `android/keystore.properties` (gitignored) and fill values.

3. Add signing config to `android/app/build.gradle` (release only) — see Google Play docs.

4. Build:

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Do not commit** `.jks`, `keystore.properties`, or passwords.

## Replace placeholder branding

Default Capacitor launcher icons are placeholders. Replace before store submission:

- `android/app/src/main/res/mipmap-*`
- Splash drawables under `android/app/src/main/res/drawable*`
- Optional: add `@capacitor/assets` workflow later

## Future native features (prepared, not implemented)

Architecture supports adding later:

- `@capacitor/push-notifications`
- `@capacitor/local-notifications`
- `@capacitor/share`
- `@capacitor/haptics`
- App shortcuts via Android manifest

## Vercel website

The website build is unchanged:

```bash
npm run build
npm run start
```

Capacitor files do not alter the Next.js production output.
