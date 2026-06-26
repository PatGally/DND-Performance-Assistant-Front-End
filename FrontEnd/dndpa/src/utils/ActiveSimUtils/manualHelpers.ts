import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import { getEncounter } from "../../api/EncounterGet.ts";
import { getCurrentTurnCreatureFromEncounter } from "./CreatureHelpers.ts";

import type { Creature } from "../../types/creature.ts";
import type {
  ActionExecutionSession,
  AoeToken,
  Encounter,
  ManualAffectedCreature,
  ManualAoePlacement,
  ManualDraftState,
} from "../../types/SimulationTypes.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type HandleManualSimulateParams = {
  manualLock: boolean;
  manualMode: boolean;
  eid?: string;
  manualDraft: ManualDraftState;
  setManualLock: StateSetter<boolean>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setManualDraft: StateSetter<ManualDraftState>;
  setInitiativeExpandedCid: StateSetter<string | null>;
  setManualMode: StateSetter<boolean>;
  setInitiativeRefreshKey: StateSetter<number>;
  setSelectedCID?: StateSetter<string | null>;
};

type ClearManualStateParams = {
  setManualDraft: StateSetter<ManualDraftState>;
  setInitiativeExpandedCid: StateSetter<string | null>;
  setSelectedCID?: StateSetter<string | null>;
};

type ClearManualAoePreviewParams = {
  resultID?: string;
  latestHoverRequestRef: MutableRefObject<number>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
};

type SetManualStateParams = {
  actionExecutionSession?: ActionExecutionSession;
  latestHoverRequestRef: MutableRefObject<number>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
  setManualMode: StateSetter<boolean>;
  setInitiativeOpen: StateSetter<boolean>;
  setActionOpen: StateSetter<boolean>;
  setManualDraft: StateSetter<ManualDraftState>;
  setInitiativeExpandedCid: StateSetter<string | null>;
  setSelectedCID?: StateSetter<string | null>;
};

type HandleManualCreatureChangeParams = {
  nextCreature: ManualAffectedCreature;
  setManualDraft: StateSetter<ManualDraftState>;
};

export async function handleManualSimulate({
  manualLock,
  manualMode,
  eid,
  manualDraft,
  setManualLock,
  setEncounterData,
  setCurrentTurnCreature,
  setManualDraft,
  setInitiativeExpandedCid,
  setManualMode,
  setInitiativeRefreshKey,
  setSelectedCID,
}: HandleManualSimulateParams): Promise<void> {
  if (manualLock || !manualMode || !eid) return;

  try {
    setManualLock(true);

    if (manualDraft.affectedCreatures.length > 0) {
      await axiosTokenInstance.post(
        `/encounter/${eid}/simulate/manual`,
          // transformManualDraftForBackend(manualDraft)
        manualDraft
      );

      const updatedEncounter = await getEncounter(eid);
      if (updatedEncounter) {
        setEncounterData(updatedEncounter);
        const newCurrentTurnCreature =
          getCurrentTurnCreatureFromEncounter(updatedEncounter);
        setCurrentTurnCreature(newCurrentTurnCreature);
      }
    }

    setManualDraft({ affectedCreatures: [] });
    setInitiativeExpandedCid(null);
    setSelectedCID?.(null);
  } catch (error) {
    console.error("Manual simulation failed:", error);
  } finally {
    setManualLock(false);
    setManualMode(false);
    setInitiativeRefreshKey((prev) => prev + 1);
  }
}

export function clearManualState({
  setManualDraft,
  setInitiativeExpandedCid,
  setSelectedCID,
}: ClearManualStateParams): void {
  setManualDraft({ affectedCreatures: [] });
  setInitiativeExpandedCid(null);
  setSelectedCID?.(null);
}

// function createConditionPayload(creature: ManualAffectedCreature) {
//     if (!creature.activeConditions) return undefined;
//     return (creature.activeConditions as unknown as string[]).map((cond) => ({
//         cond: cond.toLowerCase(),
//         resultid: [cond],
//     }));
// }
//
// function transformManualDraftForBackend(draft: ManualDraftState): ManualDraftState {
//     return {
//         ...draft,
//         affectedCreatures: draft.affectedCreatures.map((creature) => {
//             const conditions = createConditionPayload(creature);
//             if (!conditions) return creature;
//             return {
//                 ...creature,
//                 activeConditions: conditions,
//             } as ManualAffectedCreature;
//         }),
//     };
// }

export function setManualState({
  actionExecutionSession,
  latestHoverRequestRef,
  setAoeTokens,
  setManualAoePlacement,
  setManualMode,
  setInitiativeOpen,
  setActionOpen,
  setManualDraft,
  setInitiativeExpandedCid,
  setSelectedCID,
}: SetManualStateParams): void {
  clearManualAoePreview({
    resultID: actionExecutionSession?.draft.resultID,
    latestHoverRequestRef,
    setAoeTokens,
    setManualAoePlacement,
  });

  setManualMode(true);
  setInitiativeOpen(true);
  setActionOpen(false);

  clearManualState({
    setManualDraft,
    setInitiativeExpandedCid,
    setSelectedCID,
  });
}

export function handleManualCreatureChange({
  nextCreature,
  setManualDraft
}: HandleManualCreatureChangeParams): void {
  setManualDraft((prev) => {
    const others = prev.affectedCreatures.filter(
      (creature) => creature.cid !== nextCreature.cid
    );

    const changedKeys = Object.keys(nextCreature).filter(
      (key) => key !== "cid"
    );

    if (changedKeys.length === 0) {
      return { affectedCreatures: others };
    }

    return {
      affectedCreatures: [...others, nextCreature],
    };
  });
}

export function clearManualAoePreview({
  resultID,
  latestHoverRequestRef,
  setAoeTokens,
  setManualAoePlacement,
}: ClearManualAoePreviewParams): void {
  latestHoverRequestRef.current += 1;

  if (resultID) {
    setAoeTokens((prev) =>
      prev.filter((token) => token.resultID !== resultID)
    );
  }

  setManualAoePlacement(null);
}
