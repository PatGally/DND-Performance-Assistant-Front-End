import { useEffect, useMemo, useState } from "react";
import creatureGet, { isPlayerCreature } from "../../api/CreatureGet.ts";
import type {
  Creature,
  MonsterCreature,
  PlayerCreature,
} from "../../types/creature.ts";
import type { InitiativeEntry, ManualAffectedCreature, ManualStatBlock, StatKey } from "../../types/SimulationTypes.ts";

type ComplexManualEntryProps = {
  eid: string;
  cid: string;
  initiativeEntry: InitiativeEntry;
  onToggle: () => void;
  draftValue?: ManualAffectedCreature;
  onDraftChange: (next: ManualAffectedCreature) => void;
};

const STAT_KEYS: StatKey[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value ?? [], null, 2);
}
function normalizeStatBlock(
  value: Record<string, unknown> | undefined
): ManualStatBlock | undefined {
  if (!value) return undefined;

  const out: ManualStatBlock = {};
  for (const key of STAT_KEYS) {
    const raw = value[key];
    if (typeof raw === "number") {
      out[key] = raw;
    }
  }
  return out;
}

function creatureToBaseline(creature: Creature, cid: string): ManualAffectedCreature {
  if (isPlayerCreature(creature)) {
    const stats = creature.stats;

    return {
      cid,
      statArray: normalizeStatBlock(stats.statArray as Record<string, unknown> | undefined),
      saveProfs: normalizeStatBlock(stats.saveProfs as Record<string, unknown> | undefined),
      modifiers: normalizeStatBlock(stats.modifiers as Record<string, unknown> | undefined),
      damResists: stats.damResists ?? [],
      damImmunes: stats.damImmunes ?? [],
      damVulns: stats.damVulns ?? [],
      conImmunes: stats.conImmunes ?? [],
      activeConditions: stats.activeConditions ?? [],
      activeStatusEffects: Array.isArray(stats.activeStatusEffects)
        ? (stats.activeStatusEffects as Record<string, unknown>[])
        : [],
      hp: typeof stats.hp === "number" ? stats.hp : undefined,
      position: Array.isArray(stats.position) ? stats.position : [],
      ac: typeof stats.ac === "number" ? stats.ac : undefined,
      spellSlots: Array.isArray(stats.spellSlots)
        ? (stats.spellSlots as number[][])
        : [],
    };
  }

  const monster = creature as MonsterCreature;

  return {
    cid,
    statArray: normalizeStatBlock(monster.statArray as Record<string, unknown> | undefined),
    saveProfs: normalizeStatBlock(monster.saveProfs as Record<string, unknown> | undefined),
    modifiers: normalizeStatBlock(monster.modifiers as Record<string, unknown> | undefined),
    damResists: monster.damResists ?? [],
    damImmunes: monster.damImmunes ?? [],
    damVulns: monster.damVulns ?? [],
    conImmunes: monster.conImmunes ?? [],
    activeConditions: (monster.activeConditions ?? monster.activeCons ?? []) as string[],
    activeStatusEffects: Array.isArray(monster.activeStatusEffects)
      ? (monster.activeStatusEffects as Record<string, unknown>[])
      : [],
    hp: typeof monster.hp === "number" ? monster.hp : undefined,
    position: Array.isArray(monster.position) ? monster.position : [],
    ac: typeof monster.ac === "number" ? monster.ac : undefined,
    lResists: typeof monster.lResists === "number" ? monster.lResists : undefined,
    enemy: typeof monster.enemy === "boolean" ? monster.enemy : undefined,
  };
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "12px", marginBottom: "8px" }}>
      <strong>{children}</strong>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ marginBottom: "4px" }}>{label}</div>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(toNumberOrUndefined(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function CheckboxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "10px",
      }}
    >
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ marginBottom: "4px" }}>{label}</div>
      <textarea
        rows={2}
        value={(value ?? []).join(", ")}
        onChange={(e) => onChange(parseCommaList(e.target.value))}
        style={{ width: "100%" }}
      />
      <div style={{ fontSize: "12px", opacity: 0.8 }}>Comma-separated</div>
    </div>
  );
}

