// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import NavigationSignedIn from '../../components/nav/NavigationSignedIn';
// import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
// import EncounterView from "../../components/Home-Dashboard/EncounterView";
// import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";
// import EncounterCreationNav from "../../components/Home-Dashboard/EncounterCreationNav";
//
// import { useState } from 'react';
// import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
// import {PersonCircle} from "react-bootstrap-icons";
//
// function HomeDashboard(){
//     const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');
//     return(
//         <Container fluid className="min-vh-100 d-flex flex-column" >
//                 <Row >
//                     <Col lg={2} className="text-center bg-dark bg-gradient text-light">
//                         <div>Logo</div>
//                         <div className="p-3"><PersonCircle
//                             size={35}
//                             title="User"
//                         /></div>
//                     </Col>
//                     <Col lg={10} className=" bg-dark bg-gradient text-light">
//                         <h1>DASHBOARD</h1>
//                     </Col>
//                 </Row>
//             <Row>
//                 <Col lg={2} className="text-center bg-dark text-light"> |</Col>
//                 <Col lg={10} className="text-center bg-dark text-light">
//                     {activePage === 'CREATE_ENCOUNTER' && <EncounterCreationNav/>}
//
//                 </Col>
//             </Row>
//             <Row className="flex-grow-1">
//                 <Col lg={2} className="bg-dark text-center m-0 p-0">
//                     {/*C5 main navigation goes here*/}
//                     <NavigationSignedIn setActivePage={setActivePage} />
//
//                 </Col>
//                 <Col lg={10} className="bg-dark text-light">
//                     {activePage === 'SAVED_ENCOUNTERS' && <EncounterView/>}
//                     {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter/>}
//                     {activePage === 'LOAD_CHARACTERS' && <LoadCharacter/>}
//                     {activePage === 'CREATE_CHARACTER' && <CharCreation />}
//                     {activePage === 'HOW_TO_USE' && <div>How To Use </div>}
//                 </Col>
//             </Row>
//
//             <Row>
//                 <Col className="text-center bg-dark-subtle text-light">C7 Footer </Col>
//             </Row>
//         </Container>
//     )
// }
//
// export default HomeDashboard;


import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavigationSignedIn from '../../components/nav/NavigationSignedIn';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
import EncounterView from "../../components/Home-Dashboard/EncounterView";
import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";
import EncounterCreationNav from "../../components/Home-Dashboard/EncounterCreationNav";

import { useState } from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
import {PersonCircle} from "react-bootstrap-icons";

function HomeDashboard(){
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');
    return(
        <Container fluid className="d-flex flex-column min-vh-100 p-0" >
            <Row>
                <Col xs={1} sm={2} md={2} lg={2} xl={2} xxl={2}  className="bg-primary min-vh-100 d-flex flex-column" >
                    <Row className="d-flex flex-column align-items-center align-items-md-start gap-2">
                        <div className="text-center m-1">DND</div>
                        <div className="text-center m-1">
                            <PersonCircle
                                title="User" className="icon-responsive text-dark"/>
                        </div>
                    </Row>

                    <Row>
                        <NavigationSignedIn setActivePage={setActivePage} />
                    </Row>

                </Col>
                <Col xs={11} sm={9} md={10} lg={10} xl={10} xxl={10} className="d-flex flex-column">
                    <Row className="flex mb-4">
                        <h1>DASHBOARD</h1>
                    </Row>
                    <Row>
                        {activePage === 'CREATE_ENCOUNTER' && <EncounterCreationNav/>}
                    </Row>
                    <Row className="flex-grow-1">
                        {activePage === 'SAVED_ENCOUNTERS' && <EncounterView/>}
                        {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter/>}
                        {activePage === 'LOAD_CHARACTERS' && <LoadCharacter/>}
                        {activePage === 'CREATE_CHARACTER' && <CharCreation />}
                        {activePage === 'HOW_TO_USE' && <div>How To Use </div>}
                    </Row>

                </Col>
            </Row>

            <Row>
                <Col className="text-center bg-dark-subtle text-light">C7 Footer </Col>
            </Row>
        </Container>
    )
}

export default HomeDashboard;