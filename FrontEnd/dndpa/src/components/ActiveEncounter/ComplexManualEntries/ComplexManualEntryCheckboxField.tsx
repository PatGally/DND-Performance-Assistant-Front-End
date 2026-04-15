export default function ComplexManualEntryCheckboxField({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}) {
    return (
        <label
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span>{label}</span>
        </label>
    );
}