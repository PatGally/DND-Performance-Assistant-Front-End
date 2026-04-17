import type {InitiativeEntryDisplay} from "../../types/SimulationTypes";
import "../../css/SimpleInitiativeEntry.css";

type SimpleInitiativeEntryProps = {
  entry: InitiativeEntryDisplay;
  onToggle: () => void;
};

export default function SimpleInitiativeEntry({
                                                  entry,
                                                  onToggle,
                                              }: SimpleInitiativeEntryProps) {

    function PropRow({ label, value }: { label: string; value: React.ReactNode }) {
        return (
            <div>
                <span className="sie-label">{label}: </span>
                <span>{value}</span>
            </div>
        );
    }

    return (
        <div className="sie-wrap">

            <div className="sie-header">
                <span className="sie-name">{entry.name}</span>
                <div className="sie-header-controls">
                    {entry.currentTurn && (
                        <span className="sie-active-badge">Active</span>
                    )}
                    {entry.hp != null && (
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-label="Expand creature details"
                            className="sie-toggle-btn"
                        >
                            ▶
                        </button>
                    )}
                </div>
            </div>

            <hr className="sie-red-rule" />

            <div className="sie-stat-grid">
                <PropRow label="Initiative" value={entry.iValue} />
                {entry.ac != null && (
                    <PropRow label="AC" value={entry.ac} />
                )}
                {entry.hp != null && entry.maxhp != null && (
                    <PropRow label="HP" value={`${entry.hp} / ${entry.maxhp}`} />
                )}
            </div>

            <hr className="sie-thin-rule" />

            <div className="sie-stat-grid">
                {entry.hp != null && (
                    <PropRow label="Action" value={entry.actionResource} />
                )}
                {entry.hp != null && (
                    <PropRow label="Bonus Action" value={entry.bonusActionResource} />
                )}
            </div>

        </div>
    );
}