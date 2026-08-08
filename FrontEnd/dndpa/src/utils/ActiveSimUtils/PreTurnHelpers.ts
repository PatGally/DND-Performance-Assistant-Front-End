import type { Dispatch, SetStateAction } from "react";
import type {
  ActiveStatusEffect,
  Creature,
  PreTurnEffect,
  ResultID,
} from "../../types/creature.ts";
import type {
  ActionExecutionSession,
  ActionRequestDraft,
  NormalizedAction,
  PendingPreTurnResolution,
} from "../../types/SimulationTypes.ts";
import { isPlayerCreature } from "../../api/CreatureGet.ts";
import type { CreatureAction } from "../../types/action.ts";
import {
  getCreatureCid,
  getCreatureName,
} from "./CreatureHelpers.ts";
import {
  buildRequiredInputs,
  extractActionEffects,
  normalizeAction,
} from "./actionHelpers.ts";

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function isPreTurnEffect(value: unknown): value is PreTurnEffect {
  if (!value || typeof value !== "object") return false;

  const effect = value as ActiveStatusEffect;
  const name = String(effect.name ?? "").trim().toLowerCase();

  return name === "lingeffect" || name === "lingsave";
}

export function extractRawPreTurnEffects(
    creature?: Creature
): PreTurnEffect[] {
  if (!creature) return [];

  const statusEffects = isPlayerCreature(creature)
      ? creature.stats.activeStatusEffects
      : creature.activeStatusEffects;

  if (!Array.isArray(statusEffects)) return [];

  return statusEffects.filter(isPreTurnEffect);
}

/**
 * Convert backend status-effect payloads into the one-item-at-a-time queue used
 * by EncounterSimulation. The backend response is preferred because it is
 * captured before timed effects are advanced or removed at turn start.
 */
export function buildPreTurnQueueFromEffects(
    rawEffects: unknown
): PendingPreTurnResolution[] {
  if (!Array.isArray(rawEffects)) return [];

  const queue: PendingPreTurnResolution[] = [];
  const queuedSources = new Set<string>();

  for (const rawEffect of rawEffects) {
    if (!isPreTurnEffect(rawEffect)) continue;

    const effectName = String(rawEffect.name).trim().toLowerCase();
    const effectData = rawEffect.effect ?? {};

    const spellActions = asArray(
        (effectData as { spell?: CreatureAction | CreatureAction[] }).spell
    );
    const normalActions = asArray(
        (effectData as { action?: CreatureAction | CreatureAction[] }).action
    );
    const actions = spellActions.length > 0 ? spellActions : normalActions;

    const resultIDs = asArray<ResultID>(effectData.resultID);
    const actors = asArray(
        (effectData as { actor?: string | string[] }).actor
    );

    const itemCount = Math.min(actions.length, resultIDs.length);

    for (let index = 0; index < itemCount; index += 1) {
      const resultID = String(resultIDs[index] ?? "").trim();
      if (!resultID || resultID === "-1") continue;

      const sourceKey = `${effectName}:${resultID}`;
      if (queuedSources.has(sourceKey)) continue;
      queuedSources.add(sourceKey);

      const actor = String(
          actors[index] ?? actors[0] ?? ""
      ).trim();

      queue.push({
        effectName: effectName as "lingeffect" | "lingsave",
        spell: actions[index],
        resultID,
        actor,
      });
    }
  }

  return queue;
}

export function syncPreTurnQueueFromCreature(
    setPreTurnQueue: Dispatch<SetStateAction<PendingPreTurnResolution[]>>,
    creature?: Creature
): void {
  setPreTurnQueue(
      buildPreTurnQueueFromEffects(
          extractRawPreTurnEffects(creature)
      )
  );
}

function getPreTurnActionName(action: CreatureAction): string {
  const candidate = action as {
    spellname?: unknown;
    name?: unknown;
  };

  if (typeof candidate.spellname === "string") {
    return candidate.spellname;
  }

  if (typeof candidate.name === "string") {
    return candidate.name;
  }

  return "";
}

export function buildPreTurnSession(
    item: PendingPreTurnResolution,
    targetCreature: Creature
): ActionExecutionSession {
  const base = normalizeAction(item.spell);
  const normalized: NormalizedAction = {
    ...base,
    targetMode: "single",
    targetCount: 1,
    shape: "",
    radius: "",
    range: "",
  };

  const { conditions, statusEffects } =
      extractActionEffects(item.spell);

  const draft: ActionRequestDraft = {
    resultID: item.resultID,
    actor: item.actor,
    action: getPreTurnActionName(item.spell),
    actionType: "PreTurn",
    actionProb: 0,
    actionEDam: 0,
    actionImpact: 0,
    actionRanking: 0,
    base_weight: 0,
    ml_weight: 0,
    useML: false,
    final_weight: 0,
    candidateCount: 0,
    targets: [getCreatureCid(targetCreature)],
    conditions,
    statusEffects: filterPreTurnStatusEffects(statusEffects),
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

  return {
    action: normalized,
    requiredInputs: buildRequiredInputs(normalized),
    draft,
    error: "",
  };
}

export function filterPreTurnStatusEffects(
    statusEffects: Record<string, unknown>[]
): Record<string, unknown>[] {
  return statusEffects.filter((effect) => {
    const name =
        typeof effect?.name === "string"
            ? effect.name.trim().toLowerCase()
            : "";

    return name !== "concentration";
  });
}

function getPotentialPreTurnEffectsForCreature(
    creature: Creature
): ActiveStatusEffect[] {
  if (isPlayerCreature(creature)) {
    return creature.stats.activeStatusEffects ?? [];
  }

  return creature.activeStatusEffects ?? [];
}

/**
 * Compatibility fallback for older saved effects that do not contain the
 * actor array. New effects and the next-turn API response include actor data.
 */
export function getActorByConcentrationID(
    resultID: string,
    allCreatures: Creature[]
): string {
  const normalizedResultID = String(resultID).trim();

  for (const creature of allCreatures) {
    const hasMatchingConcentration =
        getPotentialPreTurnEffectsForCreature(creature).some(
            (effect) => {
              const effectName = String(
                  effect?.name ?? ""
              ).trim().toLowerCase();

              if (effectName !== "concentration") return false;

              return asArray(effect.effect?.resultID).some(
                  (id) => String(id).trim() === normalizedResultID
              );
            }
        );

    if (hasMatchingConcentration) {
      return getCreatureName(creature);
    }
  }

  return "";
}