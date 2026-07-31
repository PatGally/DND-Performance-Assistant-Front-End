import {isPlayerCreature} from "../../api/CreatureGet.ts";
import {type Creature} from "../../types/creature.ts";
import type {Encounter, InitiativeEntry} from "../../types/SimulationTypes.ts";
import type {GridCoord} from "../../types/creature.ts";

export function getCreatureCid(creature: Creature): string {
    return isPlayerCreature(creature) ? creature.stats.cid : creature.cid;
}
export function getCreaturePosition(creature: Creature): GridCoord[] {
    if (isPlayerCreature(creature)) {
        return Array.isArray((creature as { position?: number[][] }).position)
            ? ((creature as { position?: GridCoord[] }).position ?? [])
            : (creature.stats.position ?? []);
    }
    return creature.position ?? [];
}
export function getCreatureName(creature: Creature): string {
    return isPlayerCreature(creature) ? creature.stats.name : creature.name;
}
export function getCreatureSize(creature: Creature): string {
    return isPlayerCreature(creature) ? "medium" : String(creature.size ?? "medium").toLowerCase();
}
export function getEncounterCreatures(encounter: Encounter): Creature[] {
  return [
    ...(encounter.players ?? []),
    ...(encounter.monsters ?? []),
  ];
}
export function getCreatureNameByCid(encounter: Encounter, cid: string): string {
  const creature = getEncounterCreatures(encounter).find(
    (candidate) => getCreatureCid(candidate) === cid
  );
  return creature ? getCreatureName(creature) : cid;
}
export function isLairActionEntry(entry?: InitiativeEntry): boolean {
  return entry?.turnType === "lairAction";
}
export function findCreatureByInitiativeEntry(
  encounter: Encounter,
  entry?: InitiativeEntry,
): Creature | undefined {
  if (!entry || isLairActionEntry(entry)) return undefined;

  return getEncounterCreatures(encounter).find(
    (creature) => getCreatureCid(creature) === entry.cid
  );
}
export function resolveTargetToCid(target: string, encounter: Encounter): string | null {
  const allCreatures = getEncounterCreatures(encounter);
  const found = allCreatures.find(
    (creature) =>
      getCreatureCid(creature) === target ||
      getCreatureName(creature).toLowerCase() === target.toLowerCase()
  );
  return found ? getCreatureCid(found) : null;
}
export function getCurrentTurnCreatureFromEncounter(encounter: Encounter): Creature | undefined {
        const currentTurnEntry = encounter.initiative.find((entry : InitiativeEntry) => entry.currentTurn);
        if (!currentTurnEntry) return undefined;
    if (isLairActionEntry(currentTurnEntry)) {
        const sentinel = { _isLairAction: true } as unknown as Creature;
        return sentinel;
    }

        return findCreatureByInitiativeEntry(encounter, currentTurnEntry);
    }
