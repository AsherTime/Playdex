"use client";

import { Capacitor } from "@capacitor/core";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function isAndroidApp() {
  return Capacitor.getPlatform() === "android";
}

export function getCapacitorPlatform() {
  return Capacitor.getPlatform();
}

/** True when the installed Android shell should use mobile app chrome (bottom nav). */
export function useMobileAppChrome() {
  if (typeof window === "undefined") return false;
  return isNativeApp();
}
