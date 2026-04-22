import { isPlayerCreature } from "../../../api/CreatureGet";
import '../../../css/ManualEntry.css';
import type {
    Creature,
    MonsterCreature,
    PlayerCreature,
} from "../../../types/creature";

export default function ComplexManualEntryCreatureSummary({
    creature,
}: {
    creature: Creature;
}) {
    if (isPlayerCreature(creature)) {
        const player = creature as PlayerCreature;
        return (
            <>
                <div className="manual-entry-summary-row">
                    <span className="manual-entry-summary-label">Type:</span>
                    Player
                </div>
                <div className="manual-entry-summary-row">
                    <span className="manual-entry-summary-label">Name:</span>
                    {player.stats.name}
                </div>
                <div className="manual-entry-summary-row">
                    <span className="manual-entry-summary-label">Class:</span>
                    {player.stats.characterClass}
                </div>
                <div className="manual-entry-summary-row">
                    <span className="manual-entry-summary-label">Level:</span>
                    {player.stats.level}
                </div>
            </>
        );
    }
    const monster = creature as MonsterCreature;
    return (
        <>
            <div className="manual-entry-summary-row">
                <span className="manual-entry-summary-label">Type:</span>
                Monster
            </div>
            <div className="manual-entry-summary-row">
                <span className="manual-entry-summary-label">Name:</span>
                {monster.name}
            </div>
            <div className="manual-entry-summary-row">
                <span className="manual-entry-summary-label">CR:</span>
                {monster.cr}
            </div>
            <div className="manual-entry-summary-row">
                <span className="manual-entry-summary-label">Creature Type:</span>
                {monster.creatureType}
            </div>
            <div className="manual-entry-summary-row">
                <span className="manual-entry-summary-label">Size:</span>
                {monster.size}
            </div>
        </>
    );
}