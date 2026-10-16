import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Mascot } from "@/components/Mascot";
import { useGame } from "@/context/GameContext";
import { RichText, useT } from "@/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";

const ONBOARD_KEY = "thirst-onboarded-v1";

/** Shown once, on the very first launch: language, quick rules, then out of the way. */
export function WelcomeDialog() {
  const { t } = useT();
  const { settings, setLanguage } = useGame();
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARD_KEY);
    } catch {
      return false;
    }
  });

  const dismiss = (nextOpen: boolean) => {
    if (!nextOpen) {
      try {
        localStorage.setItem(ONBOARD_KEY, "1");
      } catch {
        // Storage unavailable: they'll just see this again next launch
      }
    }
    setOpen(nextOpen);
  };

  const steps = [t("welcome.step1"), t("welcome.step2"), t("welcome.step3")];

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent
        className="max-w-sm gap-0 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-6 pt-5 text-center">
          <Mascot bob className="mx-auto h-[min(9rem,18dvh)] w-auto" />
          <DialogTitle className="title-retro mt-2 text-[2rem] leading-tight">{t("welcome.title")}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">{t("welcome.subtitle")}</DialogDescription>
          <div className="mt-3 flex justify-center">
            <LanguageSwitch value={settings.language} onChange={setLanguage} />
          </div>
        </div>

        <div className="space-y-3 px-6 pb-5 pt-4">
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-medium text-brand">
                  {i + 1}
                </span>
                <span className="font-body text-[15px] leading-snug text-foreground/85">
                  <RichText text={step} />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">{t("welcome.footer")}</p>
          <Button onClick={() => dismiss(false)} className="w-full py-6 font-display text-lg font-medium">
            {t("welcome.cta")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
