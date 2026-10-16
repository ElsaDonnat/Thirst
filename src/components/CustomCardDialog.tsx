import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_EXTENSIONS, type Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { packLabel, typeLabel } from "@/i18n/cards";

export function CustomCardDialog({ trigger }: { trigger: ReactNode }) {
  const { addCustomCard } = useGame();
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rule, setRule] = useState("");
  const [type, setType] = useState<Card["type"]>("Strike");
  const [extension, setExtension] = useState<string>("ORIGINAL");

  const add = () => {
    if (!name.trim() || !rule.trim()) return;
    addCustomCard({ type, name: name.trim(), rule: rule.trim(), extension });
    setName("");
    setRule("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{t("custom.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder={t("custom.name")} value={name} onChange={(e) => setName(e.target.value)} />
          <textarea
            placeholder={t("custom.rule")}
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
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
          <Button onClick={add} className="w-full" disabled={!name.trim() || !rule.trim()}>
            {t("custom.add")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
