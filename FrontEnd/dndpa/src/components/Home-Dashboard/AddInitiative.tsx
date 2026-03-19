import { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Badge from "react-bootstrap/Badge";
import type { EncounterFormData } from "./CreateEncounter";

export interface InitiativeEntry {
    key: string;                    // frontend only — cid for characters, name for monsters
    name: string;
    iValue: number;                 // backend field name
    turnType: "Player" | "Monster"; // backend field name
    movementResource: number;       // required by backend, no default
}

type Participant = {
    key: string;
    name: string;
    type: "character" | "monster";
    movement: number;
};

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function AddInitiative({ formData, updateFormData }: Props) {
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const allParticipants: Participant[] = [
        ...formData.characters.map((c) => ({
            key: c.stats.cid,
            name: c.stats.name,
            type: "character" as const,
            movement: 30,
        })),
        ...formData.monsters.map((m) => ({
            key: m.name,
            name: m.name,
            type: "monster" as const,
            movement: m.movement,
        })),
    ];

    const getEntry = (key: string): InitiativeEntry | undefined =>
        formData.initiative.find((e) => e.key === key);

    // When characters/monsters are removed, strip their initiative entries and input state
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

    const sortedInitiative = [...formData.initiative].sort(
        (a, b) => b.iValue - a.iValue
    );

    return (
        <Container fluid className="p-4">
            <h5 className="text-white mb-1">Set Initiative</h5>
            <p className="text-secondary mb-4" style={{ fontSize: "0.85rem" }}>
                Enter each participant's roll. The order preview updates automatically.
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
                        <p className="text-secondary border rounded p-3" style={{ borderColor: "#444", fontSize: "0.85rem" }}>
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
                                        className="d-flex align-items-center gap-3 px-3 py-2 rounded"
                                        style={{
                                            background: isSet ? "#1a2e1a" : "#1c1c1c",
                                            border: `1px solid ${isSet ? "#2d5a2d" : "#333"}`,
                                        }}
                                    >
                                        <Badge bg={p.type === "character" ? "primary" : "danger"} style={{ minWidth: "60px", textAlign: "center" }}>
                                            {p.type === "character" ? "Player" : "Monster"}
                                        </Badge>

                                        <span className="text-white flex-grow-1" style={{ fontSize: "0.9rem" }}>
                                            {p.name}
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
                                            className="btn btn-sm btn-dark border-0 text-secondary"
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
                <div style={{ flex: "0 0 200px" }}>
                    <small className="text-secondary text-uppercase d-block mb-2">Turn Order</small>
                    <div className="rounded p-3 bg-dark border border-secondary" style={{ minHeight: "100px" }}>
                        {sortedInitiative.length === 0 ? (
                            <small className="text-secondary">No initiative set yet.</small>
                        ) : (
                            <ol className="mb-0 ps-3" style={{ fontSize: "0.875rem" }}>
                                {sortedInitiative.map((entry, i) => (
                                    <li key={entry.key} className="mb-1">
                                        <span className="text-white" style={{ fontWeight: i === 0 ? 600 : 400 }}>
                                            {entry.name}
                                        </span>
                                        <span
                                            className="ms-2"
                                            style={{
                                                fontSize: "0.8rem",
                                                color: entry.turnType === "Player" ? "lightblue" : "red",
                                            }}
                                        >
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