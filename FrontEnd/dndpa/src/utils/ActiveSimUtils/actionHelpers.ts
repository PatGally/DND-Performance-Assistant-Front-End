import type { Dispatch, SetStateAction } from "react";
import type { CreatureAction } from "../../types/action.ts";
import type {Creature, PlayerCreature} from "../../types/creature.ts";
import type {
  ActionExecutionSession,
  ActionRequestDraft,
  AoeToken,
  Encounter,
  ManualAoePlacement,
  NormalizedAction,
  PendingPreTurnResolution,
  RecommendationTarget,
  RollMode,
    StatKey
} from "../../types/SimulationTypes.ts";

import {isBasicAction, isMonsterAction, isSpellAction} from "./ActionTypeChecker.ts";
import { actionsGet } from "../../api/ActionsGet.ts";
import {
  getCreatureCid,
  getCreatureName,
  getCreaturePosition,
  getCurrentTurnCreatureFromEncounter,
  resolveTargetToCid,
} from "./CreatureHelpers.ts";
import { fetchUUID } from "../../api/UUIDGet.ts";
import {
  extractLineWidthCells,
  feetToCells,
  findActionByName, getFootprintCenterCell,
  isDirectionalShape,
  normalizeAoeShape,
  normalizeGridCoords,
  resolveAoeTokenImageNameFromStats,
    extractActionTiming
} from "./aoeHelpers.ts";
import { basicActionGet } from "../../api/BasicActionGet.ts";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import { getEncounter } from "../../api/EncounterGet.ts";
import { getActorByConcentrationID } from "./PreTurnHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

type RollBounds = {
  min: number;
  max: number;
};

const SPELLCASTING_ABILITY_BY_CLASS: Record<string, StatKey> = {
  artificer: "INT",
  bard: "CHA",
  cleric: "WIS",
  druid: "WIS",
  paladin: "CHA",
  ranger: "WIS",
  sorcerer: "CHA",
  warlock: "CHA",
  wizard: "INT",
};

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

export type HandleActionSubmissionParams = {
  action: CreatureAction;
  currentTurnCreature?: Creature;
  setManualLock: StateSetter<boolean>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
};
export type HandlePASubmissionParams = {
  name: string;
  prob: number;
  eDam: number;
  impact: number;
  overallRank : number;
  base_weight : number;
  ml_weight : number;
  useML : boolean;
  final_weight : number;
  candidateCount : number;
  targets: RecommendationTarget;
  previewResultID?: string;
  currentTurnCreature?: Creature;
  encounterData?: Encounter;
  currentTurnActions?: CreatureAction[];
  setManualLock: StateSetter<boolean>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
};
export type HandleActionExecutionParams = {
  finalDraft: ActionRequestDraft;
  eid?: string;
  currentTurnCreature?: Creature;
  encounterData?: Encounter;
  actionExecutionSession?: ActionExecutionSession;
  aoeTokens: AoeToken[];
  setEncounterData: StateSetter<Encounter | undefined>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setManualLock: StateSetter<boolean>;
  setInitiativeRefreshKey: StateSetter<number>;
};
export type HandlePreTurnExecutionParams = {
  finalDraft: ActionRequestDraft;
  eid?: string;
  currentTurnCreature?: Creature;
  encounterData?: Encounter;
  preTurnQueue: PendingPreTurnResolution[];
  aoeTokens: AoeToken[];
  setManualLock: StateSetter<boolean>;
  setPreTurnQueue: StateSetter<PendingPreTurnResolution[]>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setInitiativeRefreshKey: StateSetter<number>;
};

//ONLOAD EFFECT
export const loadActions = async (
  currentTurnCreature: Creature,
  eid: string,
  setCurrentTurnActions: StateSetter<CreatureAction[] | undefined>
): Promise<void> => {
  if (!currentTurnCreature) return;
  const currentActions = await actionsGet(eid, getCreatureCid(currentTurnCreature));
  setCurrentTurnActions(currentActions);
};



