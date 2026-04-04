import { useEffect, useState } from "react";
import type {
  CreatureAction,
  SpellAction,
  WeaponAction,
  MonsterAction,
} from "../../api/ActionsGet.ts";
import { actionsGet } from "../../api/ActionsGet.ts";
import {isSpellAction, isWeaponAction, isMonsterAction} from "../../utils/ActionTypeChecker.ts"

type ActionListProps = {
  eid: string;
  cid: string;
  handleActionSubmission: (action: CreatureAction) => void;
  handleManualSimulate: () => void;
};

function getActionName(action: CreatureAction): string {
  if (isSpellAction(action)) return action.spellname;
  return action.name;
}

function renderSpellDetails(action: SpellAction) {
  const target = action.targeting?.[0];

  return (
    <div style={{ marginTop: "8px", paddingLeft: "8px" }}>
      <div><strong>Type:</strong> Spell</div>
      <div><strong>Level:</strong> {action.level}</div>

      {target && (
        <>
          <div><strong>Targets:</strong> {target.number}</div>
          <div><strong>Range:</strong> {target.actionRange}</div>
          <div><strong>Shape:</strong> {target.shape || "None"}</div>
          <div><strong>Radius:</strong> {target.radius || "None"}</div>
          <div><strong>Roll Type:</strong> {target.rolls?.rollType || "None"}</div>
          <div><strong>Save Type:</strong> {target.rolls?.saveType || "None"}</div>
          <div><strong>Half Save:</strong> {String(target.rolls?.halfSave ?? false)}</div>
          <div><strong>Damage:</strong> {target.rolls?.damage || "None"}</div>
          <div><strong>Damage Mod:</strong> {target.rolls?.damageMod || "0"}</div>
          <div><strong>Damage Type:</strong> {target.damType?.join(", ") || "None"}</div>
          <div><strong>Conditions:</strong> {target.conditions?.join(", ") || "None"}</div>
          <div><strong>Action Cost:</strong> {target.actionCost || "None"}</div>
          <div><strong>Special Notes:</strong> {target.specialNotes?.join(", ") || "None"}</div>
        </>
      )}
    </div>
  );
}

function renderWeaponDetails(action: WeaponAction) {
  return (
    <div style={{ marginTop: "8px", paddingLeft: "8px" }}>
      <div><strong>Type:</strong> Weapon</div>
      <div><strong>Damage:</strong> {action.properties.damage}</div>
      <div><strong>Damage Type:</strong> {action.properties.damageType}</div>
      <div><strong>Weapon Stat:</strong> {action.properties.weaponStat}</div>
    </div>
  );
}

function renderMonsterDetails(action: MonsterAction) {
  return (
    <div style={{ marginTop: "8px", paddingLeft: "8px" }}>
      <div><strong>Type:</strong> Monster Action</div>
      <div><strong>Description:</strong> {action.desc || "None"}</div>
      <div><strong>Targets:</strong> {action.number}</div>
      <div><strong>Range:</strong> {action.actionRange}</div>
      <div><strong>Shape:</strong> {action.shape || "None"}</div>
      <div><strong>Roll Type:</strong> {action.rolls?.rollType || "None"}</div>
      <div><strong>Save Type:</strong> {action.rolls?.saveType || "None"}</div>
      <div><strong>Save DC:</strong> {String(action.rolls?.saveDC ?? "None")}</div>
      <div><strong>Half Save:</strong> {String(action.rolls?.halfSave ?? false)}</div>
      <div><strong>Attack Bonus:</strong> {action.rolls?.attackBonus || "0"}</div>
      <div><strong>Damage:</strong> {action.rolls?.damage || "None"}</div>
      <div><strong>Damage Mod:</strong> {action.rolls?.damageMod || "0"}</div>
      <div><strong>Damage Type:</strong> {action.damType?.join(", ") || "None"}</div>
      <div><strong>Conditions:</strong> {action.conditions?.join(", ") || "None"}</div>
      <div><strong>Recharge:</strong> {Array.isArray(action.recharge) ? action.recharge.join(", ") : String(action.recharge || "None")}</div>
      <div><strong>Action Cost:</strong> {action.actionCost || "None"}</div>
      <div><strong>Special Notes:</strong> {action.specialNotes?.join(", ") || "None"}</div>
    </div>
  );
}

export default function ActionList({
  eid,
  cid,
  handleActionSubmission,
  handleManualSimulate,
}: ActionListProps) {
  const [actions, setActions] = useState<CreatureAction[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  function renderActionDetails(action: CreatureAction) {
    let actionElement;

    if (isSpellAction(action)) actionElement = renderSpellDetails(action);
    else if (isWeaponAction(action)) actionElement = renderWeaponDetails(action);
    else if (isMonsterAction(action)) actionElement = renderMonsterDetails(action);

    return (
      <div style={{ marginTop: "8px" }}>
        {!actionElement ?
            <div>No details available.
                <button onClick={handleManualSimulate} style={{color: "red"}}>
                Select
                </button>
            </div>
            : <>
                {actionElement}
                <button onClick={() => handleActionSubmission(action)} style={{color: "blue"}}>
                    Select
                </button>
            </>
        }
      </div>
    );
  }

    useEffect(() => {
        async function loadActions() {
            try {
                setLoading(true);
        setError("");
        const data = await actionsGet(eid, cid);
        setActions(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load actions.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadActions();
  }, [eid, cid]);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (loading) return <div>Loading actions...</div>;
  if (error) return <div>Error: {error}</div>;
  if (actions.length === 0) {
    return (
      <div>
        No actions found.
      </div>
    );
  }
    if(!sessionStorage.getItem(`encounter-${eid}-${cid}-actions`)) {
        sessionStorage.setItem(`encounter-${eid}-${cid}-actions`, JSON.stringify(actions));
    }
  return (
    <div style={{ width: "100%" }}>
      {actions.map((action, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={`${getActionName(action)}-${index}`}
            style={{
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "10px 12px",
              marginBottom: "10px",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => toggleExpand(index)}
            >
              <span>{getActionName(action)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(index);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "14px",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
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