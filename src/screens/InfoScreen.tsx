import { Vibrate, Trash2, BookOpen, Coffee, Languages } from "lucide-react";
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
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useGame } from "@/context/GameContext";
import { RichText, useT } from "@/i18n";
import { typeLabel } from "@/i18n/cards";
import type { Card } from "@/data/cards";
import logoUrl from "@/assets/logo.webp";

// Keep in step with package.json / store releases
const APP_VERSION = "1.5.3";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/elsadonnat0";

const CARD_TYPES: { type: Card["type"]; className: string }[] = [
  { type: "Strike", className: "bg-card-strike" },
  { type: "Gift", className: "bg-card-gift" },
  { type: "Event", className: "bg-card-event" },
  { type: "Equip", className: "bg-card-equip" },
  { type: "Special", className: "bg-card-special" },
];

export function InfoScreen() {
  const { settings, setHaptics, setLanguage, clearAllData } = useGame();
  const { t, lang } = useT();

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-24 pt-6">
      <div>
        <h1 className="font-display text-4xl font-medium text-brand">{t("info.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("info.subtitle")}</p>
      </div>

      {/* How to play */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-brand" />
          <h2 className="font-display text-lg font-medium">{t("info.howTo")}</h2>
        </div>
        <ol className="list-decimal space-y-2 pl-5 font-body text-[15px] leading-relaxed text-foreground/80">
          <li><RichText text={t("info.step1")} /></li>
          <li><RichText text={t("info.step2")} /></li>
          <li><RichText text={t("info.step3")} /></li>
          <li><RichText text={t("info.step4")} /></li>
        </ol>
      </div>

      {/* Card types */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-medium">{t("info.cardTypes")}</h2>
        <div className="space-y-3">
          {CARD_TYPES.map(({ type, className }) => (
            <div key={type} className="flex items-center gap-3">
              <span className={`w-20 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white ${className}`}>
                {typeLabel(type, lang)}
              </span>
              <span className="font-body text-sm text-foreground/80">{t(`info.type.${type}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-medium">{t("info.settings")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-brand" />
              <span className="text-base font-semibold text-foreground">{t("info.language")}</span>
            </div>
            <LanguageSwitch value={settings.language} onChange={setLanguage} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="h-5 w-5 text-brand" />
              <span className="text-base font-semibold text-foreground">{t("info.haptics")}</span>
            </div>
            <Switch checked={settings.haptics} onCheckedChange={setHaptics} />
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" /> {t("info.clear")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">{t("info.clearTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("info.clearBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllData}>{t("info.clearConfirm")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Support */}
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="font-body text-[15px] leading-relaxed text-foreground/80">{t("info.support")}</p>
        <Button
          onClick={() => window.open(BUY_ME_A_COFFEE_URL, "_blank")}
          className="mt-3 w-full gap-2 bg-amber-400 py-6 font-display text-lg font-medium text-amber-950 hover:bg-amber-500"
        >
          <Coffee className="h-5 w-5" /> {t("info.coffee")}
        </Button>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <img src={logoUrl} alt="" className="mx-auto mb-3 h-20 w-20 rounded-[22%] border-[3px] border-foreground shadow-sm" draggable={false} />
        <p className="title-retro text-4xl">THIRST</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("info.version", { v: APP_VERSION })}</p>
        <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{t("info.about")}</p>
        <p className="mt-2 font-body text-sm font-semibold text-muted-foreground">{t("info.responsible")}</p>
      </div>
    </div>
  );
}
