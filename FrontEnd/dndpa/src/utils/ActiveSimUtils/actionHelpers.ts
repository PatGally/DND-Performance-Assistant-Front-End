import type { Dispatch, SetStateAction } from "react";
import type { CreatureAction } from "../../types/action.ts";
import type { Creature } from "../../types/creature.ts";
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
} from "../../types/SimulationTypes.ts";

import { isMonsterAction, isSpellAction } from "./ActionTypeChecker.ts";
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
  feetToCells,
  findActionByName,
  isDirectionalShape,
  normalizeAoeShape,
  normalizeGridCoords,
  resolveAoeTokenImageNameFromStats,
} from "./aoeHelpers.ts";
import { basicActionGet } from "../../api/BasicActionGet.ts";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import { getEncounter } from "../../api/EncounterGet.ts";
import { getActorByConcentrationID } from "./PreTurnHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

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
  setManualLock: StateSetter<boolean>;
  setPreTurnQueue: StateSetter<PendingPreTurnResolution[]>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setInitiativeRefreshKey: StateSetter<number>;
};

export const loadActions = async (
  currentTurnCreature: Creature,
  eid: string,
  setCurrentTurnActions: StateSetter<CreatureAction[] | undefined>
): Promise<void> => {
  if (!currentTurnCreature) return;
  const currentActions = await actionsGet(eid, getCreatureCid(currentTurnCreature));
  setCurrentTurnActions(currentActions);
};

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

export async function handleActionSubmission({
  action,
  currentTurnCreature,
  setManualLock,
  setActionExecutionSession,
  setManualAoePlacement,
}: HandleActionSubmissionParams): Promise<void> {
  setManualLock(true);

  const { conditions, statusEffects } = extractActionEffects(action);
  const normalized = normalizeAction(action);
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
    actionType: isSpellAction(action)
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

  setActionExecutionSession({
    action: normalized,
    requiredInputs,
    draft,
    error: "",
  });

  if (normalized.targetCount === -1 || normalized.targetCount === -2) {
    const actorCid = currentTurnCreature ? getCreatureCid(currentTurnCreature) : "";
    const shape = normalizeAoeShape(normalized.shape);
    const selfOrigin = normalized.targetCount === -2;
    const actorPosition = normalizeGridCoords(
      currentTurnCreature ? (getCreaturePosition(currentTurnCreature) as unknown) : []
    );

    let timing = "instantaneous";
    if (
      ("lingEffect" in action && action.lingEffect) ||
      ("lingSave" in action && action.lingSave)
    ) {
      timing = "lingering";
    }

    const autoAnchor = selfOrigin ? actorPosition[0] ?? null : null;

    const placement: ManualAoePlacement = {
      resultID: draft.resultID,
      name: normalized.name,
      cid: actorCid,
      shape,
      radiusCells: feetToCells(normalized.radius),
      rangeCells: feetToCells(normalized.range),
      timing,
      token_image: resolveAoeTokenImageNameFromStats(shape, normalized.damageType),
      selfOrigin,
      anchor: autoAnchor,
      stage: selfOrigin && isDirectionalShape(shape) ? "pick_direction" : "pick_anchor",
    };

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
  const normalized = normalizeAction(action);
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
    actionType: isSpellAction(action)
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

    const payload = {
      ...finalDraft,
      token: executedAoeToken ?? null,
    };

    console.log("Pre-execution payload:", payload);

    try {
      await axiosTokenInstance.post(`/encounter/${eid}/simulate/ruleset`, payload);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item: unknown) => String(item)).join(", ")
        : typeof detail === "string"
          ? detail
          : "Error with Action Execution";

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

    const detail = error?.response?.data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item: unknown) => String(item)).join(", ")
      : typeof detail === "string"
        ? detail
        : "Action execution failed.";

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

    const response = await axiosTokenInstance.post(
      `/encounter/${eid}/simulate/preturn`,
      {
        ...cleanedDraft,
        preTurnMeta: activeItem.effectName,
      }
    );

    const savedOut = response?.data?.savedOut === true;

    if (activeItem.effectName === "lingsave" && savedOut) {
      await axiosTokenInstance.delete(
        `/encounter/${eid}/creature/${getCreatureCid(currentTurnCreature)}/status-effect/${cleanedDraft.resultID}`
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