import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_EXTENSIONS, type Card } from "@/data/cards";
import { useGame } from "@/context/GameContext";

export function CustomCardDialog({ trigger }: { trigger: ReactNode }) {
  const { addCustomCard } = useGame();
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
          <DialogTitle className="font-display">Create a card</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Card name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea
            placeholder="Card rule / description"
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={type} onValueChange={(v) => setType(v as Card["type"])}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {(["Strike", "Gift", "Event", "Equip", "Special"] as const).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={extension} onValueChange={setExtension}>
              <SelectTrigger><SelectValue placeholder="Pack" /></SelectTrigger>
              <SelectContent>
                {ALL_EXTENSIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} className="w-full" disabled={!name.trim() || !rule.trim()}>
            Add to deck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
