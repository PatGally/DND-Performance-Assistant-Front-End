import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Modal } from "react-bootstrap";
import '../../css/EncounterView.css';
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
        <>
            <div className="pa-ev">
                <div className="row g-3">
                    {(encounters ?? []).map((enc) => (
                        <div key={enc.eid} className="col-12 col-md-6 col-lg-4">
                            <Card className="pa-ev__card">
                                {/* Map preview with gradient overlay + title */}
                                <div className="pa-ev__media">
                                    {enc.mapLink ? (
                                        <img
                                            className="pa-ev__media-image"
                                            src={enc.mapLink}
                                            alt={`Map for ${enc.name}`}
                                        />
                                    ) : (
                                        <div className="pa-ev__media-placeholder">
                                            No map available
                                        </div>
                                    )}

                                    <div className="pa-ev__media-overlay">
                                        <div className="pa-ev__media-title">
                                            {enc.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Body: date + actions */}
                                <Card.Body className="pa-ev__body">
                                    <p className="pa-ev__meta">
                                        {new Date(enc.date).toLocaleDateString()}
                                        {' — '}
                                        <span className={`pa-ev__status pa-ev__status--${enc.completed ? 'complete' : 'open'}`}>
                                        {enc.completed ? 'Completed' : 'In Progress'}
                                    </span>
                                    </p>

                                    <div className="pa-ev__actions">
                                        <button
                                            type="button"
                                            className="pa-ev__btn pa-ev__btn--primary"
                                            onClick={() =>
                                                navigate('/encounter-simulation', {
                                                    state: { eid: enc.eid },
                                                })
                                            }
                                        >
                                            Play
                                        </button>

                                        <button
                                            type="button"
                                            className="pa-ev__btn pa-ev__btn--danger"
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

            {/* Delete confirmation modal */}
            <Modal
                show={showDeleteConfirm}
                onHide={closeDeleteConfirm}
                centered
                contentClassName="pa-ev-modal"
            >
                <Modal.Header closeButton className="pa-ev-modal__header">
                    <Modal.Title className="pa-ev-modal__title">Confirm Delete</Modal.Title>
                </Modal.Header>

                <Modal.Body className="pa-ev-modal__body">
                    Are you sure you want to delete{' '}
                    <strong className="pa-ev-modal__target">
                        {selectedEncounter?.name}
                    </strong>
                    ?
                </Modal.Body>

                <Modal.Footer className="pa-ev-modal__footer">
                    <button
                        type="button"
                        className="pa-ev__btn pa-ev__btn--ghost"
                        onClick={closeDeleteConfirm}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="pa-ev__btn pa-ev__btn--danger"
                        onClick={confirmDelete}
                    >
                        Delete
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
};

export default EncounterView;