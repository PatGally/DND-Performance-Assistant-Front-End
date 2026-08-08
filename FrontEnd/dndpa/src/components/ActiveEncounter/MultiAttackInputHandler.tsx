import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import axios from "axios";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import type { Creature } from "../../types/creature.ts";
import type {
    ActionRequestDraft,
    Encounter,
} from "../../types/SimulationTypes.ts";
import type {
    MultiattackDefinition,
    MultiattackRecommendation,
    MultiattackSequenceItem,
} from "../../types/multiattack.ts";
import {
    getCreatureCid,
    getCreatureName,
} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";
import "../../css/EncounterSimulation.css";

type ChildTargetInput = {
    attackRoll: string;
    saveRoll: string;
    damageRoll: string;
};

type ChildDraft = {
    targets: string[];
    inputs: Record<string, ChildTargetInput>;
};

type MultiAttackInputHandlerProps = {
    eid: string;
    actorCid: string;
    encounter: Encounter;
    definition: MultiattackDefinition;
    recommendation?: MultiattackRecommendation;
    executeAction?: (draft: ActionRequestDraft) => Promise<void | string>;
    onCancel: () => void;
    onComplete: () => Promise<void> | void;
};

function emptyTargetInput(): ChildTargetInput {
    return {
        attackRoll: "",
        saveRoll: "",
        damageRoll: "",
    };
}

