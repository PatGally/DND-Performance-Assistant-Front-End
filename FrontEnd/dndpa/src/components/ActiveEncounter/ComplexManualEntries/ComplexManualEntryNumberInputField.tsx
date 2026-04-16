import { toInteger } from "../../../utils/ActiveSimUtils/ManualEntryHelpers.ts";

export default function ComplexManualEntryNumberInputField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (next: number) => void;
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
            }}
        >
            <div>{label}</div>

            <input
                type="number"
                value={value}
                onChange={(e) => onChange(toInteger(e.target.value, 0))}
                style={{ width: "100%" }}
            />
        </div>
    );
}