import { useState, useEffect } from "react";
import AnimatedList from "../../css/AnimatedList.tsx";
import { Form, Row, Col, Dropdown, Modal, Button } from "react-bootstrap";
import { getCharacters } from "../../api/CharactersGet.ts";
import {type CharacterPayload} from "../../types/creature.ts";

type Props = {
    onDeletePlayer: (cid: string) => Promise<void>;
};

function LoadCharacter({ onDeletePlayer }: Props) {
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [characters, setCharacters] = useState<CharacterPayload[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<CharacterPayload | null>(null);

    useEffect(() => {
        getCharacters().then(setCharacters);
    }, []);

    const handleDelete = async (cid: string) => {
        try {
            await onDeletePlayer(cid);

            setCharacters((prev) =>
                prev.filter((character) => character.stats.cid !== cid)
            );
        } catch (err) {
            console.error("Error deleting character:", err);
        }
    };

    const filteredCharacters = characters.filter((c) => {
        const matchesName = c.stats.name.toLowerCase().includes(search.toLowerCase());
        const matchesClass = filterClass === "" || c.stats.characterClass === filterClass;
        const matchesLevel = filterLevel === "" || String(c.stats.level) === filterLevel;
        return matchesName && matchesClass && matchesLevel;
    });

    const openDeleteConfirm = (character: CharacterPayload) => {
        setSelectedCharacter(character);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setSelectedCharacter(null);
    };

    const confirmDelete = async () => {
        if (!selectedCharacter) return;

        try {
            await handleDelete(selectedCharacter.stats.cid);
            closeDeleteConfirm();
        } catch (err) {
            console.error(err);
        }
    };

    const characterLabels = filteredCharacters.map((c) => (
        <div key={c.stats.cid} className="d-flex">
            <span style={{ flex: 3 }}>{c.stats.name}</span>
            <span style={{ flex: 3 }}>{c.stats.characterClass}</span>
            <span style={{ flex: 1 }}>{c.stats.level}</span>
            <span style={{ flex: 1 }}>{c.stats.maxhp}</span>
            <div style={{ flex: 0.01 }} className="text-end">
                <Dropdown align="end">
                    <Dropdown.Toggle
                        variant="link"
                        id={`dots-menu-${c.stats.cid}`}
                        className="p-0 border-0 text-white text-decoration-none fs-4"
                    >
                        &#8942;
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => openDeleteConfirm(c)}>
                            Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    ));

    const uniqueClasses = [...new Set(characters.map((c) => c.stats.characterClass))].sort();
    const uniqueLevel = [...new Set(characters.map((c) => String(c.stats.level)))].sort(
        (a, b) => Number(a) - Number(b)
    );

    return (
        <div className="p-3">
            <Form>
                <Row className="mb-3">
                    <Col>
                        <Form.Label className="text-white">Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <Form.Label className="text-white">Class</Form.Label>
                        <Form.Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            <option value="">All Classes</option>
                            {uniqueClasses.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Label className="text-white">Level</Form.Label>
                        <Form.Select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="">All</option>
                            {uniqueLevel.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </Form>

            <div className="d-flex px-4 text-dark mb-1">
                <span style={{ flex: 3 }}>Name</span>
                <span style={{ flex: 2.9 }}>Class</span>
                <span style={{ flex: 1.1 }}>Level</span>
                <span style={{ flex: 1 }}>HP</span>
            </div>

            <AnimatedList
                items={characterLabels}
                showGradients
                displayScrollbar
            />

            <Modal show={showDeleteConfirm} onHide={closeDeleteConfirm} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Are you sure you want to delete{" "}
                    <strong>{selectedCharacter?.stats.name}</strong>?
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="light" onClick={closeDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default LoadCharacter;