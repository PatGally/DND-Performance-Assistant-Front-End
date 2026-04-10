import { useEffect, useMemo, useState } from "react";
import creatureGet, { isPlayerCreature } from "../../api/CreatureGet";
import { fetchUUID } from "../../api/UUIDGet";
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

const ATTRS_BY_EFFECT = {
    advantage: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    disadvantage: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    buff: [
        "attack rolls for",
        "attack rolls against",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "AC",
        "ALL save",
    ],
    debuff: [
        "attack rolls for",
        "attack rolls against",
        "AC",
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
    autocrit: ["attack rolls against"],
    autofail: [
        "STR save",
        "DEX save",
        "CON save",
        "INT save",
        "WIS save",
        "CHA save",
        "ALL save",
    ],
} as const;

type EffectKey = keyof typeof ATTRS_BY_EFFECT;

type StatusEffectRecord = {
    name: string;
    effect: {
        roll: string;
        attribute: string[];
        resultID: string[];
    };
};

const BLOCKED_CONDITIONS = new Set([
    "stabilized",
    "downed",
    "dead",
]);

const BLOCKED_STATUS_EFFECTS = new Set([
    "resistance",
    "immunity",
    "vulnerability",
    "concentration",
    "lingeffect",
    "lingsave",
    "summon",
    "switchsides",
    "time stop",
]);

function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeValue(value: string): string {
    return value.trim().toLowerCase();
}

function toDisplayName(value: string): string {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
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
            statArray: normalizeStatBlock(s.statArray as Record<string, unknown> | undefined),
            saveProfs: normalizeStatBlock(s.saveProfs as Record<string, unknown> | undefined),
            modifiers: normalizeStatBlock(s.modifiers as Record<string, unknown> | undefined),

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
        statArray: normalizeStatBlock(m.statArray as Record<string, unknown> | undefined),
        saveProfs: normalizeStatBlock(m.saveProfs as Record<string, unknown> | undefined),
        modifiers: normalizeStatBlock(m.modifiers as Record<string, unknown> | undefined),

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

function isStatusEffectRecord(value: unknown): value is StatusEffectRecord {
    if (typeof value !== "object" || value === null) return false;
    if (!("name" in value)) return false;

    const candidate = value as { name?: unknown; effect?: unknown };
    if (typeof candidate.name !== "string") return false;

    if (candidate.effect === undefined) return true;
    if (typeof candidate.effect !== "object" || candidate.effect === null) return false;

    return true;
}

function getStatusEffectAttributes(record: Record<string, unknown>): string[] {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return [];

    const attrs = (effect as { attribute?: unknown }).attribute;
    return Array.isArray(attrs)
        ? attrs.filter((x): x is string => typeof x === "string")
        : [];
}

function getStatusEffectRoll(record: Record<string, unknown>): string {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return "";

    const roll = (effect as { roll?: unknown }).roll;
    return typeof roll === "string" ? roll : "";
}

function getStatusEffectResultIDs(record: Record<string, unknown>): string[] {
    const effect = record.effect;
    if (typeof effect !== "object" || effect === null) return [];

    const resultID = (effect as { resultID?: unknown }).resultID;
    return Array.isArray(resultID)
        ? resultID.filter((x): x is string => typeof x === "string")
        : [];
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

function StatusEffectEditor({
                                options,
                                value,
                                onChange,
                            }: {
    options: string[];
    value: StatusEffectRecord[];
    onChange: (next: StatusEffectRecord[]) => void;
}) {
    const [selectedStatusEffect, setSelectedStatusEffect] = useState("");
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
    const [rollValue, setRollValue] = useState("");
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const normalizedEffect = normalizeValue(selectedStatusEffect);
    const effectKey = normalizedEffect as EffectKey;
    const attributeOptions = ATTRS_BY_EFFECT[effectKey] ?? [];
    const needsAttributePrompt = attributeOptions.length > 0;
    const needsRollPrompt = normalizedEffect === "buff" || normalizedEffect === "debuff";

    function resetBuilderFields() {
        setSelectedAttributes([]);
        setRollValue("");
        setError("");
    }

    async function addStatusEffect() {
        setError("");

        if (!selectedStatusEffect) {
            setError("Choose a status effect first.");
            return;
        }

        if (needsAttributePrompt && selectedAttributes.length === 0) {
            setError("Choose at least one attribute.");
            return;
        }

        if (needsRollPrompt && !rollValue.trim()) {
            setError("Buff and debuff require a roll value.");
            return;
        }

        try {
            setIsCreating(true);

            const uuid = await fetchUUID();

            const nextRecord: StatusEffectRecord = {
                name: toDisplayName(selectedStatusEffect),
                effect: {
                    roll: needsRollPrompt ? rollValue.trim() : "",
                    attribute: needsAttributePrompt ? selectedAttributes : [],
                    resultID: [uuid],
                },
            };

            onChange([...value, nextRecord]);

            setSelectedStatusEffect("");
            setSelectedAttributes([]);
            setRollValue("");
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error ? err.message : "Failed to create status effect."
            );
        } finally {
            setIsCreating(false);
        }
    }

    function removeStatusEffect(indexToRemove: number) {
        onChange(value.filter((_, index) => index !== indexToRemove));
    }

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6 }}>Active Status Effects</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {value.map((record, index) => {
                    const attrs = record.effect.attribute ?? [];
                    const roll = record.effect.roll ?? "";

                    return (
                        <div
                            key={`${record.name}-${index}`}
                            style={{
                                border: "1px solid #555",
                                borderRadius: 6,
                                padding: 8,
                                background: "#2b2b2b",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <strong>{record.name}</strong>
                                <button
                                    type="button"
                                    onClick={() => removeStatusEffect(index)}
                                    style={{ cursor: "pointer" }}
                                >
                                    Remove
                                </button>
                            </div>

                            {attrs.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                    <strong>Attributes:</strong> {attrs.join(", ")}
                                </div>
                            )}

                            {roll && (
                                <div style={{ marginTop: 4 }}>
                                    <strong>Roll:</strong> {roll}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ border: "1px solid #555", borderRadius: 6, padding: 10 }}>
                <div style={{ marginBottom: 6 }}>
                    <strong>Add Status Effect</strong>
                </div>

                <select
                    value={selectedStatusEffect}
                    onChange={(e) => {
                        setSelectedStatusEffect(e.target.value);
                        resetBuilderFields();
                    }}
                    style={{ width: "100%", marginBottom: 10 }}
                >
                    <option value="">Select status effect</option>
                    {options.map((effect) => (
                        <option key={effect} value={effect}>
                            {effect}
                        </option>
                    ))}
                </select>

                {needsAttributePrompt && (
                    <MultiSelectSearch
                        label="Attributes"
                        options={[...attributeOptions]}
                        value={selectedAttributes}
                        onChange={setSelectedAttributes}
                    />
                )}

                {needsRollPrompt && (
                    <div style={{ marginBottom: 12 }}>
                        <div>Roll</div>
                        <input
                            type="text"
                            value={rollValue}
                            onChange={(e) => setRollValue(e.target.value)}
                            placeholder="Enter roll value"
                            style={{ width: "100%" }}
                        />
                    </div>
                )}

                {error && (
                    <div style={{ color: "#ff6b6b", marginBottom: 8 }}>
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={addStatusEffect}
                    disabled={isCreating}
                    style={{ cursor: isCreating ? "not-allowed" : "pointer" }}
                >
                    {isCreating ? "Creating..." : "Add Status Effect"}
                </button>
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
    onToggle?: () => void;
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

    const filteredConditions = useMemo(() => {
        return conditions.filter(
            (condition) => !BLOCKED_CONDITIONS.has(normalizeValue(condition))
        );
    }, [conditions]);

    const filteredStatusEffects = useMemo(() => {
        return statusEffects.filter(
            (effect) => !BLOCKED_STATUS_EFFECTS.has(normalizeValue(effect))
        );
    }, [statusEffects]);

    const baseline = useMemo(
        () => (creature ? creatureToBaseline(creature, cid) : undefined),
        [creature, cid]
    );

    function update(
        key: keyof ManualAffectedCreature,
        val: unknown,
        base: unknown
    ) {
        const next = {
            ...(draftValue ?? { cid }),
            cid,
        } as Record<string, unknown>;

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

    if (!creature || !baseline) {
        return <div>Loading...</div>;
    }

    const currentStatusEffects = Array.isArray(val("activeStatusEffects"))
        ? (val("activeStatusEffects") as unknown[]).filter(isStatusEffectRecord)
        : [];

    const normalizedCurrentStatusEffects: StatusEffectRecord[] = currentStatusEffects.map((record) => {
        const recordObj = record as unknown as Record<string, unknown>;

        return {
            name: String((record as { name: unknown }).name),
            effect: {
                roll: getStatusEffectRoll(recordObj),
                attribute: getStatusEffectAttributes(recordObj),
                resultID: getStatusEffectResultIDs(recordObj),
            },
        };
    });

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
                options={filteredConditions}
                value={val("conImmunes") as string[]}
                onChange={(v) => update("conImmunes", v, baseline.conImmunes)}
            />

            <MultiSelectSearch
                label="Active Conditions"
                options={filteredConditions}
                value={val("activeConditions") as string[]}
                onChange={(v) => update("activeConditions", v, baseline.activeConditions)}
            />

            <StatusEffectEditor
                options={filteredStatusEffects}
                value={normalizedCurrentStatusEffects}
                onChange={(next) =>
                    update("activeStatusEffects", next, baseline.activeStatusEffects)
                }
            />

            <MultiSelectSearch
                label="Damage Resistances"
                options={DAMAGE_TYPES}
                value={val("damResists") as string[]}
                onChange={(v) => update("damResists", v, baseline.damResists)}
            />

            <MultiSelectSearch
                label="Damage Immunities"
                options={DAMAGE_TYPES}
                value={val("damImmunes") as string[]}
                onChange={(v) => update("damImmunes", v, baseline.damImmunes)}
            />

            <MultiSelectSearch
                label="Damage Vulnerabilities"
                options={DAMAGE_TYPES}
                value={val("damVulns") as string[]}
                onChange={(v) => update("damVulns", v, baseline.damVulns)}
            />
        </div>
    );
}