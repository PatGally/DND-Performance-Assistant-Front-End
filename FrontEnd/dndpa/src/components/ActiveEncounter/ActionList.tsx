import { useEffect, useState, type ReactNode } from "react";
import type {
    CreatureAction,
    SpellAction,
    WeaponAction,
    MonsterAction,
} from "../../types/action.ts";
import type { Creature } from "../../types/creature.ts";
import type { MultiattackDefinition } from "../../types/multiattack.ts";
import { hasMultiattackDefinition } from "../../types/multiattack.ts";
import { actionsGet } from "../../api/ActionsGet.ts";
import { getEncounter } from "../../api/EncounterGet.ts";
import { isSpellAction, isWeaponAction, isMonsterAction } from "../../utils/ActiveSimUtils/ActionTypeChecker.ts";
import { getCreatureCid } from "../../utils/ActiveSimUtils/CreatureHelpers.ts";
import "../../css/ActionList.css";

type ActionListProps = {
    eid: string;
    cid: string;
    handleActionSubmission: (action: CreatureAction) => void;
    onSelectManual: () => void;
};

function getActionName(action: CreatureAction): string {
    if (isSpellAction(action)) return action.spellname;
    return action.name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function expandedSplitNames(split: unknown): string[] {
    if (!Array.isArray(split)) return [];

    return split.flatMap((item) => {
        if (!isRecord(item)) return [];

        const name = String(item.name ?? "").trim();
        const parsedCount = Number(item.number ?? 1);
        const count = Number.isFinite(parsedCount)
            ? Math.max(0, Math.trunc(parsedCount))
            : 1;

        return name ? Array.from({ length: count }, () => name) : [];
    });
}

function actionNameFromUnknown(action: unknown): string {
    if (!isRecord(action)) return "";
    return String(action.name ?? action.spellname ?? "").trim();
}

function executableSequence(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is Record<string, unknown> => (
        isRecord(item) &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        isRecord(item.action)
    ));
}

function buildLocalMultiattackAction(
    creature: Creature | undefined,
    availableActions: CreatureAction[]
): CreatureAction | undefined {
    if (!creature || !isRecord(creature)) return undefined;

    const multiattack = creature.multiattack;
    if (!isRecord(multiattack)) return undefined;

    const expectedNames = expandedSplitNames(multiattack.split);
    if (expectedNames.length === 0) return undefined;

    const creatureActions = Array.isArray(creature.actions)
        ? creature.actions.filter(isRecord)
        : [];
    const actionCandidates: unknown[] = [...creatureActions, ...availableActions];
    const actionsByName = new Map<string, Record<string, unknown>>();

    for (const action of actionCandidates) {
        if (!isRecord(action)) continue;
        const key = actionNameFromUnknown(action).toLowerCase();
        if (key && !actionsByName.has(key)) actionsByName.set(key, action);
    }

    const resolvedSequence = expectedNames.map((expectedName, index) => {
        const action = actionsByName.get(expectedName.toLowerCase());
        return action
            ? {
                index,
                name: actionNameFromUnknown(action) || expectedName,
                action,
            }
            : undefined;
    });
    const sequence = resolvedSequence.every(Boolean)
        ? resolvedSequence
        : [];
    const total = expectedNames.length;
    const name = String(multiattack.name ?? "Multiattack").trim() || "Multiattack";
    const splitDescription = Array.isArray(multiattack.split)
        ? multiattack.split
            .filter(isRecord)
            .map((item) => `${Number(item.number ?? 1)} × ${String(item.name ?? "")}`)
            .join(", ")
        : "";

    return {
        name,
        desc: `Use one action to perform: ${splitDescription}.`,
        number: "0",
        actionRange: "0",
        shape: "",
        rolls: {
            rollType: "multiattack",
            saveType: "",
            halfSave: false,
            saveDC: 0,
            damage: "",
            attackBonus: "0",
            damageMod: "0",
        },
        extraDamage: [],
        damType: [],
        conditions: [],
        statusEffect: [],
        lingEffect: {},
        extraEffect: {},
        lingSave: {},
        recharge: "",
        actionCost: "action",
        specialNotes: ["Multiattack"],
        multiattack: {
            ...multiattack,
            name,
            total,
            split: Array.isArray(multiattack.split) ? multiattack.split : [],
            sequence,
        },
    } as unknown as CreatureAction;
}

