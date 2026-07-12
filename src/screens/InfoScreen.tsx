import { Vibrate, Trash2, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGame } from "@/context/GameContext";

// Keep in step with package.json / store releases
const APP_VERSION = "1.1.0";

const CARD_TYPES = [
  { type: "Strike", className: "bg-card-strike", blurb: "A challenge for you — do it or drink." },
  { type: "Gift", className: "bg-card-gift", blurb: "You hand it out — someone else drinks." },
  { type: "Event", className: "bg-card-event", blurb: "Affects the whole table." },
  { type: "Equip", className: "bg-card-equip", blurb: "An ongoing rule that sticks with you." },
  { type: "Special", className: "bg-card-special", blurb: "Wildcards — anything can happen." },
];

export function InfoScreen() {
  const { settings, setHaptics, clearAllData } = useGame();

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">Info</h1>
        <p className="text-xs text-muted-foreground">How to play, settings & about</p>
      </div>

      {/* How to play */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">How to play</span>
        </div>
        <ol className="list-decimal space-y-2 pl-5 font-body text-sm leading-relaxed text-foreground/80">
          <li>Add your players, choose your card packs, and start the game.</li>
          <li>On your turn you're dealt a hand of cards. Pick <strong>one</strong> challenge and do what it says…</li>
          <li>…or chicken out and take <strong>15 sips</strong> instead.</li>
          <li>The phone passes to the next player. The deck reshuffles itself when it runs out — play as long as you like.</li>
        </ol>
      </div>

      {/* Card types */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Card types</p>
        <div className="space-y-2.5">
          {CARD_TYPES.map(({ type, className, blurb }) => (
            <div key={type} className="flex items-center gap-3">
              <span className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-white ${className}`}>
                {type}
              </span>
              <span className="font-body text-sm text-foreground/80">{blurb}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Settings</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vibrate className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Haptic feedback</span>
          </div>
          <Switch checked={settings.haptics} onCheckedChange={setHaptics} />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Clear all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Clear all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes the saved game, custom cards, and settings. There's no undo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllData}>Delete everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="font-display text-lg font-bold text-primary">THIRST</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Version {APP_VERSION}</p>
        <p className="mt-3 font-body text-xs leading-relaxed text-muted-foreground">
          A social party game. No real money, no wagers, no prizes — just friends and questionable decisions.
        </p>
        <p className="mt-2 font-body text-xs font-semibold text-muted-foreground">
          Please drink responsibly. For adults only.
        </p>
        <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60">
          Made with <Heart className="h-3 w-3 fill-current" /> for game nights
        </p>
      </div>
    </div>
  );
}
