import { useState } from "react";
import type { EncounterFormData } from "./CreateEncounter";
import AnimatedList from "../../css/AnimatedList.tsx";
import { Form, Row, Col } from "react-bootstrap";
import type {CharacterPayload} from "../../types/creature.ts";


type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
    characters: CharacterPayload[];
};

function AddCharacters({ formData, updateFormData, characters }: Props) {
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterLevel, setFilterLevel] = useState("");

    const filteredCharacters = characters.filter((c) => {
        const matchesName = c.stats.name.toLowerCase().includes(search.toLowerCase());
        const matchesClass = filterClass === "" || c.stats.characterClass === filterClass;
        const matchesLevel = filterLevel === "" || String(c.stats.level) === filterLevel;
        return matchesName && matchesClass && matchesLevel;
    });

    const characterLabels = filteredCharacters.map((c) => (
        <div className="d-flex">
            <span style={{ flex: 3 }}>{c.stats.name}</span>
            <span style={{ flex: 3 }}>{c.stats.characterClass}</span>
            <span style={{ flex: 1 }}>{c.stats.level}</span>
            <span style={{ flex: 1 }}>{c.stats.maxhp}</span>
        </div>
    ));

    const selectedIndices = filteredCharacters
        .map((c, i) => formData.characters.some((fc) => fc.stats.cid === c.stats.cid) ? i : -1)
        .filter((i) => i !== -1);

    const handleSelect = (index: number) => {
        const selected = filteredCharacters[index];
        const already = formData.characters.some((c) => c.stats.cid === selected.stats.cid);
        updateFormData({
            characters: already
                ? formData.characters.filter((c) => c.stats.cid !== selected.stats.cid)
                : [...formData.characters, selected],
        });
    };

    const uniqueClasses = [...new Set(characters.map((c) => c.stats.characterClass))].sort();
    const uniqueLevel = [...new Set(characters.map((c) => String(c.stats.level)))].sort((a, b) => Number(a) - Number(b));

    return (
        <div className="p-3"  style={{backgroundColor: "rgba(15, 24, 40, 0.85)"}}>
            <Form>
                <Row className="mb-3">
                    <Col>
                        <Form.Control
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <Form.Select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {uniqueClasses.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">All</option>
                            {uniqueLevel.map((level) => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </Form>

            <div className="d-flex px-4 text-white mb-1">
                <span style={{ flex: 3 }}>Name</span>
                <span style={{ flex: 2.9 }}>Class</span>
                <span style={{ flex: 1.05 }}>Level</span>
                <span style={{ flex: 1.05 }}>HP</span>
            </div>

            <AnimatedList
                items={characterLabels}
                onItemSelect={handleSelect}
                selectedIndices={selectedIndices}
                showGradients
                enableArrowNavigation
                displayScrollbar
            />
        </div>
    );
}

export default AddCharacters;