function ensureMultiattackAction(
    actions: CreatureAction[],
    creature?: Creature
): CreatureAction[] {
    const existingIndex = actions.findIndex(hasMultiattackDefinition);
    const localMultiattack = buildLocalMultiattackAction(creature, actions);

    if (existingIndex < 0) {
        return localMultiattack ? [localMultiattack, ...actions] : actions;
    }
    if (!localMultiattack) return actions;

    const existing = actions[existingIndex] as unknown as Record<string, unknown>;
    const existingDefinition = isRecord(existing.multiattack)
        ? existing.multiattack
        : {};
    const local = localMultiattack as unknown as Record<string, unknown>;
    const localDefinition = isRecord(local.multiattack) ? local.multiattack : {};
    const existingSequence = executableSequence(existingDefinition.sequence);
    const localSequence = executableSequence(localDefinition.sequence);
    const expectedCount = expandedSplitNames(
        existingDefinition.split ?? localDefinition.split
    ).length;

    // A backend entry can contain the definition but no executable sequence.
    // Hydrate that card from the encounter's concrete child actions.
    if (
        (expectedCount > 0 && existingSequence.length === expectedCount) ||
        localSequence.length === 0
    ) return actions;

    const hydrated = {
        ...existing,
        actionCost: "action",
        multiattack: {
            ...localDefinition,
            ...existingDefinition,
            sequence: localSequence,
        },
    } as unknown as CreatureAction;

    return actions.map((action, index) =>
        index === existingIndex ? hydrated : action
    );
}

function renderMultiattackDetails(multiattack: MultiattackDefinition) {
    const split = Array.isArray(multiattack.split) ? multiattack.split : [];
    const sequence = Array.isArray(multiattack.sequence) ? multiattack.sequence : [];
    const executionNames = sequence.length > 0
        ? sequence.map((item) => item.name)
        : expandedSplitNames(split);

    return (
        <>
            <span className="action-type-badge">Multiattack</span>
            <DetailRow label="Action Cost" value="One Action" />
            <DetailRow label="Total Attacks" value={multiattack.total} />
            <DetailRow
                label="Required Sequence"
                value={split.length > 0
                    ? split
                    .map((item) => {
                        if (!item || typeof item !== "object") return null;
                        const entry = item as { number?: unknown; name?: unknown };
                        const name = String(entry.name ?? "").trim();
                        if (!name) return null;
                        const count = Number(entry.number ?? 1);
                        return `${Number.isFinite(count) ? count : 1} × ${name}`;
                    })
                    .filter((item): item is string => item !== null)
                    .join(", ") || "Unavailable"
                    : "Unavailable"}
            />
            <div className="action-description-section">
                <span className="action-detail-label">Execution Order</span>
                <ol className="action-description-text">
                    {executionNames.length > 0 ? (
                        executionNames.map((name, index) => (
                            <li key={`${name}-${index}`}>{name}</li>
                        ))
                    ) : (
                        <li>Executable sequence unavailable</li>
                    )}
                </ol>
            </div>
        </>
    );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="action-detail-row">
            <span className="action-detail-label">{label}</span>
            <span className="action-detail-value">{value ?? "None"}</span>
        </div>
    );
}

function ExpandableDescriptionSection({ description }: { description?: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="action-description-section">
            <span className="action-detail-label">Description</span>
            <div className="action-description-header">
                {!isExpanded && (
                    <button
                        type="button"
                        className="action-description-toggle-btn"
                        onClick={() => setIsExpanded(true)}
                        aria-label="Expand description"
                    >
                        {">"}
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="action-description-expanded-box">
                    <button
                        type="button"
                        className="action-description-toggle-btn"
                        onClick={() => setIsExpanded(false)}
                        aria-label="Collapse description"
                    >
                        {"<"}
                    </button>

                    <span className="action-description-text">{description || "None"}</span>
                </div>
            )}
        </div>
    );
}

function renderSpellDetails(action: SpellAction) {
    const target = action.targeting?.[0];

    return (
        <>
            <span className="action-type-badge">Spell</span>
            <DetailRow label="Level" value={action.level} />
            {target && (
                <>
                    <DetailRow label="Targets" value={target.number === "-2" ? "Self-origin AOE" :
                        target.number === "-1" ? "AOE" : target.number === "0" ? "Self" : target.number} />
                    <DetailRow label="Range" value={target.actionRange} />
                    <DetailRow label="Shape" value={target.shape || "None"} />
                    {target.radius !== "0" && (<DetailRow label="Radius" value={target.radius || "None"} />)}
                    <DetailRow label="Roll Type" value={target.rolls?.rollType || "None"} />
                    <DetailRow label="Save Type" value={target.rolls?.saveType || "None"} />
                    <DetailRow label="Half Save" value={String(target.rolls?.halfSave ?? false)} />
                    <DetailRow label="Damage" value={target.rolls?.damage || "None"} />
                    <DetailRow label="Damage Mod" value={target.rolls?.damageMod || "0"} />
                    <DetailRow label="Damage Type" value={target.damType?.join(", ") || "None"} />
                    <DetailRow label="Conditions" value={target.conditions?.join(", ") || "None"} />
                    <DetailRow label="Action Cost" value={target.actionCost || "None"} />
                    <DetailRow label="Special Notes" value={target.specialNotes?.join(", ") || "None"} />
                </>
            )}
        </>
    );
}

