import type {InitiativeEntryDisplay} from "../../types/SimulationTypes.ts";

type SimpleInitiativeEntryProps = {
  entry: InitiativeEntryDisplay;
  onToggle: () => void;
};

export default function SimpleInitiativeEntry({
                                                  entry,
                                                  onToggle,
                                              }: SimpleInitiativeEntryProps) {
    const s: Record<string, React.CSSProperties> = {
        wrap: {
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
            backgroundColor: "#fdf1dc",
            border: "2px solid #8b1a1a",
            borderRadius: "4px",
            padding: "10px 14px",
            color: "#3b1a1a",
            fontSize: "13px",
            lineHeight: "1.5",
            minWidth: 0,
            boxSizing: "border-box",
            width: "100%",
        },
        redRule: {
            border: "none",
            borderTop: "2px solid #8b1a1a",
            margin: "7px 0",
        },
        thinRule: {
            border: "none",
            borderTop: "1px solid #8b1a1a",
            margin: "5px 0",
            opacity: 0.35,
        },
        label: {
            color: "#8b1a1a",
            fontWeight: "bold" as const,
            fontStyle: "italic" as const,
        },
    };

    function PropRow({ label, value }: { label: string; value: React.ReactNode }) {
        return (
            <div>
                <span style={s.label}>{label}: </span>
                <span>{value}</span>
            </div>
        );
    }

    return (
        <div style={s.wrap}>

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "15px", fontWeight: "bold", color: "#8b1a1a", letterSpacing: "0.02em" }}>
          {entry.name}
        </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {entry.currentTurn && (
                        <span style={{
                            fontSize: "10px",
                            fontWeight: "bold",
                            fontStyle: "italic",
                            color: "#8b1a1a",
                            border: "1px solid #8b1a1a",
                            borderRadius: "3px",
                            padding: "1px 6px",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                        }}>
              Active
            </span>
                    )}
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Expand creature details"
                        style={{
                            border: "1px solid #8b1a1a",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "11px",
                            color: "#8b1a1a",
                            borderRadius: "3px",
                            padding: "2px 7px",
                            fontFamily: "inherit",
                        }}
                    >
                        ▶
                    </button>
                </div>
            </div>

            <hr style={s.redRule} />

            {/* ── Core stats — 2-col grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <PropRow label="Initiative" value={entry.iValue} />
                <PropRow label="AC"         value={entry.ac} />
                <PropRow label="HP"         value={`${entry.hp} / ${entry.maxhp}`} />
            </div>

            <hr style={s.thinRule} />

            {/* ── Action resources ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
                <PropRow label="Action"       value={entry.actionResource} />
                <PropRow label="Bonus Action" value={entry.bonusActionResource} />
            </div>

        </div>
    );
}

// export default function SimpleInitiativeEntry({
//   entry,
//   onToggle,
// }: SimpleInitiativeEntryProps) {
//   return (
//     <div
//       style={{
//         border: "1px solid #ccc",
//         borderRadius: "6px",
//         padding: "10px 12px",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           gap: "12px",
//         }}
//       >
//         <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
//           <div><strong>{entry.name}</strong></div>
//           <div>Initiative: {entry.iValue}</div>
//             <div>HP: {entry.hp} / {entry.maxhp}</div>
//             <div>AC: {entry.ac}</div>
//           <div>Current Turn: {entry.currentTurn ? "Yes" : "No"}</div>
//           <div>Action Resource: {entry.actionResource}</div>
//           <div>Bonus Action Resource: {entry.bonusActionResource}</div>
//           <div>B.A.R: {entry.bonusActionResource}</div>
//
//         </div>
//
//         <button
//           type="button"
//           onClick={onToggle}
//           aria-label="Expand creature details"
//           style={{
//             border: "none",
//             background: "transparent",
//             cursor: "pointer",
//             fontSize: "14px",
//               color: "#ccc",
//           }}
//         >
//           ▶
//         </button>
//       </div>
//     </div>
//   );
// }