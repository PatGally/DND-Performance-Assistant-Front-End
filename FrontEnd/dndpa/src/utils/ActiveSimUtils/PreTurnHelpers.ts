import type {Creature, PreTurnEffect} from "../../types/creature.ts";
import type {
    ActionExecutionSession,
    ActionRequestDraft,
    NormalizedAction,
    PendingPreTurnResolution
} from "../../types/SimulationTypes.ts";
import {isPlayerCreature} from "../../api/CreatureGet.ts";
import type {CreatureAction} from "../../types/action.ts";
import {getCreatureCid, getCreatureName} from "../CreatureHelpers.ts";
import {isSpellAction} from "./ActionTypeChecker.ts";
import {buildRequiredInputs, extractActionEffects, normalizeAction} from "./actionHelpers.ts";

export function extractRawPreTurnEffects(creature?: Creature): PreTurnEffect[] {
  if (!creature) return [];

  const statEffs = isPlayerCreature(creature)
    ? creature.stats.activeStatusEffects
    : creature.activeStatusEffects;

  if (!Array.isArray(statEffs)) return [];

  return statEffs.filter((eff) => {
    const name = typeof eff?.name === "string" ? eff.name.toLowerCase() : "";
    return name === "lingeffect" || name === "lingsave";
  }) as PreTurnEffect[];
}

function flattenPreTurnEffects(effects: PreTurnEffect[]): PendingPreTurnResolution[] {
  const queue: PendingPreTurnResolution[] = [];

  for (const effect of effects) {
    const effectName = (effect?.name ?? "").trim().toLowerCase();
    if (effectName !== "lingeffect" && effectName !== "lingsave") continue;

    const actions = Array.isArray((effect.effect as any)?.spell)
      ? (effect.effect as any).spell
      : Array.isArray((effect.effect as any)?.action)
        ? (effect.effect as any).action
        : [];

    const resultIDs = Array.isArray(effect?.effect?.resultID)
      ? effect.effect.resultID
      : [];

    const len = Math.min(actions.length, resultIDs.length);

    for (let i = 0; i < len; i++) {
      queue.push({
        effectName: effectName as "lingeffect" | "lingsave",
        spell: actions[i] as CreatureAction,
        resultID: String(resultIDs[i]).trim(),
        actor: "",
      });
    }
  }

  return queue;
}

export function syncPreTurnQueueFromCreature(setPreTurnQueue : React.Dispatch<React.SetStateAction<PendingPreTurnResolution[]>>,
                                             creature?: Creature) {
  const raw = extractRawPreTurnEffects(creature);
  console.log("raw", raw);
  const flattened = flattenPreTurnEffects(raw);
  console.log("flattened", flattened);
  setPreTurnQueue(flattened);
}

export function buildPreTurnSession(
  item: PendingPreTurnResolution,
  targetCreature: Creature
): ActionExecutionSession {
  console.log("In buildPreTurnSession with item", item);
  const base = normalizeAction(item.spell);
  const normalized: NormalizedAction = {
    ...base,
    targetMode: "single",
    targetCount: 1,
    shape: "",
    radius: "",
    range: "",
  };

  const { conditions, statusEffects } = extractActionEffects(item.spell);
  const filteredStatusEffects = filterPreTurnStatusEffects(statusEffects);
  const requiredInputs = buildRequiredInputs(normalized);

  const draft: ActionRequestDraft = {
    resultID: item.resultID,
    actor: item.actor, // original caster, NOT current turn creature
    action: isSpellAction(item.spell) ? item.spell.spellname : item.spell.name,
    actionType: "PreTurn",
    actionProb: 0,
    actionEDam: 0,
    actionImpact: 0,
    targets: [getCreatureCid(targetCreature)],
    conditions,
    statusEffects: filteredStatusEffects,
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
    requiredInputs,
    draft,
    error: "",
  };
}

export function filterPreTurnStatusEffects(
  statusEffects: Record<string, unknown>[]
): Record<string, unknown>[] {
  return statusEffects.filter((effect) => {
    const name =
      typeof effect?.name === "string" ? effect.name.trim().toLowerCase() : "";
    return name !== "concentration";
  });
}

function getPotentialPreTurnEffectsForCreature(creature: Creature): PreTurnEffect[] {
  if (isPlayerCreature(creature)) {
    return (creature.stats.activeStatusEffects ?? []) as PreTurnEffect[];
  }
  return ((creature as { activeStatusEffects?: PreTurnEffect[] }).activeStatusEffects ?? []);
}

export function getActorByConcentrationID(
  resultID: string,
  allCreatures: Creature[]
): string {
  const normalizedResultID = String(resultID).trim();

  console.log("In getActorByConcID");
  for (const creature of allCreatures) {
    const statEffects = getPotentialPreTurnEffectsForCreature(creature);
    console.log(creature, "StatusEffects");
    console.log(statEffects);

    const hasMatchingConcentration = statEffects.some((eff) => {
      const effectName =
        typeof eff?.name === "string" ? eff.name.trim().toLowerCase() : "";

      if (effectName !== "concentration") return false;

      const idArray = eff?.effect?.resultID
        ? eff.effect.resultID
        : [];
      console.log("idArray", idArray);

      if (Array.isArray(idArray)) {
        return idArray.some((id) => String(id).trim() === normalizedResultID);
      }
      else {
        return idArray === resultID;
      }
    });

    if (hasMatchingConcentration) {
      return getCreatureName(creature);
    }
  }
  console.error("Actor not found!");

  return "";
}