//HELPER METHODS
export function buildRequiredInputs(normalized: NormalizedAction): string[] {
  const fields: string[] = [];

  if (normalized.rollMode === "toHit" || normalized.rollMode === "onHit") {
    fields.push("attackRoll");
  } else if (normalized.rollMode === "save") {
    fields.push("save");
  }

  if (normalized.hasDamage) {
    fields.push("damageRoll");
  }

  return fields;
}

export function isCriticalAttackRoll(
  rollMode: string,
  rawRoll: string,
  rollBounds: RollBounds | null
): boolean {
  if (!(rollMode === "toHit" || rollMode === "onHit")) return false;
  if (!rollBounds) return false;

  const rollValue = Number(rawRoll.trim());
  return Number.isFinite(rollValue) && rollValue === rollBounds.max;
}

export function getCriticalDamageBounds(
  baseBounds: RollBounds | null,
  isCrit: boolean
): RollBounds | null {
  if (!baseBounds) return null;
  if (!isCrit) return baseBounds;

  return {
    min: baseBounds.min * 2,
    max: baseBounds.max * 2,
  };
}

function getTargetSaveBonus(creature: Creature, saveType: string): number {
  const key = saveType.toUpperCase() as StatKey;

  if (isPlayerCreatureLocal(creature)) {
    return toNumber(creature.stats.saveProfs?.[key]) ?? 0;
  }

  return toNumber(creature.saveProfs?.[key]) ?? 0;
}

export function getRollBoundsForTarget(actionSession: ActionExecutionSession, creature: Creature): RollBounds | null {
  const rollMode = actionSession.action.rollMode?.toLowerCase();

  if (rollMode === "tohit" || rollMode === "onhit") {
    const bonus = actionSession.action.attackBonus ?? 0;
    return {
      min: 1 + bonus,
      max: 20 + bonus,
    };
  }

  if (rollMode === "save") {
    const bonus = getTargetSaveBonus(creature, actionSession.action.saveType);
    return {
      min: 1 + bonus,
      max: 20 + bonus,
    };
  }

  return null;
}

export function getDamageBounds(actionSession: ActionExecutionSession): RollBounds | null {
  const dieNum = actionSession.action.damageDieNum;
  const dieType = actionSession.action.damageDieType;

  if (!dieNum || !dieType) return null;

  const damageMod = actionSession.action.resolvedDamageMod ?? 0;

  return {
    min: dieNum + damageMod,
    max: (dieNum * dieType) + damageMod,
  };
}

export function formatBounds(bounds: RollBounds | null): string {
  if (!bounds) return "";
  return `Min: ${bounds.min} | Max: ${bounds.max}`;
}
function isSpellActionLike(action: CreatureAction): boolean {
  const maybe = action as any;

  return (
    isSpellAction(action) ||
    typeof maybe?.spellname === "string" ||
    Array.isArray(maybe?.targeting)
  );
}

function isMonsterActionLike(action: CreatureAction): boolean {
  const maybe = action as any;

  return (
    isMonsterAction(action) ||
    (
      !isSpellActionLike(action) &&
      !maybe?.properties &&
      typeof maybe?.name === "string" &&
      (
        maybe?.rolls !== undefined ||
        maybe?.number !== undefined ||
        maybe?.actionRange !== undefined ||
        maybe?.shape !== undefined
      )
    )
  );
}

function getFirstTarget(action: CreatureAction): any | undefined {
  const maybe = action as any;
  return Array.isArray(maybe?.targeting) ? maybe.targeting[0] : undefined;
}

function getFirstDamageType(value: unknown): string {
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}

