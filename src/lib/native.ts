import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const isNative = Capacitor.isNativePlatform();

/** One-time native setup: status bar styling, then reveal the app. */
export async function initNative() {
  if (!isNative) return;
  try {
    // Light theme → dark status-bar text
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#f4f5f9" });
    }
  } catch {
    // StatusBar not available (e.g. web) — nothing to do
  }
  try {
    await SplashScreen.hide();
  } catch {
    // SplashScreen not available — nothing to do
  }
}

/** Small tactile confirmation for game actions; silently no-ops on web. */
export async function tapFeedback() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Haptics not available — nothing to do
  }
}
