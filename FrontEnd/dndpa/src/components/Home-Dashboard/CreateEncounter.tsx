import EncounterCreationNav from "../../pages/logged-in/EncounterCreationNav";
import Container from "react-bootstrap/Container";
import { useState } from "react";

type ActivePanel =
    | 'SET_ENCOUNTERNAME'
    | 'ADD_CHARACTERS'
    | 'ADD_MONSTERS'
    | 'ADD_MAPLINK'
    | 'ADD_GRIDSIZE';

function CreateEncounter() {
    const [activePanel, setActivePanel] = useState<ActivePanel>('SET_ENCOUNTERNAME');

    return (
        <Container>
            <EncounterCreationNav setActivePanel={setActivePanel} />

            {activePanel === 'SET_ENCOUNTERNAME' && <div>Name Section</div>}
            {activePanel === 'ADD_CHARACTERS' && <div>Add Characters</div>}
            {activePanel === 'ADD_MONSTERS' && <div>Add Monsters</div>}
            {activePanel === 'ADD_MAPLINK' && <div>Map Link</div>}
            {activePanel === 'ADD_GRIDSIZE' && <div>Grid Size</div>}
        </Container>
    );
}

export default CreateEncounter;