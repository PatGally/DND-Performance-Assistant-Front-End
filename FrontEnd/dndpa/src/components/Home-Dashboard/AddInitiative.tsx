import { useState, useEffect } from "react";
// import Container from "react-bootstrap/Container";
// import Badge from "react-bootstrap/Badge";
import type { EncounterFormData } from "./CreateEncounter";

export interface InitiativeEntry {
    key: string;
    name: string;
    iValue: number;
    turnType: "Player" | "Monster";
    movementResource: number;
    dex: number;
    currentTurn: boolean;
}

type Participant = {
    key: string;
    name: string;
    type: "character" | "monster";
    movement: number;
    dex: number;
};

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

type TiebreakReason = "roll" | "dex" | "random";

interface SortedEntry extends InitiativeEntry {
    tiebreakReason: TiebreakReason;
}

function getDex(statArray: Record<string, string | number>): number {
    return parseInt(String(statArray?.DEX ?? 0), 10);
}

function sortInitiative(entries: InitiativeEntry[]): SortedEntry[] {
    const groups: Record<number, InitiativeEntry[]> = {};
    for (const e of entries) {
        if (!groups[e.iValue]) groups[e.iValue] = [];
        groups[e.iValue].push(e);
    }

    const result: SortedEntry[] = [];
    const sortedRolls = Object.keys(groups).map(Number).sort((a, b) => b - a);

    for (const roll of sortedRolls) {
        const group = groups[roll];
        if (group.length === 1) {
            result.push({ ...group[0], tiebreakReason: "roll" });
            continue;
        }

        const dexGroups: Record<number, InitiativeEntry[]> = {};
        for (const e of group) {
            if (!dexGroups[e.dex]) dexGroups[e.dex] = [];
            dexGroups[e.dex].push(e);
        }

        const sortedDex = Object.keys(dexGroups).map(Number).sort((a, b) => b - a);

        for (const dex of sortedDex) {
            const dexGroup = dexGroups[dex];
            if (dexGroup.length === 1) {
                result.push({ ...dexGroup[0], tiebreakReason: "dex" });
            } else {
                const shuffled = [...dexGroup].sort(() => Math.random() - 0.5);
                for (const e of shuffled) {
                    result.push({ ...e, tiebreakReason: "random" });
                }
            }
        }
    }

    return result;
}

