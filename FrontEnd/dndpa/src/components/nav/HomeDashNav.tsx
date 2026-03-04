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
            {/*<Row>Saved Encounters</Row>*/}
            <Row className="d-flex flex-column align-items-center align-items-md-start gap-2">
                <button
                    type="button"
                    className="btn text-light d-flex align-items-center justify-content-center justify-content-md-start w-100 border-0 m-1"
                    onClick={() => setActivePage('SAVED_ENCOUNTERS')}
                >
                    <Archive className="icon-responsive me-0 me-md-2 text-light" title="Saved Encounters Icon" />
                    <span className="d-none d-md-inline fw-bold">Saved Encounters</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex align-items-center justify-content-center justify-content-md-start w-100 border-0 m-1"
                    onClick={() => setActivePage('CREATE_ENCOUNTER')}
                >
                    <Journals className="icon-responsive me-0 me-md-2 text-light" title="Create Encounter Icon" />
                    <span className="d-none d-md-inline fw-bold">Create Encounter</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex align-items-center justify-content-center justify-content-md-start w-100 border-0 m-1"
                    onClick={() => setActivePage('LOAD_CHARACTERS')}
                >
                    <CloudArrowDown className="icon-responsive me-0 me-md-2 text-light" title="Load Characters Icon" />
                    <span className="d-none d-md-inline fw-bold">Load Characters</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex align-items-center justify-content-center justify-content-md-start w-100 border-0 m-1"
                    onClick={() => setActivePage('CREATE_CHARACTER')}
                >
                    <PersonGear className="icon-responsive me-0 me-md-2 text-light" title="Create Character Icon" />
                    <span className="d-none d-md-inline fw-bold">Create Character</span>
                </button>

                <button
                    type="button"
                    className="btn text-light d-flex align-items-center justify-content-center justify-content-md-start w-100 border-0 m-1"
                    onClick={() => setActivePage('HOW_TO_USE')}
                >
                    <QuestionSquare className="icon-responsive me-0 me-md-2 text-light" title="How To Use Icon" />
                    <span className="d-none d-md-inline fw-bold">How to Use</span>
                </button>
            </Row>
        </Container>
    )
}

export default HomeDashNav;