export function normalizeAction(action: CreatureAction, actor?: Creature): NormalizedAction {
  const maybe = action as any;

  if (isSpellActionLike(action)) {
    const target = getFirstTarget(action);
    const rolls = target?.rolls ?? {};
    const count = toNumber(target?.number);
    const isAoe = !!target?.shape;
    const isSelf = !!target?.self;
    const parsedDamage = parseDamageDice(rolls?.damage);

    return {
      kind: "spell",
      name: String(maybe?.spellname ?? maybe?.name ?? "Unknown Spell"),
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
      rollMode: (rolls?.rollType as RollMode) || "none",
      saveType: rolls?.saveType ?? "",
      halfSave: rolls?.halfSave ?? false,
      hasDamage: !!rolls?.damage,
      actionCost: target?.actionCost ?? "",
      damage: rolls?.damage ?? "",
      damageMod: rolls?.damageMod ?? "",
      damageType: getFirstDamageType(target?.damType),

      attackBonus: getSpellAttackBonus(actor),
      damageDieNum: parsedDamage?.dieNum,
      damageDieType: parsedDamage?.dieType,
      resolvedDamageMod: resolveDamageMod(rolls?.damageMod, actor),
    };
  }

  if (isMonsterActionLike(action)) {
    const rolls = maybe?.rolls ?? {};
    const count = toNumber(maybe?.number);
    const isAoe = !!maybe?.shape;
    const parsedDamage = parseDamageDice(rolls?.damage);

    return {
      kind: "monster",
      name: String(maybe?.name ?? "Unknown Monster Action"),
      targetMode: isAoe
        ? "aoe"
        : count === 1
          ? "single"
          : (count ?? 0) > 1
            ? "multi"
            : "none",
      targetCount: count,
      range: maybe?.actionRange ?? "",
      shape: maybe?.shape ?? "",
      radius: "",
      rollMode: (rolls?.rollType as RollMode) || "none",
      saveType: rolls?.saveType ?? "",
      halfSave: rolls?.halfSave ?? false,
      hasDamage: !!rolls?.damage,
      actionCost: maybe?.actionCost ?? "",
      damage: rolls?.damage ?? "",
      damageMod: rolls?.damageMod ?? "",
      damageType: getFirstDamageType(maybe?.damType),

      attackBonus: toNumber(rolls?.attackBonus) ?? 0,
      damageDieNum: parsedDamage?.dieNum,
      damageDieType: parsedDamage?.dieType,
      resolvedDamageMod: toNumber(rolls?.damageMod) ?? 0,
    };
  }

  const properties = maybe?.properties ?? {};
  const parsedDamage = parseDamageDice(properties?.damage);

  return {
    kind: "weapon",
    name: String(maybe?.name ?? "Unknown Weapon"),
    ...WEAPON_DEFAULTS,
    hasDamage: !!properties?.damage,
    damage: properties?.damage ?? "",
    damageType: properties?.damageType ?? "",
    damageMod: "",
    weaponStat: properties?.weaponStat ?? "",

    attackBonus: getWeaponAttackBonus(actor, properties?.weaponStat),
    damageDieNum: parsedDamage?.dieNum,
    damageDieType: parsedDamage?.dieType,
    resolvedDamageMod: getWeaponDamageMod(actor, properties?.weaponStat),
  };
}

