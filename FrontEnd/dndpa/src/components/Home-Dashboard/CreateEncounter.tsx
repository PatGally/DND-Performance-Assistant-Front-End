import EncounterCreationNav from "../../pages/logged-in/EncounterCreationNav";
import type { ActivePanel } from "../../pages/logged-in/EncounterCreationNav";

import Container from "react-bootstrap/Container";
import {useEffect, useState} from "react";
import SetEncounterName from "./SetEncounterName.tsx";
import AddCharacters from "./AddCharacters.tsx";
import AddMonsters from "./AddMonsters.tsx";
import AddMapLink from "./AddMapLink.tsx";
import AddGridSize from "./AddGridSize.tsx";

import {getMonsters, type Monster} from "../../api/MonstersGet.ts";
import {type Character, getCharacters} from "../../api/CharactersGet.ts";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";



export interface EncounterFormData {
    name: string;
    characters: Character[];
    monsters: Monster[];
    maplink: string;
    gridSize: { rows: number; cols: number };
}

const defaultFormData: EncounterFormData = {
    name: "",
    characters: [],
    monsters: [],
    maplink: "",
    gridSize: { rows: 0, cols: 0 },
};

function CreateEncounter() {
    const [activePanel, setActivePanel] = useState<ActivePanel>("SET_ENCOUNTERNAME");
    const [formData, setFormData] = useState<EncounterFormData>(defaultFormData);
    const [monsters, setMonsters] = useState<Monster[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        const fetchMonsters = async () => {
            const data = await getMonsters();
            setMonsters(data);
        };
        fetchMonsters();
    }, []);

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
            case "ADD_MAPLINK":
                return <AddMapLink formData={formData} updateFormData={updateFormData} />;
            case "ADD_GRIDSIZE":
                return <AddGridSize formData={formData} updateFormData={updateFormData} />;
        }
    };

    return ( //im pretty here is the area in where we need to stop page bounce up when we scroll up hard
        <Container fluid className="px-0"> {/* Fix the scroll to not allow scrolling from left to right */}
            <Row>
                {/*<Col >*/}
                {/*    <Row> Hello </Row>*/}
                {/*</Col>*/}
                <Col>
                    <EncounterCreationNav
                        activePanel={activePanel}
                        setActivePanel={setActivePanel}
                        formData={formData}
                        // monsters={monsters}
                        // characters={characters}  //change this to players ????
                    />
                    {renderPanel()}
                </Col>

            </Row>


        </Container>
    );
}


export default CreateEncounter;