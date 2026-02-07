import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
//stylize each Home, Saved Encounter to be within a box and reusable

type ActivePanel =
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'HOW_TO_USE';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};

function NavigationSignedIn({ setActivePage }: NavigationSignedInProps) {
    return(
        <Container>
            {/*<Row>Saved Encounters</Row>*/}
            <Row role='button' onClick={() => setActivePage('SAVED_ENCOUNTERS')}>Home</Row>
            <Row role='button' onClick={() => setActivePage('LOAD_CHARACTERS')}>Load Saved Characters</Row>
            <Row role='button' onClick={() => setActivePage('HOW_TO_USE')} >How to Use</Row>
        </Container>
    )
}

export default NavigationSignedIn;