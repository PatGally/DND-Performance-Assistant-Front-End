import type {InitiativeEntry} from "./InitiativeList";

type SimpleInitiativeEntryProps = {
  entry: InitiativeEntry;
  onToggle: () => void;
};

export default function SimpleInitiativeEntry({
  entry,
  onToggle,
}: SimpleInitiativeEntryProps) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          <div><strong>{entry.name}</strong></div>
          <div>Initiative: {entry.iValue}</div>
          <div>Current Turn: {entry.currentTurn ? "Yes" : "No"}</div>
          <div>Action Resource: {entry.actionResource}</div>
          <div>Bonus Action Resource: {entry.bonusActionResource}</div>
          <div>HP: {entry.hp} / {entry.maxhp}</div>
          <div>AC: {entry.ac}</div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand creature details"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}