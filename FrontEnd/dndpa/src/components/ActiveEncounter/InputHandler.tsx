import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Encounter,
  ActionExecutionSession,
  ActionRequestDraft,
} from "../../types/SimulationTypes.ts";
import type { Creature } from "../../types/creature.ts";
import {
  getCreatureName,
  getCreatureCid,
} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";
import {
  getRollBoundsForTarget,
  getDamageBounds,
  formatBounds,
  getEffectiveDamageBounds, isCriticalAttackRoll,
} from "../../utils/ActiveSimUtils/actionHelpers.ts";

type PerTargetInput = {
  attackRoll: string;
  saveRoll: string;
  damageRoll: string;
};

type InputHandlerProps = {
  encounter: Encounter;
  actionSession: ActionExecutionSession;
  setActionExecutionSession: React.Dispatch<
    React.SetStateAction<ActionExecutionSession | undefined>
  >;
  handleActionExecution: (draft: ActionRequestDraft) => Promise<void | string>;
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
  const errorTimeoutRef = useRef<number | null>(null);

  const allCreatures: Creature[] = useMemo(
    () => [...(encounter.players ?? []), ...(encounter.monsters ?? [])],
    [encounter]
  );

  const damageBounds = useMemo(
    () => getDamageBounds(actionSession),
    [actionSession]
  );

  const availableTargets = useMemo(() => allCreatures, [allCreatures]);

  const targetCount = actionSession.action.targetCount ?? 0;

  const needsTargetSelection =
    targetCount > 0 && actionSession.draft.targets.length === 0;

  const needsAoeSelection =
    (targetCount === -1 || targetCount === -2) &&
    actionSession.draft.targets.length === 0;

  const [selectedTargets, setSelectedTargets] = useState<string[]>(
    actionSession.draft.targets
  );

  const [perTargetInputs, setPerTargetInputs] = useState<
    Record<string, PerTargetInput>
  >(() => {
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

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current !== null) {
        window.clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  function showTimedError(message: string) {
    setLocalError(message);

    if (errorTimeoutRef.current !== null) {
      window.clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = window.setTimeout(() => {
      setLocalError("");
      errorTimeoutRef.current = null;
    }, 5000);
  }

  function updateTargetInput(
    cid: string,
    field: keyof PerTargetInput,
    value: string
  ) {
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
      showTimedError("Select at least one target.");
      return;
    }

    if (targetCount > 0 && selectedTargets.length > targetCount) {
      showTimedError(`You can select up to ${targetCount} target(s).`);
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

  async function handleSubmit() {
    const targets = actionSession.draft.targets;

    const rollResults: string[] = [];
    const diceResults: number[] = [];

    const extraRollResults = [
      ...(actionSession.draft.extraOutcome?.extraRollResults ?? []),
    ];
    const extraDiceResults = [
      ...(actionSession.draft.extraOutcome?.extraDiceResults ?? []),
    ];

    const needsAttackRoll =
      actionSession.action.rollMode === "toHit" ||
      actionSession.action.rollMode === "onHit";
    const needsSaveRoll = actionSession.action.rollMode === "save";
    const needsDamageRoll = actionSession.action.hasDamage;

    for (const cid of targets) {
      const entry = perTargetInputs[cid];
      const creature = allCreatures.find((c) => getCreatureCid(c) === cid);

      if (!entry || !creature) {
        showTimedError("Missing input data for one or more targets.");
        return;
      }

      const rollBounds = getRollBoundsForTarget(actionSession, creature);

      if (needsAttackRoll && entry.attackRoll.trim() === "") {
        showTimedError("All attack roll inputs must be filled.");
        return;
      }

      if (needsSaveRoll && entry.saveRoll.trim() === "") {
        showTimedError("All save roll inputs must be filled.");
        return;
      }

      if (needsDamageRoll && entry.damageRoll.trim() === "") {
        showTimedError("All damage roll inputs must be filled.");
        return;
      }

      const critActive =
        needsAttackRoll && rollBounds
          ? isCriticalAttackRoll(
              actionSession.action.rollMode,
              entry.attackRoll,
              rollBounds
            )
          : false;

      const effectiveDamageBounds = getEffectiveDamageBounds(
        damageBounds,
        critActive
      );

      if (needsAttackRoll) {
        if (!rollBounds) {
          showTimedError(
            `Could not determine attack roll bounds for ${actionSession.draft.action}.`
          );
          return;
        }

        const validatedRoll = Number(entry.attackRoll.trim());

        if (!Number.isFinite(validatedRoll)) {
          showTimedError(
            `Attack roll for ${getCreatureName(creature)} must be a number.`
          );
          return;
        }

        if (validatedRoll < rollBounds.min || validatedRoll > rollBounds.max) {
          showTimedError(
            `Attack roll for ${getCreatureName(creature)} must be between ${rollBounds.min} and ${rollBounds.max}.`
          );
          return;
        }

        rollResults.push(String(validatedRoll));
      } else if (needsSaveRoll) {
        if (!rollBounds) {
          showTimedError(
            `Could not determine save roll bounds for ${actionSession.draft.action}.`
          );
          return;
        }

        const validatedRoll = Number(entry.saveRoll.trim());

        if (!Number.isFinite(validatedRoll)) {
          showTimedError(
            `Save roll for ${getCreatureName(creature)} must be a number.`
          );
          return;
        }

        if (validatedRoll < rollBounds.min || validatedRoll > rollBounds.max) {
          showTimedError(
            `Save roll for ${getCreatureName(creature)} must be between ${rollBounds.min} and ${rollBounds.max}.`
          );
          return;
        }

        rollResults.push(String(validatedRoll));
      } else if (actionSession.action.rollMode.toLowerCase() === "autohit") {
        rollResults.push("y");
      }

      if (needsDamageRoll) {
        if (!effectiveDamageBounds) {
          showTimedError(
            `Could not determine damage bounds for ${actionSession.draft.action}.`
          );
          return;
        }

        const damageValue = Number(entry.damageRoll.trim());

        if (!Number.isFinite(damageValue)) {
          showTimedError(
            `Damage roll for ${getCreatureName(creature)} must be a number.`
          );
          return;
        }

        if (
          damageValue < effectiveDamageBounds.min ||
          damageValue > effectiveDamageBounds.max
        ) {
          showTimedError(
            `Damage roll for ${getCreatureName(creature)} must be between ${effectiveDamageBounds.min} and ${effectiveDamageBounds.max}.`
          );
          return;
        }

        diceResults.push(damageValue);
      } else {
        diceResults.push(0);
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
  await handleActionExecution(finalDraft);
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
    <div
      className="bg-dark border rounded p-3"
      style={{ minWidth: "420px", maxWidth: "700px" }}
    >
      <h5 className="mb-3">{actionSession.draft.action}</h5>
      <button className="btn btn-dark btn-outline-light" onClick={handleExit}>
        Back
      </button>

      {needsTargetSelection ? (
        <>
          <p className="mb-2">
            Select target{targetCount !== 1 ? "s" : ""}{" "}
            {targetCount > 0 ? `(up to ${targetCount})` : ""}
          </p>

          <div className="mb-3">
            {availableTargets.map((creature) => {
              const cid = getCreatureCid(creature);
              const checked = selectedTargets.includes(cid);

              return (
                <div key={cid} className="form-check">
                  <input
                    className="form-check-input"
                    type={targetCount === 1 ? "radio" : "checkbox"}
                    name="targetSelection"
                    id={`target-${cid}`}
                    checked={checked}
                    onChange={() => toggleTarget(cid)}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`target-${cid}`}
                  >
                    {getCreatureName(creature)}
                  </label>
                </div>
              );
            })}
          </div>

          {localError && <div className="text-danger mb-2">{localError}</div>}

          <button className="btn btn-success" onClick={handleNext}>
            Next
          </button>
        </>
      ) : needsAoeSelection ? (
        <>
          <p className="mb-2">
            {aoePlacementStage === "pick_direction"
              ? "Move the cursor to choose a direction, then click the map to confirm."
              : "Move the cursor to preview the area, then click the map to confirm placement."}
          </p>

          <p className="mb-0 text-secondary">
            Targets will be filled automatically from the creatures inside the
            placed AOE.
          </p>

          {localError && <div className="text-danger mt-2">{localError}</div>}
        </>
      ) : (
        <>
          <p className="mb-3">Enter results for each target.</p>

          {actionSession.draft.targets.map((cid) => {
            const creature = allCreatures.find((c) => getCreatureCid(c) === cid);
            if (!creature) return null;

            const name = getCreatureName(creature);
            const input = perTargetInputs[cid] ?? {
              attackRoll: "",
              saveRoll: "",
              damageRoll: "",
            };

            const rollBounds = getRollBoundsForTarget(actionSession, creature);
            const critActive =
              (actionSession.action.rollMode === "toHit" ||
                actionSession.action.rollMode === "onHit") &&
              isCriticalAttackRoll(
                actionSession.action.rollMode,
                input.attackRoll,
                rollBounds
              );

            const effectiveDamageBounds = getEffectiveDamageBounds(
              damageBounds,
              critActive
            );

            return (
              <div key={cid} className="border rounded p-2 mb-3">
                <strong>{name}</strong>

                {(actionSession.action.rollMode === "toHit" ||
                  actionSession.action.rollMode === "onHit") && (
                  <div className="mt-2">
                    <div className="small text-secondary mb-1">
                      {formatBounds(rollBounds)}
                    </div>
                    {critActive && (
                      <div className="small text-warning mb-1">
                        Critical hit active: damage bounds doubled.
                      </div>
                    )}
                    <label className="form-label">Attack Roll</label>
                    <input
                      className="form-control"
                      type="number"
                      min={rollBounds?.min}
                      max={rollBounds?.max}
                      value={input.attackRoll}
                      onChange={(e) =>
                        updateTargetInput(cid, "attackRoll", e.target.value)
                      }
                    />
                  </div>
                )}

                {actionSession.action.rollMode === "save" && (
                  <div className="mt-2">
                    <div className="small text-secondary mb-1">
                      {formatBounds(rollBounds)}
                    </div>
                    <label className="form-label">
                      Save Roll{" "}
                      {actionSession.action.saveType
                        ? `(${actionSession.action.saveType})`
                        : ""}
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      min={rollBounds?.min}
                      max={rollBounds?.max}
                      value={input.saveRoll}
                      onChange={(e) =>
                        updateTargetInput(cid, "saveRoll", e.target.value)
                      }
                    />
                  </div>
                )}

                {actionSession.action.hasDamage && (
                  <div className="mt-2">
                    <div className="small text-secondary mb-1">
                      {formatBounds(effectiveDamageBounds)}
                    </div>
                    <label className="form-label">Damage Roll</label>
                    <input
                      className="form-control"
                      type="number"
                      min={effectiveDamageBounds?.min}
                      max={effectiveDamageBounds?.max}
                      value={input.damageRoll}
                      onChange={(e) =>
                        updateTargetInput(cid, "damageRoll", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}

          {localError && <div className="text-danger mb-2">{localError}</div>}

          <button className="btn btn-danger" onClick={handleSubmit}>
            Submit
          </button>
        </>
      )}
    </div>
  );
}