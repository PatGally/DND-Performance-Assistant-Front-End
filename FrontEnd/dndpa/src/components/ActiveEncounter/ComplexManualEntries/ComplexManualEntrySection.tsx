import type { ReactNode } from "react";

export default function ComplexManualEntrySection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div
            style={{
                marginBottom: 14,
                border: "1px solid #555",
                borderRadius: 6,
                padding: 10,
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
            {children}
        </div>
    );
}