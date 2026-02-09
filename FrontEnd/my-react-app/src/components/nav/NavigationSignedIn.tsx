import Container from 'react-bootstrap/Container';
import Row from "react-bootstrap/Row";
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
//stylize each Home, Saved Encounter to be within a box and reusable

type ActivePanel =
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'CREATE_CHARACTER'
    | 'HOW_TO_USE';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};

function NavigationSignedIn({ setActivePage }: NavigationSignedInProps) {
    return(
        <Container fluid>
            {/*<Row>Saved Encounters</Row>*/}
            <Row className="d-grid">
                <button type="button" onClick={() => setActivePage('SAVED_ENCOUNTERS')}> Home </button>
                <button type="button" onClick={() => setActivePage('LOAD_CHARACTERS')}>Load Saved Characters</button>
                <button type="button" onClick={() => setActivePage('CREATE_CHARACTER')}>Create Character</button>
                <button type="button" onClick={() => setActivePage('HOW_TO_USE')}>How to Use</button>
            </Row>
        </Container>
    )
}

export default NavigationSignedIn;