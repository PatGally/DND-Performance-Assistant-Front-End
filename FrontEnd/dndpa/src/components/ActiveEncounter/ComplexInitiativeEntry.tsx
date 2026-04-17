import { useEffect, useState } from "react";
import {type Creature, type MonsterCreature, type PlayerCreature} from "../../types/creature.ts";
import creatureGet from "../../api/CreatureGet";
import {isPlayerCreature} from "../../api/CreatureGet";
import type {InitiativeEntry} from "../../types/SimulationTypes";


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


function renderPlayer(creature: PlayerCreature, onToggle?: () => void) {
    const stats = creature.stats;

    const s: Record<string, React.CSSProperties> = {
        wrap: {
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
            backgroundColor: "#fdf1dc",
            border: "2px solid #8b1a1a",
            borderRadius: "4px",
            padding: "10px 14px",
            marginTop: "8px",
            color: "#3b1a1a",
            fontSize: "13px",
            lineHeight: "1.5",
        },
        blueRule: {
            border: "none",
            borderTop: "2px solid #8b1a1a",
            margin: "7px 0",
        },
        thinRule: {
            border: "none",
            borderTop: "1px solid #8b1a1a",
            margin: "5px 0",
            opacity: 0.35,
        },
        label: {
            color: "#8b1a1a",
            fontWeight: "bold" as const,
            fontStyle: "italic" as const,
        },
        statCell: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            backgroundColor: "#fdf1dc",
            border: "1px solid #8b1a1a",
            borderRadius: "3px",
            padding: "3px 6px",
            minWidth: 0,
        },
        statKey: {
            fontSize: "10px",
            color: "#8b1a1a",
            fontWeight: "bold" as const,
            letterSpacing: "0.05em",
        },
        statVal: {
            fontSize: "13px",
            fontWeight: "bold" as const,
            color: "#3b1a1a",
        },
    };

    function StatRow({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "4px" }}>
                <div style={{ ...s.label, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {title}
                </div>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(entries.length, 6)}, 1fr)`,
                    gap: "4px",
                    marginTop: "3px",
                }}>
                    {entries.map(([key, val]) => (
                        <div key={key} style={s.statCell}>
                            <span style={s.statKey}>{key}</span>
                            <span style={s.statVal}>{String(val)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: "2px 4px",
                    alignItems: "baseline",
                }}>
        {entries.map(([key, val], i) => (
            <span key={key} style={{ whiteSpace: "nowrap" }}> {/* pair stays together */}
                <span style={{ fontWeight: "bold" }}>{key}</span>{" "}
                <span style={{ color: "#8b1a1a" }}>{String(val)}</span>
                {i < entries.length - 1 && (
                    <span style={{ opacity: 0.4, margin: "0 3px" }}>·</span>
                )}
          </span>
        ))}
      </span>
            </div>
        );
    }

    function PropRow({ label, value }: { label: string; value: React.ReactNode }) {
        return (
            <div>
                <span style={s.label}>{label}: </span>
                <span>{value}</span>
            </div>
        );
    }

    const statArray = stats.statArray as Record<string, unknown> | undefined;
    const saveProfs = stats.saveProfs as Record<string, unknown> | undefined;
    const modifiers = stats.modifiers as Record<string, unknown> | undefined;

    function getOrdinal(level: number): string {
        const mod10 = level % 10;
        const mod100 = level % 100;

        if (mod10 === 1 && mod100 !== 11) return `${level}st`;
        if (mod10 === 2 && mod100 !== 12) return `${level}nd`;
        if (mod10 === 3 && mod100 !== 13) return `${level}rd`;
        return `${level}th`;
    }

    function formatSpellSlots(
        spellSlots: Array<[number, number]> | number[][] | undefined
    ): string {
        if (!spellSlots || spellSlots.length === 0) return "None";

        const formatted = spellSlots
            .map((slot, index) => {
                const first = Number(slot?.[0] ?? 0);
                const second = Number(slot?.[1] ?? 0);

                if (first === 0 && second === 0) return null;

                return `${getOrdinal(index + 1)}: ${first}`;
            })
            .filter((slot): slot is string => slot !== null);

        return formatted.length > 0 ? formatted.join(", ") : "None";
    }

    return (
        <div style={s.wrap}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#8b1a1a", letterSpacing: "0.02em" }}>
          {stats.name}
        </span>
                <span style={{ fontSize: "11px", fontStyle: "italic", color: "#5a3030" }}>
          {stats.characterClass} · Level {stats.level}
        </span>
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Collapse creature details"
                        style={{
                            border: "1px solid #8b1a1a",
                            background: "#8b1a1a",
                            cursor: "pointer",
                            fontSize: "11px",
                            color: "#fdf1dc",
                            borderRadius: "3px",
                            padding: "2px 7px",
                            fontFamily: "inherit",
                        }}
                    >
                        ▼
                    </button>
                )}
            </div>

            <hr style={s.blueRule} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <PropRow label="HP"       value={`${stats.hp} / ${stats.maxhp}`} />
                <PropRow label="AC"       value={stats.ac} />
                <PropRow label="Position" value={renderValue(stats.position)} />
            </div>

            <hr style={s.blueRule} />

            {statArray && <StatRow title="Ability Scores" data={statArray} />}

            {saveProfs && Object.keys(saveProfs).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Saving Throws" data={saveProfs} />
                </>
            )}

            {modifiers && Object.keys(modifiers).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Modifiers" data={modifiers} />
                </>
            )}

            <hr style={s.blueRule} />

            {renderList("Damage Resistances",     stats.damResists)}
            {renderList("Damage Immunities",      stats.damImmunes)}
            {renderList("Damage Vulnerabilities", stats.damVulns)}
            {renderList("Condition Immunities",   stats.conImmunes)}
            {renderList("Active Conditions",      stats.activeConditions)}
            {renderList("Active Status Effects",  stats.activeStatusEffects)}

            <div>
                <strong>Spell Slots:</strong> {formatSpellSlots(stats.spellSlots)}
            </div>


            {(creature.spells?.length || creature.weapons?.length) && (
                <>
                    <hr style={s.blueRule} />
                    {renderList("Spells",   creature.spells)}
                    {renderList("Weapons",  creature.weapons)}
                </>
            )}

        </div>
    );
}

function renderMonster(creature: MonsterCreature, onToggle?: () => void) {
    const activeConditions = creature.activeConditions ?? creature.activeCons ?? [];
    console.log("Test Creautre",creature)

    const statAbbrev: Record<string, string> = {
        strength: "STR", dexterity: "DEX", constitution: "CON",
        intelligence: "INT", wisdom: "WIS", charisma: "CHA",
        str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
    };

    const s: Record<string, React.CSSProperties> = {
        wrap: {
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
            backgroundColor: "#fdf1dc",
            border: "2px solid #8b1a1a",
            borderRadius: "4px",
            padding: "10px 14px",
            marginTop: "8px",
            color: "#3b1a1a",
            fontSize: "13px",
            lineHeight: "1.5",
        },
        redRule: {
            border: "none",
            borderTop: "2px solid #8b1a1a",
            margin: "7px 0",
        },
        thinRule: {
            border: "none",
            borderTop: "1px solid #8b1a1a",
            margin: "5px 0",
            opacity: 0.35,
        },
        label: {
            color: "#8b1a1a",
            fontWeight: "bold" as const,
            fontStyle: "italic" as const,
        },
        statCell: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            backgroundColor: "#f5e2c0",
            border: "1px solid #8b1a1a",
            borderRadius: "3px",
            padding: "3px 6px",
            minWidth: 0,
        },
        statKey: {
            fontSize: "10px",
            color: "#8b1a1a",
            fontWeight: "bold" as const,
            letterSpacing: "0.05em",
        },
        statVal: {
            fontSize: "13px",
            fontWeight: "bold" as const,
            color: "#3b1a1a",
        },
    };

    function StatRow({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "4px" }}>
                <div style={{ ...s.label, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {title}
                </div>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(entries.length, 6)}, 1fr)`,
                    gap: "4px",
                    marginTop: "3px",
                }}>
                    {entries.map(([key, val]) => (
                        <div key={key} style={s.statCell}>
              <span style={s.statKey}>
                {statAbbrev[key.toLowerCase()] ?? key.slice(0, 3).toUpperCase()}
              </span>
                            <span style={s.statVal}>{String(val)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: "2px 4px",
                    alignItems: "baseline",
                }}>
        {entries.map(([key, val], i) => (
            <span key={key} style={{ whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: "bold" }}>{key}</span>{" "}
                <span style={{ color: "#8b1a1a" }}>{String(val)}</span>
                {i < entries.length - 1 && (
                    <span style={{ opacity: 0.4, margin: "0 3px" }}>·</span>
                )}
          </span>
        ))}
      </span>
            </div>
        );
    }

    function InlineList({title, items}: { title: string; items?: string[]; }) {
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span>
                {items && items.length > 0 ? items.join(", ") : "None"}
            </span>
            </div>
        );
    }

    function PropRow({ label, value }: { label: string; value: React.ReactNode }) {
        return (
            <div>
                <span style={s.label}>{label}: </span>
                <span>{value}</span>
            </div>
        );
    }

    const statArray  = creature.statArray  as Record<string, unknown> | undefined;
    const saveProfs  = creature.saveProfs  as Record<string, unknown> | undefined;
    const modifiers  = creature.modifiers  as Record<string, unknown> | undefined;

    function formatFullSpellSlots(
        spellSlots: Array<[number, number]> | number[][] | undefined
    ): string {
        const labels = ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th"];

        return labels
            .map((label, index) => {
                const value = Number(spellSlots?.[index]?.[0] ?? 0);
                return `${label}: ${value}`;
            })
            .join(", ");
    }

    return (
        <div style={s.wrap}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#8b1a1a", letterSpacing: "0.02em" }}>
          {creature.name}
        </span>
                <span style={{ fontSize: "11px", fontStyle: "italic", color: "#5a3030" }}>
          {creature.size} {creature.creatureType}
        </span>
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Collapse creature details"
                        style={{
                            border: "1px solid #8b1a1a",
                            background: "#8b1a1a",
                            cursor: "pointer",
                            fontSize: "11px",
                            color: "#fdf1dc",
                            borderRadius: "3px",
                            padding: "2px 7px",
                            fontFamily: "inherit",
                        }}
                    >
                        ▼
                    </button>
                )}
            </div>

            <hr style={s.redRule} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <PropRow label="HP"   value={`${creature.hp} / ${creature.maxhp}`} />
                <PropRow label="AC"   value={creature.ac} />
                <PropRow label="CR"   value={creature.cr} />
                <PropRow label="Speed" value={creature.movement} />
                <PropRow label="Leg. Resists"  value={creature.lResists ?? "—"} />
                <PropRow label="Magic Resist"  value={creature.magicResist ? "Yes" : "No"} />
                <PropRow label="Lair Action"   value={creature.lairAction  ? "Yes" : "No"} />
            </div>

            <hr style={s.redRule} />

            {statArray && <StatRow title="Ability Scores" data={statArray} />}

            {saveProfs && Object.keys(saveProfs).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Saving Throws" data={saveProfs} />
                </>
            )}

            {modifiers && Object.keys(modifiers).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Modifiers" data={modifiers} />
                </>
            )}

            <hr style={s.redRule} />

            <InlineList title="Damage Resistances"     items={creature.damResists} />
            <InlineList title="Damage Immunities"      items={creature.damImmunes} />
            <InlineList title="Damage Vulnerabilities" items={creature.damVulns} />
            <InlineList title="Condition Immunities"   items={creature.conImmunes} />
            <InlineList title="Active Conditions"      items={activeConditions} />
            <InlineList title="Active Status Effects"  items={creature.activeStatusEffects}/>

            {creature.spellInfo && (
                <>
                    <hr style={s.thinRule} />

                    <div>
                        <span style={s.label}>Spell Info:</span>

                        <div style={{ fontSize: "12px" }}>
                            <div>Type: {creature.spellInfo?.type}</div>
                            <div>DC: {creature.spellInfo?.DC}</div>
                            <div>Attack Roll: {creature.spellInfo?.attackRoll}</div>

                            <div>
                                Slots: {formatFullSpellSlots(creature.spellInfo?.spellSlots)}
                            </div>

                            <div>
                                Spells: {creature.spellInfo?.spells?.map(s => s.name).join(", ")}
                            </div>
                        </div>
                    </div>
                </>
            )}
            {creature.multiattack && (
                <div style={{ marginTop: "3px" }}>
                    <span style={s.label}>Multiattack: </span>
                    <span style={{ fontSize: "12px" }}>{JSON.stringify(creature.multiattack)}</span>
                </div>
            )}

        </div>
    );
}
export default function ComplexInitiativeEntry({
  eid,
  cid,
  // initiativeEntry,
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
      </div>

      {loading && <div style={{ marginTop: "10px" }}>Loading creature...</div>}
      {error && <div style={{ marginTop: "10px" }}>Error: {error}</div>}

      {!loading && !error && creature && (
        <>
          {isPlayerCreature(creature) ? renderPlayer(creature, onToggle) : renderMonster(creature, onToggle)}
        </>
      )}
    </div>
  );
}