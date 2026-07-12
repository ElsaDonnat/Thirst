import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Beer } from "lucide-react";

const ONBOARD_KEY = "thirst-onboarded-v1";

/** Shown once, on the very first launch: quick rules, then out of the way. */
export function WelcomeDialog() {
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
        // Storage unavailable — they'll just see this again next launch
      }
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-bold text-primary">
            Welcome to THIRST
          </DialogTitle>
          <DialogDescription className="text-center">
            The drinking card game for your whole crew.
          </DialogDescription>
        </DialogHeader>
        <ol className="list-decimal space-y-2 pl-5 font-body text-sm leading-relaxed text-foreground/80">
          <li>Add your players and pick your card packs.</li>
          <li>On your turn, pick <strong>one</strong> challenge card and do what it says…</li>
          <li>…or chicken out and take <strong>15 sips</strong>.</li>
          <li>Pass the phone. Repeat until the night gets interesting.</li>
        </ol>
        <p className="text-center text-[11px] text-muted-foreground">
          Full rules live in the Info tab. Please drink responsibly — adults only.
        </p>
        <Button onClick={() => dismiss(false)} className="w-full gap-2 py-5 font-display text-lg font-bold">
          <Beer className="h-5 w-5" /> Let's play
        </Button>
      </DialogContent>
    </Dialog>
  );
}
