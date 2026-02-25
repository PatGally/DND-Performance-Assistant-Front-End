import Container from 'react-bootstrap/Container';
import Row from "react-bootstrap/Row";
import { CloudArrowDown, PersonGear, QuestionSquare, Archive } from 'react-bootstrap-icons';

type ActivePanel =
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'CREATE_CHARACTER'
    | 'CREATE_ENCOUNTER'
    | 'HOW_TO_USE';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};

function NavigationSignedIn({ setActivePage }: NavigationSignedInProps) {
    return(
        <Container fluid>
            {/*<Row>Saved Encounters</Row>*/}
            <Row className="d-grid">
                <button type="button" className={"btn text-light d-flex align-items-center border-0 mt-1"}
                        onClick={() => setActivePage('SAVED_ENCOUNTERS')}>
                    <Archive
                    size={20}
                    className="me-2 text-light"
                    title="Saved Encounters Icon"/> <strong>Saved Encounters</strong> </button>

                <button type="button" className={"btn text-light d-flex align-items-center border-0 mt-1"}
                        onClick={() => setActivePage('CREATE_ENCOUNTER')}>
                    <Archive
                        size={20}
                        className="me-2 text-light"
                        title="Saved Encounters Icon"/> <strong>Create Encounter</strong> </button>

                {/*// I think this should go to the home page not signed in page.*/}

                <button type="button" className={"btn text-light d-flex align-items-center border-0 mt-1"}
                        onClick={() => setActivePage('LOAD_CHARACTERS')}>
                    <CloudArrowDown
                        className="me-2 text-light"
                        size={20}
                        title="Load Characters Icon"/><strong> Load Saved Characters </strong> </button>

                <button type="button" className={"btn text-light d-flex align-items-center border-0 mt-1"}
                        onClick={() => setActivePage('CREATE_CHARACTER')}>
                    <PersonGear
                        size={20}
                    className="me-2 text-light"
                    title="Create Character Icon"/><strong> Create Character </strong> </button>

                <button type="button" className={"btn text-light d-flex align-items-center border-0 mt-1"}
                        onClick={() => setActivePage('HOW_TO_USE')}>
                    <QuestionSquare
                    size={20}
                    className="me-2 text-light"
                    title="How To Use Icon"/><strong> How to Use </strong> </button>
            </Row>
        </Container>
    )
}

export default NavigationSignedIn;