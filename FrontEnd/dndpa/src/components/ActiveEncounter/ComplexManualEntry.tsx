import { useEffect, useMemo, useState } from "react";
import creatureGet, { isPlayerCreature } from "../../api/CreatureGet";
import { getConditions } from "../../api/ConditionGet";
import { getStatusEffects } from "../../api/StatusEffectsGet";

import type {
    Creature,
    MonsterCreature,
    PlayerCreature,
} from "../../types/creature";

import type {
    InitiativeEntry,
    ManualAffectedCreature,
    ManualStatBlock,
    StatKey,
} from "../../types/SimulationTypes";

const STAT_KEYS: StatKey[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const DAMAGE_TYPES = [
    "fire",
    "cold",
    "lightning",
    "acid",
    "poison",
    "psychic",
    "necrotic",
    "radiant",
    "force",
    "thunder",
    "bludgeoning",
    "piercing",
    "slashing",
];

function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeStatBlock(
    value: Record<string, unknown> | undefined
): ManualStatBlock | undefined {
    if (!value) return undefined;

    const out: ManualStatBlock = {};

    for (const key of STAT_KEYS) {
        if (typeof value[key] === "number") {
            out[key] = value[key] as number;
        }
    }
    return out;
}

function creatureToBaseline(
    creature: Creature,
    cid: string
): ManualAffectedCreature {
    if (isPlayerCreature(creature)) {
        const s = creature.stats;

        return {
            cid,
            statArray: normalizeStatBlock(s.statArray as any),
            saveProfs: normalizeStatBlock(s.saveProfs as any),
            modifiers: normalizeStatBlock(s.modifiers as any),

            damResists: s.damResists ?? [],
            damImmunes: s.damImmunes ?? [],
            damVulns: s.damVulns ?? [],

            conImmunes: s.conImmunes ?? [],
            activeConditions: s.activeConditions ?? [],

            activeStatusEffects: Array.isArray(s.activeStatusEffects)
                ? s.activeStatusEffects.filter(
                    (item): item is Record<string, unknown> =>
                        typeof item === "object" && item !== null && "name" in item
                )
                : [],

            hp: typeof s.hp === "number" ? s.hp : undefined,
            position: Array.isArray(s.position) ? s.position : [],
            ac: typeof s.ac === "number" ? s.ac : undefined,
            spellSlots: Array.isArray(s.spellSlots) ? s.spellSlots : [],
        };
    }

    const m = creature as MonsterCreature;

    return {
        cid,
        statArray: normalizeStatBlock(m.statArray as any),
        saveProfs: normalizeStatBlock(m.saveProfs as any),
        modifiers: normalizeStatBlock(m.modifiers as any),

        damResists: m.damResists ?? [],
        damImmunes: m.damImmunes ?? [],
        damVulns: m.damVulns ?? [],

        conImmunes: m.conImmunes ?? [],
        activeConditions: m.activeConditions ?? [],

        activeStatusEffects: Array.isArray(m.activeStatusEffects)
            ? m.activeStatusEffects.filter(
                (item): item is Record<string, unknown> =>
                    typeof item === "object" && item !== null && "name" in item
            )
            : [],

        hp: typeof m.hp === "number" ? m.hp : undefined,
        position: Array.isArray(m.position) ? m.position : [],
        ac: typeof m.ac === "number" ? m.ac : undefined,
        lResists: typeof m.lResists === "number" ? m.lResists : undefined,
        enemy: m.enemy,
    };
}

function MultiSelectSearch({
                               label,
                               options,
                               value,
                               onChange,
                           }: {
    label: string;
    options: string[];
    value: string[] | undefined;
    onChange: (next: string[]) => void;
}) {
    const [query, setQuery] = useState("");

    const current = value ?? [];

    const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(query.toLowerCase())
    );

    function toggle(opt: string) {
        if (current.includes(opt)) {
            onChange(current.filter((x) => x !== opt));
        } else {
            onChange([...current, opt]);
        }
    }

    return (
        <div style={{ marginBottom: 12 }}>
            <div>{label}</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {current.map((item) => (
                    <div
                        key={item}
                        style={{ background: "#444", padding: "4px 8px", borderRadius: 4 }}
                    >
                        {item}
                        <span
                            onClick={() => toggle(item)}
                            style={{ marginLeft: 6, cursor: "pointer" }}
                        >
              ✕
            </span>
                    </div>
                ))}
            </div>

            <input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%", margin: "6px 0" }}
            />

            <div
                style={{
                    maxHeight: 120,
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    minHeight: 0,
                }}
            >
                {filtered.map((opt) => (
                    <div
                        key={opt}
                        onClick={() => toggle(opt)}
                        style={{
                            padding: 6,
                            cursor: "pointer",
                            background: current.includes(opt) ? "#666" : "transparent",
                        }}
                    >
                        {opt}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ComplexManualEntry({
                                               eid,
                                               cid,
                                               initiativeEntry,
                                               draftValue,
                                               onDraftChange,
                                           }: {
    eid: string;
    cid: string;
    initiativeEntry: InitiativeEntry;
    onToggle: () => void;
    draftValue?: ManualAffectedCreature;
    onDraftChange: (next: ManualAffectedCreature) => void;
}) {
    const [creature, setCreature] = useState<Creature | null>(null);
    const [conditions, setConditions] = useState<string[]>([]);
    const [statusEffects, setStatusEffects] = useState<string[]>([]);

    useEffect(() => {
        async function loadData() {
            const [c, conds, stats] = await Promise.all([
                creatureGet(eid, cid),
                getConditions(),
                getStatusEffects(),
            ]);

            setCreature(c);
            setConditions(conds);
            setStatusEffects(stats);
        }

        loadData();
    }, [eid, cid]);

    const baseline = useMemo(
        () => (creature ? creatureToBaseline(creature, cid) : undefined),
        [creature, cid]
    );

    function update(
        key: keyof ManualAffectedCreature,
        val: any,
        base: any
    ) {
        const next = {
            ...(draftValue ?? { cid }),
            cid,
        } as Record<string, any>;

        if (deepEqual(val, base)) {
            delete next[key];
        } else {
            next[key] = val;
        }

        onDraftChange(next as ManualAffectedCreature);
    }

    function val(key: keyof ManualAffectedCreature) {
        return draftValue?.[key] ?? baseline?.[key];
    }

    if (!creature || !baseline) return <div>Loading...</div>;

    return (
        <div style={{ border: "1px solid #ccc", padding: 10 }}>
            <strong>{initiativeEntry.name}</strong>

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

            <MultiSelectSearch
                label="Condition Immunities"
                options={conditions}
                value={val("conImmunes") as string[]}
                onChange={(v) =>
                    update("conImmunes", v, baseline.conImmunes)
                }
            />

            <MultiSelectSearch
                label="Active Conditions"
                options={conditions}
                value={val("activeConditions") as string[]}
                onChange={(v) =>
                    update("activeConditions", v, baseline.activeConditions)
                }
            />

            <MultiSelectSearch
                label="Active Status Effects"
                options={statusEffects}
                value={(val("activeStatusEffects") as Array<{ name: string }>)?.map((e) => e.name)}
                onChange={(v) =>
                    update(
                        "activeStatusEffects",
                        v.map((name) => ({ name })),
                        baseline.activeStatusEffects
                    )
                }
            />

            <MultiSelectSearch
                label="Damage Resistances"
                options={DAMAGE_TYPES}
                value={val("damResists") as string[]}
                onChange={(v) =>
                    update("damResists", v, baseline.damResists)
                }
            />

            <MultiSelectSearch
                label="Damage Immunities"
                options={DAMAGE_TYPES}
                value={val("damImmunes") as string[]}
                onChange={(v) =>
                    update("damImmunes", v, baseline.damImmunes)
                }
            />

            <MultiSelectSearch
                label="Damage Vulnerabilities"
                options={DAMAGE_TYPES}
                value={val("damVulns") as string[]}
                onChange={(v) =>
                    update("damVulns", v, baseline.damVulns)
                }
            />
        </div>
    );
}