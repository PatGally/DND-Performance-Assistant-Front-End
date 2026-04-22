import { toInteger } from "../../../utils/ActiveSimUtils/ManualEntryHelpers.ts";
import '../../../css/ManualEntry.css';
export default function ComplexManualEntryNumberInputField({
    label, value, onChange,
}: {
    label: string; value: number; onChange: (next: number) => void;
}) {
    return (
        <div className="manual-entry-number-field">
            <div className="manual-entry-field-label" >{label}</div>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(toInteger(e.target.value, 0))}
                className="manual-entry-input"
            />
        </div>
    );
}