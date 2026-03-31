//
// import { Card } from "react-bootstrap";
//
// import type {EncounterWithPacket} from "../../types/encounter.ts";
//
// type Props = {
//     encounters: EncounterWithPacket[];
//     loadingEncounter: boolean;
// };
//
// const EncounterView = ({encounters, loadingEncounter}:Props) => {
//     if (loadingEncounter) return <div>Loading...</div>;
//     if (encounters.length === 0) return <div>No encounters found</div>;
//
//     return (
//         <div>
//             {encounters.map((enc) => (
//                 <div key={enc.eid} className="mb-3">
//                     <Card className="my-card">
//
//                         <Card.Body>
//                             <h4>{enc.name}</h4>
//                             <p>{enc.date} --- Completed: {enc.completed.toString()}</p>
//
//                             {enc.packet ? (
//                                 <div>
//                                     <h5>Players:</h5>
//                                     {enc.packet.players.map((p) => (
//                                         <div key={p.name}>
//                                             {p.name} - Level {p.level} ({p.characterClass})
//                                         </div>
//                                     ))}
//
//                                     <h5>Monsters:</h5>
//                                     {enc.packet.monsters.map((m) => (
//                                         <div key={m.name}>
//                                             Name: {m.name}, CR: {m.cr}, Size: ({m.size})
//                                         </div>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <p>Loading creatures...</p>
//                             )}
//                         </Card.Body>
//                     </Card>
//                 </div>
//             ))}
//         </div>
//     );
// };
//
// export default EncounterView;

import { Card } from "react-bootstrap";
import type { EncounterWithPacket } from "../../types/encounter.ts";
import { getCachedDriveImage } from "../../utils/driveImageCache.ts";

type Props = {
    encounters: EncounterWithPacket[];
    loadingEncounter: boolean;
};

const EncounterView = ({ encounters, loadingEncounter }: Props) => {
    if (loadingEncounter) return <div>Loading...</div>;
    if (encounters.length === 0) return <div>No encounters found</div>;
    console.log('EncounterView rendering, encounters:', encounters); // ← is this firing?
    console.log('maplinkss:', encounters.map(e => e.maplink));

    return (
        <div>
            {encounters.map((enc) => {
                const imageUrl = getCachedDriveImage(enc.maplink); // ← look up this encounter's image

                return (
                    <div key={enc.eid} className="mb-3">
                        <Card className="my-card">

                            {imageUrl && (
                                <Card.Img
                                    variant="top"
                                    src={imageUrl}
                                    alt={`Map for ${enc.name}`}
                                />
                            )}

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
                );
            })}
        </div>
    );
};

export default EncounterView;