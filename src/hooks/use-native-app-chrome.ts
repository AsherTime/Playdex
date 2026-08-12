"use client";

import { useSyncExternalStore } from "react";
import { useMobileAppChrome as detectMobileAppChrome } from "@/lib/capacitor/platform";

export function useNativeAppChrome() {
  return useSyncExternalStore(
    () => () => {},
    () => detectMobileAppChrome(),
    () => false,
  );
}
