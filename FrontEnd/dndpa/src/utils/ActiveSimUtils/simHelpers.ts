import type { Dispatch, SetStateAction } from "react";

import type { Creature } from "../../types/creature.ts";
import type {
  ActionExecutionSession,
  Encounter,
  PendingPreTurnResolution,
} from "../../types/SimulationTypes.ts";

import {getCreatureName, getCreaturePosition, getCurrentTurnCreatureFromEncounter} from "./CreatureHelpers.ts";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import { getEncounter } from "../../api/EncounterGet.ts";
import { syncPreTurnQueueFromCreature } from "./PreTurnHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type SimStartParams = {
  encounterData?: Encounter;
  setEncStart: StateSetter<boolean>;
  setActiveEncounter: StateSetter<boolean>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
};

export type HandleNextTurnParams = {
  currentTurnCreature?: Creature;
  handlingNextTurn: boolean;
  actionExecutionSession?: ActionExecutionSession;
  encounterData?: Encounter;
  encStart: boolean;
  activeEncounter: boolean;
  eid?: string;
  hasPreTurnQueue: boolean;
  endOfEncounter: boolean;
  setHandlingNextTurn: StateSetter<boolean>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setPreTurnQueue: StateSetter<PendingPreTurnResolution[]>;
  setInitiativeRefreshKey: StateSetter<number>;
  setManualLock: StateSetter<boolean>;
};

export type HandlePreTurnBackParams = {
  clearManualAoePreview: () => void;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setManualLock: StateSetter<boolean>;
  setPreTurnQueue: StateSetter<PendingPreTurnResolution[]>;
};

export function simStart({
  encounterData,
  setEncStart,
  setActiveEncounter,
  setCurrentTurnCreature,
}: SimStartParams): void {
  if (!encounterData || encounterData.initiative.length === 0) return;

  const allCreatures: Creature[] = [
    ...(encounterData.players ?? []),
    ...(encounterData.monsters ?? []),
  ];

  const zeroOccupants = allCreatures.filter((creature) => {
            const position = getCreaturePosition(creature);
            return position.some(
                (tile) =>
                    Array.isArray(tile) &&
                    tile.length === 2 &&
                    tile[0] === 0 &&
                    tile[1] === 0
            );
        });
  const noCollisionAtZero = zeroOccupants.length <= 1;

  if(!noCollisionAtZero) {
    return;
  }

  setEncStart(false);
  setActiveEncounter(true);

  const initStart = encounterData.initiative[0]?.name;
  if (!initStart) return;

  if(initStart.toLowerCase() == "lair action") {
    setCurrentTurnCreature({ _isLairAction: true } as unknown as Creature);
  }

  const matchingCreature = allCreatures.find(
    (creature) => getCreatureName(creature) === initStart
  );

  if (!matchingCreature) {
    console.warn("Could not find initiative starting creature.");
    setCurrentTurnCreature(undefined);
    return;
  }

  setCurrentTurnCreature(matchingCreature);
}

export async function handleNextTurn({
  currentTurnCreature,
  handlingNextTurn,
  actionExecutionSession,
  encounterData,
  encStart,
  activeEncounter,
  eid,
  hasPreTurnQueue,
  endOfEncounter,
  setHandlingNextTurn,
  setEncounterData,
  setCurrentTurnCreature,
  setPreTurnQueue,
  setInitiativeRefreshKey,
  setManualLock,
}: HandleNextTurnParams): Promise<void> {
  const isLairActionTurn = (currentTurnCreature as any)?._isLairAction === true;

  if (
    handlingNextTurn ||
    actionExecutionSession ||
    !encounterData ||
    (!currentTurnCreature && !isLairActionTurn) ||
    encStart ||
    !activeEncounter ||
    !eid ||
    hasPreTurnQueue ||
    endOfEncounter
  ) {
    return;
  }

  try {
    setHandlingNextTurn(true);

    await axiosTokenInstance.get(`/encounter/${eid}/initiative/nextturn`);

    const updatedEncounter = await getEncounter(eid);
    if (!updatedEncounter) {
      console.error("Failed to reload encounter after advancing turn.");
      return;
    }

    setEncounterData(updatedEncounter);

    const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);

    if (newCurrentTurnCreature) {
      setCurrentTurnCreature(newCurrentTurnCreature);
      syncPreTurnQueueFromCreature(setPreTurnQueue, newCurrentTurnCreature);
    } else if (isLairActionTurn) {
      console.warn("Sentinel missing but confirmed lair action turn.");
    } else {
      console.error("Could not determine current turn creature from updated encounter.");
      setCurrentTurnCreature(undefined);
      setPreTurnQueue([]);
    }
  } catch (error) {
    console.error("Failed to advance turn:", error);
  } finally {
    setInitiativeRefreshKey((prev) => prev + 1);
    setHandlingNextTurn(false);
    setManualLock(false);
  }
}

export function handlePreTurnBack({
  clearManualAoePreview,
  setActionExecutionSession,
  setManualLock,
  setPreTurnQueue,
}: HandlePreTurnBackParams): void {
  clearManualAoePreview();
  setActionExecutionSession(undefined);
  setManualLock(false);
  setPreTurnQueue((prev) => prev.slice(1));
}