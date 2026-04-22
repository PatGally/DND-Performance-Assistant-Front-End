import { useState } from "react";
import '../../../css/ManualEntry.css';
export default function ComplexManualEntryMultiSelectSearch({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: string[];
    value: string[] | undefined;
    onChange: (next: string[]) => void;
}) {
    const [query, setQuery] = useState("");

    const current = value ?? [];

    const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(query.toLowerCase())
    );

    function toggle(opt: string) {
        if (current.includes(opt)) {
            onChange(current.filter((x) => x !== opt));
        } else {
            onChange([...current, opt]);
        }
    }

    return (
        <div className="manual-entry-multiselect">
            <div className="manual-entry-multiselect-label" >{label}</div>
            {current.length > 0 && (
            <div className="manual-entry-chip-list">
                {current.map((item) => (
                    <div key={item} className="manual-entry-chip">
                        {item}
                        <span
                            onClick={() => toggle(item)}
                            className="manual-entry-chip-remove">
                            ✕
                        </span>
                    </div>
                ))}
            </div>
            )}

            <input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="manual-entry-search-input"
            />

            <div className="manual-entry-option-list">
                {filtered.map((opt) => (
                    <div key={opt} onClick={() => toggle(opt)}
                        className={"manual-entry-option" + (current.includes(opt) ? " selected" : "")}>{opt}
                    </div>
                ))}
            </div>
        </div>
    );
}