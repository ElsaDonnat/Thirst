import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Bookmark, Check, Heart, Minus, Play, Plus, Settings2, Shuffle, Sparkles, WineOff } from "lucide-react";
import { ALL_EXTENSIONS, DEFAULT_CARDS, type Extension } from "@/data/cards";
import { useGame } from "@/context/GameContext";
import { useT } from "@/i18n";
import { packDescription, packLabel } from "@/i18n/cards";
import { MAX_PRESETS, type Preset } from "@/lib/presets";
import { setBackHandler, tapFeedback } from "@/lib/native";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import type { Gender, Likes, Relationship } from "@/lib/targeting";
import { tokensIn } from "@/lib/tokens";

const MAX_PLAYERS = 15;
const ROUND_OPTIONS: (number | null)[] = [null, 3, 5, 10];

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Segmented<T>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={`h-10 min-w-10 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors ${
            value === o ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground"
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
        on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-10 shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({ icon, label, hint, checked, onChange }: { icon: React.ReactNode; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[15px] font-semibold">{label}</span>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {hint && checked && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SetupFlowProps {
  initial: Preset;
  startStep: 1 | 2;
  onExit: () => void;
}

/** New game in two screens: packs, then players. Rules live behind Options. */
export function SetupFlow({ initial, startStep, onExit }: SetupFlowProps) {
  const { state, startGame, customCards, settings, presets, savePreset } = useGame();
  const { t, lang } = useT();
  const [step, setStep] = useState<1 | 2>(startStep);
  const [draft, setDraft] = useState<Preset>(initial);
  const [names, setNames] = useState<string[]>(() => Array.from({ length: MAX_PLAYERS }, (_, i) => initial.players[i] ?? ""));
  const [genders, setGenders] = useState<(Gender | null)[]>(() => Array.from({ length: MAX_PLAYERS }, (_, i) => initial.genders[i] ?? null));
  const [sober, setSober] = useState<boolean[]>(() => Array.from({ length: MAX_PLAYERS }, (_, i) => !!initial.sober?.[i]));
  const [likes, setLikes] = useState<Likes[]>(() => Array.from({ length: MAX_PLAYERS }, (_, i) => initial.likes?.[i] ?? null));
  const [relationships, setRelationships] = useState<Relationship[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => initial.relationships?.[i] ?? null),
  );
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const keyboardOpen = useKeyboardOpen();
  const [playerCount, setPlayerCount] = useState(Math.min(MAX_PLAYERS, Math.max(2, initial.players.length || 4)));
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState(initial.name);
  const [replaceSlot, setReplaceSlot] = useState(MAX_PRESETS - 1);
  const [confirmReplaceGame, setConfirmReplaceGame] = useState(false);

  const goBack = () => (step === 2 && startStep === 1 ? setStep(1) : onExit());
  useEffect(() => {
    setBackHandler(() => {
      goBack();
      return true;
    });
    return () => setBackHandler(null);
  });

  const update = (patch: Partial<Preset>) => setDraft((d) => ({ ...d, ...patch }));
  const extensions = new Set(draft.enabledExtensions);
  // Who-likes-who only matters when something in the deck uses it
  const matchAvailable =
    extensions.has("FLIRTY") ||
    customCards.some((c) => extensions.has(c.extension as Extension) && tokensIn(c.rule).includes("match"));
  const matching = matchAvailable && draft.genderMatch;

  const toggleExtension = (ext: Extension) => {
    const next = new Set(extensions);
    if (next.has(ext)) {
      if (next.size > 1) next.delete(ext);
    } else {
      next.add(ext);
    }
    update({ enabledExtensions: ALL_EXTENSIONS.filter((e) => next.has(e)) });
  };

  const surpriseMe = () => {
    const pool = ALL_EXTENSIONS.filter((e) => e !== "CUSTOM" || customCards.length > 0);
    const count = 2 + Math.floor(Math.random() * 2);
    update({ enabledExtensions: shuffled(pool).slice(0, count) });
  };

  // Everything here is optional: tapping a selected button unselects it
  const toggleGender = (i: number, g: Gender) =>
    setGenders((prev) => prev.map((cur, j) => (j !== i ? cur : cur === g ? null : g)));
  const toggleLike = (i: number, like: "m" | "f" | "none") =>
    setLikes((prev) =>
      prev.map((cur, j) => {
        if (j !== i) return cur;
        if (like === "none") return cur && cur.length === 0 ? null : [];
        const base = cur ?? [];
        const next = base.includes(like) ? base.filter((x) => x !== like) : [...base, like];
        return next.length ? next : null;
      }),
    );

  // Taken on/off. Turning it off releases the partner, who stays marked as
  // taken (by someone not playing) rather than silently becoming single.
  const toggleTaken = (i: number) =>
    setRelationships((prev) => {
      const next = [...prev];
      const current = next[i];
      if (current === null) {
        next[i] = "away";
      } else {
        if (typeof current === "number" && next[current] === i) next[current] = "away";
        next[i] = null;
      }
      return next;
    });

  // Couples are linked both ways; whoever either of them was with before is
  // left taken by someone not playing
  const setPartner = (i: number, partner: Relationship) =>
    setRelationships((prev) => {
      const next = [...prev];
      const release = (who: number) => {
        const old = next[who];
        if (typeof old === "number" && next[old] === who) next[old] = "away";
      };
      release(i);
      if (typeof partner === "number") {
        release(partner);
        next[partner] = i;
      }
      next[i] = partner;
      return next;
    });

  /** Enter moves to the next name; on the last one it closes the keyboard */
  const onNameKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = nameRefs.current[i + 1];
    if (i + 1 < playerCount && next) next.focus();
    else e.currentTarget.blur();
  };

  const availableCardCount = [...DEFAULT_CARDS, ...customCards].filter((c) => extensions.has(c.extension as Extension)).length;
  const deckTooSmall = availableCardCount < draft.cardsPerTurn;

  /** Everything the current screens describe, as a preset */
  const currentSetup = (): Preset => ({
    ...draft,
    players: names.slice(0, playerCount).map((n, i) => n.trim() || t("setup.playerPlaceholder", { n: i + 1 })),
    sober: sober.slice(0, playerCount),
    genders: genders.slice(0, playerCount),
    likes: likes.slice(0, playerCount),
    // A partner who was removed from the game counts as not playing
    relationships: relationships.slice(0, playerCount).map((r) => (typeof r === "number" && r >= playerCount ? "away" : r)),
    genderMatch: matching,
  });

  const play = () => {
    if (settings.haptics) tapFeedback();
    const setup = currentSetup();
    let { players, sober: playerSober, genders: playerGenders, likes: playerLikes, relationships: playerRelationships } = setup;
    if (setup.randomOrder) {
      const order = shuffled(players.map((_, i) => i));
      // Partners point at seat numbers, so they follow everyone to their new seat
      const newSeat = new Map(order.map((oldSeat, seat) => [oldSeat, seat]));
      players = order.map((i) => players[i]);
      playerSober = order.map((i) => playerSober[i]);
      playerGenders = order.map((i) => playerGenders[i]);
      playerLikes = order.map((i) => playerLikes[i]);
      playerRelationships = order.map((i) => {
        const r = playerRelationships[i];
        return typeof r === "number" ? newSeat.get(r) ?? "away" : r;
      });
    }
    startGame({ ...setup, players, sober: playerSober, genders: playerGenders, likes: playerLikes, relationships: playerRelationships, customCards });
  };

  const onPlay = () => (state.phase === "playing" ? setConfirmReplaceGame(true) : play());

  const confirmSave = () => {
    const name = presetName.trim() || t("preset.namePlaceholder");
    savePreset({ ...currentSetup(), name }, replaceSlot);
    setSaveOpen(false);
    toast(t("preset.saved"));
  };
  const slotsFull = presets.length >= MAX_PRESETS && !presets.some((p) => p.name.trim().toLowerCase() === presetName.trim().toLowerCase());

  const typing = keyboardOpen && step === 2;

  return (
    <div className={`mx-auto flex w-full max-w-lg flex-col px-4 pb-3 pt-3 ${typing ? "h-[calc(100dvh-var(--safe-top))]" : "h-[calc(100dvh-4.5rem-var(--safe-top))]"}`}>
      {/* Top bar: back, progress, options */}
      <div className={`items-center justify-between ${typing ? "hidden" : "flex"}`}>
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={goBack} aria-label={t("wizard.back")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          {[1, 2].map((s) => (
            <span key={s} className={`h-2 rounded-full transition-all ${s === step ? "w-6 bg-primary" : "w-2 bg-border"}`} />
          ))}
        </div>
        <Button variant="ghost" className="h-10 gap-1.5 px-2 text-sm" onClick={() => setOptionsOpen(true)}>
          <Settings2 className="h-5 w-5" /> {t("options.title")}
        </Button>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: step === 2 ? 32 : -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {step === 1 ? (
          <>
            <div className="mb-3 mt-2 flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("wizard.step", { n: 1 })}</p>
                <h1 className="font-display text-3xl font-bold text-primary">{t("setup.packsTitle")}</h1>
              </div>
              <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={surpriseMe}>
                <Shuffle className="h-4 w-4" /> {t("wizard.surprise")}
              </Button>
            </div>
            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 overflow-y-auto">
              {ALL_EXTENSIONS.map((ext) => {
                const on = extensions.has(ext);
                return (
                  <button
                    key={ext}
                    onClick={() => toggleExtension(ext)}
                    className={`relative flex flex-col justify-center rounded-xl border-2 px-3 py-2 text-left transition-colors ${
                      on ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    {on && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
                    <span className={`block pr-5 text-[15px] font-bold uppercase tracking-wide ${on ? "text-primary" : "text-foreground"}`}>
                      {packLabel(ext, lang)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{packDescription(ext, lang)}</span>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => setStep(2)} className="mt-3 w-full py-7 font-display text-xl font-bold">
              {t("wizard.next")}
            </Button>
          </>
        ) : (
          <>
            <div className={`mb-3 mt-2 items-end justify-between gap-2 ${typing ? "hidden" : "flex"}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("wizard.step", { n: 2 })}</p>
                <h1 className="font-display text-3xl font-bold text-primary">{t("setup.playersTitle")}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setPlayerCount(Math.max(2, playerCount - 1))} disabled={playerCount <= 2}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-7 text-center font-display text-2xl font-bold text-primary">{playerCount}</span>
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setPlayerCount(Math.min(MAX_PLAYERS, playerCount + 1))} disabled={playerCount >= MAX_PLAYERS}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
              {Array.from({ length: playerCount }).map((_, i) => (
                <div key={i} className={matching ? "rounded-xl border border-border bg-card p-2" : ""}>
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center font-display text-base font-bold text-muted-foreground">{i + 1}</span>
                  <Input
                    ref={(el) => (nameRefs.current[i] = el)}
                    placeholder={t("setup.playerPlaceholder", { n: i + 1 })}
                    value={names[i]}
                    onChange={(e) => setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                    onKeyDown={onNameKeyDown(i)}
                    enterKeyHint={i + 1 < playerCount ? "next" : "done"}
                    autoCapitalize="words"
                    autoComplete="off"
                    autoCorrect="off"
                    className="h-12 min-w-0 flex-1 text-base"
                  />
                  <button
                    onClick={() => setSober((prev) => prev.map((s, j) => (j === i ? !s : s)))}
                    aria-pressed={sober[i]}
                    className={`flex h-12 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                      sober[i] ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <WineOff className="h-4 w-4" /> {t("player.sober")}
                  </button>
                </div>
                {matching && (
                  <div className="mt-2 space-y-1.5 pl-8">
                    <ChipRow label={t("player.is")}>
                      {(["m", "f", "x"] as const).map((g) => (
                        <Chip key={g} on={genders[i] === g} onClick={() => toggleGender(i, g)}>{t(`gender.${g}`)}</Chip>
                      ))}
                    </ChipRow>
                    <ChipRow label={t("player.into")}>
                      {(["m", "f"] as const).map((g) => (
                        <Chip key={g} on={!!likes[i]?.includes(g)} onClick={() => toggleLike(i, g)}>{t(`likes.${g}`)}</Chip>
                      ))}
                      <Chip on={likes[i]?.length === 0} onClick={() => toggleLike(i, "none")}>{t("likes.none")}</Chip>
                    </ChipRow>
                    <ChipRow label="">
                      <Chip on={relationships[i] !== null} onClick={() => toggleTaken(i)}>{t("player.taken")}</Chip>
                      {relationships[i] !== null && (
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {t("player.with")}
                          <select
                            value={relationships[i] === "away" ? "away" : String(relationships[i])}
                            onChange={(e) => setPartner(i, e.target.value === "away" ? "away" : Number(e.target.value))}
                            className="h-8 max-w-[9rem] rounded-full bg-secondary px-2 text-xs font-semibold text-foreground"
                          >
                            <option value="away">{t("player.partnerAway")}</option>
                            {Array.from({ length: playerCount }).map((_, j) =>
                              j === i ? null : (
                                <option key={j} value={j}>
                                  {names[j].trim() || t("setup.playerPlaceholder", { n: j + 1 })}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      )}
                    </ChipRow>
                  </div>
                )}
                </div>
              ))}
            </div>

            <div className={`mt-3 space-y-2 ${typing ? "hidden" : ""}`}>
              <ToggleRow
                icon={<Shuffle className="h-4 w-4 text-primary" />}
                label={t("wizard.randomOrder")}
                hint={t("wizard.randomOrderHint")}
                checked={draft.randomOrder}
                onChange={(v) => update({ randomOrder: v })}
              />
              {matchAvailable && (
                <ToggleRow
                  icon={<Heart className="h-4 w-4 text-primary" />}
                  label={t("setup.genderMatch")}
                  hint={t("setup.genderMatchHint")}
                  checked={draft.genderMatch}
                  onChange={(v) => update({ genderMatch: v })}
                />
              )}
            </div>

            {deckTooSmall && !typing && (
              <p className="mt-2 text-center text-sm text-destructive">{t("setup.deckTooSmall", { n: availableCardCount })}</p>
            )}
            <div className={`mt-3 gap-2 ${typing ? "hidden" : "flex"}`}>
              <Button variant="outline" onClick={() => setSaveOpen(true)} className="h-auto gap-1.5 px-4 py-4 text-sm font-semibold">
                <Bookmark className="h-4 w-4" /> {t("preset.save")}
              </Button>
              <Button onClick={onPlay} disabled={deckTooSmall} className="h-auto flex-1 gap-2 py-4 font-display text-xl font-bold">
                <Play className="h-5 w-5" /> {t("tabs.play")}
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {/* Options: the rules most groups never change */}
      <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("options.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[15px] font-semibold">{t("setup.cardsPerTurn")}</span>
              <Segmented options={[1, 2, 3]} value={draft.cardsPerTurn} onChange={(v) => update({ cardsPerTurn: v })} label={String} />
            </div>
            <div className="space-y-2">
              <span className="text-[15px] font-semibold">{t("setup.rounds")}</span>
              <Segmented
                options={ROUND_OPTIONS}
                value={draft.maxRounds}
                onChange={(v) => update({ maxRounds: v })}
                label={(v) => (v === null ? t("setup.endless") : String(v))}
              />
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[15px] font-semibold">{t("setup.customCards", { n: customCards.length })}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("options.customHint")}</p>
            </div>
            <Button className="w-full" onClick={() => setOptionsOpen(false)}>{t("options.done")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as preset */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("preset.saveTitle")}</DialogTitle>
            <DialogDescription>{t("preset.saveBody")}</DialogDescription>
          </DialogHeader>
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder={t("preset.namePlaceholder")}
            maxLength={30}
            className="h-12 text-base"
          />
          {slotsFull && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("preset.replace")}</p>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setReplaceSlot(i)}
                  className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold ${
                    replaceSlot === i ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {p.name}
                  {replaceSlot === i && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
          <Button onClick={confirmSave} className="w-full py-5 text-base font-bold">{t("preset.confirm")}</Button>
        </DialogContent>
      </Dialog>

      {/* Starting over a saved game needs a yes */}
      <AlertDialog open={confirmReplaceGame} onOpenChange={setConfirmReplaceGame}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("setup.replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("setup.replaceBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={play}>{t("setup.startNew")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
