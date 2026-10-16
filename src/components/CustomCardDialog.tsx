import { useRef, useState, type ReactNode } from "react";
import { Dices, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_EXTENSIONS, type Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { packLabel, typeLabel } from "@/i18n/cards";
import { fromLabels, TOKEN_LABELS, type TokenKind } from "@/lib/tokens";

export function CustomCardDialog({ trigger }: { trigger: ReactNode }) {
  const { addCustomCard } = useGame();
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rule, setRule] = useState("");
  const [type, setType] = useState<Card["type"]>("Strike");
  const [extension, setExtension] = useState<string>("CUSTOM");
  const ruleRef = useRef<HTMLTextAreaElement>(null);

  /** Drops a player slot where the cursor is (or at the end) */
  const insertSlot = (kind: TokenKind) => {
    const label = TOKEN_LABELS[kind][lang];
    const el = ruleRef.current;
    const start = el?.selectionStart ?? rule.length;
    const end = el?.selectionEnd ?? rule.length;
    const before = rule.slice(0, start);
    const after = rule.slice(end);
    const spaceBefore = before && !before.endsWith(" ") ? " " : "";
    const spaceAfter = after.startsWith(" ") ? "" : " ";
    const next = `${before}${spaceBefore}${label}${spaceAfter}${after}`;
    setRule(next);
    const caret = before.length + spaceBefore.length + label.length + spaceAfter.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const add = () => {
    if (!name.trim() || !rule.trim()) return;
    addCustomCard({ type, name: name.trim(), rule: fromLabels(rule.trim()), extension });
    setName("");
    setRule("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t("custom.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Input placeholder={t("custom.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
          <textarea
            ref={ruleRef}
            placeholder={t("custom.rule")}
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => insertSlot("random")}>
                <Dices className="h-4 w-4" /> {t("custom.insertRandom")}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => insertSlot("match")}>
                <Heart className="h-4 w-4" /> {t("custom.insertCrush")}
              </Button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("custom.slotsHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={type} onValueChange={(v) => setType(v as Card["type"])}>
              <SelectTrigger><SelectValue placeholder={t("custom.type")} /></SelectTrigger>
              <SelectContent>
                {(["Strike", "Gift", "Event", "Equip", "Special"] as const).map((ty) => (
                  <SelectItem key={ty} value={ty}>{typeLabel(ty, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={extension} onValueChange={setExtension}>
              <SelectTrigger><SelectValue placeholder={t("custom.pack")} /></SelectTrigger>
              <SelectContent>
                {ALL_EXTENSIONS.map((e) => (
                  <SelectItem key={e} value={e}>{packLabel(e, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} className="w-full py-5 text-base font-bold" disabled={!name.trim() || !rule.trim()}>
            {t("custom.add")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
