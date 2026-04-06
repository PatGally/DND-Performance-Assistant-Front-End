import { useState, useEffect } from "react";
import type { EncounterFormData } from "./CreateEncounter";
import { type MonsterCreature } from "../../types/creature.ts";
import AnimatedList from "../../css/AnimatedList.tsx";
import { Form, Row, Col } from "react-bootstrap";


type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
    monsters: MonsterCreature[];
};

function AddMonsters({ formData, updateFormData, monsters }: Props) {
    const [search, setSearch] = useState("");
    const [filterCR, setFilterCR] = useState("");
    const [filterSize, setFilterSize] = useState("");
    const [filterType, setFilterType] = useState("");


    useEffect(() => {
        console.log("monsters updated:", formData.monsters);
    }, [formData.monsters]);

    const filteredMonsters = monsters.filter((m) => {
        const matchesName = m.name.toLowerCase().includes(search.toLowerCase());
        const matchesCR = filterCR === "" || String(m.cr) === filterCR;
        const matchesSize = filterSize === "" || m.size.toLowerCase() === filterSize.toLowerCase();
        const matchesType = filterType === "" || m.creatureType.toLowerCase() === filterType.toLowerCase();
        return matchesName && matchesCR && matchesSize && matchesType;
    });

    const monsterLabels = filteredMonsters.map((m) => (
        <div className="d-flex" style={{ gap: '1rem' }}>
            <span style={{ flex: 3 }}>{m.name}</span>
            <span style={{ flex: 3 }}>{m.creatureType}</span>
            <span style={{ flex: 1 }}>CR: {m.cr}</span>
            <span style={{ flex: 1 }}>Size: {m.size}</span>
        </div>
    ));

    const selectedIndices = filteredMonsters
        .map((m, i) => formData.monsters.some((fm) => fm.name === m.name) ? i : -1)
        .filter((i) => i !== -1);

    const handleSelect = (index: number) => {
        const selected = filteredMonsters[index];
        const already = formData.monsters.some((m) => m.name === selected.name);
        updateFormData({
            monsters: already
                ? formData.monsters.filter((m) => m.name !== selected.name)
                : [...formData.monsters, selected],
        });
    };

    const uniqueCRs = [...new Set(monsters.map((m) => String(m.cr)))].sort();
    const uniqueSizes = [...new Set(monsters.map((m) => m.size))].sort();
    const uniqueTypes = [...new Set(monsters.map((m) => m.creatureType))].sort();

    return (
        <div className="p-3">
            <Form>
                <Row className="mb-3">
                    <Col>
                        <Form.Label className="text-Dark">Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <Form.Label className="text-Dark">CR</Form.Label>
                        <Form.Select
                            value={filterCR}
                            onChange={(e) => setFilterCR(e.target.value)}
                        >
                            <option value="">All CRs</option>
                            {uniqueCRs.map((cr) => (
                                <option key={cr} value={cr}>{cr}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Label className="text-dark">Monster Type</Form.Label>
                        <Form.Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Monster Types</option>
                            {uniqueTypes.map((ctype) => (
                                <option key={ctype} value={ctype}>{ctype}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col>
                        <Form.Label className="text-Dark">Size</Form.Label>
                        <Form.Select
                            value={filterSize}
                            onChange={(e) => setFilterSize(e.target.value)}
                        >
                            <option value="">All Sizes</option>
                            {uniqueSizes.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </Form.Select>
                    </Col>
                </Row>
            </Form>
            {/*style={{ borderBottom: "1px solid black" }}*/}
            <div className="d-flex px-3 text-dark mb-1" >
                <span style={{ flex: 2.96}}>Name</span>
                <span style={{ flex: 2.96}}> Creature Type</span>
                <span style={{ flex: 1 }}>CR</span>
                <span style={{ flex: 1}}>Size</span>
            </div>


            <AnimatedList
                items={monsterLabels}
                onItemSelect={handleSelect}
                selectedIndices={selectedIndices}
                showGradients
                enableArrowNavigation
                displayScrollbar
            />
        </div>
    );
}

export default AddMonsters;