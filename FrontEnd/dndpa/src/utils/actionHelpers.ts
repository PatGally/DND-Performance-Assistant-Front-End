import type {CreatureAction} from "../types/action.ts";
import type {NormalizedAction, RollMode} from "../types/SimulationTypes.ts";
import {isMonsterAction, isSpellAction} from "./ActionTypeChecker.ts";
const WEAPON_DEFAULTS = {
  targetMode: "single" as const,
  targetCount: 1,
  range: "5",
  shape: "",
  radius: "",
  rollMode: "toHit" as const,
  saveType: "",
  halfSave: false,
  actionCost: "action",
};


export function buildRequiredInputs(normalized: NormalizedAction) {
  const fields: string[] = [];

  if (normalized.rollMode === "toHit" || normalized.rollMode === "onHit") fields.push("attackRoll");
  else if (normalized.rollMode === "save") fields.push("save");
  if (normalized.hasDamage) fields.push("damageRoll");

  return fields;
}
function parseCount(value?: string | number): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function normalizeAction(action: CreatureAction): NormalizedAction {
  if (isSpellAction(action)) {
    const target = action.targeting?.[0];
    const count = parseCount(target?.number);
    const isAoe = !!target?.shape;
    const isSelf = !!target?.self;

    return {
      kind: "spell",
      name: action.spellname,
      targetMode: isSelf
        ? "self"
        : isAoe
          ? "aoe"
          : count === 1
            ? "single"
            : (count ?? 0) > 1
              ? "multi"
              : "none",
      targetCount: isSelf ? 0 : count,
      range: target?.actionRange ?? "",
      shape: target?.shape ?? "",
      radius: target?.radius ?? "",
      rollMode: (target?.rolls?.rollType as RollMode) || "none",
      saveType: target?.rolls?.saveType ?? "",
      halfSave: target?.rolls?.halfSave ?? false,
      hasDamage: !!target?.rolls?.damage,
      actionCost: target?.actionCost ?? "",
      damage: target?.rolls?.damage ?? "",
      damageMod: target?.rolls?.damageMod ?? "",
      damageType: target?.damType?.[0] ?? "",
    };
  }
  if (isMonsterAction(action)) {
    const count = parseCount(action.number);
    const isAoe = !!action.shape;

    return {
      kind: "monster",
      name: action.name,
      targetMode: isAoe
        ? "aoe"
        : count === 1
          ? "single"
          : (count ?? 0) > 1
            ? "multi"
            : "none",
      targetCount: count,
      range: action.actionRange ?? "",
      shape: action.shape ?? "",
      radius: "",
      rollMode: (action.rolls?.rollType as RollMode) || "none",
      saveType: action.rolls?.saveType ?? "",
      halfSave: action.rolls?.halfSave ?? false,
      hasDamage: !!action.rolls?.damage,
      actionCost: action.actionCost ?? "",
      damage: action.rolls?.damage ?? "",
      damageMod: action.rolls?.damageMod ?? "",
      damageType: action.damType?.[0] ?? "",
    };
  }

  // Weapon defaults
    //TODO: Account for ranged weapons in terms of range
  return {
  kind: "weapon",
  name: action.name,
  ...WEAPON_DEFAULTS,
  hasDamage: !!action.properties.damage,
  damage: action.properties.damage,
  damageType: action.properties.damageType,
  damageMod: "",
  weaponStat: action.properties.weaponStat,
};
}
export function extractActionEffects(action: CreatureAction): {
  conditions: string[];
  statusEffects: Record<string, unknown>[];
} {
  if (isSpellAction(action)) {
    const target = action.targeting?.[0];
    return {
      conditions: Array.isArray(target?.conditions) ? target.conditions : [],
      statusEffects: Array.isArray(target?.statusEffect)
        ? (target.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  if (isMonsterAction(action)) {
    return {
      conditions: Array.isArray(action.conditions) ? action.conditions : [],
      statusEffects: Array.isArray(action.statusEffect)
        ? (action.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  return {
    conditions: [],
    statusEffects: [],
  };
}