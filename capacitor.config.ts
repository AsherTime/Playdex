import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Gamedex Android uses a hosted-web architecture: the WebView loads the deployed
 * Next.js site on Vercel so API routes, middleware, server components, and
 * server actions keep working unchanged.
 *
 * Set CAPACITOR_SERVER_URL before `npm run cap:sync` / production builds, e.g.:
 *   CAPACITOR_SERVER_URL=https://your-app.vercel.app
 *
 * Local dev (Android emulator → host machine):
 *   CAPACITOR_SERVER_URL=http://10.0.2.2:3000 CAPACITOR_LIVE_RELOAD=true npm run cap:sync
 *
 * Local dev (physical device on same Wi‑Fi):
 *   CAPACITOR_SERVER_URL=http://192.168.x.x:3000 CAPACITOR_LIVE_RELOAD=true npm run cap:sync
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const liveReload = process.env.CAPACITOR_LIVE_RELOAD === "true";

const config: CapacitorConfig = {
  appId: "com.gamedex.app",
  appName: "Gamedex",
  webDir: "capacitor-www",
  android: {
    allowMixedContent: liveReload,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#070811",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#070811",
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: serverUrl.startsWith("https://") ? "https" : "http",
  };
}

export default config;
