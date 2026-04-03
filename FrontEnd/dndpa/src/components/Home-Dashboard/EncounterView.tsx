import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Modal, Button } from "react-bootstrap";
import type { EncounterWithPacket } from "../../types/encounter.ts";
import "bootstrap/dist/css/bootstrap.min.css";

type Props = {
    encounters: EncounterWithPacket[];
    loadingEncounter: boolean;
    onDeleteEncounter: (eid: string) => Promise<void>;
};

const EncounterView = ({ encounters, loadingEncounter, onDeleteEncounter }: Props) => {
    const navigate = useNavigate();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedEncounter, setSelectedEncounter] = useState<EncounterWithPacket | null>(null);

    const openDeleteConfirm = (encounter: EncounterWithPacket) => {
        setSelectedEncounter(encounter);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setSelectedEncounter(null);
    };

    const confirmDelete = async () => {
        if (!selectedEncounter) return;

        try {
            await onDeleteEncounter(selectedEncounter.eid);
            closeDeleteConfirm();
        } catch (err) {
            console.error(err);
        }
    };

    if (loadingEncounter) return <div>Loading...</div>;
    if (encounters.length === 0) return <div>No encounters found</div>;

    return (
        <>
            <div className="container">
                <div className="row g-3">
                    {(encounters ?? []).map((enc) => (
                        <div key={enc.eid} className="col-12 col-md-6 col-lg-4">
                            <Card>
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
                                                <button
                                                    className="btn btn-primary mt-3 me-1"
                                                    onClick={() =>
                                                        navigate("/encounter-simulation", {
                                                            state: { eid: enc.eid },
                                                        })
                                                    }
                                                >
                                                    Play
                                                </button>
                                            </div>

                                            <div className="col-6">
                                                <button
                                                    className="btn btn-danger mt-3 ms-5"
                                                    onClick={() => openDeleteConfirm(enc)}
                                                >
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

            <Modal show={showDeleteConfirm} onHide={closeDeleteConfirm} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to delete{" "}
                    <strong>{selectedEncounter?.name}</strong>?
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="light" onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default EncounterView;