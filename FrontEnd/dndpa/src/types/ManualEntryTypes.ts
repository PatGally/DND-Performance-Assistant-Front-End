import type { StatKey } from "./SimulationTypes.ts";

export const STAT_KEYS: StatKey[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export type SpellSlotRow = [number, number];

export type StatusEffectRecord = {
    name: string;
    effect: {
        roll: string;
        attribute: string[];
        resultID: string[];
    };
};

export const DAMAGE_TYPES = [
    "fire",
    "cold",
    "lightning",
    "acid",
    "poison",
    "psychic",
    "necrotic",
    "radiant",
    "force",
    "thunder",
    "bludgeoning",
    "piercing",
    "slashing",
] as const;

export const ATTRS_BY_EFFECT = {
    advantage: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    disadvantage: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    buff: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "AC",
        "ALL save",
    ],
    debuff: [
        "attack rolls for",
        "attack rolls against",
        "AC",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    autocrit: ["attack rolls against"],
    autofail: [
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
} as const;

export type EffectKey = keyof typeof ATTRS_BY_EFFECT;

export const BLOCKED_CONDITIONS = new Set([
    "stabilized",
    "downed",
    "dead",
]);

export const BLOCKED_STATUS_EFFECTS = new Set([
    "resistance",
    "immunity",
    "vulnerability",
    "concentration",
    "lingeffect",
    "lingsave",
    "summon",
    "switchsides",
    "time stop",
]);