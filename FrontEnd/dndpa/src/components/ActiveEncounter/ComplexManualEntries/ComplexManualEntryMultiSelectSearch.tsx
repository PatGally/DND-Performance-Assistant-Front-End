import { useState } from "react";

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
        <div style={{ marginBottom: 12 }}>
            <div>{label}</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {current.map((item) => (
                    <div
                        key={item}
                        style={{ background: "#444", padding: "4px 8px", borderRadius: 4 }}
                    >
                        {item}
                        <span
                            onClick={() => toggle(item)}
                            style={{ marginLeft: 6, cursor: "pointer" }}
                        >
                            ✕
                        </span>
                    </div>
                ))}
            </div>

            <input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: "100%", margin: "6px 0" }}
            />

            <div
                style={{
                    maxHeight: 120,
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    minHeight: 0,
                }}
            >
                {filtered.map((opt) => (
                    <div
                        key={opt}
                        onClick={() => toggle(opt)}
                        style={{
                            padding: 6,
                            cursor: "pointer",
                            background: current.includes(opt) ? "#666" : "transparent",
                        }}
                    >
                        {opt}
                    </div>
                ))}
            </div>
        </div>
    );
}