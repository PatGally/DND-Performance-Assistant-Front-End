import Container from 'react-bootstrap/Container';
import Row from "react-bootstrap/Row";
import { CloudArrowDown, PersonGear, QuestionSquare, Archive, Journals } from 'react-bootstrap-icons';

type ActivePanel =
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'CREATE_CHARACTER'
    | 'CREATE_ENCOUNTER'
    | 'HOW_TO_USE';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};

function HomeDashNav({ setActivePage }: NavigationSignedInProps) {
    return(
        <Container fluid>
            <Row className="d-flex flex-column align-items-center gap-2 mt-3">
                <button
                    type="button"
                    className="btn text-light d-flex flex-column align-items-center justify-content-center border-0"
                    onClick={() => setActivePage('SAVED_ENCOUNTERS')}
                >
                    <Archive size={22} className="text-light" title="Saved Encounters Icon" />
                    <span className="fw-bold" style={{fontSize: ".7rem"}}>Archives</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex flex-column align-items-center justify-content-center border-0 "
                    onClick={() => setActivePage('CREATE_ENCOUNTER')}
                >
                    <Journals size={22} className="text-light" title="Create Encounter Icon" />
                    <span className="fw-bold" style={{fontSize: ".7rem"}}>Create</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex flex-column align-items-center justify-content-center border-0 "
                    onClick={() => setActivePage('LOAD_CHARACTERS')}
                >
                    <CloudArrowDown size={22} className="text-light" title="Load Characters Icon" />
                    <span className="fw-bold" style={{fontSize: ".7rem"}}>Characters</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex flex-column align-items-center justify-content-center border-0 "
                    onClick={() => setActivePage('CREATE_CHARACTER')}
                >
                    <PersonGear size={22} className="text-light" title="Create Character Icon" />
                    <span className="fw-bold" style={{fontSize: ".7rem"}}>Builder</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex flex-column align-items-center justify-content-center border-0"
                    onClick={() => setActivePage('HOW_TO_USE')}
                >
                    <QuestionSquare size={22} className="text-light" title="How To Use Icon" />
                    <span className="fw-bold" style={{fontSize: ".7rem"}}>Guide</span>
                </button>
            </Row>
        </Container>
    )
}

export default HomeDashNav;