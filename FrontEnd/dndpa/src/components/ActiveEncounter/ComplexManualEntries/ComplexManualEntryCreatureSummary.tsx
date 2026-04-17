import { isPlayerCreature } from "../../../api/CreatureGet";

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
        return (
            <>
                <div><strong>Type:</strong> Player</div>
                <div><strong>Name:</strong> {(creature as PlayerCreature).stats.name}</div>
                <div><strong>Class:</strong> {(creature as PlayerCreature).stats.characterClass}</div>
                <div><strong>Level:</strong> {(creature as PlayerCreature).stats.level}</div>
            </>
        );
    }

    return (
        <>
            <div><strong>Type:</strong> Monster</div>
            <div><strong>Name:</strong> {(creature as MonsterCreature).name}</div>
            <div><strong>CR:</strong> {(creature as MonsterCreature).cr}</div>
            <div><strong>Creature Type:</strong> {(creature as MonsterCreature).creatureType}</div>
            <div><strong>Size:</strong> {(creature as MonsterCreature).size}</div>
        </>
    );
}