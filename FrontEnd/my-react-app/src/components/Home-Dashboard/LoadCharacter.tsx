import { useQuery } from "@tanstack/react-query";
import { getCharacters } from "../../api/CharactersGet.ts";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import {Card} from "react-bootstrap";
//
interface Character {
    stats: {
        cid: string;
        name: string;
        level: number;
        ac: number;
        hp: number;
        maxHP: number;
        characterClass: string;
    };
    weapons?: { name: string }[];
    spells?: { spellname: string }[];
}
//
// function LoadCharacter() {
//     const { data: characters = [], isLoading, isError } = useQuery<Character[], Error>({
//         queryKey: ["characters"],
//         queryFn: getCharacters
//     });
//
//     if (isLoading) return <p>Loading...</p>;
//     if (isError) return <p>Error loading characters</p>;
//     console.log("Did this work?");
//     return (
//         <Row className="g-3">
//             {characters.map((char) => (
//                 <Col md={4} key={char.stats.cid}>
//                     <Card>
//                         <Card.Body>
//                             <Card.Title>{char.stats.name}</Card.Title>
//                             <Card.Subtitle className="mb-2 text-muted">
//                                 Level {char.stats.level} {char.stats.characterClass}
//                             </Card.Subtitle>
//                             <Card.Text>
//                                 HP: {char.stats.hp} <br />
//                                 AC: {char.stats.ac}
//                             </Card.Text>
//                         </Card.Body>
//                     </Card>
//                 </Col>
//             ))}
//         </Row>
//     );
// }
// export default LoadCharacter;


// function  LoadCharacter(){
//     return (<>hello</>)
// }
//
// export default LoadCharacter;

function LoadCharacter() {
    const { data: characters = [], isLoading, isError } = useQuery<Character[], Error>({
        queryKey: ["characters"],
        queryFn: getCharacters,
    });

    if (isLoading) return <p>Loading...</p>;
    if (isError) return <p>Error loading characters</p>;
    if (!characters.length) return <p>No characters found</p>; // <-- safe fallback

    return (
        <Row className="g-3">
            {characters.map((char) => (
                <Col md={4} key={char.stats.cid}>
                    <Card>
                        <Card.Body>
                            <Card.Title>{char.stats.name}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                Level {char.stats.level} {char.stats.characterClass}
                            </Card.Subtitle>
                            <Card.Text>
                                HP: {char.stats.hp} <br />
                                AC: {char.stats.ac}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}

export default LoadCharacter;