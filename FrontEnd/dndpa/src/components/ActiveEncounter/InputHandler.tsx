import {useMemo, useState} from "react";
import '../../css/EncounterSimulation.css'

import type {
  Encounter,
  ActionExecutionSession,
  ActionRequestDraft
} from "../../types/SimulationTypes.ts";
import type { Creature} from "../../types/creature.ts";
import {getCreatureName, getCreatureCid} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";

type PerTargetInput = {
  attackRoll: string;
  saveRoll: string;
  damageRoll: string;
};

type InputHandlerProps = {
  encounter: Encounter;
  actionSession: ActionExecutionSession;
  setActionExecutionSession: React.Dispatch<React.SetStateAction<ActionExecutionSession | undefined>>;
  handleActionExecution: (draft: ActionRequestDraft) => void;
  setManualLock: React.Dispatch<React.SetStateAction<boolean>>;
  clearManualAoePreview: () => void;
  aoePlacementStage: "pick_anchor" | "pick_direction" | "ready";
  onExit?: () => void;

};

function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function InputHandler({
  encounter,
  actionSession,
  setActionExecutionSession,
  setManualLock,
  clearManualAoePreview,
  handleActionExecution,
  aoePlacementStage,
  onExit,
}: InputHandlerProps) {
  const [localError, setLocalError] = useState<string>("");
  const allCreatures: Creature[] = useMemo(
    () => [...(encounter.players ?? []), ...(encounter.monsters ?? [])],
    [encounter]
  );
  const availableTargets = useMemo(
    () => allCreatures,
    [allCreatures]
  );
  const targetCount = actionSession.action.targetCount ?? 0;
  const needsTargetSelection =
    targetCount > 0 && actionSession.draft.targets.length === 0;

  const needsAoeSelection =
      (targetCount === -1 || targetCount === -2) && actionSession.draft.targets.length === 0;

  const [selectedTargets, setSelectedTargets] = useState<string[]>(actionSession.draft.targets);
  const [perTargetInputs, setPerTargetInputs] = useState<Record<string, PerTargetInput>>(() => {
    const initial: Record<string, PerTargetInput> = {};
    actionSession.draft.targets.forEach((cid) => {
      initial[cid] = {
        attackRoll: "",
        saveRoll: "",
        damageRoll: "",
      };
    });
    return initial;
  });

  function updateTargetInput(cid: string, field: keyof PerTargetInput, value: string) {
    setPerTargetInputs((prev) => ({
      ...prev,
      [cid]: {
        attackRoll: prev[cid]?.attackRoll ?? "",
        saveRoll: prev[cid]?.saveRoll ?? "",
        damageRoll: prev[cid]?.damageRoll ?? "",
        [field]: value,
      },
    }));
  }
  function toggleTarget(cid: string) {
    setSelectedTargets((prev) => {
      const exists = prev.includes(cid);
      if (exists) return prev.filter((id) => id !== cid);
      if (targetCount > 0 && prev.length >= targetCount) return prev;
      return [...prev, cid];
    });
  }

  function handleNext() {
    if (selectedTargets.length === 0) {
      setLocalError("Select at least one target.");
      return;
    }
    if (targetCount > 0 && selectedTargets.length > targetCount) {
      setLocalError(`You can select up to ${targetCount} target(s).`);
      return;
    }

    const nextInputs: Record<string, PerTargetInput> = {};
    selectedTargets.forEach((cid) => {
      nextInputs[cid] = perTargetInputs[cid] ?? {
        attackRoll: "",
        saveRoll: "",
        damageRoll: "",
      };
    });

    setPerTargetInputs(nextInputs);
    setActionExecutionSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          targets: selectedTargets,
        },
        error: null,
      };
    });
    setLocalError("");
  }
  function handleSubmit() {
  const targets = actionSession.draft.targets;

  const rollResults: string[] = [];
  const diceResults: number[] = [];

  const extraRollResults = [...(actionSession.draft.extraOutcome?.extraRollResults ?? [])];
  const extraDiceResults = [...(actionSession.draft.extraOutcome?.extraDiceResults ?? [])];

  for (const cid of targets) {
    const entry = perTargetInputs[cid];

    if (!entry) {
      setLocalError("Missing input data for one or more targets.");
      return;
    }

    let rollValue = "";

    if (
      (actionSession.action.rollMode === "toHit" || actionSession.action.rollMode === "onHit") &&
      entry.attackRoll.trim() === ""
    ) {
      setLocalError("All attack roll inputs must be filled.");
      return;
    }

    if (actionSession.action.rollMode === "save" && entry.saveRoll.trim() === "") {
      setLocalError("All save roll inputs must be filled.");
      return;
    }

    if (actionSession.action.hasDamage && entry.damageRoll.trim() === "") {
      setLocalError("All damage roll inputs must be filled.");
      return;
    }

    if (actionSession.action.rollMode.toLowerCase() === "tohit" || actionSession.action.rollMode.toLowerCase() === "onhit") {
      rollValue = entry.attackRoll.trim();
    } else if (actionSession.action.rollMode.toLowerCase() === "save") {
      rollValue = entry.saveRoll.trim();
    } else if (actionSession.action.rollMode.toLowerCase() == "autohit") {
      rollValue = "y"
    }

    if (rollValue !== "") {
      rollResults.push(rollValue);

      if (actionSession.action.hasDamage) {
        diceResults.push(Number(entry.damageRoll));
      } else {
        diceResults.push(0);
      }
    }
  }

  while (extraDiceResults.length < extraRollResults.length) {
    extraDiceResults.push(0);
  }
  while (extraRollResults.length < extraDiceResults.length) {
    extraRollResults.push("");
  }

  const finalDraft: ActionRequestDraft = {
    ...actionSession.draft,
    outcome: {
      rollResults,
      diceResults,
    },
    extraOutcome: {
      extraRollResults,
      extraDiceResults,
    },
    timestamp: getCurrentTimeString(),
  };

  setActionExecutionSession((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      draft: finalDraft,
      error: null,
    };
  });

  setLocalError("");
  handleActionExecution(finalDraft);
}
  function handleExit() {
    if (onExit) {
      onExit();
      return;
    }

    clearManualAoePreview();
    setActionExecutionSession(undefined);
    setManualLock(false);
  }

    return (
        <div className="pa-input-handler">
            <div className="pa-input-handler__title">
                {actionSession.draft.action}
            </div>

            <div className="pa-input-handler__actions">
                <button
                    type="button"
                    className="pa-input-handler__btn pa-input-handler__btn--back"
                    onClick={handleExit}
                >
                    Back
                </button>
            </div>

            {needsTargetSelection ? (
                <>
                    <p className="pa-input-handler__helper">
                        Select target{targetCount !== 1 ? 's' : ''}{' '}
                        {targetCount > 0 ? `(up to ${targetCount})` : ''}
                    </p>

                    <div className="pa-input-handler__targets">
                        {availableTargets.map((creature) => {
                            const cid = getCreatureCid(creature);
                            const checked = selectedTargets.includes(cid);

                            return (
                                <div key={cid} className="form-check">
                                    <input
                                        className="form-check-input"
                                        type={targetCount === 1 ? 'radio' : 'checkbox'}
                                        name="targetSelection"
                                        id={`target-${cid}`}
                                        checked={checked}
                                        onChange={() => toggleTarget(cid)}
                                    />
                                    <label className="form-check-label" htmlFor={`target-${cid}`}>
                                        {getCreatureName(creature)}
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    {localError && (
                        <p className="pa-input-handler__error">{localError}</p>
                    )}

                    <div className="pa-input-handler__actions">
                        <button
                            type="button"
                            className="pa-input-handler__btn pa-input-handler__btn--next"
                            onClick={handleNext}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : needsAoeSelection ? (
                <>
                    <p className="pa-input-handler__helper">
                        {aoePlacementStage === 'pick_direction'
                            ? 'Move the cursor to choose a direction, then click the map to confirm.'
                            : 'Move the cursor to preview the area, then click the map to confirm placement.'}
                    </p>

                    <p className="pa-input-handler__helper pa-input-handler__helper--muted">
                        Targets will be filled automatically from the creatures inside the placed AOE.
                    </p>

                    {localError && (
                        <p className="pa-input-handler__error">{localError}</p>
                    )}
                </>
            ) : (
                <>
                    <p className="pa-input-handler__helper">
                        Enter results for each target.
                    </p>

                    {actionSession.draft.targets.map((cid) => {
                        const creature = allCreatures.find((c) => getCreatureCid(c) === cid);
                        if (!creature) return null;

                        const name = getCreatureName(creature);
                        const input = perTargetInputs[cid] ?? {
                            attackRoll: '',
                            saveRoll: '',
                            damageRoll: '',
                        };

                        return (
                            <div key={cid} className="pa-input-handler__target-block">
                                <div className="pa-input-handler__target-name">{name}</div>

                                {(actionSession.action.rollMode === 'toHit' ||
                                    actionSession.action.rollMode === 'onHit') && (
                                    <div className="pa-input-handler__field">
                                        <label className="pa-input-handler__field-label">Attack Roll</label>
                                        <input
                                            className="pa-input-handler__input form-control"
                                            type="number"
                                            value={input.attackRoll}
                                            onChange={(e) => updateTargetInput(cid, 'attackRoll', e.target.value)}
                                        />
                                    </div>
                                )}

                                {actionSession.action.rollMode === 'save' && (
                                    <div className="pa-input-handler__field">
                                        <label className="pa-input-handler__field-label">
                                            Save Roll{' '}
                                            {actionSession.action.saveType
                                                ? `(${actionSession.action.saveType})`
                                                : ''}
                                        </label>
                                        <input
                                            className="pa-input-handler__input form-control"
                                            type="number"
                                            value={input.saveRoll}
                                            onChange={(e) => updateTargetInput(cid, 'saveRoll', e.target.value)}
                                        />
                                    </div>
                                )}

                                {actionSession.action.hasDamage && (
                                    <div className="pa-input-handler__field">
                                        <label className="pa-input-handler__field-label">Damage Roll</label>
                                        <input
                                            className="pa-input-handler__input form-control"
                                            type="number"
                                            value={input.damageRoll}
                                            onChange={(e) => updateTargetInput(cid, 'damageRoll', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {localError && (
                        <p className="pa-input-handler__error">{localError}</p>
                    )}

                    <div className="pa-input-handler__actions">
                        <button
                            type="button"
                            className="pa-input-handler__btn pa-input-handler__btn--submit"
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}