import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Modal, Button } from "react-bootstrap";
import type { EncounterWithPacket } from "../../types/encounter.ts";
import "bootstrap/dist/css/bootstrap.min.css";
import NoEncounters from "./NoEncounters.tsx";

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
    if (encounters.length === 0)
        return<div style={{ backgroundColor: "rgba(15, 24, 40, 0.85)", flex: 1, minHeight: "100vh"}}>
            <NoEncounters />
    </div>;
    return (
        < >
            <div className="container-fluid"
                 style={{ backgroundColor: "rgba(15, 24, 40, 0.85)",
                flex: 1,
                minHeight: "100vh"}}>
                <div className="row g-3">
                    {(encounters ?? []).map((enc) => (
                        <div key={enc.eid} className="col-12 col-md-6 col-lg-4">
                            <Card style={{ overflow: 'hidden' }}>

                                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                    {enc.mapLink ? (
                                        <img
                                            src={enc.mapLink}
                                            alt={`Map for ${enc.name}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                display: 'block',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#1a1a2e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#666',
                                            fontSize: '0.85rem',
                                        }}>
                                            No map available
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: '0.5rem 0.75rem',
                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: '1.1rem',
                                        }}
                                    >
                                        {enc.name}
                                    </div>
                                </div>

                                <Card.Body >
                                    <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                                        {new Date(enc.date).toLocaleDateString()} &mdash; Completed: {String(enc.completed)}
                                    </p>

                                    <div className="d-flex justify-content-between">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() =>
                                                navigate("/encounter-simulation", {
                                                    state: { eid: enc.eid },
                                                })
                                            }
                                        >
                                            Play
                                        </button>

                                        <button
                                            className="btn btn-danger"
                                            onClick={() => openDeleteConfirm(enc)}
                                        >
                                            Delete
                                        </button>
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