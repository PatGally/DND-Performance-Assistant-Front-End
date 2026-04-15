import { useState, useEffect } from "react";
import type { EncounterFormData } from "./CreateEncounter";

export interface InitiativeEntry {
    key: string;
    name: string;
    iValue: number;
    turnType: "Player" | "Monster" | "lairAction";
    currentTurn: boolean;
    actionResource: number;
    bonusActionResource: number;
    movementResource: number;
}

type Participant = {
    key: string;
    name: string;
    type: "player" | "monster";
    movement: number;
    dex: number;
};

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

const LAIR_KEY  = "Lair_Action";
const LAIR_NAME = "Lair Action";

function getDex(statArray: Record<string, string | number>): number {
    return parseInt(String(statArray?.DEX ?? 0), 10);
}

function sortInitiative(
    entries: InitiativeEntry[],
    dexMap: Record<string, number>,
): InitiativeEntry[] {
    const groups: Record<number, InitiativeEntry[]> = {};
    for (const e of entries) {
        if (!groups[e.iValue]) groups[e.iValue] = [];
        groups[e.iValue].push(e);
    }

    const result: InitiativeEntry[] = [];
    const sortedRolls = Object.keys(groups).map(Number).sort((a, b) => b - a);

    function resolveSubgroup(subgroup: InitiativeEntry[]): InitiativeEntry[] {
        if (subgroup.length === 0) return [];
        if (subgroup.length === 1) return [{ ...subgroup[0] }];

        const dexGroups: Record<number, InitiativeEntry[]> = {};
        for (const e of subgroup) {
            const dex = dexMap[e.key] ?? 0;
            if (!dexGroups[dex]) dexGroups[dex] = [];
            dexGroups[dex].push(e);
        }

        const sortedDex = Object.keys(dexGroups).map(Number).sort((a, b) => b - a);
        const out: InitiativeEntry[] = [];

        for (const dex of sortedDex) {
            const dexGroup = dexGroups[dex];
            if (dexGroup.length === 1) {
                out.push({ ...dexGroup[0] });
            } else {
                const shuffled = [...dexGroup].sort(() => Math.random() - 0.5);
                for (const e of shuffled) out.push({ ...e });
            }
        }
        return out;
    }

    for (const roll of sortedRolls) {
        const group = groups[roll];

        const players     = group.filter((e) => e.turnType === "Player");
        const monsters    = group.filter((e) => e.turnType === "Monster");
        const lairActions = group.filter((e) => e.turnType === "lairAction");

        result.push(
            ...resolveSubgroup(players),
            ...resolveSubgroup(monsters),
            ...lairActions.map((e) => ({ ...e })),
        );
    }

    return result;
}

