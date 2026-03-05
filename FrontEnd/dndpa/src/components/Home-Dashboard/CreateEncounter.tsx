import EncounterCreationNav from "../../pages/logged-in/EncounterCreationNav";
import type { ActivePanel } from "../../pages/logged-in/EncounterCreationNav";
import Container from "react-bootstrap/Container";
import { useState } from "react";
import type { ReactElement } from "react";

// For UI purposes and fill the name selection area
// we can allow user to write notes for their encounter with a 50 character limit and optional
// also the created date is shown in that page

const panels: Record<ActivePanel, ReactElement> = {
    SET_ENCOUNTERNAME: <div>Name Section</div>,
    ADD_CHARACTERS:    <div>Add Characters</div>,
    ADD_MONSTERS:      <div>Add Monsters</div>,
    ADD_MAPLINK:       <div>Map Link</div>,
    ADD_GRIDSIZE:      <div>Grid Size</div>,
};

function CreateEncounter() {
    const [activePanel, setActivePanel] = useState<ActivePanel>('SET_ENCOUNTERNAME');

    return (
        <Container>
            <EncounterCreationNav activePanel={activePanel} setActivePanel={setActivePanel} />
            {panels[activePanel]}
        </Container>
    );
}

export default CreateEncounter;