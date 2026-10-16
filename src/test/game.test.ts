import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_CARDS } from "@/data/cards";
import { CARDS_FR, PACK_DESCRIPTIONS, PACK_LABELS_FR, TARGETABLE_FR } from "@/data/cards.fr";
import { ALL_EXTENSIONS } from "@/data/cards";
import { STRINGS } from "@/i18n/strings";
import { cardText } from "@/i18n/cards";
import { personalizeCard, TARGETABLE } from "@/lib/targeting";
import { useGameState } from "@/hooks/useGameState";

describe("French translation", () => {
  it("has one French card per English card", () => {
    expect(CARDS_FR).toHaveLength(DEFAULT_CARDS.length);
    CARDS_FR.forEach((c) => {
      expect(c.name.trim()).not.toBe("");
      expect(c.rule.trim()).not.toBe("");
    });
  });

  it("labels and describes every pack in both languages", () => {
    for (const pack of ALL_EXTENSIONS) {
      expect(PACK_LABELS_FR[pack]).toBeTruthy();
      expect(PACK_DESCRIPTIONS[pack]?.en).toBeTruthy();
      expect(PACK_DESCRIPTIONS[pack]?.fr).toBeTruthy();
    }
  });

  it("can name a player on every targetable card in both languages", () => {
    const players = ["Alice", "Bob"];
    for (const entry of TARGETABLE) {
      expect(TARGETABLE_FR[entry.from], entry.from).toBeTruthy();
      const cards = DEFAULT_CARDS.filter((c) => c.rule.includes(entry.from));
      expect(cards.length, entry.from).toBeGreaterThan(0);
      for (const card of cards) {
        const targeted = { ...card, targets: entry.pair ? [0, 1] : [0] };
        for (const lang of ["en", "fr"] as const) {
          const { rule } = cardText(targeted, lang, players);
          expect(rule, `${lang}: ${card.name}`).toContain("Alice");
          expect(rule).not.toMatch(/\{p2?\}/);
        }
      }
    }
  });

  it("contains no em or en dashes in any user-facing text", () => {
    const all = [
      ...Object.values(STRINGS.en),
      ...Object.values(STRINGS.fr),
      ...CARDS_FR.flatMap((c) => [c.name, c.rule]),
      ...Object.values(PACK_DESCRIPTIONS).flatMap((d) => [d.en, d.fr]),
    ];
    for (const s of all) expect(s).not.toMatch(/[—–]/);
  });
});

describe("player targeting", () => {
  const mates = DEFAULT_CARDS.find((c) => c.name === "Mates")!;
  const massage = DEFAULT_CARDS.find((c) => c.name === "Massage")!;
  const ctx = {
    players: ["Ana", "Ben", "Cleo", "Dan"],
    genders: ["f", "m", "f", "m"] as ("m" | "f")[],
    targetCounts: [0, 0, 0, 0],
    currentPlayerIndex: 0,
    genderMatch: false,
  };

  it("never names the player whose turn it is", () => {
    for (let i = 0; i < 300; i++) {
      const card = personalizeCard(mates, ctx);
      if (card.targets) expect(card.targets).not.toContain(0);
    }
  });

  it("names someone on roughly half of eligible cards", () => {
    const hits = Array.from({ length: 1000 }, () => personalizeCard(mates, ctx)).filter((c) => c.targets).length;
    expect(hits).toBeGreaterThan(400);
    expect(hits).toBeLessThan(600);
  });

  it("prefers players who have been named less", () => {
    const counts = [0, 5, 0, 0];
    const picks = Array.from({ length: 2000 }, () => personalizeCard(mates, { ...ctx, targetCounts: counts }))
      .flatMap((c) => c.targets ?? []);
    const ben = picks.filter((p) => p === 1).length;
    const cleo = picks.filter((p) => p === 2).length;
    expect(ben).toBeLessThan(cleo / 5);
  });

  it("picks the opposite gender on flirty cards when matching is on", () => {
    for (let i = 0; i < 300; i++) {
      const card = personalizeCard(massage, { ...ctx, genderMatch: true });
      if (card.targets) expect(ctx.genders[card.targets[0]]).toBe("m");
    }
  });
});

describe("game flow", () => {
  it("ends after the chosen number of rounds and counts skipped sips", () => {
    const { result } = renderHook(() => useGameState());
    act(() =>
      result.current.startGame({
        players: ["A", "B"],
        genders: [null, null],
        enabledExtensions: ["ORIGINAL"],
        customCards: [],
        cardsPerTurn: 3,
        maxRounds: 3,
        genderMatch: false,
      }),
    );
    // 3 rounds x 2 players = 6 turns; A skips every turn
    for (let turn = 0; turn < 6; turn++) {
      expect(result.current.state.phase).toBe("playing");
      act(() => (turn % 2 === 0 ? result.current.skipCards() : result.current.pickCard(0)));
    }
    expect(result.current.state.phase).toBe("finished");
    expect(result.current.state.sips).toEqual([45, 0]);
  });

  it("records history and undoes the last turn exactly", () => {
    const { result } = renderHook(() => useGameState());
    act(() =>
      result.current.startGame({
        players: ["A", "B", "C"],
        genders: [null, null, null],
        enabledExtensions: ["ORIGINAL"],
        customCards: [],
        cardsPerTurn: 2,
        maxRounds: null,
        genderMatch: false,
      }),
    );
    expect(result.current.canUndo).toBe(false);
    const before = result.current.state;
    act(() => result.current.skipCards());
    expect(result.current.state.history).toEqual([{ round: 1, player: 0, card: null }]);
    expect(result.current.state.currentPlayerIndex).toBe(1);
    act(() => result.current.pickCard(1));
    expect(result.current.state.history[1]).toMatchObject({ round: 1, player: 1 });
    expect(result.current.state.history[1].card).not.toBeNull();
    expect(result.current.state.history).toHaveLength(2);

    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toEqual(before);
    expect(result.current.canUndo).toBe(false);
  });
});
