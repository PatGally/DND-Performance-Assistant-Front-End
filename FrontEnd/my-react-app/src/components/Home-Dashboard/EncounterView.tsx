import { getEncounters } from "../../api/EncounterGet";
import creaturePacketGet from "../../api/CreaturePacketGet"; // no curly braces since default export
import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

interface Player {
    name: string;
    level: number;
    characterClass: string;
    location?: string;
}

interface Monster {
    name: string;
    cr: number;
    size: string;
    location?: string;
}

interface EncounterPacket {
    players: Player[];
    monsters: Monster[];
}

interface Encounter {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
}

interface EncounterWithPacket extends Encounter {
    packet?: EncounterPacket; // optional at first
}

const EncounterView: React.FC = () => {
    const [encounters, setEncounters] = useState<EncounterWithPacket[]>([]);
    const [loadingEncounter, setLoadingEncounter] = useState<boolean>(false);

    useEffect(() => {
        const fetchEncounters = async () => {
            setLoadingEncounter(true);
            try {
                const data: Encounter[] = await getEncounters();

                // Add a `packet` property for each encounter
                const encountersWithPackets: EncounterWithPacket[] = data.map((enc) => ({
                    ...enc,
                    packet: undefined, // initially undefined
                }));

                setEncounters(encountersWithPackets);

                // Fetch the packet for each encounter
                for (const encounterItem of encountersWithPackets) {
                    try {
                        const packet = await creaturePacketGet(encounterItem.eid);
                        setEncounters((prev) =>
                            prev.map((e) =>
                                e.eid === encounterItem.eid ? { ...e, packet } : e
                            )
                        );
                    } catch (err) {
                        console.error(`Error fetching packet for ${encounterItem.eid}`, err);
                    }
                }
            } catch (err) {
                console.error("Error fetching encounters", err);
            } finally {
                setLoadingEncounter(false);
            }
        };
        fetchEncounters();
    }, []);

    if (loadingEncounter) return <div>Loading...</div>;
    if (encounters.length === 0) return <div>No encounters found</div>;

    return (
        <div>
            {encounters.map((enc) => (
                <div key={enc.eid} className="mb-3">
                    <Card className="my-card">
                        <Card.Body>
                            <h4>{enc.name}</h4>
                            <p>{enc.date} --- Completed: {enc.completed.toString()}</p>

                            {enc.packet ? (
                                <div>
                                    <h5>Players:</h5>
                                    {enc.packet.players.map((p) => (
                                        <div key={p.name}>
                                            {p.name} - Level {p.level} ({p.characterClass})
                                        </div>
                                    ))}

                                    <h5>Monsters:</h5>
                                    {enc.packet.monsters.map((m) => (
                                        <div key={m.name}>
                                            Name: {m.name}, CR: {m.cr}, Size: ({m.size})
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Loading creatures...</p>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            ))}
        </div>
    );
};

export default EncounterView;
