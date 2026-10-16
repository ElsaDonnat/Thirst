import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ALL_EXTENSIONS, DEFAULT_CARDS, type Card } from "@/data/cards";
import { CARDS_FR, PACK_DESCRIPTIONS, PACK_LABELS_FR } from "@/data/cards.fr";
import { FORFEITS, involvesDrinking } from "@/data/forfeits";
import { STRINGS } from "@/i18n/strings";
import { cardText } from "@/i18n/cards";
import { canGetSpicy, isInto, personalizeCard, type Likes, type TargetContext } from "@/lib/targeting";
import { fromLabels, tokensIn, withLabels } from "@/lib/tokens";
import { freshGame, nextTurn, useGameState, type GameConfig } from "@/hooks/useGameState";

const card = (name: string) => DEFAULT_CARDS.find((c) => c.name === name)!;

const baseConfig = (players: string[], extra: Partial<GameConfig> = {}): GameConfig => ({
  players,
  sober: players.map(() => false),
  genders: players.map(() => null),
  likes: players.map(() => null),
  relationships: players.map(() => null),
  enabledExtensions: ["ORIGINAL"],
  customCards: [],
  cardsPerTurn: 3,
  maxRounds: null,
  genderMatch: false,
  ...extra,
});

describe("cards and translation", () => {
  it("has one French card per English card, with the same player slots", () => {
    expect(CARDS_FR).toHaveLength(DEFAULT_CARDS.length);
    DEFAULT_CARDS.forEach((c, i) => {
      expect(CARDS_FR[i].name.trim()).not.toBe("");
      expect(tokensIn(CARDS_FR[i].rule), `${i} ${c.name}`).toEqual(tokensIn(c.rule));
    });
  });

  it("labels and describes every pack in both languages", () => {
    for (const pack of ALL_EXTENSIONS) {
      expect(PACK_LABELS_FR[pack]).toBeTruthy();
      expect(PACK_DESCRIPTIONS[pack]?.en).toBeTruthy();
      expect(PACK_DESCRIPTIONS[pack]?.fr).toBeTruthy();
    }
  });

  it("has enough flirty cards that name someone", () => {
    const flirtyNamed = DEFAULT_CARDS.filter((c) => c.extension === "FLIRTY" && tokensIn(c.rule).includes("match"));
    expect(flirtyNamed.length).toBeGreaterThanOrEqual(12);
    expect(DEFAULT_CARDS.filter((c) => c.extension === "FLIRTY" && !c.spicy).length).toBeGreaterThanOrEqual(10);
  });

  it("contains no em or en dashes in any user-facing text", () => {
    const all = [
      ...Object.values(STRINGS.en),
      ...Object.values(STRINGS.fr),
      ...DEFAULT_CARDS.flatMap((c) => [c.name, c.rule]),
      ...CARDS_FR.flatMap((c) => [c.name, c.rule]),
      ...Object.values(PACK_DESCRIPTIONS).flatMap((d) => [d.en, d.fr]),
      ...FORFEITS.flatMap((f) => [f.en, f.fr]),
    ];
    for (const s of all) expect(s).not.toMatch(/[—–]/);
  });

  it("spots cards that involve drinking", () => {
    expect(involvesDrinking(card("Gambler").rule)).toBe(true);
    expect(involvesDrinking("Bois 3 gorgées.")).toBe(true);
    expect(involvesDrinking(card("Twerk!").rule)).toBe(false);
  });
});