function renderWeaponDetails(action: WeaponAction) {
    return (
        <>
            <span className="action-type-badge">Weapon</span>
            <DetailRow label="Damage" value={action.properties.damage} />
            <DetailRow label="Damage Type" value={action.properties.damageType} />
            <DetailRow label="Weapon Stat" value={action.properties.weaponStat} />
        </>
    );
}

function renderMonsterDetails(action: MonsterAction) {
    return (
        <>
            <span className="action-type-badge">Monster Action</span>
            <ExpandableDescriptionSection description={action.desc} />
            <DetailRow label="Targets" value={action.number === "-2" ? "Self-origin AOE" :
                action.number === "-1" ? "AOE" : action.number === "0" ? "Self" : action.number} />
            <DetailRow label="Range" value={action.actionRange} />
            <DetailRow label="Shape" value={action.shape || "None"} />
            <DetailRow label="Roll Type" value={action.rolls?.rollType || "None"} />
            <DetailRow label="Save Type" value={action.rolls?.saveType || "None"} />
            <DetailRow label="Save DC" value={String(action.rolls?.saveDC ?? "None")} />
            <DetailRow label="Half Save" value={String(action.rolls?.halfSave ?? false)} />
            <DetailRow label="Attack Bonus" value={action.rolls?.attackBonus || "0"} />
            <DetailRow label="Damage" value={action.rolls?.damage || "None"} />
            <DetailRow label="Damage Mod" value={action.rolls?.damageMod || "0"} />
            <DetailRow label="Damage Type" value={action.damType?.join(", ") || "None"} />
            <DetailRow label="Conditions" value={action.conditions?.join(", ") || "None"} />
            <DetailRow label="Recharge" value={Array.isArray(action.recharge) ? action.recharge.join(", ") : String(action.recharge || "None")}
            />
            <DetailRow label="Action Cost" value={action.actionCost || "None"} />
            <DetailRow label="Special Notes" value={action.specialNotes?.join(", ") || "None"} />
        </>
    );
}

export default function ActionList({
                                       eid,
                                       cid,
                                       handleActionSubmission,
                                       onSelectManual,
                                   }: ActionListProps) {
    const [actions, setActions] = useState<CreatureAction[]>([]);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        async function loadActions() {
            try {
                setLoading(true);
                setError("");
                const [data, encounter] = await Promise.all([
                    actionsGet(eid, cid),
                    getEncounter(eid),
                ]);
                const serverActions = Array.isArray(data) ? data : [];
                const creatures: Creature[] = encounter
                    ? [...(encounter.players ?? []), ...(encounter.monsters ?? [])]
                    : [];
                const creature = creatures.find(
                    (candidate) => getCreatureCid(candidate) === cid
                );

                setActions(ensureMultiattackAction(serverActions, creature));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load actions.");
            } finally {
                setLoading(false);
            }
        }

        loadActions();
    }, [eid, cid]);

    const toggleExpand = (index: number) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    function renderActionDetails(action: CreatureAction) {
        let details: ReactNode = null;

        if (hasMultiattackDefinition(action)) {
            details = renderMultiattackDetails(action.multiattack);
        } else if (isSpellAction(action)) details = renderSpellDetails(action);
        else if (isWeaponAction(action)) details = renderWeaponDetails(action);
        else if (isMonsterAction(action)) details = renderMonsterDetails(action);

        return (
            <div className="action-details">
                {details ? (
                    <>
                        {details}
                        <hr className="action-list-thin-rule" />
                        <button className="action-select-btn" onClick={() => handleActionSubmission(action)}>
                            Select Action
                        </button>
                    </>
                ) : (
                    <>
                        <span className="action-detail-value">No details available.</span>
                        <hr className="action-list-thin-rule" />
                        <button className="action-select-btn manual" onClick={onSelectManual}>
                            Select Manually
                        </button>
                    </>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="action-list-wrap">
                <span className="action-list-status">Loading actions...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="action-list-wrap">
                <span className="action-list-status">Error: {error}</span>
            </div>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="action-list-wrap">
                <span className="action-list-status">No actions found.</span>
            </div>
        );
    }

    return (
        <div className="action-list-wrap">
            <span className="action-list-title">Actions</span>
            <hr className="action-list-red-rule" />

            {actions.map((action, index) => {
                const isExpanded = expandedIndex === index;

                return (
                    <div key={`${getActionName(action)}-${index}`} className="action-card">
                        <div className="action-card-header" onClick={() => toggleExpand(index)}>
                            <span className="action-card-name">{getActionName(action)}</span>
                            <button
                                type="button"
                                className={`action-expand-btn${isExpanded ? " expanded" : ""}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(index);
                                }}
                                aria-label={isExpanded ? "Collapse action details" : "Expand action details"}
                            >
                                ▶
                            </button>
                        </div>

                        {isExpanded && renderActionDetails(action)}
                    </div>
                );
            })}
        </div>
    );
}