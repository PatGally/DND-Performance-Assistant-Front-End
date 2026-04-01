import EncounterCreationNavAndSubmit from "../../pages/logged-in/EncounterCreationNavAndSubmit.tsx";
import type { ActivePanel } from "../../pages/logged-in/EncounterCreationNavAndSubmit.tsx";

import Container from "react-bootstrap/Container";
import { useEffect, useState } from "react";
import SetEncounterName from "./SetEncounterName.tsx";
import AddCharacters from "./AddCharacters.tsx";
import AddMonsters from "./AddMonsters.tsx";
import AddMapLink from "./AddMapLink.tsx";
import AddGridSize from "./AddGridSize.tsx";
import AddInitiative, { type InitiativeEntry } from "./AddInitiative.tsx";

import { type Monster } from "../../api/MonstersGet.ts";
import { type Character, getCharacters } from "../../api/CharactersGet.ts";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export interface EncounterFormData {
    name: string;
    characters: Character[];
    monsters: Monster[];
    initiative: InitiativeEntry[];
    maplink: string;
    gridSize: { rows: number; cols: number };
}

const defaultFormData: EncounterFormData = {
    name: "",
    characters: [],
    monsters: [],
    initiative: [],
    maplink: "",
    gridSize: { rows: 0, cols: 0 },
};

type Props = {
    monsters: Monster[];
    onEncounterCreated: () => void; // ← just void
};

function CreateEncounter({ monsters, onEncounterCreated }: Props) {
    const [activePanel, setActivePanel] = useState<ActivePanel>("SET_ENCOUNTERNAME");
    const [formData, setFormData] = useState<EncounterFormData>(defaultFormData);
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        const fetchCharacters = async () => {

            const data = await getCharacters();
            setCharacters(data);
        };
        fetchCharacters();
    }, []);

    const updateFormData = (updates: Partial<EncounterFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const renderPanel = () => {
        switch (activePanel) {
            case "SET_ENCOUNTERNAME":
                return <SetEncounterName formData={formData} updateFormData={updateFormData} />;
            case "ADD_CHARACTERS":
                return <AddCharacters formData={formData} characters={characters} updateFormData={updateFormData} />;
            case "ADD_MONSTERS":
                return <AddMonsters formData={formData} monsters={monsters} updateFormData={updateFormData} />;
            case "ADD_INITIATIVE":
                return <AddInitiative formData={formData} updateFormData={updateFormData} />;
            case "ADD_MAPLINK":
                return <AddMapLink formData={formData} updateFormData={updateFormData} />;
            case "ADD_GRIDSIZE":
                return <AddGridSize formData={formData} updateFormData={updateFormData} />;
        }
    };

    return (
        <Container fluid className="px-0">
            <Row>
                <Col>
                    <EncounterCreationNavAndSubmit
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        formData={formData}
                        onSuccess={onEncounterCreated} // ← wired through
                    />
                    {renderPanel()}
                </Col>
            </Row>
        </Container>
    );
}

export default CreateEncounter;