function JsonField<T>({
  label,
  value,
  onChange,
}: {
  label: string;
  value: T | undefined;
  onChange: (next: T) => void;
}) {
  const [raw, setRaw] = useState<string>(safeJsonStringify(value));
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setRaw(safeJsonStringify(value));
    setError("");
  }, [value]);

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ marginBottom: "4px" }}>{label}</div>
      <textarea
        rows={5}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          try {
            const parsed = JSON.parse(raw) as T;
            onChange(parsed);
            setError("");
          } catch {
            setError("Invalid JSON");
          }
        }}
        style={{ width: "100%" }}
      />
      {error ? (
        <div style={{ fontSize: "12px", color: "#ff8080" }}>{error}</div>
      ) : null}
    </div>
  );
}

function StatBlockEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ManualStatBlock | undefined;
  onChange: (next: ManualStatBlock) => void;
}) {
  const current = value ?? {};

  return (
    <div style={{ marginBottom: "10px" }}>
      <SectionHeader>{label}</SectionHeader>
      {STAT_KEYS.map((key) => (
        <NumberField
          key={key}
          label={key}
          value={current[key]}
          onChange={(nextValue) =>
            onChange({
              ...current,
              [key]: nextValue,
            })
          }
        />
      ))}
    </div>
  );
}

