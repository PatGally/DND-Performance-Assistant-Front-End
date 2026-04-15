import ComplexManualEntrySection from "./ComplexManualEntrySection";
import { STAT_KEYS } from "../../../types/ManualEntryTypes.ts";
import { getNumberValue, toInteger } from "../../../utils/ManualEntryHelpers.ts";

import type {
    ManualStatBlock,
    StatKey,
} from "../../../types/SimulationTypes";

export default function ComplexManualEntryStatBlockEditor({
    title,
    value,
    onChange,
}: {
    title: string;
    value: ManualStatBlock;
    onChange: (next: ManualStatBlock) => void;
}) {
    function updateStat(key: StatKey, rawValue: string) {
        onChange({
            ...value,
            [key]: toInteger(rawValue, 0),
        });
    }

    return (
        <ComplexManualEntrySection title={title}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 10,
                }}
            >
                {STAT_KEYS.map((key) => (
                    <div key={key}>
                        <div style={{ marginBottom: 4 }}>{key}</div>
                        <input
                            type="number"
                            value={getNumberValue(value[key], 0)}
                            onChange={(e) => updateStat(key, e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </div>
                ))}
            </div>
        </ComplexManualEntrySection>
    );
}