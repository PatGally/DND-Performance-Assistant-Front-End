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
export function resolveTargetToCid(target: string, encounter: Encounter): string | null {
  const allCreatures: Creature[] = [
    ...(encounter.players ?? []),
    ...(encounter.monsters ?? []),
  ];
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
    if (currentTurnEntry.turnType === "lairAction") {
        const sentinel = { _isLairAction: true } as unknown as Creature;
        return sentinel;
    }

        const allCreatures: Creature[] = [
            ...(encounter.players ?? []),
            ...(encounter.monsters ?? []),
        ];

        return allCreatures.find(
            (creature) => getCreatureName(creature).toLowerCase() === currentTurnEntry.name.toLowerCase()
        );
    }