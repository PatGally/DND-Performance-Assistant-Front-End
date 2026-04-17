import type { SpellSlotRow, StatusEffectRecord} from "../../types/ManualEntryTypes.ts";
import {STAT_KEYS} from "../../types/ManualEntryTypes.ts";

import type {
    Creature,
    MonsterCreature,
} from "../../types/creature.ts";

import { isPlayerCreature } from "../../api/CreatureGet.ts";

import type {
    ManualAffectedCreature,
    ManualStatBlock
} from "../../types/SimulationTypes.ts";

export function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeValue(value: string): string {
    return value.trim().toLowerCase();
}

export function toDisplayName(value: string): string {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

export function toInteger(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return Math.trunc(parsed);
        }
    }

    return fallback;
}

export function getNumberValue(value: unknown, fallback = 0): number {
    return toInteger(value, fallback);
}

export function getBooleanValue(value: unknown, fallback = false): boolean {
    return typeof value === "boolean" ? value : fallback;
}

export function normalizeStatBlock(
    value: Record<string, unknown> | undefined
): ManualStatBlock | undefined {
    if (!value) return undefined;

    const out: ManualStatBlock = {};

    for (const key of STAT_KEYS) {
        if (typeof value[key] === "number") {
            out[key] = value[key] as number;
        }
    }

    return out;
}

export function expandStatBlock(
    value: ManualStatBlock | undefined
): ManualStatBlock {
    const normalized = normalizeStatBlock(
        value as Record<string, unknown> | undefined
    );

    const out: ManualStatBlock = {};

    for (const key of STAT_KEYS) {
        out[key] =
            typeof normalized?.[key] === "number"
                ? (normalized[key] as number)
                : 0;
    }

    return out;
}

export function normalizeSpellSlots(value: unknown): SpellSlotRow[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((row): SpellSlotRow | null => {
            if (!Array.isArray(row)) return null;

            const current = toInteger(row[0], 0);
            const max = toInteger(row[1], 0);

            return [current, max];
        })
        .filter((row): row is SpellSlotRow => row !== null);
}

export function serializeSpellSlots(value: SpellSlotRow[]): SpellSlotRow[] {
    const trimmed = [...value];

    while (
        trimmed.length > 0 &&
        trimmed[trimmed.length - 1][0] === 0 &&
        trimmed[trimmed.length - 1][1] === 0
    ) {
        trimmed.pop();
    }

    return trimmed;
}

export function creatureToBaseline(
    creature: Creature,
    cid: string
): ManualAffectedCreature {
    if (isPlayerCreature(creature)) {
        const s = creature.stats;
        const sRecord = s as unknown as Record<string, unknown>;

        return {
            cid,
            statArray: normalizeStatBlock(s.statArray as Record<string, unknown> | undefined),
            saveProfs: normalizeStatBlock(s.saveProfs as Record<string, unknown> | undefined),
            modifiers: normalizeStatBlock(s.modifiers as Record<string, unknown> | undefined),

            damResists: s.damResists ?? [],
            damImmunes: s.damImmunes ?? [],
            damVulns: s.damVulns ?? [],

            conImmunes: s.conImmunes ?? [],
            activeConditions: s.activeConditions ?? [],

            activeStatusEffects: Array.isArray(s.activeStatusEffects)
                ? s.activeStatusEffects.filter(
                      (item): item is Record<string, unknown> =>
                          typeof item === "object" && item !== null && "name" in item
                  )
                : [],

            hp: typeof s.hp === "number" ? s.hp : 0,
            position: Array.isArray(s.position) ? s.position : [],
            ac: typeof s.ac === "number" ? s.ac : 0,
            lResists:
                typeof sRecord.lResists === "number"
                    ? (sRecord.lResists as number)
                    : 0,
            enemy:
                typeof sRecord.enemy === "boolean"
                    ? (sRecord.enemy as boolean)
                    : false,
            spellSlots: normalizeSpellSlots(s.spellSlots),
        };
    }

    const m = creature as MonsterCreature;

    return {
        cid,
        statArray: normalizeStatBlock(m.statArray as Record<string, unknown> | undefined),
        saveProfs: normalizeStatBlock(m.saveProfs as Record<string, unknown> | undefined),
        modifiers: normalizeStatBlock(m.modifiers as Record<string, unknown> | undefined),

        damResists: m.damResists ?? [],
        damImmunes: m.damImmunes ?? [],
        damVulns: m.damVulns ?? [],

        conImmunes: m.conImmunes ?? [],
        activeConditions: m.activeConditions ?? [],

        activeStatusEffects: Array.isArray(m.activeStatusEffects)
            ? m.activeStatusEffects.filter(
                  (item): item is Record<string, unknown> =>
                      typeof item === "object" && item !== null && "name" in item
              )
            : [],

        hp: typeof m.hp === "number" ? m.hp : 0,
        position: Array.isArray(m.position) ? m.position : [],
        ac: typeof m.ac === "number" ? m.ac : 0,
        lResists: typeof m.lResists === "number" ? m.lResists : 0,
        enemy: typeof m.enemy === "boolean" ? m.enemy : false,
    };
}

export function isStatusEffectRecord(value: unknown): value is StatusEffectRecord {
    if (typeof value !== "object" || value === null) return false;
    if (!("name" in value)) return false;

    const candidate = value as { name?: unknown; effect?: unknown };
    if (typeof candidate.name !== "string") return false;

    if (candidate.effect === undefined) return true;
    if (typeof candidate.effect !== "object" || candidate.effect === null) return false;

    return true;
}

export function getStatusEffectAttributes(record: Record<string, unknown>): string[] {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return [];

    const attrs = (effect as { attribute?: unknown }).attribute;
    return Array.isArray(attrs)
        ? attrs.filter((x): x is string => typeof x === "string")
        : [];
}

export function getStatusEffectRoll(record: Record<string, unknown>): string {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return "";

    const roll = (effect as { roll?: unknown }).roll;
    return typeof roll === "string" ? roll : "";
}

export function getStatusEffectResultIDs(record: Record<string, unknown>): string[] {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return [];

    const resultID = (effect as { resultID?: unknown }).resultID;
    return Array.isArray(resultID)
        ? resultID.filter((x): x is string => typeof x === "string")
        : [];
}