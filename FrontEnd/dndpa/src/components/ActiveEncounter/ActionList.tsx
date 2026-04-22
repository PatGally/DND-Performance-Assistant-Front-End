import { useEffect, useState, type ReactNode } from "react";
import type {
    CreatureAction,
    SpellAction,
    WeaponAction,
    MonsterAction,
} from "../../types/action.ts";
import { actionsGet } from "../../api/ActionsGet.ts";
import { isSpellAction, isWeaponAction, isMonsterAction } from "../../utils/ActiveSimUtils/ActionTypeChecker.ts";
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
                const data = await actionsGet(eid, cid);
                setActions(data);
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

        if (isSpellAction(action)) details = renderSpellDetails(action);
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