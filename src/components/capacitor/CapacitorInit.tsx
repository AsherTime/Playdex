"use client";

import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeApp } from "@/lib/capacitor/platform";

function isInAppUrl(url: URL, appOrigin: string) {
  return url.origin === appOrigin;
}

export function CapacitorInit() {
  useEffect(() => {
    if (!isNativeApp()) return;

    async function initNativeShell() {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#070811" });
      } catch {
        // Status bar plugin unavailable on some WebView builds.
      }

      try {
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }

      try {
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
      } catch {
        // Optional keyboard tuning.
      }
    }

    void initNativeShell();

    const backListener = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }
      void CapApp.exitApp();
    });

    const appUrl = window.location.origin;

    const clickHandler = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (isInAppUrl(url, appUrl)) return;

      event.preventDefault();
      void Browser.open({ url: url.toString() });
    };

    document.addEventListener("click", clickHandler, true);

    return () => {
      void backListener.then((listener) => listener.remove());
      document.removeEventListener("click", clickHandler, true);
    };
  }, []);

  return null;
}
