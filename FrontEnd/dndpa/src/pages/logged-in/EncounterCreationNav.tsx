// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Container from "react-bootstrap/Container";
//
// type ActivePanel =
//     | 'SET_ENCOUNTERNAME'
//     | 'ADD_CHARACTERS'
//     | 'ADD_MONSTERS'
//     | 'ADD_MAPLINK'
//     | 'ADD_GRIDSIZE';
//
// type EncounterCreationNav = {
//     setActivePage: (page: ActivePanel) => void;
// }
// function EncounterCreationNav({ setActivePage }: EncounterCreationNav){
//     return (
//         <Container>
//             <Row className="justify-content-center">
//                 <Col className="text-center">
//                     <button
//                         type="button"
//                         className="btn btn-outline-primary"
//                         onClick={() => setActivePage('SET_ENCOUNTERNAME')}>Name</button>
//                 </Col>
//                 <Col className="text-center">
//                    <button
//                        type="button"
//                        className="btn btn-outline-primary"
//                        onClick={() => setActivePage('ADD_CHARACTERS')} > Add Characters</button>
//                 </Col>
//                 <Col className="text-center">
//                     <button
//                         type="button"
//                         className="btn btn-outline-primary"
//                         onClick={() => setActivePage('ADD_MONSTERS')} > Add Monsters </button>
//                 </Col>
//                 <Col className="text-center">
//                     <button
//                         type="button"
//                         className="btn btn-outline-primary"
//                         onClick={() => setActivePage('ADD_MAPLINK')} > Map Link </button>
//                 </Col>
//                 <Col className="text-center">
//                     <button
//                         type="button"
//                         className="btn btn-outline-primary"
//                         onClick={() => setActivePage('ADD_GRIDSIZE')} > Grid Size</button>
//                 </Col>
//             </Row>
//         </Container>
//     )
// }
//
// export default EncounterCreationNav;


import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from "react-bootstrap/Container";

export type ActivePanel =
    | 'SET_ENCOUNTERNAME'
    | 'ADD_CHARACTERS'
    | 'ADD_MONSTERS'
    | 'ADD_MAPLINK'
    | 'ADD_GRIDSIZE';

type EncounterCreationNavProps = {
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
};

function EncounterCreationNav({ activePanel, setActivePanel }: EncounterCreationNavProps) {
    return (
        <Container>
            <Row className="justify-content-center">

                <Col className="text-center">
                    <button
                        className={`btn ${activePanel === 'SET_ENCOUNTERNAME' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActivePanel('SET_ENCOUNTERNAME')}
                    >
                        Name
                    </button>
                </Col>

                <Col className="text-center">
                    <button
                        className={`btn ${activePanel === 'ADD_CHARACTERS' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActivePanel('ADD_CHARACTERS')}
                    >
                        Add Characters
                    </button>
                </Col>

                <Col className="text-center">
                    <button
                        className={`btn ${activePanel === 'ADD_MONSTERS' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActivePanel('ADD_MONSTERS')}
                    >
                        Add Monsters
                    </button>
                </Col>

                <Col className="text-center">
                    <button
                        className={`btn ${activePanel === 'ADD_MAPLINK' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActivePanel('ADD_MAPLINK')}
                    >
                        Map Link
                    </button>
                </Col>

                <Col className="text-center">
                    <button
                        className={`btn ${activePanel === 'ADD_GRIDSIZE' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setActivePanel('ADD_GRIDSIZE')}
                    >
                        Grid Size
                    </button>
                </Col>

            </Row>
        </Container>
    );
}

export default EncounterCreationNav;