// import { getEncounters } from "../../api/EncounterGet";
// import creaturePacketGet from "../../api/CreaturePacketGet";
// import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
// import type {EncounterFormData} from "./CreateEncounter.tsx";
// import type {Monster} from "../../api/MonstersGet.ts";
// import type {EncounterFormData} from "./CreateEncounter.tsx";
// import type {Monster} from "../../api/MonstersGet.ts";
import type {EncounterWithPacket} from "../../types/encounter.ts";


type Props = {
    encounters: EncounterWithPacket[];
    loadingEncounter: boolean;
};

const EncounterView = ({encounters, loadingEncounter}:Props) => {

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
