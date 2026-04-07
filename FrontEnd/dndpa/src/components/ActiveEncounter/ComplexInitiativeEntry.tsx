import { useEffect, useState } from "react";
import {
    type Creature,
    type MonsterCreature,
    type PlayerCreature,
} from "../../types/creature.ts";
import creatureGet from "../../api/CreatureGet.ts";
import {isPlayerCreature} from "../../api/CreatureGet.ts";
import type {InitiativeEntry} from "../../types/SimulationTypes.ts";

type ComplexInitiativeEntryProps = {
  eid: string;
  cid: string;
  initiativeEntry: InitiativeEntry;
  onToggle: () => void;
};

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function renderList(label: string, items: unknown[] | undefined) {
  return (
    <div>
      <strong>{label}:</strong>{" "}
      {items && items.length > 0 ? items.map((item) => renderValue(item)).join(", ") : "None"}
    </div>
  );
}
function renderRecord(label: string, record: Record<string, unknown> | undefined) {
  return (
    <div style={{ marginTop: "8px" }}>
      <strong>{label}:</strong>
      {record ? (
        <div style={{ paddingLeft: "12px", marginTop: "4px" }}>
          {Object.entries(record).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {renderValue(value)}
            </div>
          ))}
        </div>
      ) : (
        <span> None</span>
      )}
    </div>
  );
}
function renderPlayer(creature: PlayerCreature) {
  const stats = creature.stats;

  return (
    <div style={{ marginTop: "10px", paddingLeft: "8px" }}>
      <div><strong>Type:</strong> Player</div>
      <div><strong>Name:</strong> {stats.name}</div>
      <div><strong>Class:</strong> {stats.characterClass}</div>
      <div><strong>Level:</strong> {stats.level}</div>
      <div><strong>HP:</strong> {stats.hp}</div>
      <div><strong>Max HP:</strong> {stats.maxhp}</div>
      <div><strong>AC:</strong> {stats.ac}</div>
      <div><strong>Position:</strong> {renderValue(stats.position)}</div>

      {renderRecord("Stat Array", stats.statArray as Record<string, unknown>)}
      {renderRecord("Save Proficiencies", stats.saveProfs as Record<string, unknown>)}
      {renderRecord("Modifiers", stats.modifiers)}

      {renderList("Damage Resistances", stats.damResists)}
      {renderList("Damage Immunities", stats.damImmunes)}
      {renderList("Damage Vulnerabilities", stats.damVulns)}
      {renderList("Condition Immunities", stats.conImmunes)}
      {renderList("Active Conditions", stats.activeConditions)}
      {renderList("Active Status Effects", stats.activeStatusEffects)}
      {renderList("Spell Slots", stats.spellSlots)}

      {renderList("Spells", creature.spells)}
      {renderList("Weapons", creature.weapons)}

      <div style={{ marginTop: "8px" }}>
        <strong>Extra Fields:</strong>
        <div style={{ paddingLeft: "12px", marginTop: "4px" }}>
          {Object.entries(creature)
            .filter(([key]) => key !== "stats" && key !== "spells" && key !== "weapons")
            .map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {renderValue(value)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
function renderMonster(creature: MonsterCreature) {
  const activeConditions = creature.activeConditions ?? creature.activeCons ?? [];

  return (
    <div style={{ marginTop: "10px", paddingLeft: "8px" }}>
      <div><strong>Type:</strong> Monster</div>
      <div><strong>Name:</strong> {creature.name}</div>
      <div><strong>CR:</strong> {creature.cr}</div>
      <div><strong>Creature Type:</strong> {creature.creatureType}</div>
      <div><strong>HP:</strong> {creature.hp}</div>
      <div><strong>Max HP:</strong> {creature.maxhp}</div>
      <div><strong>AC:</strong> {creature.ac}</div>
      <div><strong>Legendary Resists:</strong> {creature.lResists}</div>
      <div><strong>Magic Resist:</strong> {creature.magicResist ? "true" : "false"}</div>
      <div><strong>Lair Action:</strong> {creature.lairAction ? "true" : "false"}</div>
      <div><strong>Enemy:</strong> {creature.enemy ? "true" : "false"}</div>
      <div><strong>Size:</strong> {creature.size}</div>
      <div><strong>Movement:</strong> {creature.movement}</div>
      <div><strong>Position:</strong> {renderValue(creature.position)}</div>

      {renderRecord("Stat Array", creature.statArray as Record<string, unknown>)}
      {renderRecord("Save Proficiencies", creature.saveProfs as Record<string, unknown>)}
      {renderRecord("Modifiers", creature.modifiers)}

      {renderList("Damage Resistances", creature.damResists)}
      {renderList("Damage Immunities", creature.damImmunes)}
      {renderList("Damage Vulnerabilities", creature.damVulns)}
      {renderList("Condition Immunities", creature.conImmunes)}
      {renderList("Active Conditions", activeConditions)}
      {renderList("Active Status Effects", creature.activeStatusEffects)}
      {renderList("Actions", creature.actions)}
      {renderList("Legendary Actions", creature.legActions)}

      <div style={{ marginTop: "8px" }}>
        <strong>Spell Info:</strong> {creature.spellInfo ? JSON.stringify(creature.spellInfo) : "None"}
      </div>

      <div style={{ marginTop: "8px" }}>
        <strong>Multiattack:</strong> {creature.multiattack ? JSON.stringify(creature.multiattack) : "None"}
      </div>
    </div>
  );
}

export default function ComplexInitiativeEntry({
  eid,
  cid,
  initiativeEntry,
  onToggle,
}: ComplexInitiativeEntryProps) {
  const [creature, setCreature] = useState<Creature | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadCreature() {
      try {
        setLoading(true);
        setError("");
        const data = await creatureGet(eid, cid);

        if (!data) {
          setError("Creature not found.");
          setCreature(null);
          return;
        }

        setCreature(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load creature.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCreature();
  }, [eid, cid]);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <strong>{initiativeEntry.name}</strong>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse creature details"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "14px",
            transform: "rotate(90deg)",
          }}
        >
          ▶
        </button>
      </div>

      {loading && <div style={{ marginTop: "10px" }}>Loading creature...</div>}
      {error && <div style={{ marginTop: "10px" }}>Error: {error}</div>}

      {!loading && !error && creature && (
        <>
          {isPlayerCreature(creature) ? renderPlayer(creature) : renderMonster(creature)}
        </>
      )}
    </div>
  );
}