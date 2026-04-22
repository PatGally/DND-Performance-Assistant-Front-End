import { useState } from "react";
import '../../../css/ManualEntry.css';
import { fetchUUID } from "../../../api/UUIDGet";

import ComplexManualEntryMultiSelectSearch from "./ComplexManualEntryMultiSelectSearch";
import { ATTRS_BY_EFFECT, type EffectKey } from "../../../types/ManualEntryTypes.ts";
import { normalizeValue, toDisplayName } from "../../../utils/ActiveSimUtils/ManualEntryHelpers.ts";
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
        <div className="manual-entry-status-effects">
            <div className="manual-entry-multiselect-label">Active Status Effects</div>

            <div className="manual-entry-status-list">
                {value.map((record, index) => {
                    const attrs = record.effect.attribute ?? [];
                    const roll = record.effect.roll ?? "";

                    return (
                        <div key={`${record.name}-${index}`} className="manual-entry-status-card">
                            <div className="manual-entry-status-card-header">
                                <span className="manual-entry-status-name">{record.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeStatusEffect(index)}
                                    className="manual-entry-btn manual-entry-btn-small"
                                >
                                    Remove
                                </button>
                            </div>

                            {attrs.length > 0 && (
                                <div className="manual-entry-status-detail">
                                    <span className="manual-entry-status-detail-label">Attributes:</span>
                                    {attrs.join(", ")}
                                </div>
                            )}

                            {roll && (
                                <div className="manual-entry-status-detail">
                                    <span className="manual-entry-status-detail-label">Roll:</span>
                                    {roll}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="manual-entry-status-builder">
                <div style={{ marginBottom: 6 }}>
                    <span className="manual-entry-status-builder-title">Add Status Effect</span>
                </div>

                <select
                    value={selectedStatusEffect}
                    onChange={(e) => {
                        setSelectedStatusEffect(e.target.value);
                        resetBuilderFields();
                    }}
                    className="manual-entry-select"
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
                    <div className="manual-entry-text-field">
                        <div className="manual-entry-field-label">Roll</div>
                        <input
                            type="text"
                            value={rollValue}
                            onChange={(e) => setRollValue(e.target.value)}
                            placeholder="Enter roll value"
                            className="manual-entry-input"
                        />
                    </div>
                )}

                {error && (
                    <div className="manual-entry-error">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={addStatusEffect}
                    disabled={isCreating}
                    className="manual-entry-btn"
                >
                    {isCreating ? "Creating..." : "Add Status Effect"}
                </button>
            </div>
        </div>
    );
}