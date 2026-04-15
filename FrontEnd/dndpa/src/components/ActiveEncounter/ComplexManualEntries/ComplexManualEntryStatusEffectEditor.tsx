import { useState } from "react";

import { fetchUUID } from "../../../api/UUIDGet";

import ComplexManualEntryMultiSelectSearch from "./ComplexManualEntryMultiSelectSearch";
import { ATTRS_BY_EFFECT, type EffectKey } from "../../../types/ManualEntryTypes.ts";
import { normalizeValue, toDisplayName } from "../../../utils/ManualEntryHelpers.ts";
import type { StatusEffectRecord } from "../../../types/ManualEntryTypes.ts";

export default function ComplexManualEntryStatusEffectEditor({
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
                    <ComplexManualEntryMultiSelectSearch
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