describe("player slots", () => {
  const ctx: TargetContext = {
    players: ["Ana", "Ben", "Cleo", "Dan"],
    genders: ["f", "m", "f", "m"],
    likes: [null, null, null, null],
    relationships: [null, null, null, null],
    targetCounts: [0, 0, 0, 0],
    currentPlayerIndex: 0,
    genderMatch: false,
  };

  it("always names someone, never the player whose turn it is", () => {
    for (let i = 0; i < 300; i++) {
      const dealt = personalizeCard(card("Mates"), ctx);
      expect(dealt.targets).toHaveLength(1);
      expect(dealt.targets).not.toContain(0);
    }
  });

  it("prefers players who have been named less", () => {
    const picks = Array.from({ length: 2000 }, () => personalizeCard(card("Mates"), { ...ctx, targetCounts: [0, 5, 0, 0] }))
      .flatMap((c) => c.targets ?? []);
    expect(picks.filter((p) => p === 1).length).toBeLessThan(picks.filter((p) => p === 2).length / 5);
  });

  it("prefers someone mutually interested", () => {
    const likes: Likes[] = [["m"], ["f"], ["m"], ["m"]];
    for (let i = 0; i < 300; i++) {
      expect(personalizeCard(card("Massage"), { ...ctx, likes, genderMatch: true }).targets).toEqual([1]);
    }
  });

  it("falls back to someone they're into, then anyone", () => {
    for (let i = 0; i < 200; i++) {
      const dealt = personalizeCard(card("Sweet talk"), { ...ctx, likes: [["m"], [], [], []], genderMatch: true });
      expect([1, 3]).toContain(dealt.targets![0]);
    }
    expect(personalizeCard(card("Sweet talk"), { ...ctx, likes: [[], null, null, null], genderMatch: true }).targets).toHaveLength(1);
  });

  it("treats blank details as open to anyone", () => {
    expect(isInto(0, 1, ["f", null], [null, null])).toBe(true);
    expect(isInto(0, 1, ["f", "x"], [["m"], null])).toBe(true);
    expect(isInto(0, 1, ["f", "f"], [["m"], null])).toBe(false);
    expect(isInto(0, 1, ["f", "m"], [[], null])).toBe(false);
  });

  it("prefers drinkers for random slots on drinking cards", () => {
    for (let i = 0; i < 200; i++) {
      const dealt = personalizeCard(card("Gambler"), { ...ctx, sober: [false, true, true, false] });
      expect(dealt.targets).toEqual([3]);
    }
  });

  it("fills custom slots with different players and shows readable labels", () => {
    const custom: Card = { type: "Gift", name: "Date", rule: "{random} buys {match} a drink", extension: "CUSTOM" };
    for (let i = 0; i < 300; i++) {
      const [random, match] = personalizeCard(custom, { ...ctx, likes: [["m"], ["f"], ["m"], ["m"]], genderMatch: true }).targets!;
      expect(random).not.toBe(match);
      if (random !== 1) expect(match).toBe(1);
    }
    expect(cardText({ ...custom, targets: [2, 1] }, "en", ctx.players).rule).toBe("Cleo buys Ben a drink");
    expect(withLabels("Kiss {match}", "en")).toBe("Kiss [someone they're into]");
    expect(withLabels("{match} boit", "fr")).toBe("[quelqu'un qui lui plaît] boit");
    expect(fromLabels("[random player] and [joueur au hasard] toast [someone they're into]")).toBe("{random} and {random} toast {match}");
    expect(fromLabels("Kiss [crush]")).toBe("Kiss {match}");
  });

  it("uses French elision before a name starting with a vowel", () => {
    const dealt = { ...card("Hand in hand"), targets: [1] };
    expect(cardText(dealt, "fr", ["Zoé", "Anna"]).rule).toBe("Tiens la main d'Anna jusqu'à ton prochain tour.");
    expect(cardText({ ...dealt, targets: [0] }, "fr", ["Zoé", "Anna"]).rule).toBe("Tiens la main de Zoé jusqu'à ton prochain tour.");
  });
});

describe("relationships", () => {
  const ctx: TargetContext = {
    players: ["Ana", "Ben", "Cleo", "Dan"],
    genders: ["f", "m", "f", "m"],
    likes: [["m"], ["f"], ["m"], ["f"]],
    relationships: [null, null, null, null],
    targetCounts: [0, 0, 0, 0],
    currentPlayerIndex: 0,
    genderMatch: true,
  };

  it("pairs someone with their partner when the partner is playing", () => {
    for (let i = 0; i < 100; i++) {
      expect(personalizeCard(card("Lap time"), { ...ctx, relationships: [3, null, null, 0] }).targets).toEqual([3]);
    }
  });

  it("never names a taken player on a spicy card", () => {
    // Ben is taken by someone who isn't here; Dan is free
    for (let i = 0; i < 200; i++) {
      expect(personalizeCard(card("Lap time"), { ...ctx, relationships: [null, "away", null, null] }).targets).toEqual([3]);
    }
  });

  it("gives a taken player someone they wouldn't usually be into on mild cards", () => {
    for (let i = 0; i < 200; i++) {
      const dealt = personalizeCard(card("Sweet talk"), { ...ctx, relationships: ["away", null, null, null] });
      expect(dealt.targets).toEqual([2]);
    }
  });

  it("keeps the partner for the match slot even when a random slot comes first", () => {
    const card: Card = { type: "Gift", name: "Date", rule: "{random} watches while you dance with {match}", extension: "CUSTOM" };
    for (let i = 0; i < 300; i++) {
      const [random, match] = personalizeCard(card, { ...ctx, relationships: [3, null, null, 0] }).targets!;
      expect(match).toBe(3);
      expect(random).not.toBe(3);
    }
  });

  it("keeps a spicy card between partners even with only a random slot", () => {
    const card: Card = { type: "Strike", name: "Lap", rule: "{random} sits on your lap", extension: "CUSTOM", spicy: true };
    for (let i = 0; i < 100; i++) {
      expect(personalizeCard(card, { ...ctx, relationships: [2, null, 0, null] }).targets).toEqual([2]);
    }
    // Without matching turned on, relationships are ignored entirely
    const picks = new Set(Array.from({ length: 200 }, () => personalizeCard(card, { ...ctx, relationships: [2, null, 0, null], genderMatch: false }).targets![0]));
    expect(picks.size).toBeGreaterThan(1);
  });

  it("keeps spicy cards away from taken players whose partner isn't here", () => {
    expect(canGetSpicy(0, ["away"], true)).toBe(false);
    expect(canGetSpicy(0, [1, 0], true)).toBe(true);
    expect(canGetSpicy(0, ["away"], false)).toBe(true);

    let state = freshGame(baseConfig(["Ana", "Ben"], { enabledExtensions: ["FLIRTY"], genderMatch: true, relationships: ["away", null], cardsPerTurn: 2 }));
    for (let turn = 0; turn < 40; turn++) {
      if (state.currentPlayerIndex === 0) expect(state.currentCards.some((c) => c.spicy)).toBe(false);
      state = nextTurn(state, { pickedIndex: 0 });
    }
  });
});