function AddInitiative({ formData, updateFormData }: Props) {
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const allParticipants: Participant[] = [
        ...formData.characters.map((c) => ({
            key: c.stats.cid,
            name: c.stats.name,
            type: "character" as const,
            movement: 30,
            dex: getDex(c.stats.statArray),
        })),
        ...formData.monsters.map((m) => ({
            key: m.name,
            name: m.name,
            type: "monster" as const,
            movement: m.movement,
            dex: getDex(m.statArray),
        })),
    ];

    useEffect(() => {
        const validKeys = new Set(allParticipants.map((p) => p.key));
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
            console.log("Form Data initiatives", formData.initiative.filter((e) => validKeys.has(e.key)));

        }
    }, [allParticipants.length]);

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
                    key: p.key,
                    name: p.name,
                    iValue: parsed,
                    turnType: p.type === "character" ? "Player" : "Monster",
                    movementResource: p.movement,
                    dex: p.dex,
                    currentTurn: false,
                },
            ];
        //Fixed initiative and updates here correctly and gives first creature a value of true for current turn
        const sortedInitiative = sortInitiative(updated).map((e, i) => ({
            ...e,
            currentTurn: i === 0,
        }));
        updateFormData({ initiative: sortedInitiative });

    };

    const handleClear = (key: string) => {
        setInputValues((prev) => ({ ...prev, [key]: "" }));
        updateFormData({
            initiative: formData.initiative.filter((e) => e.key !== key),
        });
    };

    const sortedInitiative = sortInitiative(formData.initiative);

    const colors = {
        bgBase:       "rgba(15, 24, 40, 0.85)",
        bgDeep:       "rgba(8, 14, 26, 0.9)",
        bgSet:        "rgba(22, 38, 65, 0.92)",
        bgUnset:      "rgba(12, 19, 33, 0.75)",
        borderDefault:"rgba(60, 85, 130, 0.35)",
        borderSet:    "rgba(80, 130, 220, 0.45)",
        // textPrimary:  "rgb(210, 225, 245)",
        textPrimary:  "rgb(235, 245, 255)",
        // textSecondary:"rgb(110, 135, 175)",
        textSecondary:"rgb(160, 185, 220)",
        // textMuted:    "rgb(70, 95, 135)",
        textMuted:    "rgb(115, 145, 190)",
        player:       "rgb(56, 130, 240)",
        playerDim:    "rgba(56, 130, 240, 0.15)",
        monster:      "rgb(210, 65, 55)",
        monsterDim:   "rgba(210, 65, 55, 0.15)",
        inputBg:      "rgba(8, 14, 26, 0.85)",
        clearBtn:     "rgba(60, 85, 130, 0.2)",
        clearBtnHover:"rgba(210, 65, 55, 0.25)",
    };

    return (
        <div style={{ padding: "1.5rem", backgroundColor: "rgba(15, 24, 40, 0.85)" }}>
            <p style={{ color: colors.textSecondary, marginBottom: "1.25rem", fontSize: "1.2rem" }}>
                Enter each creature's roll.
            </p>

            <div className="d-flex gap-4 flex-wrap align-items-start">

                {/* ── Creatures column ── */}
                <div style={{ flex: "1 1 340px" }}>
                    <div className="d-flex justify-content-between mb-2">
                        <small style={{ color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.9rem" }}>
                            Creatures
                        </small>
                        <small style={{ color: colors.textMuted, fontSize: "1rem" }}>
                            {formData.initiative.length} / {allParticipants.length} set
                        </small>
                    </div>

                    {allParticipants.length === 0 ? (
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
                            {allParticipants.map((p) => {
                                const entry = getEntry(p.key);
                                const rawVal = inputValues[p.key] ?? (entry ? String(entry.iValue) : "");
                                const isSet = Boolean(entry);
                                const isPlayer = p.type === "character";

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
                                        {/* Badge */}
                                        <span style={{
                                            minWidth: "60px",
                                            textAlign: "center",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.05em",
                                            padding: "3px 8px",
                                            borderRadius: "4px",
                                            background: isPlayer ? colors.playerDim : colors.monsterDim,
                                            color: isPlayer ? colors.player : colors.monster,
                                            border: `1px solid ${isPlayer ? colors.player : colors.monster}44`,
                                        }}>
                                    {isPlayer ? "Player" : "Monster"}
                                </span>

                                        {/* Name */}
                                        <span style={{ color: colors.textPrimary, flexGrow: 1, fontSize: "1.19rem" }}>
                                    {p.name}
                                </span>

                                        {/* DEX */}
                                        <span style={{ color: colors.textPrimary, fontSize: "0.9rem" }}>
                                    DEX {p.dex}
                                </span>

                                        {/* Input */}
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

                                        {/* Clear */}
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
                        </div>
                    )}
                </div>

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
                                {sortedInitiative.map((entry, i) => (
                                    <li key={entry.key} style={{ marginBottom: "0.35rem", fontSize: "1rem" }}>
                                <span style={{
                                    fontWeight: i === 0 ? 600 : 400,
                                    color: entry.turnType === "Player" ? colors.player : colors.monster,
                                }}>
                                    {entry.name}
                                </span>
                                        <span style={{ color: colors.textMuted, marginLeft: "6px", fontSize: "0.78rem" }}>
                                    ({entry.iValue})
                                </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

            </div>
        </div>
        // <Container fluid className="p-4">
        //     <p className="text-secondary mb-4 ">
        //         Enter each creature's roll.
        //     </p>
        //
        //     <div className="d-flex gap-4 flex-wrap align-items-start">
        //
        //         <div style={{ flex: "1 1 340px" }}>
        //             <div className="d-flex justify-content-between mb-2">
        //                 <small className="text-secondary text-uppercase">Creatures</small>
        //                 <small className="text-secondary">
        //                     {formData.initiative.length} / {allParticipants.length} set
        //                 </small>
        //             </div>
        //
        //             {allParticipants.length === 0 ? (
        //                 <p className="text-secondary border rounded p-3 small">
        //                     No characters or monsters added yet.
        //                 </p>
        //             ) : (
        //                 <div className="d-flex flex-column gap-2">
        //                     {allParticipants.map((p) => {
        //                         const entry = getEntry(p.key);
        //                         const rawVal = inputValues[p.key] ?? (entry ? String(entry.iValue) : "");
        //                         const isSet = Boolean(entry);
        //
        //                         return (
        //                             <div
        //                                 key={p.key}
        //                                 className={`d-flex align-items-center gap-3 px-3 py-2 rounded border ${isSet ? "bg-dark" : "border-secondary rgba(15, 24, 40, 0.85) "}`}
        //                             >
        //                                 <Badge bg={p.type === "character" ? "primary" : "danger"} style={{ minWidth: "60px", textAlign: "center" }}>
        //                                     {p.type === "character" ? "Player" : "Monster"}
        //                                 </Badge>
        //
        //                                 <span className="text-white flex-grow-1 small">
        //                                     {p.name}
        //                                 </span>
        //
        //                                 <span className="text-secondary small">
        //                                     DEX {p.dex}
        //                                 </span>
        //
        //                                 <input
        //                                     type="number"
        //                                     className="form-control form-control-sm text-center bg-dark text-white border-secondary"
        //                                     placeholder="—"
        //                                     value={rawVal}
        //                                     onChange={(e) => handleChange(p.key, e.target.value)}
        //                                     onBlur={(e) => handleBlur(p, e.target.value)}
        //                                     style={{ width: "70px" }}
        //                                 />
        //
        //                                 <button
        //                                     className="btn btn-sm btn-outline-secondary border-0"
        //                                     onClick={() => isSet && handleClear(p.key)}
        //                                     disabled={!isSet}
        //                                     title="Clear"
        //                                 >
        //                                     ✕
        //                                 </button>
        //                             </div>
        //                         );
        //                     })}
        //                 </div>
        //             )}
        //         </div>
        //
        //         <div style={{ flex: "0 0 220px" }}>
        //             <small className="text-secondary text-uppercase d-block mb-2">Turn Order</small>
        //             <div className="rounded p-3 bg-dark border border-secondary">
        //                 {sortedInitiative.length === 0 ? (
        //                     <small className="text-secondary">No initiative set yet.</small>
        //                 ) : (
        //                     <ol className="mb-0 ps-3 small">
        //                         {sortedInitiative.map((entry, i) => (
        //                             <li key={entry.key} className="mb-1">
        //                                 <span className={`${i === 0 ? "fw-semibold" : "fw-normal"} ${entry.turnType === "Player" ? "text-info" : "text-danger"}`}>
        //                                     {entry.name}
        //                                 </span>
        //                                 <span className="text-secondary ms-2 small">
        //                                     ({entry.iValue})
        //                                 </span>
        //                             </li>
        //                         ))}
        //                     </ol>
        //                 )}
        //             </div>
        //
        //         </div>
        //     </div>
        // </Container>
    );
}

export default AddInitiative;