export default function ComplexManualEntry({
  eid,
  cid,
  initiativeEntry,
  onToggle,
  draftValue,
  onDraftChange,
}: ComplexManualEntryProps) {
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

  const baseline = useMemo(() => {
    if (!creature) return undefined;
    return creatureToBaseline(creature, cid);
  }, [creature, cid]);

  function updatePatchField<K extends keyof ManualAffectedCreature>(
    key: K,
    nextValue: ManualAffectedCreature[K],
    baselineValue: ManualAffectedCreature[K]
  ) {
    const nextPatch: ManualAffectedCreature = {
      ...(draftValue ?? { cid }),
      cid,
    };

    if (deepEqual(nextValue, baselineValue)) {
      delete nextPatch[key];
    } else {
      nextPatch[key] = nextValue;
    }

    const changedKeys = Object.keys(nextPatch).filter((field) => field !== "cid");

    if (changedKeys.length === 0) {
      onDraftChange({ cid });
      return;
    }

    onDraftChange(nextPatch);
  }

  function getDisplayValue<K extends keyof ManualAffectedCreature>(
    key: K
  ): ManualAffectedCreature[K] | undefined {
    if (draftValue && draftValue[key] !== undefined) {
      return draftValue[key];
    }
    return baseline?.[key];
  }

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

      {loading && <div style={{ marginTop: "10px" }}>Loading creature.</div>}
      {error && <div style={{ marginTop: "10px" }}>Error: {error}</div>}

      {!loading && !error && creature && baseline && (
        <div style={{ marginTop: "10px", paddingLeft: "8px" }}>
          {isPlayerCreature(creature) ? (
            <>
              <div><strong>Type:</strong> Player</div>
              <div><strong>Name:</strong> {(creature as PlayerCreature).stats.name}</div>
              <div><strong>Class:</strong> {(creature as PlayerCreature).stats.characterClass}</div>
              <div><strong>Level:</strong> {(creature as PlayerCreature).stats.level}</div>
            </>
          ) : (
            <>
              <div><strong>Type:</strong> Monster</div>
              <div><strong>Name:</strong> {(creature as MonsterCreature).name}</div>
              <div><strong>CR:</strong> {(creature as MonsterCreature).cr}</div>
              <div><strong>Creature Type:</strong> {(creature as MonsterCreature).creatureType}</div>
              <div><strong>Size:</strong> {(creature as MonsterCreature).size}</div>
            </>
          )}

          <SectionHeader>Core</SectionHeader>

          <NumberField
            label="HP"
            value={getDisplayValue("hp") as number | undefined}
            onChange={(next) => updatePatchField("hp", next, baseline.hp)}
          />

          <NumberField
            label="AC"
            value={getDisplayValue("ac") as number | undefined}
            onChange={(next) => updatePatchField("ac", next, baseline.ac)}
          />

          {!isPlayerCreature(creature) && (
            <>
              <NumberField
                label="Legendary Resists"
                value={getDisplayValue("lResists") as number | undefined}
                onChange={(next) =>
                  updatePatchField("lResists", next, baseline.lResists)
                }
              />

              <CheckboxField
                label="Enemy"
                value={getDisplayValue("enemy") as boolean | undefined}
                onChange={(next) => updatePatchField("enemy", next, baseline.enemy)}
              />
            </>
          )}

          {/*<JsonField<number[][]>*/}
          {/*  label="Position"*/}
          {/*  value={getDisplayValue("position") as number[][] | undefined}*/}
          {/*  onChange={(next) => updatePatchField("position", next, baseline.position)}*/}
          {/*/>*/}

          <StatBlockEditor
            label="Stat Array"
            value={getDisplayValue("statArray") as ManualStatBlock | undefined}
            onChange={(next) =>
              updatePatchField("statArray", next, baseline.statArray)
            }
          />

          <StatBlockEditor
            label="Save Proficiencies"
            value={getDisplayValue("saveProfs") as ManualStatBlock | undefined}
            onChange={(next) =>
              updatePatchField("saveProfs", next, baseline.saveProfs)
            }
          />

          {/*<StatBlockEditor*/}
          {/*  label="Modifiers"*/}
          {/*  value={getDisplayValue("modifiers") as ManualStatBlock | undefined}*/}
          {/*  onChange={(next) =>*/}
          {/*    updatePatchField("modifiers", next, baseline.modifiers)*/}
          {/*  }*/}
          {/*/>*/}

          <SectionHeader>Lists</SectionHeader>

          <ListField
            label="Damage Resistances"
            value={getDisplayValue("damResists") as string[] | undefined}
            onChange={(next) =>
              updatePatchField("damResists", next, baseline.damResists)
            }
          />

          <ListField
            label="Damage Immunities"
            value={getDisplayValue("damImmunes") as string[] | undefined}
            onChange={(next) =>
              updatePatchField("damImmunes", next, baseline.damImmunes)
            }
          />

          <ListField
            label="Damage Vulnerabilities"
            value={getDisplayValue("damVulns") as string[] | undefined}
            onChange={(next) =>
              updatePatchField("damVulns", next, baseline.damVulns)
            }
          />

          <ListField
            label="Condition Immunities"
            value={getDisplayValue("conImmunes") as string[] | undefined}
            onChange={(next) =>
              updatePatchField("conImmunes", next, baseline.conImmunes)
            }
          />

          <ListField
            label="Active Conditions"
            value={getDisplayValue("activeConditions") as string[] | undefined}
            onChange={(next) =>
              updatePatchField("activeConditions", next, baseline.activeConditions)
            }
          />

          <JsonField<Record<string, unknown>[]>
            label="Active Status Effects"
            value={
              getDisplayValue("activeStatusEffects") as
                | Record<string, unknown>[]
                | undefined
            }
            onChange={(next) =>
              updatePatchField(
                "activeStatusEffects",
                next,
                baseline.activeStatusEffects
              )
            }
          />

          {isPlayerCreature(creature) && (
            <JsonField<number[][]>
              label="Spell Slots"
              value={getDisplayValue("spellSlots") as number[][] | undefined}
              onChange={(next) =>
                updatePatchField("spellSlots", next, baseline.spellSlots)
              }
            />
          )}
        </div>
      )}
    </div>
  );
}