describe("sober players and links", () => {
  it("gives sober players forfeits instead of sips", () => {
    let state = freshGame(baseConfig(["Ana", "Ben"], { sober: [true, false] }));
    state = nextTurn(state, { pickedIndex: null, forfeit: 2 });
    expect(state.sips).toEqual([0, 0]);
    expect(state.forfeits).toEqual([1, 0]);
    expect(state.history[0].forfeit).toBe(2);
  });

  it("attaches a forfeit to drinking cards dealt to a sober player", () => {
    let state = freshGame(baseConfig(["Ana", "Ben"], { sober: [false, true] }));
    for (let turn = 0; turn < 30; turn++) {
      const soberTurn = state.currentPlayerIndex === 1;
      for (const c of state.currentCards) {
        expect(c.forfeit !== undefined).toBe(soberTurn && involvesDrinking(c.rule));
      }
      state = nextTurn(state, { pickedIndex: 0 });
    }
  });

  it("records Buddy and Mates links and applies them when someone skips", () => {
    let state = freshGame(baseConfig(["Ana", "Ben", "Cleo"], { sober: [false, false, true] }));

    // Ana plays the "choose a player" Buddy card and picks Ben
    const buddyChoice = DEFAULT_CARDS.filter((c) => c.name === "Buddy").find((c) => !tokensIn(c.rule).length)!;
    state = { ...state, currentPlayerIndex: 0, currentCards: [buddyChoice] };
    state = nextTurn(state, { pickedIndex: 0, chosen: 1 });
    // Ana then plays a Mates card naming Cleo
    state = { ...state, currentPlayerIndex: 0, currentCards: [{ ...card("Mates"), targets: [2] }] };
    state = nextTurn(state, { pickedIndex: 0 });
    expect(state.links).toEqual([
      { from: 0, to: 1, kind: "buddy" },
      { from: 0, to: 2, kind: "mates" },
    ]);

    // Ana takes the sips: Ben drinks along, Cleo is sober so she does a forfeit
    state = { ...state, currentPlayerIndex: 0 };
    state = nextTurn(state, { pickedIndex: null, forfeit: 4 });
    expect(state.sips).toEqual([15, 15, 0]);
    expect(state.forfeits).toEqual([0, 0, 1]);
    const last = state.history[state.history.length - 1];
    expect(last.alsoDrank).toEqual([1]);
    expect(last.alsoForfeit).toEqual([2]);

    // Cleo (sober) takes a forfeit: her mate Ana does the same forfeit, not sips
    state = { ...state, currentPlayerIndex: 2 };
    state = nextTurn(state, { pickedIndex: null, forfeit: 5 });
    expect(state.sips).toEqual([15, 15, 0]);
    expect(state.forfeits).toEqual([1, 0, 2]);
    expect(state.history[state.history.length - 1]).toMatchObject({ forfeit: 5, alsoForfeit: [0] });
  });
});

describe("game flow", () => {
  it("ends after the chosen number of rounds and counts skipped sips", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame(baseConfig(["A", "B"], { maxRounds: 3 })));
    for (let turn = 0; turn < 6; turn++) {
      expect(result.current.state.phase).toBe("playing");
      act(() => (turn % 2 === 0 ? result.current.skipCards() : result.current.pickCard(0)));
    }
    expect(result.current.state.phase).toBe("finished");
    expect(result.current.state.sips).toEqual([45, 0]);
  });

  it("records history and undoes the last turn exactly", () => {
    const { result } = renderHook(() => useGameState());
    act(() => result.current.startGame(baseConfig(["A", "B", "C"], { cardsPerTurn: 2 })));
    expect(result.current.canUndo).toBe(false);
    const before = result.current.state;
    act(() => result.current.skipCards());
    expect(result.current.state.history).toEqual([{ round: 1, player: 0, card: null }]);
    act(() => result.current.pickCard(1));
    expect(result.current.state.history[1]).toMatchObject({ round: 1, player: 1 });
    expect(result.current.state.history[1].card).not.toBeNull();
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toEqual(before);
    expect(result.current.canUndo).toBe(false);
  });
});
