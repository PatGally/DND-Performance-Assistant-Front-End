import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Badge from "react-bootstrap/Badge";
import type { EncounterFormData } from "./CreateEncounter";

export interface InitiativeEntry {
    key: string;
    name: string;
    iValue: number;
    turnType: "Player" | "Monster";
    movementResource: number;
    dex: number;
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
                },
            ];

        updateFormData({ initiative: updated });
    };

    const handleClear = (key: string) => {
        setInputValues((prev) => ({ ...prev, [key]: "" }));
        updateFormData({
            initiative: formData.initiative.filter((e) => e.key !== key),
        });
    };

    const sortedInitiative = sortInitiative(formData.initiative);


    return (
        <Container fluid className="p-4">
            <p className="text-secondary mb-4 ">
                Enter each participant's roll.
            </p>

            <div className="d-flex gap-4 flex-wrap align-items-start">

                {/* Left: participant rows */}
                <div style={{ flex: "1 1 340px" }}>
                    <div className="d-flex justify-content-between mb-2">
                        <small className="text-secondary text-uppercase">Participants</small>
                        <small className="text-secondary">
                            {formData.initiative.length} / {allParticipants.length} set
                        </small>
                    </div>

                    {allParticipants.length === 0 ? (
                        <p className="text-secondary border rounded p-3 small">
                            No characters or monsters added yet.
                        </p>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {allParticipants.map((p) => {
                                const entry = getEntry(p.key);
                                const rawVal = inputValues[p.key] ?? (entry ? String(entry.iValue) : "");
                                const isSet = Boolean(entry);

                                return (
                                    <div
                                        key={p.key}
                                        className={`d-flex align-items-center gap-3 px-3 py-2 rounded border ${isSet ? "bg-dark" : "border-secondary bg-dark"}`}
                                    >
                                        <Badge bg={p.type === "character" ? "primary" : "danger"} style={{ minWidth: "60px", textAlign: "center" }}>
                                            {p.type === "character" ? "Player" : "Monster"}
                                        </Badge>

                                        <span className="text-white flex-grow-1 small">
                                            {p.name}
                                        </span>

                                        <span className="text-secondary small">
                                            DEX {p.dex}
                                        </span>

                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center bg-dark text-white border-secondary"
                                            placeholder="—"
                                            value={rawVal}
                                            onChange={(e) => handleChange(p.key, e.target.value)}
                                            onBlur={(e) => handleBlur(p, e.target.value)}
                                            style={{ width: "70px" }}
                                        />

                                        <button
                                            className="btn btn-sm btn-outline-secondary border-0"
                                            onClick={() => isSet && handleClear(p.key)}
                                            disabled={!isSet}
                                            title="Clear"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: order preview */}
                <div style={{ flex: "0 0 220px" }}>
                    <small className="text-secondary text-uppercase d-block mb-2">Turn Order</small>
                    <div className="rounded p-3 bg-dark border border-secondary">
                        {sortedInitiative.length === 0 ? (
                            <small className="text-secondary">No initiative set yet.</small>
                        ) : (
                            <ol className="mb-0 ps-3 small">
                                {sortedInitiative.map((entry, i) => (
                                    <li key={entry.key} className="mb-1">
                                        <span className={`${i === 0 ? "fw-semibold" : "fw-normal"} ${entry.turnType === "Player" ? "text-info" : "text-danger"}`}>
                                            {entry.name}
                                        </span>
                                        <span className="text-secondary ms-2 small">
                                            ({entry.iValue})
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                </div>
            </div>
        </Container>
    );
}

export default AddInitiative;