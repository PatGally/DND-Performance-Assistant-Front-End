import { useState, useEffect } from "react";
import type { EncounterFormData } from "./CreateEncounter";
import "./AddInitiative.css"

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


    return (
        <div className="initiative-page">

            <p className="initiative-intro">
                Enter each creature's roll.
            </p>

            <div className="d-flex gap-4 flex-wrap align-items-start">

                {/* ── Creatures column ── */}
                <div className="creature-column">

                    <div className="d-flex justify-content-between mb-2">
                        <small className="section-label">Creatures</small>
                        <small className="section-count">
                            {formData.initiative.filter(e => e.turnType !== "lairAction").length}
                            {" / "}
                            {allParticipants.length} set
                        </small>
                    </div>

                    {allParticipants.length === 0 && !hasLairAction ? (
                        <p className="empty-state">
                            No characters or monsters added yet.
                        </p>
                    ) : (
                        <div className="d-flex flex-column gap-2">

                            {allParticipants.map((p) => {
                                const entry = getEntry(p.key);
                                const rawVal = inputValues[p.key] ?? (entry ? String(entry.iValue) : "");
                                const isSet = Boolean(entry);

                                const type =
                                    p.type === "player"
                                        ? "player"
                                        : "monster";

                                return (
                                    <div
                                        key={p.key}
                                        className={`creature-row ${isSet ? "set" : "unset"} border-${type}`}
                                    >

                                <span className={`type-badge badge-${type}`}>
                                    {p.type === "player" ? "Player" : "Monster"}
                                </span>

                                        <span className="creature-name">
                                    {p.name}
                                </span>

                                        <span className="creature-dex">
                                    DEX {p.dex}
                                </span>

                                        <input
                                            type="number"
                                            placeholder="—"
                                            value={rawVal}
                                            onChange={(e) => handleChange(p.key, e.target.value)}
                                            onBlur={(e) => handleBlur(p, e.target.value)}
                                            className="initiative-input"
                                        />

                                        <button
                                            onClick={() => isSet && handleClear(p.key)}
                                            disabled={!isSet}
                                            className={`clear-btn ${isSet ? "enabled" : "disabled"}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}

                            {/* ── Lair ── */}
                            {hasLairAction && (
                                <>
                                    <div className="lair-header">
                                        <small className="lair-label">
                                            Lair Action(s) - Note: One entry for all lair actions
                                        </small>
                                    </div>

                                    <div className="lair-row">
                                        <span className="type-badge badge-lair">Lair</span>

                                        <span className="creature-name">
                                    {LAIR_NAME}
                                </span>

                                        <span className="lair-value">20</span>

                                        <span className="lair-spacer" />
                                    </div>
                                </>
                            )}

                        </div>
                    )}
                </div>

                {/* ── Turn order column ── */}
                <div className="turn-order-column">

                    <small className="section-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                        Turn Order
                    </small>

                    <div className="turn-box">

                        {sortedInitiative.length === 0 ? (
                            <small className="turn-muted">
                                No initiative set yet.
                            </small>
                        ) : (
                            <ol className="turn-list">

                                {sortedInitiative.map((entry, i) => {

                                    const colorClass =
                                        entry.turnType === "Player"
                                            ? "turn-player"
                                            : entry.turnType === "lairAction"
                                                ? "turn-lair"
                                                : "turn-monster";

                                    return (
                                        <li key={entry.key} className="turn-item">

                                    <span className={colorClass} style={{ fontWeight: i === 0 ? 600 : 400 }}>
                                        {entry.name}
                                    </span>

                                            <span className="turn-muted">
                                        ({entry.iValue})
                                    </span>

                                            {entry.turnType === "lairAction" && (
                                                <span className="turn-lair-tag">
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
        </div>);
}

export default AddInitiative;