function AddInitiative({ formData, updateFormData }: Props) {
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const allParticipants: Participant[] = [
        ...formData.characters.map((c) => ({
            key:      c.stats.cid,
            name:     c.stats.name,
            type:     "player" as const,
            movement: 30,
            dex:      getDex(c.stats.statArray),
        })),
        ...formData.monsters.map((m) => ({
            key:      m.name,
            name:     m.name,
            type:     "monster" as const,
            movement: m.movement,
            dex:      getDex(m.statArray),
        })),
    ];

    // dexMap is the local-only lookup used by sortInitiative
    const dexMap: Record<string, number> = {};
    for (const p of allParticipants) dexMap[p.key] = p.dex;

    // True if at least one monster in the encounter has a lair action
    const hasLairAction = formData.monsters.some((m) => m.lairAction === true);

    // ── Stale-entry cleanup ───────────────────────────────────────────────────
    useEffect(() => {
        const participantKeys = new Set(allParticipants.map((p) => p.key));
        // If any lair monster exists the single LAIR_KEY is valid; otherwise it isn't
        const validKeys = hasLairAction
            ? new Set([...participantKeys, LAIR_KEY])
            : participantKeys;

        const hasStale = formData.initiative.some((e) => !validKeys.has(e.key));
        if (hasStale) {
            setInputValues((prev) => {
                const cleaned: Record<string, string> = {};
                for (const k of Object.keys(prev)) {
                    if (validKeys.has(k)) cleaned[k] = prev[k];
                }
                return cleaned;
            });
            updateFormData({
                initiative: formData.initiative.filter((e) => validKeys.has(e.key)),
            });
        }
    }, [allParticipants.length, hasLairAction]);

    // ── Auto-manage the single shared lair action entry ───────────────────────
    // One entry exists whenever hasLairAction is true; it is removed when false.
    useEffect(() => {
        const alreadyPresent = formData.initiative.some((e) => e.key === LAIR_KEY);

        if (hasLairAction && !alreadyPresent) {
            // Add the single lair action entry
            const lairEntry: InitiativeEntry = {
                key:                 LAIR_KEY,
                name:                LAIR_NAME,
                iValue:              20,
                turnType:            "lairAction",
                currentTurn:         false,
                actionResource:      0,
                bonusActionResource: 0,
                movementResource:    0,
            };

            const combined = [...formData.initiative, lairEntry];
            const sorted   = sortInitiative(combined, dexMap).map((e, i) => ({
                ...e,
                currentTurn: i === 0,
            }));
            updateFormData({ initiative: sorted });

        } else if (!hasLairAction && alreadyPresent) {
            // Remove the lair action entry — no lair monsters remain
            const filtered = formData.initiative.filter((e) => e.key !== LAIR_KEY);
            const sorted   = sortInitiative(filtered, dexMap).map((e, i) => ({
                ...e,
                currentTurn: i === 0,
            }));
            updateFormData({ initiative: sorted });
        }
        // If both flags agree, nothing needs to change
    }, [hasLairAction]);

    const getEntry = (key: string) => formData.initiative.find((e) => e.key === key);

    const handleChange = (key: string, raw: string) => {
        setInputValues((prev) => ({ ...prev, [key]: raw }));
    };

    const handleBlur = (p: Participant, raw: string) => {
        const parsed = parseInt(raw, 10);
        if (isNaN(parsed)) return;

        const existing = getEntry(p.key);
        const updated: InitiativeEntry[] = existing
            ? formData.initiative.map((e) =>
                e.key === p.key ? { ...e, iValue: parsed } : e
            )
            : [
                ...formData.initiative,
                {
                    key:                 p.key,
                    name:                p.name,
                    iValue:              parsed,
                    turnType:            p.type === "player" ? "Player" : "Monster",
                    currentTurn:         false,
                    actionResource:      1,
                    bonusActionResource: 1,
                    // movementMax:         p.movement,
                    movementResource:    p.movement,
                },
            ];

        const sorted = sortInitiative(updated, dexMap).map((e, i) => ({
            ...e,
            currentTurn: i === 0,
        }));
        updateFormData({ initiative: sorted });
    };

    const handleClear = (key: string) => {
        setInputValues((prev) => ({ ...prev, [key]: "" }));
        updateFormData({
            initiative: formData.initiative.filter((e) => e.key !== key),
        });
    };

    const sortedInitiative = sortInitiative(formData.initiative, dexMap);

    const colors = {
        bgDeep:        "rgba(8, 14, 26, 0.9)",
        bgSet:         "rgba(22, 38, 65, 0.92)",
        bgUnset:       "rgba(12, 19, 33, 0.75)",
        bgLair:        "rgba(35, 28, 10, 0.85)",
        borderDefault: "rgba(60, 85, 130, 0.35)",
        textPrimary:   "rgb(235, 245, 255)",
        textSecondary: "rgb(160, 185, 220)",
        textMuted:     "rgb(115, 145, 190)",
        player:        "rgb(56, 130, 240)",
        playerDim:     "rgba(56, 130, 240, 0.15)",
        monster:       "rgb(210, 65, 55)",
        monsterDim:    "rgba(210, 65, 55, 0.15)",
        lair:          "rgb(210, 160, 45)",
        lairDim:       "rgba(210, 160, 45, 0.15)",
        inputBg:       "rgba(8, 14, 26, 0.85)",
    };

    return (
        <div style={{ padding: "1.5rem", backgroundColor: "rgba(15, 24, 40, 0.85)" }}>
            <p style={{ color: colors.textSecondary, marginBottom: "1.25rem", fontSize: "1.2rem" }}>
                Enter each creature's roll.
            </p>

            <div className="d-flex gap-4 flex-wrap align-items-start">

                {/* ── Creatures column ──────────────────────────────────── */}
                <div style={{ flex: "1 1 340px" }}>
                    <div className="d-flex justify-content-between mb-2">
                        <small style={{ color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.9rem" }}>
                            Creatures
                        </small>
                        <small style={{ color: colors.textMuted, fontSize: "1rem" }}>
                            {formData.initiative.filter((e) => e.turnType !== "lairAction").length} / {allParticipants.length} set
                        </small>
                    </div>

                    {allParticipants.length === 0 && !hasLairAction ? (
                        <p style={{
                            color: colors.textSecondary,
                            border: `1px solid ${colors.borderDefault}`,
                            borderRadius: "8px",
                            padding: "0.75rem",
                            fontSize: "0.85rem",
                            background: colors.bgUnset,
                        }}>
                            No characters or monsters added yet.
                        </p>
                    ) : (
                        <div className="d-flex flex-column gap-2">

                            {/* ── Players & monsters (require a roll) ─────── */}
                            {allParticipants.map((p) => {
                                const entry    = getEntry(p.key);
                                const rawVal   = inputValues[p.key] ?? (entry ? String(entry.iValue) : "");
                                const isSet    = Boolean(entry);
                                const isPlayer = p.type === "player";

                                return (
                                    <div
                                        key={p.key}
                                        className="d-flex align-items-center gap-3 px-3 py-2"
                                        style={{
                                            borderRadius: "8px",
                                            background: isSet ? colors.bgSet : colors.bgUnset,
                                            border: `1px solid ${isSet
                                                ? (isPlayer ? colors.player : colors.monster) + "55"
                                                : colors.borderDefault}`,
                                            transition: "background 0.2s, border-color 0.2s",
                                        }}
                                    >
                                        <span style={{
                                            minWidth: "60px",
                                            textAlign: "center",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.05em",
                                            padding: "3px 8px",
                                            borderRadius: "4px",
                                            background: isPlayer ? colors.playerDim : colors.monsterDim,
                                            color:      isPlayer ? colors.player    : colors.monster,
                                            border: `1px solid ${isPlayer ? colors.player : colors.monster}44`,
                                        }}>
                                            {isPlayer ? "Player" : "Monster"}
                                        </span>

                                        <span style={{ color: colors.textPrimary, flexGrow: 1, fontSize: "1.19rem" }}>
                                            {p.name}
                                        </span>

                                        <span style={{ color: colors.textMuted, fontSize: "0.9rem" }}>
                                            DEX {p.dex}
                                        </span>

                                        <input
                                            type="number"
                                            placeholder="—"
                                            value={rawVal}
                                            onChange={(e) => handleChange(p.key, e.target.value)}
                                            onBlur={(e) => handleBlur(p, e.target.value)}
                                            style={{
                                                width: "70px",
                                                textAlign: "center",
                                                background: colors.inputBg,
                                                color: colors.textPrimary,
                                                border: `1px solid ${colors.borderDefault}`,
                                                borderRadius: "6px",
                                                padding: "4px 6px",
                                                fontSize: "0.875rem",
                                                outline: "none",
                                            }}
                                        />

                                        <button
                                            onClick={() => isSet && handleClear(p.key)}
                                            disabled={!isSet}
                                            title="Clear"
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: isSet ? colors.textSecondary : colors.textMuted,
                                                cursor: isSet ? "pointer" : "not-allowed",
                                                opacity: isSet ? 1 : 0.35,
                                                fontSize: "0.8rem",
                                                padding: "4px 6px",
                                                borderRadius: "4px",
                                                transition: "color 0.15s",
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}

                            {/* ── Single lair action row (read-only, always 20) ─ */}
                            {hasLairAction && (
                                <>
                                    <div style={{
                                        marginTop: "0.4rem",
                                        paddingTop: "0.4rem",
                                        borderTop: `1px solid ${colors.borderDefault}`,
                                    }}>
                                        <small style={{
                                            color: colors.lair,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            fontSize: "0.72rem",
                                            opacity: 0.8,
                                        }}>
                                            Lair Action(s) - Note: One entry for all lair actions
                                        </small>
                                    </div>

                                    <div
                                        className="d-flex align-items-center gap-3 px-3 py-2"
                                        style={{
                                            borderRadius: "8px",
                                            background: colors.bgLair,
                                            border: `1px solid ${colors.lair}44`,
                                        }}
                                    >
                                        <span style={{
                                            minWidth: "60px",
                                            textAlign: "center",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.05em",
                                            padding: "3px 8px",
                                            borderRadius: "4px",
                                            background: colors.lairDim,
                                            color:      colors.lair,
                                            border:     `1px solid ${colors.lair}44`,
                                        }}>
                                            Lair
                                        </span>

                                        <span style={{ color: colors.textPrimary, flexGrow: 1, fontSize: "1.19rem" }}>
                                            {LAIR_NAME}
                                        </span>

                                        <span style={{
                                            color: colors.lair,
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            padding: "3px 10px",
                                            borderRadius: "6px",
                                            background: colors.lairDim,
                                            border: `1px solid ${colors.lair}44`,
                                        }}>
                                            20
                                        </span>

                                        {/* Spacer aligns with the clear button column */}
                                        <span style={{ width: "28px" }} />
                                    </div>
                                </>
                            )}

                        </div>
                    )}
                </div>

                {/* ── Turn order column ─────────────────────────────────── */}
                <div style={{ flex: "0 0 220px" }}>
                    <small style={{
                        color: colors.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontSize: "1rem",
                        display: "block",
                        marginBottom: "0.5rem",
                    }}>
                        Turn Order
                    </small>

                    <div style={{
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        background: colors.bgDeep,
                        border: `1px solid ${colors.borderDefault}`,
                    }}>
                        {sortedInitiative.length === 0 ? (
                            <small style={{ color: colors.textMuted, fontSize: "1rem" }}>
                                No initiative set yet.
                            </small>
                        ) : (
                            <ol style={{ marginBottom: 0, paddingLeft: "1.1rem" }}>
                                {sortedInitiative.map((entry, i) => {
                                    const nameColor =
                                        entry.turnType === "Player"     ? colors.player :
                                            entry.turnType === "lairAction" ? colors.lair   :
                                                colors.monster;

                                    return (
                                        <li key={entry.key} style={{ marginBottom: "0.35rem", fontSize: "1rem" }}>
                                            <span style={{ fontWeight: i === 0 ? 600 : 400, color: nameColor }}>
                                                {entry.name}
                                            </span>
                                            <span style={{ color: colors.textMuted, marginLeft: "6px", fontSize: "0.78rem" }}>
                                                ({entry.iValue})
                                            </span>
                                            {entry.turnType === "lairAction" && (
                                                <span style={{
                                                    marginLeft: "6px",
                                                    fontSize: "0.65rem",
                                                    color: colors.lair,
                                                    background: colors.lairDim,
                                                    border: `1px solid ${colors.lair}44`,
                                                    borderRadius: "3px",
                                                    padding: "1px 5px",
                                                    fontWeight: 600,
                                                    letterSpacing: "0.04em",
                                                    verticalAlign: "middle",
                                                }}>
                                                    LAIR
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AddInitiative;