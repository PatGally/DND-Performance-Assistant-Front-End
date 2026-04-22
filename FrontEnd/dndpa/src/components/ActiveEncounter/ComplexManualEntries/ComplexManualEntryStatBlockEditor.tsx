import ComplexManualEntrySection from "./ComplexManualEntrySection";
import { STAT_KEYS } from "../../../types/ManualEntryTypes.ts";
import { getNumberValue, toInteger } from "../../../utils/ActiveSimUtils/ManualEntryHelpers.ts";
import '../../../css/ManualEntry.css';
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
            <div className="manual-entry-stat-grid">
                {STAT_KEYS.map((key) => (
                    <div key={key} className="manual-entry-stat-cell">
                        <div  className="manual-entry-stat-label">{key}</div>
                        <input
                            type="number"
                            value={getNumberValue(value[key], 0)}
                            onChange={(e) => updateStat(key, e.target.value)}
                            className="manual-entry-input"
                        />
                    </div>
                ))}
            </div>
        </ComplexManualEntrySection>
    );
}