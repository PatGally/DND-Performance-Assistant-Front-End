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


function renderPlayer(creature: PlayerCreature) {
    const stats = creature.stats;

    const s: Record<string, React.CSSProperties> = {
        wrap: {
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
            backgroundColor: "#eef3fd",
            border: "2px solid #1a3a8b",
            borderRadius: "4px",
            padding: "10px 14px",
            marginTop: "8px",
            color: "#1a1a3b",
            fontSize: "13px",
            lineHeight: "1.5",
        },
        blueRule: {
            border: "none",
            borderTop: "2px solid #1a3a8b",
            margin: "7px 0",
        },
        thinRule: {
            border: "none",
            borderTop: "1px solid #1a3a8b",
            margin: "5px 0",
            opacity: 0.35,
        },
        label: {
            color: "#1a3a8b",
            fontWeight: "bold" as const,
            fontStyle: "italic" as const,
        },
        statCell: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            backgroundColor: "#d8e4f7",
            border: "1px solid #1a3a8b",
            borderRadius: "3px",
            padding: "3px 6px",
            minWidth: 0,
        },
        statKey: {
            fontSize: "10px",
            color: "#1a3a8b",
            fontWeight: "bold" as const,
            letterSpacing: "0.05em",
        },
        statVal: {
            fontSize: "13px",
            fontWeight: "bold" as const,
            color: "#1a1a3b",
        },
    };

    // Horizontal grid — keys already uppercase, no transform needed
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

    // Inline dot-separated pairs for saves/modifiers

    // function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
    //     const entries = Object.entries(data);
    //     if (!entries.length) return null;
    //     return (
    //         <div style={{ marginTop: "3px" }}>
    //             <span style={s.label}>{title}: </span>
    //             {entries.map(([key, val], i) => (
    //                 <span key={key}>
    //         <span style={{ fontWeight: "bold" }}>{key}</span>{" "}
    //                     <span style={{ color: "#1a3a8b" }}>{String(val)}</span>
    //                     {i < entries.length - 1 && (
    //                         <span style={{ opacity: 0.4, margin: "0 5px" }}>·</span>
    //                     )}
    //       </span>
    //             ))}
    //         </div>
    //     );
    // }

    function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span style={{
                    display: "inline-flex",
                    flexWrap: "wrap",       // ← wraps at parent boundary
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

    const extraEntries = Object.entries(creature).filter(
        ([key]) => key !== "stats" && key !== "spells" && key !== "weapons"
    );

    return (
        <div style={s.wrap}>

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#1a3a8b", letterSpacing: "0.02em" }}>
          {stats.name}
        </span>
                <span style={{ fontSize: "11px", fontStyle: "italic", color: "#2a2a5a" }}>
          {stats.characterClass} · Level {stats.level}
        </span>
            </div>

            <hr style={s.blueRule} />

            {/* ── Core properties — 2-col grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <PropRow label="HP"       value={`${stats.hp} / ${stats.maxhp}`} />
                <PropRow label="AC"       value={stats.ac} />
                <PropRow label="Position" value={renderValue(stats.position)} />
            </div>

            <hr style={s.blueRule} />

            {/* ── Ability scores — horizontal stat cells ── */}
            {statArray && <StatRow title="Ability Scores" data={statArray} />}

            {/* ── Saving throws — inline pairs ── */}
            {saveProfs && Object.keys(saveProfs).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Saving Throws" data={saveProfs} />
                </>
            )}

            {/* ── Modifiers — inline pairs ── */}
            {modifiers && Object.keys(modifiers).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Modifiers" data={modifiers} />
                </>
            )}

            <hr style={s.blueRule} />

            {/* ── Trait lists — using your existing renderList ── */}
            {renderList("Damage Resistances",     stats.damResists)}
            {renderList("Damage Immunities",      stats.damImmunes)}
            {renderList("Damage Vulnerabilities", stats.damVulns)}
            {renderList("Condition Immunities",   stats.conImmunes)}
            {renderList("Active Conditions",      stats.activeConditions)}
            {renderList("Active Status Effects",  stats.activeStatusEffects)}
            {renderList("Spell Slots",            stats.spellSlots)}

            {/* ── Spells & Weapons — using your existing renderList ── */}
            {(creature.spells?.length || creature.weapons?.length) && (
                <>
                    <hr style={s.blueRule} />
                    {renderList("Spells",   creature.spells)}
                    {renderList("Weapons",  creature.weapons)}
                </>
            )}

            {/* ── Extra fields — using your existing renderRecord ── */}
            {extraEntries.length > 0 && (
                <>
                    <hr style={s.blueRule} />
                    <div style={{ ...s.label, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Extra Fields
                    </div>
                    {extraEntries.map(([key, value]) => (
                        <div key={key}>
                            <span style={s.label}>{key}: </span>
                            {renderValue(value)}
                        </div>
                    ))}
                </>
            )}

        </div>
    );
}

function renderMonster(creature: MonsterCreature) {
    const activeConditions = creature.activeConditions ?? creature.activeCons ?? [];

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

    // Horizontal grid of stat cells
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

    // Inline dot-separated pairs  e.g.  STR +4 · DEX +2

    // function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
    //     const entries = Object.entries(data);
    //     if (!entries.length) return null;
    //     return (
    //         <div style={{ marginTop: "3px" }}>
    //             <span style={s.label}>{title}: </span>
    //             {entries.map(([key, val], i) => (
    //                 <span key={key}>
    //         <span style={{ fontWeight: "bold" }}>
    //           {statAbbrev[key.toLowerCase()] ?? key}
    //         </span>{" "}
    //                     <span style={{ color: "#8b1a1a" }}>{String(val)}</span>
    //                     {i < entries.length - 1 && (
    //                         <span style={{ opacity: 0.4, margin: "0 5px" }}>·</span>
    //                     )}
    //       </span>
    //             ))}
    //         </div>
    //     );
    // }

    function InlinePairs({ title, data }: { title: string; data: Record<string, unknown> }) {
        const entries = Object.entries(data);
        if (!entries.length) return null;
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span style={{
                    display: "inline-flex",
                    flexWrap: "wrap",       // ← wraps at parent boundary
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

    // Inline comma list — renders nothing if empty
    function InlineList({ title, items }: { title: string; items?: string[] }) {
        if (!items?.length) return null;
        return (
            <div style={{ marginTop: "3px" }}>
                <span style={s.label}>{title}: </span>
                <span>{items.join(", ")}</span>
            </div>
        );
    }

    // Two-column property grid
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

    return (
        <div style={s.wrap}>

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#8b1a1a", letterSpacing: "0.02em" }}>
          {creature.name}
        </span>
                <span style={{ fontSize: "11px", fontStyle: "italic", color: "#5a3030" }}>
          {creature.size} {creature.creatureType}
        </span>
            </div>

            <hr style={s.redRule} />

            {/* ── Core properties — 2-col grid ── */}
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

            {/* ── Ability scores ── */}
            {statArray && <StatRow title="Ability Scores" data={statArray} />}

            {/* ── Saving throws ── */}
            {saveProfs && Object.keys(saveProfs).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Saving Throws" data={saveProfs} />
                </>
            )}

            {/* ── Modifiers ── */}
            {modifiers && Object.keys(modifiers).length > 0 && (
                <>
                    <hr style={s.thinRule} />
                    <InlinePairs title="Modifiers" data={modifiers} />
                </>
            )}

            <hr style={s.redRule} />

            {/* ── Trait lists ── */}
            <InlineList title="Damage Resistances"     items={creature.damResists} />
            <InlineList title="Damage Immunities"      items={creature.damImmunes} />
            <InlineList title="Damage Vulnerabilities" items={creature.damVulns} />
            <InlineList title="Condition Immunities"   items={creature.conImmunes} />
            <InlineList title="Active Conditions"      items={activeConditions} />
            <InlineList title="Active Status Effects"  items={creature.activeStatusEffects}/>

            {/* ── Spell info & multiattack ── */}
            {creature.spellInfo && (
                <>
                    <hr style={s.thinRule} />
                    <div>
                        <span style={s.label}>Spell Info: </span>
                        <span style={{ fontSize: "12px" }}>{JSON.stringify(creature.spellInfo)}</span>
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
              color: "#ccc",
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



// function renderRecord(label: string, record: Record<string, unknown> | undefined) {
//   return (
//     <div style={{ marginTop: "8px" }}>
//       <strong>{label}:</strong>
//       {record ? (
//         <div style={{ paddingLeft: "12px", marginTop: "4px" }}>
//           {Object.entries(record).map(([key, value]) => (
//             <div key={key}>
//               <strong>{key}:</strong> {renderValue(value)}
//             </div>
//           ))}
//         </div>
//       ) : (
//         <span> None</span>
//       )}
//     </div>
//   );
// }

// function renderPlayer(creature: PlayerCreature) {
//   const stats = creature.stats;
//
//   return (
//     <div style={{ marginTop: "10px", paddingLeft: "8px" }}>
//       <div><strong>Type:</strong> Player</div>
//       <div><strong>Name:</strong> {stats.name}</div>
//       <div><strong>Class:</strong> {stats.characterClass}</div>
//       <div><strong>Level:</strong> {stats.level}</div>
//       <div><strong>HP:</strong> {stats.hp}</div>
//       <div><strong>Max HP:</strong> {stats.maxhp}</div>
//       <div><strong>AC:</strong> {stats.ac}</div>
//       <div><strong>Position:</strong> {renderValue(stats.position)}</div>
//
//       {renderRecord("Stat Array", stats.statArray as Record<string, unknown>)}
//       {renderRecord("Save Proficiencies", stats.saveProfs as Record<string, unknown>)}
//       {renderRecord("Modifiers", stats.modifiers)}
//
//       {renderList("Damage Resistances", stats.damResists)}
//       {renderList("Damage Immunities", stats.damImmunes)}
//       {renderList("Damage Vulnerabilities", stats.damVulns)}
//       {renderList("Condition Immunities", stats.conImmunes)}
//       {renderList("Active Conditions", stats.activeConditions)}
//       {renderList("Active Status Effects", stats.activeStatusEffects)}
//       {renderList("Spell Slots", stats.spellSlots)}
//
//       {renderList("Spells", creature.spells)}
//       {renderList("Weapons", creature.weapons)}
//
//       <div style={{ marginTop: "8px" }}>
//         <strong>Extra Fields:</strong>
//         <div style={{ paddingLeft: "12px", marginTop: "4px" }}>
//           {Object.entries(creature)
//             .filter(([key]) => key !== "stats" && key !== "spells" && key !== "weapons")
//             .map(([key, value]) => (
//               <div key={key}>
//                 <strong>{key}:</strong> {renderValue(value)}
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function renderMonster(creature: MonsterCreature) {
//   const activeConditions = creature.activeConditions ?? creature.activeCons ?? [];
//     // <div><strong>Enemy:</strong> {creature.enemy ? "true" : "false"}</div>
//     // <div><strong>Position:</strong> {renderValue(creature.position)}</div>
//     // {renderList("Actions", creature.actions)}
//     // {renderList("Legendary Actions", creature.legActions)}
//
//   return (
//     <div style={{ marginTop: "10px", paddingLeft: "8px" }}>
//       <div><strong>Type:</strong> Monster</div>
//       <div><strong>Name:</strong> {creature.name}</div>
//       <div><strong>Creature Type:</strong> {creature.creatureType}</div>
//       <div><strong>HP:</strong> {creature.hp}</div>
//       <div><strong>CR:</strong> {creature.cr}</div>
//       <div><strong>Max HP:</strong> {creature.maxhp}</div>
//       <div><strong>AC:</strong> {creature.ac}</div>
//       <div><strong>Legendary Resists:</strong> {creature.lResists}</div>
//       <div><strong>Magic Resist:</strong> {creature.magicResist ? "true" : "false"}</div>
//       <div><strong>Lair Action:</strong> {creature.lairAction ? "true" : "false"}</div>
//       <div><strong>Size:</strong> {creature.size}</div>
//       <div><strong>Movement:</strong> {creature.movement}</div>
//       {renderRecord("Stat Array", creature.statArray as Record<string, unknown>)}
//       {renderRecord("Save Proficiencies", creature.saveProfs as Record<string, unknown>)}
//       {renderRecord("Modifiers", creature.modifiers)}
//       {renderList("Damage Resistances", creature.damResists)}
//       {renderList("Damage Immunities", creature.damImmunes)}
//       {renderList("Damage Vulnerabilities", creature.damVulns)}
//       {renderList("Condition Immunities", creature.conImmunes)}
//       {renderList("Active Conditions", activeConditions)}
//       {renderList("Active Status Effects", creature.activeStatusEffects)}
//       <div style={{ marginTop: "8px" }}>
//         <strong>Spell Info:</strong> {creature.spellInfo ? JSON.stringify(creature.spellInfo) : "None"}
//       </div>
//       <div style={{ marginTop: "8px" }}>
//         <strong>Multiattack:</strong> {creature.multiattack ? JSON.stringify(creature.multiattack) : "None"}
//       </div>
//     </div>
//   );
// }
