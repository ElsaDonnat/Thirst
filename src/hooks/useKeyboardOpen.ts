import { useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { isNative } from "@/lib/native";

/** True while the on-screen keyboard is showing (always false on the web) */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!isNative) return;
    const handles = [
      Keyboard.addListener("keyboardWillShow", () => setOpen(true)),
      Keyboard.addListener("keyboardWillHide", () => setOpen(false)),
    ];
    return () => {
      handles.forEach((h) => h.then((l) => l.remove()));
    };
  }, []);
  return open;
}
