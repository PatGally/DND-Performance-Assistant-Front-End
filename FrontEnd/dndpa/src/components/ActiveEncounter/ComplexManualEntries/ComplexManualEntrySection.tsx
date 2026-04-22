import type { ReactNode } from "react";
import '../../../css/ManualEntry.css';

export default function ComplexManualEntrySection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="manual-entry-section">
            <div className="manual-entry-section-title">{title}</div>
            {children}
        </div>
    );
}