export function extractActionEffects(action: CreatureAction): {
  conditions: string[];
  statusEffects: Record<string, unknown>[];
} {
  const maybe = action as any;

  if (isSpellActionLike(action)) {
    const target = getFirstTarget(action);

    return {
      conditions: Array.isArray(target?.conditions) ? target.conditions : [],
      statusEffects: Array.isArray(target?.statusEffect)
        ? (target.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  if (isMonsterActionLike(action)) {
    return {
      conditions: Array.isArray(maybe?.conditions) ? maybe.conditions : [],
      statusEffects: Array.isArray(maybe?.statusEffect)
        ? (maybe.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  return {
    conditions: [],
    statusEffects: [],
  };
}

export function isPlayerCreatureLocal(creature: Creature): creature is PlayerCreature {
  return "stats" in creature;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseDamageDice(damage?: string): {dieNum: number; dieType: number} | null {
  if (!damage) return null;
  const match = damage.trim().match(/^(\d+)d(\d+)$/i);
  if (!match) return null;

  return {
    dieNum: Number(match[1]),
    dieType: Number(match[2]),
  };
}

export function getAbilityModifier(creature: Creature, stat: StatKey): number {
  if (isPlayerCreatureLocal(creature)) {
    const explicit = toNumber(creature.stats.modifiers?.[stat]);
    if (explicit !== null) return explicit;

    const statScore = toNumber(creature.stats.statArray[stat]);
    if (statScore !== null) return Math.floor((statScore - 10) / 2);
    return 0;
  }

  const explicit = toNumber(creature.modifiers?.[stat]);
  if (explicit !== null) return explicit;

  const statScore = toNumber(creature.statArray[stat]);
  if (statScore !== null) return Math.floor((statScore - 10) / 2);
  return 0;
}

export function getPlayerProfBonus(player: PlayerCreature): number {
  const topLevelProf = toNumber((player as Record<string, unknown>).profBonus);
  if (topLevelProf !== null) return topLevelProf;

  const statsProf = toNumber((player.stats as Record<string, unknown>).profBonus);
  if (statsProf !== null) return statsProf;

  const level = toNumber(player.stats.level) ?? 1;
  return 2 + Math.floor((Math.max(level, 1) - 1) / 4);
}

export function getSpellAttackBonus(actor?: Creature): number {
  if (!actor) return 0;

  if (isPlayerCreatureLocal(actor)) {
    const classKey = String(actor.stats.characterClass ?? "").toLowerCase();
    const castingStat = SPELLCASTING_ABILITY_BY_CLASS[classKey];
    if (!castingStat) return 0;

    return getAbilityModifier(actor, castingStat) + getPlayerProfBonus(actor);
  }

  return toNumber(actor.spellInfo?.attackRoll) ?? 0;
}

export function getWeaponAttackBonus(actor?: Creature, weaponStat?: string): number {
  if (!actor || !weaponStat) return 0;
  const stat = weaponStat.toUpperCase() as StatKey;
  const abilityMod = getAbilityModifier(actor, stat);

  if (isPlayerCreatureLocal(actor)) {
    return abilityMod + getPlayerProfBonus(actor);
  }

  return abilityMod;
}

export function getWeaponDamageMod(actor?: Creature, weaponStat?: string): number {
  if (!actor || !weaponStat) return 0;
  return getAbilityModifier(actor, weaponStat.toUpperCase() as StatKey);
}

export function resolveDamageMod(rawDamageMod: string | undefined, actor?: Creature): number {
  if (!rawDamageMod) return 0;

  if (rawDamageMod.toLowerCase() === "spellmod") {
    return getSpellAttackBonus(actor);
  }

  return toNumber(rawDamageMod) ?? 0;
}

function extractActionExecutionErrorMessage(
  error: unknown,
  fallback: string
): string {
  const axiosError = error as any;
  const data = axiosError?.response?.data;

  const detail =
    data?.detail ??
    data?.message ??
    data?.error ??
    data;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;

          if (typeof record.msg === "string") return record.msg;
          if (typeof record.message === "string") return record.message;
          if (typeof record.detail === "string") return record.detail;

          return JSON.stringify(record);
        }

        return String(item);
      })
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;

    if (typeof record.msg === "string") return record.msg;
    if (typeof record.message === "string") return record.message;
    if (typeof record.detail === "string") return record.detail;

    return JSON.stringify(record);
  }

  return fallback;
}

//SIM LOGIC
export async function handleActionSubmission({
  action,
  currentTurnCreature,
  setManualLock,
  setActionExecutionSession,
  setManualAoePlacement,
}: HandleActionSubmissionParams): Promise<void> {
  setManualLock(true);

  const { conditions, statusEffects } = extractActionEffects(action);
  const normalized = normalizeAction(action, currentTurnCreature);
  const requiredInputs = buildRequiredInputs(normalized);

  let resultID = "a";
  try {
    resultID = await fetchUUID();
  } catch (err) {
    console.error("Failed to fetch CID", err);
  }

  const draft: ActionRequestDraft = {
    resultID,
    actor: currentTurnCreature ? getCreatureName(currentTurnCreature) : "",
    action: isSpellAction(action) ? action.spellname : action.name,
    actionType: isBasicAction(action) ? `Basic` : (isSpellAction(action))
      ? `Lvl ${action.level} Spell`
      : isMonsterAction(action)
        ? "MonAction"
        : "Weapon",
    actionProb: 0,
    actionEDam: 0,
    actionImpact: 0,
        actionRanking : 0,
    base_weight :0,
    ml_weight :0,
    useML : false,
    final_weight : 0,
    candidateCount : 0,
    targets: [],
    conditions,
    statusEffects,
    outcome: {
      rollResults: [],
      diceResults: [],
    },
    extraOutcome: {
      extraRollResults: [],
      extraDiceResults: [],
    },
    timestamp: "",
  };
  console.log("Normalized action session action:", normalized);
  setActionExecutionSession({
    action: normalized,
    requiredInputs,
    draft,
    error: "",
  });

  if (normalized.targetCount === -1 || normalized.targetCount === -2) {
    const actorCid = currentTurnCreature ? getCreatureCid(currentTurnCreature) : "";
    const lineWidthCells = normalized.shape.includes("line")
      ? extractLineWidthCells(normalized.shape)
      : 1;

    const shape = normalizeAoeShape(normalized.shape);
    const selfOrigin = normalized.targetCount === -2;
    const actorPosition = normalizeGridCoords(
      currentTurnCreature ? (getCreaturePosition(currentTurnCreature) as unknown) : []
    );

    const timing = extractActionTiming(action);

    const autoAnchor = selfOrigin
      ? getFootprintCenterCell(actorPosition)
      : null;

    console.log("Logging normalized before manual placement", normalized);

    if (normalized.targetCount === -2 && !normalized.radius) {
      normalized.radius = normalized.range;
    }

    const placement: ManualAoePlacement = {
      resultID: draft.resultID,
      name: normalized.name,
      cid: actorCid,
      shape,
      radiusCells: feetToCells(normalized.radius),
      rangeCells: feetToCells(normalized.range),
      lineWidthCells,
      timing,
      token_image: resolveAoeTokenImageNameFromStats(shape, normalized.damageType),
      selfOrigin,
      originMode: selfOrigin ? "self" : "placed",
      casterCells: actorPosition,
      anchor: autoAnchor,
      stage: selfOrigin && isDirectionalShape(shape) ? "pick_direction" : "pick_anchor",
    };

    console.log("Logging placement", placement);

    setManualAoePlacement(placement);
  }
}
export async function handlePASubmission({
  name, prob, eDam, impact, overallRank, base_weight, ml_weight, useML, final_weight, candidateCount,
  targets,
  previewResultID,
  currentTurnCreature,
  encounterData,
  currentTurnActions,
  setManualLock,
  setAoeTokens,
  setActionExecutionSession,
}: HandlePASubmissionParams): Promise<void> {
  if (!currentTurnCreature || !encounterData || !currentTurnActions) return;

  let action = findActionByName(name, currentTurnActions);
  if (!action) {
    action = await basicActionGet(name);
  }
  if (!action) {
    console.error("Action does not exist in statblock!");
    return;
  }

  setManualLock(true);

  const targetNames = Array.isArray(targets) ? targets : targets.targetsHit;
  const resolvedTargets = targetNames
    .map((target) => resolveTargetToCid(target, encounterData))
    .filter((target): target is string => target !== null);

  const { conditions, statusEffects } = extractActionEffects(action);
  const normalized = normalizeAction(action, currentTurnCreature);
  const requiredInputs = buildRequiredInputs(normalized);

  let resultID = "-1";
  try {
    resultID = await fetchUUID();
  } catch (err) {
    console.error("Failed to fetch CID", err);
  }

  if (previewResultID) {
    setAoeTokens((prev) =>
      prev.map((token) =>
        token.resultID === previewResultID ? { ...token, resultID } : token
      )
    );
  }

  const draft: ActionRequestDraft = {
    resultID,
    actor: getCreatureName(currentTurnCreature),
    action: isSpellAction(action) ? action.spellname : action.name,
    actionType: isBasicAction(action) ? `Basic` : (isSpellAction(action))
      ? `Lvl ${action.level} Spell`
      : isMonsterAction(action)
        ? "MonAction"
        : "Weapon",
    actionProb: prob,
    actionEDam: eDam,
    actionImpact: impact,
    actionRanking : overallRank,
    base_weight : base_weight,
    ml_weight : ml_weight,
    useML : useML,
    final_weight : final_weight,
    candidateCount : candidateCount,
    targets: resolvedTargets,
    conditions,
    statusEffects,
    outcome: {
      rollResults: [],
      diceResults: [],
    },
    extraOutcome: {
      extraRollResults: [],
      extraDiceResults: [],
    },
    timestamp: "",
  };
  console.log("Setting draft", draft);
  console.log("Normalized action session action:", normalized);
  setActionExecutionSession({
    action: normalized,
    requiredInputs,
    draft,
    error: "",
  });
}

export async function handleActionExecution({
  finalDraft,
  eid,
  currentTurnCreature,
  encounterData,
  actionExecutionSession,
  aoeTokens,
  setEncounterData,
  setAoeTokens,
  setCurrentTurnCreature,
  setActionExecutionSession,
  setManualLock,
  setInitiativeRefreshKey,
}: HandleActionExecutionParams): Promise<void | string> {
  if (!eid || !currentTurnCreature || !encounterData || !actionExecutionSession) {
    return "Missing action execution context.";
  }

  const executedAoeToken = aoeTokens.find(
    (token) => token.resultID === finalDraft.resultID
  );

  try {
    const missingTargets =
      finalDraft.targets.length === 0 &&
      (actionExecutionSession.action.targetCount ?? 0) > 0;

    if (missingTargets) {
      setActionExecutionSession((prev) =>
        prev ? { ...prev, error: "Targets are required." } : prev
      );
      return "Targets are required.";
    }

    setActionExecutionSession((prev) =>
      prev ? { ...prev, error: null } : prev
    );

    const payload = {
      ...finalDraft,
      token: executedAoeToken ?? null,
    };

    console.log("Pre-execution payload:", payload);

    try {
      await axiosTokenInstance.post(`/encounter/${eid}/simulate/ruleset`, payload);
    } catch (error: any) {
      const message = extractActionExecutionErrorMessage(
        error,
        "Action execution failed."
      );

      console.error(message);

      setActionExecutionSession((prev) =>
        prev ? { ...prev, error: message } : prev
      );

      return message;
    }

    const updatedEncounter = await getEncounter(eid);
    if (!updatedEncounter) {
      setActionExecutionSession((prev) =>
        prev ? { ...prev, error: "Action execution failed." } : prev
      );
      return "Action execution failed.";
    }

    setEncounterData(updatedEncounter);

    setAoeTokens((prev) => {
      const withoutExecuted = prev.filter(
        (token) => token.resultID !== finalDraft.resultID
      );

      if (executedAoeToken?.timing === "lingering") {
        return [...withoutExecuted, executedAoeToken];
      }

      return withoutExecuted;
    });

    const newCurrentTurnCreature =
      getCurrentTurnCreatureFromEncounter(updatedEncounter);

    setCurrentTurnCreature(newCurrentTurnCreature);
    setActionExecutionSession(undefined);
    setManualLock(false);
    setInitiativeRefreshKey((prev) => prev + 1);
  } catch (error: any) {
    console.error("Failed to execute action:", error);

    const message = extractActionExecutionErrorMessage(
      error,
      "Error with Action Execution"
    );

    setActionExecutionSession((prev) =>
      prev ? { ...prev, error: message } : prev
    );

    return message;
  }
}

export async function handlePreTurnExecution({
  finalDraft,
  eid,
  currentTurnCreature,
  encounterData,
  preTurnQueue,
  aoeTokens,
  setManualLock,
  setPreTurnQueue,
  setActionExecutionSession,
  setEncounterData,
  setCurrentTurnCreature,
  setInitiativeRefreshKey,
}: HandlePreTurnExecutionParams): Promise<void> {
  if (!eid || !currentTurnCreature || !encounterData) return;

  const activeItem = preTurnQueue[0];
  if (!activeItem) return;

  try {
    setManualLock(true);

    const allCreatures: Creature[] = [
      ...(encounterData.players ?? []),
      ...(encounterData.monsters ?? []),
    ];

    const resolvedActor = getActorByConcentrationID(finalDraft.resultID, allCreatures);

    const cleanedDraft: ActionRequestDraft = {
      ...finalDraft,
      actor: resolvedActor || finalDraft.actor,
      conditions: [],
      statusEffects: [],
    };

    const existingAoeToken = aoeTokens.find(
      (token) => token.resultID === cleanedDraft.resultID
    );

    const tokenPayload = normalizeAoeTokenForRequest(
      existingAoeToken
        ? {
            ...existingAoeToken,
            timing: "lingering",
          }
        : undefined
    );

    const response = await axiosTokenInstance.post(
      `/encounter/${eid}/simulate/preturn`,
      {
        ...cleanedDraft,
        preTurnMeta: activeItem.effectName,
        token: tokenPayload,
      }
    );

    const savedOut = response?.data?.savedOut === true;

    if (activeItem.effectName === "lingsave" && savedOut) {
      await axiosTokenInstance.delete(
        `/encounter/${eid}/creature/${getCreatureCid(currentTurnCreature)}/pre-effect/${cleanedDraft.resultID}`
      );
    }

    const updatedEncounter = await getEncounter(eid);
    if (!updatedEncounter) {
      console.error("Failed to reload encounter after pre-turn execution.");
      return;
    }

    const updatedCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);

    setPreTurnQueue((prev) => prev.slice(1));
    setActionExecutionSession(undefined);
    setEncounterData(updatedEncounter);
    setCurrentTurnCreature(updatedCreature);
    setInitiativeRefreshKey((prev) => prev + 1);
  } catch (error) {
    console.error("Failed to execute pre-turn effect:", error);
    setActionExecutionSession((prev) =>
      prev ? { ...prev, error: "Pre-turn execution failed." } : prev
    );
  } finally {
    setManualLock(false);
  }
}

function normalizeTokenAnchorForRequest(anchor: unknown): [number, number] | null {
  if (
    Array.isArray(anchor) &&
    anchor.length === 2 &&
    typeof anchor[0] === "number" &&
    typeof anchor[1] === "number"
  ) {
    return [anchor[0], anchor[1]];
  }

  if (
    anchor &&
    typeof anchor === "object" &&
    typeof (anchor as { x?: unknown }).x === "number" &&
    typeof (anchor as { y?: unknown }).y === "number"
  ) {
    return [
      (anchor as { x: number }).x,
      (anchor as { y: number }).y,
    ];
  }

  return null;
}

function normalizeAoeTokenForRequest(token: AoeToken | undefined): {
  name: string;
  positioning: [number, number][];
  token_image: string;
  resultID: string;
  cid: string;
  anchor: [number, number];
  timing: string;
  shape: string;
} | null {
  if (!token) return null;

  const anchor = normalizeTokenAnchorForRequest((token as any).anchor);
  if (!anchor) return null;

  const positioning = Array.isArray((token as any).positioning)
    ? (token as any).positioning.filter(
        (coord: unknown): coord is [number, number] =>
          Array.isArray(coord) &&
          coord.length === 2 &&
          typeof coord[0] === "number" &&
          typeof coord[1] === "number"
      )
    : [];

  return {
    name: String((token as any).name ?? ""),
    positioning,
    token_image: String((token as any).token_image ?? ""),
    resultID: String((token as any).resultID ?? ""),
    cid: String((token as any).cid ?? ""),
    anchor,
    timing: String((token as any).timing ?? "instantaneous").toLowerCase(),
    shape: String((token as any).shape ?? ""),
  };
}