function normalizeRollMode(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

function getActionRecord(item: MultiattackSequenceItem): Record<string, unknown> {
    return isRecord(item.action) ? item.action : {};
}

function getRollsRecord(item: MultiattackSequenceItem): Record<string, unknown> {
    const rolls = getActionRecord(item).rolls;
    return isRecord(rolls) ? rolls : {};
}

function hasDamage(item: MultiattackSequenceItem): boolean {
    const damage = String(getRollsRecord(item).damage ?? "").trim().toLowerCase();
    return damage !== "" && damage !== "none" && damage !== "0";
}

function targetLimit(item: MultiattackSequenceItem): number {
    const action = getActionRecord(item);
    const parsed = Number(action.numTarget ?? action.number ?? 1);
    return Number.isFinite(parsed) ? parsed : 1;
}

function attackRollBounds(item: MultiattackSequenceItem): { min: number; max: number } | null {
    const rolls = getRollsRecord(item);
    const rollMode = normalizeRollMode(rolls.rollType);
    if (rollMode !== "tohit" && rollMode !== "onhit") return null;

    const bonus = Number(rolls.attackBonus ?? 0);
    if (!Number.isFinite(bonus)) return null;
    return { min: 1 + bonus, max: 20 + bonus };
}

function damageRollBounds(
    item: MultiattackSequenceItem,
    attackRoll: string
): { min: number; max: number } | null {
    const rolls = getRollsRecord(item);
    const damage = String(rolls.damage ?? "").trim().toLowerCase();
    const match = damage.match(/^(\d+)d(\d+)$/);
    if (!match) return null;

    let diceCount = Number(match[1]);
    const diceType = Number(match[2]);
    const modifier = Number(rolls.damMod ?? rolls.damageMod ?? 0);
    const safeModifier = Number.isFinite(modifier) ? modifier : 0;

    const rollMode = normalizeRollMode(rolls.rollType);
    const attackBonus = Number(rolls.attackBonus ?? 0);
    const attackTotal = Number(attackRoll);
    if (
        (rollMode === "tohit" || rollMode === "onhit") &&
        Number.isFinite(attackBonus) &&
        Number.isFinite(attackTotal) &&
        attackTotal === 20 + attackBonus
    ) {
        diceCount *= 2;
    }

    return {
        min: diceCount + safeModifier,
        max: diceCount * diceType + safeModifier,
    };
}

function nowTime(): string {
    return new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function makeResultId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `multiattack-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeSequence(value: unknown): MultiattackSequenceItem[] {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is MultiattackSequenceItem => {
        if (!isRecord(item)) return false;
        if (typeof item.name !== "string" || item.name.trim() === "") return false;
        return isRecord(item.action);
    });
}

function nestedSequence(value: unknown): unknown {
    if (!isRecord(value)) return undefined;

    const multiattack = value.multiattack;
    return isRecord(multiattack) ? multiattack.sequence : undefined;
}

function expandedSplitNames(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        if (!isRecord(item)) return [];

        const name = String(item.name ?? "").trim();
        const parsedCount = Number(item.number ?? 1);
        const count = Number.isFinite(parsedCount)
            ? Math.max(0, Math.trunc(parsedCount))
            : 1;

        return name ? Array.from({ length: count }, () => name) : [];
    });
}

function alignSequenceToSplit(
    sequence: MultiattackSequenceItem[],
    split: unknown
): MultiattackSequenceItem[] {
    const expectedNames = expandedSplitNames(split);
    if (expectedNames.length === 0) return sequence;

    const queues = new Map<string, MultiattackSequenceItem[]>();
    const templates = new Map<string, MultiattackSequenceItem>();

    for (const item of sequence) {
        const key = item.name.trim().toLowerCase();
        const queue = queues.get(key) ?? [];
        queue.push(item);
        queues.set(key, queue);
        if (!templates.has(key)) templates.set(key, item);
    }

    const aligned = expectedNames.map((expectedName) => {
        const key = expectedName.toLowerCase();
        const next = queues.get(key)?.shift() ?? templates.get(key);
        return next ? { ...next, name: expectedName } : undefined;
    });

    return aligned.every((item): item is MultiattackSequenceItem => Boolean(item))
        ? aligned
        : sequence;
}

function buildSequenceFromActorActions(
    split: unknown,
    actor?: Creature
): MultiattackSequenceItem[] {
    const expectedNames = expandedSplitNames(split);
    if (expectedNames.length === 0 || !isRecord(actor)) return [];

    const actorActions = Array.isArray(actor.actions)
        ? actor.actions.filter(isRecord)
        : [];
    const actionsByName = new Map<string, Record<string, unknown>>();

    for (const action of actorActions) {
        const key = String(action.name ?? "").trim().toLowerCase();
        if (key && !actionsByName.has(key)) actionsByName.set(key, action);
    }

    const sequence = expectedNames.map((expectedName, index) => {
        const action = actionsByName.get(expectedName.trim().toLowerCase());
        if (!action) return undefined;

        return {
            index,
            name: String(action.name ?? expectedName),
            action: action as unknown as MultiattackSequenceItem["action"],
        } as MultiattackSequenceItem;
    });

    return sequence.every((item): item is MultiattackSequenceItem => Boolean(item))
        ? sequence
        : [];
}

function getChildEffects(item: MultiattackSequenceItem): {
    conditions: string[];
    statusEffects: Record<string, unknown>[];
} {
    const action = item.action as unknown as Record<string, unknown>;
    const rawStatusEffects = Array.isArray(action.statusEffect)
        ? action.statusEffect
        : Array.isArray(action.statusEffects)
            ? action.statusEffects
            : [];

    return {
        conditions: Array.isArray(action.conditions)
            ? action.conditions.filter((value): value is string => typeof value === "string")
            : [],
        statusEffects: rawStatusEffects.filter(isRecord),
    };
}

function recommendationNumber(
    recommendation: MultiattackRecommendation | undefined,
    keys: string[],
    fallback = 0
): number {
    if (!recommendation) return fallback;
    const record = recommendation as unknown as Record<string, unknown>;

    for (const key of keys) {
        const parsed = Number(record[key]);
        if (Number.isFinite(parsed)) return parsed;
    }

    return fallback;
}

function recommendationNullableNumber(
    recommendation: MultiattackRecommendation | undefined,
    keys: string[]
): number | null {
    if (!recommendation) return null;
    const record = recommendation as unknown as Record<string, unknown>;

    for (const key of keys) {
        if (record[key] === null || record[key] === undefined) continue;
        const parsed = Number(record[key]);
        if (Number.isFinite(parsed)) return parsed;
    }

    return null;
}

function resolveSequence(
    definition: MultiattackDefinition,
    recommendation?: MultiattackRecommendation,
    actor?: Creature
): MultiattackSequenceItem[] {
    const definitionRecord = definition as unknown as Record<string, unknown>;
    const recommendationRecord = recommendation as unknown as
        | Record<string, unknown>
        | undefined;

    const candidates: unknown[] = [
        definitionRecord.sequence,
        nestedSequence(definitionRecord),
        recommendationRecord?.sequence,
        nestedSequence(recommendationRecord),
    ];

    for (const candidate of candidates) {
        const normalized = normalizeSequence(candidate);
        if (normalized.length > 0) {
            return alignSequenceToSplit(normalized, definitionRecord.split);
        }
    }

    // Persisted monster stat blocks intentionally store only `split`. If the
    // backend did not attach a recommendation/action `sequence`, rebuild it
    // from the actor's concrete actions so legacy and current saves both work.
    return buildSequenceFromActorActions(definitionRecord.split, actor);
}

export default function MultiAttackInputHandler({
                                                    eid,
                                                    actorCid,
                                                    encounter,
                                                    definition,
                                                    recommendation,
                                                    executeAction,
                                                    onCancel,
                                                    onComplete,
                                                }: MultiAttackInputHandlerProps) {
    const allCreatures = useMemo<Creature[]>(
        () => [...(encounter.players ?? []), ...(encounter.monsters ?? [])],
        [encounter]
    );

    const actor = allCreatures.find((creature) => getCreatureCid(creature) === actorCid);
    const sequence = useMemo(
        () => resolveSequence(definition, recommendation, actor),
        [definition, recommendation, actor]
    );

    const buildInitialDrafts = (): ChildDraft[] =>
        sequence.map((item) => {
            const limit = targetLimit(item);
            let targets: string[] = [];

            if (limit === 0) {
                targets = [actorCid];
            } else if (Array.isArray(item.target)) {
                targets = item.target
                    .map((targetName) =>
                        allCreatures.find(
                            (creature) =>
                                getCreatureName(creature).toLowerCase() ===
                                String(targetName).toLowerCase()
                        )
                    )
                    .filter((creature): creature is Creature => Boolean(creature))
                    .map(getCreatureCid);

                if (limit > 0) targets = targets.slice(0, limit);
            }

            const inputs = Object.fromEntries(
                targets.map((cid) => [cid, emptyTargetInput()])
            );
            return { targets, inputs };
        });

    const [drafts, setDrafts] = useState<ChildDraft[]>(buildInitialDrafts);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setDrafts(buildInitialDrafts());
        setError("");
        // The definition identity changes whenever a new multiattack is chosen.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [definition, recommendation, sequence, actorCid]);

    function updateTargets(childIndex: number, cid: string) {
        const item = sequence[childIndex];
        if (!item) return;
        const limit = targetLimit(item);
        if (limit === 0) return;

        setDrafts((previous) =>
            previous.map((draft, index) => {
                if (index !== childIndex) return draft;

                const exists = draft.targets.includes(cid);
                let targets: string[];

                if (exists) {
                    targets = draft.targets.filter((targetCid) => targetCid !== cid);
                } else if (limit === 1) {
                    targets = [cid];
                } else if (limit > 1 && draft.targets.length >= limit) {
                    return draft;
                } else {
                    targets = [...draft.targets, cid];
                }

                const inputs = { ...draft.inputs };
                for (const targetCid of targets) {
                    inputs[targetCid] ??= emptyTargetInput();
                }
                for (const targetCid of Object.keys(inputs)) {
                    if (!targets.includes(targetCid)) delete inputs[targetCid];
                }

                return { targets, inputs };
            })
        );
    }

    function updateInput(
        childIndex: number,
        cid: string,
        field: keyof ChildTargetInput,
        value: string
    ) {
        setDrafts((previous) =>
            previous.map((draft, index) => {
                if (index !== childIndex) return draft;
                return {
                    ...draft,
                    inputs: {
                        ...draft.inputs,
                        [cid]: {
                            ...(draft.inputs[cid] ?? emptyTargetInput()),
                            [field]: value,
                        },
                    },
                };
            })
        );
    }

    function validateAndBuildChildren() {
        if (sequence.length === 0) {
            throw new Error("This multiattack does not contain an executable child sequence.");
        }

        const expectedNames = expandedSplitNames(definition.split);
        const actualNames = sequence.map((item) => item.name.trim().toLowerCase());
        if (
            expectedNames.length > 0 &&
            (
                expectedNames.length !== actualNames.length ||
                expectedNames.some(
                    (name, index) => name.toLowerCase() !== actualNames[index]
                )
            )
        ) {
            throw new Error(
                "The recommendation does not match this creature's configured multiattack split. Refresh recommendations and try again."
            );
        }

        return sequence.map((item, childIndex) => {
            const draft = drafts[childIndex];
            const limit = targetLimit(item);
            const rollMode = normalizeRollMode(getRollsRecord(item).rollType);
            const needsAttack = rollMode === "tohit" || rollMode === "onhit";
            const needsSave = rollMode === "save";
            const needsDamage = hasDamage(item);
            const { conditions, statusEffects } = getChildEffects(item);

            if (!draft || draft.targets.length === 0) {
                throw new Error(`${item.name}: select at least one target.`);
            }
            if (limit > 0 && draft.targets.length > limit) {
                throw new Error(`${item.name}: select no more than ${limit} target(s).`);
            }

            const rollResults: string[] = [];
            const diceResults: number[] = [];

            draft.targets.forEach((cid) => {
                const target = allCreatures.find(
                    (creature) => getCreatureCid(creature) === cid
                );
                const input = draft.inputs[cid] ?? emptyTargetInput();
                if (!target) throw new Error(`${item.name}: target not found.`);

                if (needsAttack) {
                    if (input.attackRoll.trim() === "") {
                        throw new Error(`${item.name}: enter an attack roll for ${getCreatureName(target)}.`);
                    }
                    const value = Number(input.attackRoll.trim());
                    const bounds = attackRollBounds(item);
                    if (!Number.isFinite(value)) {
                        throw new Error(`${item.name}: enter an attack roll for ${getCreatureName(target)}.`);
                    }
                    if (bounds && (value < bounds.min || value > bounds.max)) {
                        throw new Error(
                            `${item.name}: attack roll for ${getCreatureName(target)} must be between ${bounds.min} and ${bounds.max}.`
                        );
                    }
                    rollResults.push(String(value));
                } else if (needsSave) {
                    if (input.saveRoll.trim() === "") {
                        throw new Error(`${item.name}: enter a save total for ${getCreatureName(target)}.`);
                    }
                    const value = Number(input.saveRoll.trim());
                    if (!Number.isFinite(value)) {
                        throw new Error(`${item.name}: enter a save total for ${getCreatureName(target)}.`);
                    }
                    rollResults.push(String(value));
                } else if (rollMode === "autohit") {
                    rollResults.push("y");
                } else {
                    rollResults.push("");
                }

                if (needsDamage) {
                    if (input.damageRoll.trim() === "") {
                        throw new Error(`${item.name}: enter damage for ${getCreatureName(target)}.`);
                    }
                    const value = Number(input.damageRoll.trim());
                    const bounds = damageRollBounds(item, input.attackRoll);
                    if (!Number.isFinite(value)) {
                        throw new Error(`${item.name}: enter damage for ${getCreatureName(target)}.`);
                    }
                    if (bounds && (value < bounds.min || value > bounds.max)) {
                        throw new Error(
                            `${item.name}: damage for ${getCreatureName(target)} must be between ${bounds.min} and ${bounds.max}.`
                        );
                    }
                    diceResults.push(value);
                } else {
                    diceResults.push(0);
                }
            });

            return {
                resultID: makeResultId(),
                action: item.name,
                actionProb: item.prob ?? 0,
                actionEDam: item.eDam ?? 0,
                actionImpact: item.impact ?? 0,
                targets: draft.targets,
                conditions,
                statusEffects,
                outcome: { rollResults, diceResults },
                extraOutcome: { extraRollResults: [], extraDiceResults: [] },
            };
        });
    }

    async function submitMultiattack() {
        if (!actor) {
            setError("The multiattack actor could not be found in the encounter.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const attacks = validateAndBuildChildren();
            const resultID = makeResultId();
            const targets = Array.from(
                new Set(attacks.flatMap((attack) => attack.targets))
            );
            const mlWeight = recommendationNullableNumber(
                recommendation,
                ["mlWeight", "ml_weight"]
            );

            const payload = {
                resultID,
                actor: actorCid,
                action: definition.name,
                actionType: "Multiattack",
                actionProb: recommendationNumber(recommendation, ["prob", "actionProb"]),
                actionEDam: recommendationNumber(recommendation, ["eDam", "actionEDam"]),
                actionImpact: recommendationNumber(recommendation, ["impact", "actionImpact"]),
                actionRanking: recommendationNumber(recommendation, ["overallRank", "actionRanking"]),
                base_weight: recommendationNumber(recommendation, ["baseWeight", "base_weight"]),
                ml_weight: mlWeight,
                useML: mlWeight !== null,
                final_weight: recommendationNumber(recommendation, ["finalWeight", "final_weight"]),
                candidateCount: recommendationNumber(recommendation, ["candidateCount"]),
                recommended: Boolean(recommendation),
                targets,
                conditions: [],
                statusEffects: [],
                outcome: { rollResults: [], diceResults: [] },
                extraOutcome: { extraRollResults: [], extraDiceResults: [] },
                token: null,
                timestamp: nowTime(),
                multiattack: {
                    name: definition.name,
                    total: definition.total,
                    split: Array.isArray(definition.split) ? definition.split : [],
                    sequence,
                    attacks,
                },
            };

            if (executeAction) {
                const executionError = await executeAction(
                    payload as unknown as ActionRequestDraft
                );
                if (typeof executionError === "string" && executionError.trim()) {
                    throw new Error(executionError);
                }
                await onComplete();
            } else {
                await axiosTokenInstance.post(
                    `/encounter/${eid}/simulate/ruleset`,
                    payload
                );
                await onComplete();
            }
        } catch (caught) {
            if (axios.isAxiosError(caught)) {
                setError(
                    String(caught.response?.data?.detail ?? "Multiattack execution failed.")
                );
            } else {
                setError(caught instanceof Error ? caught.message : "Multiattack execution failed.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (sequence.length === 0) {
        return (
            <div className="pa-input-handler">
                <div className="pa-input-handler__title">
                    {definition.name || "Multiattack"}
                </div>
                <p className="pa-input-handler__error">
                    This multiattack could not match every split entry to the
                    creature&apos;s action list. Verify the split action names and try
                    again.
                </p>
                <div className="pa-input-handler__actions">
                    <button
                        type="button"
                        className="pa-input-handler__btn pa-input-handler__btn--back"
                        onClick={onCancel}
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pa-input-handler">
            <div className="pa-input-handler__title">{definition.name}</div>
            <p className="pa-input-handler__helper">
                This entire sequence consumes one action. Enter the result of every required child attack.
            </p>

            {sequence.map((item, childIndex) => {
                const draft = drafts[childIndex] ?? { targets: [], inputs: {} };
                const limit = targetLimit(item);
                const rollMode = normalizeRollMode(getRollsRecord(item).rollType);
                const needsAttack = rollMode === "tohit" || rollMode === "onhit";
                const needsSave = rollMode === "save";
                const needsDamage = hasDamage(item);

                return (
                    <div className="pa-input-handler__target-block" key={`${item.name}-${childIndex}`}>
                        <div className="pa-input-handler__target-name">
                            {childIndex + 1}. {item.name}
                        </div>

                        <p className="pa-input-handler__helper pa-input-handler__helper--muted">
                            {limit === 0
                                ? "Targets self"
                                : limit < 0
                                    ? "Select all affected targets"
                                    : `Select up to ${limit} target${limit === 1 ? "" : "s"}`}
                        </p>

                        {limit !== 0 && (
                            <div className="pa-input-handler__targets">
                                {allCreatures.map((creature) => {
                                    const cid = getCreatureCid(creature);
                                    const selected = draft.targets.includes(cid);
                                    return (
                                        <div className="form-check" key={`${childIndex}-${cid}`}>
                                            <input
                                                className="form-check-input"
                                                type={limit === 1 ? "radio" : "checkbox"}
                                                name={`multiattack-target-${childIndex}`}
                                                id={`multiattack-target-${childIndex}-${cid}`}
                                                checked={selected}
                                                onChange={() => updateTargets(childIndex, cid)}
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor={`multiattack-target-${childIndex}-${cid}`}
                                            >
                                                {getCreatureName(creature)}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {draft.targets.map((cid) => {
                            const creature = allCreatures.find(
                                (candidate) => getCreatureCid(candidate) === cid
                            );
                            if (!creature) return null;
                            const input = draft.inputs[cid] ?? emptyTargetInput();
                            const rollBounds = attackRollBounds(item);
                            const damageBounds = damageRollBounds(item, input.attackRoll);

                            return (
                                <div className="pa-input-handler__target-block" key={`${childIndex}-${cid}-inputs`}>
                                    <div className="pa-input-handler__target-name">
                                        {getCreatureName(creature)}
                                    </div>

                                    {needsAttack && (
                                        <div className="pa-input-handler__field">
                                            {rollBounds && (
                                                <div className="pa-input-handler__helper pa-input-handler__helper--muted small mb-1">
                                                    Min: {rollBounds.min} | Max: {rollBounds.max}
                                                </div>
                                            )}
                                            <label className="pa-input-handler__field-label">Attack Roll</label>
                                            <input
                                                className="pa-input-handler__input form-control"
                                                type="number"
                                                min={rollBounds?.min}
                                                max={rollBounds?.max}
                                                value={input.attackRoll}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    updateInput(
                                                        childIndex,
                                                        cid,
                                                        "attackRoll",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {needsSave && (
                                        <div className="pa-input-handler__field">
                                            <label className="pa-input-handler__field-label">
                                                Save Roll ({item.action?.rolls?.saveType || "Save"})
                                                {item.action?.rolls?.saveDC
                                                    ? ` — DC ${item.action?.rolls?.saveDC}`
                                                    : ""}
                                            </label>
                                            <input
                                                className="pa-input-handler__input form-control"
                                                type="number"
                                                value={input.saveRoll}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    updateInput(
                                                        childIndex,
                                                        cid,
                                                        "saveRoll",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {needsDamage && (
                                        <div className="pa-input-handler__field">
                                            {damageBounds && (
                                                <div className="pa-input-handler__helper pa-input-handler__helper--muted small mb-1">
                                                    Min: {damageBounds.min} | Max: {damageBounds.max}
                                                </div>
                                            )}
                                            <label className="pa-input-handler__field-label">Damage Roll</label>
                                            <input
                                                className="pa-input-handler__input form-control"
                                                type="number"
                                                min={damageBounds?.min}
                                                max={damageBounds?.max}
                                                value={input.damageRoll}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                                    updateInput(
                                                        childIndex,
                                                        cid,
                                                        "damageRoll",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {error && <p className="pa-input-handler__error">{error}</p>}

            <div className="pa-input-handler__actions">
                <button
                    type="button"
                    className="pa-input-handler__btn pa-input-handler__btn--back"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="pa-input-handler__btn pa-input-handler__btn--submit"
                    onClick={() => void submitMultiattack()}
                    disabled={submitting}
                >
                    {submitting ? "Resolving…" : "Resolve Multiattack"}
                </button>
            </div>
        </div>
    );
}