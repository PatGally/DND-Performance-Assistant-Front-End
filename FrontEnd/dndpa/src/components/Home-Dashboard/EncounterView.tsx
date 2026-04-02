import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import type { EncounterWithPacket } from "../../types/encounter.ts";
import 'bootstrap/dist/css/bootstrap.min.css';

type Props = {
    encounters: EncounterWithPacket[];
    loadingEncounter: boolean;
    onDeleteEncounter: (eid: string) => Promise<void>;

};

const EncounterView = ({ encounters, loadingEncounter, onDeleteEncounter }: Props) => {
    const navigate = useNavigate();
    if (loadingEncounter) return <div>Loading...</div>;
    if (encounters.length === 0) return <div>No encounters found</div>;

    return (
        <div className="container">
            <div className="row g-3">
                {(encounters ?? []).map((enc) => (
                    <div key={enc.eid} className="col-12 col-md-6 col-lg-4">
                        <Card className="">
                            {enc.mapdata?.map?.mapLink && (
                                <Card.Img
                                    variant="top"
                                    src={enc.mapdata.map.mapLink}
                                    alt={`Map for ${enc.name}`}
                                />
                                )}

                            <Card.Body>
                                <h4>{enc.name}</h4>
                                <p>{enc.date} --- Completed: {String(enc.completed)}</p>
                                <div className="container">
                                    <div className="row">
                                        <div className="col-6">
                                            <button className="btn btn-primary mt-3 me-1"
                                                    onClick={() => navigate("/encounter-simulation", { state: { eid: enc.eid } })}
                                            >Play</button>
                                        </div>
                                        <div className="col-6">
                                            <button
                                                className="btn btn-danger mt-3 ms-5"
                                                onClick={async () => {try {
                                                    await onDeleteEncounter(enc.eid);
                                                } catch (err) {
                                                    console.error(err);
                                                }}}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EncounterView;