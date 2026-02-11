// import Container from "react-bootstrap/Container";
// import {Card} from "react-bootstrap";

import {Button, Form} from "react-bootstrap";
import {useState} from "react";
import * as React from "react";
import { createCharacter } from "../../api/Characters";
import calculateHP from '../../utils/calculateHP.js';

// name, level, ac, class, spells, stat array, weapons are manual selections
// hp is autoselected as well as many other things

const CharacterCreation: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [characterClass, setCharacterClass] = useState<string>('');
    const [level, setLevel] = useState<string>("");
    const [ac, setAc] = useState<string>("");
    const [strength, setStrength] = useState<string>("");
    const [dexterity, setDexterity] = useState<string>("");
    const [constitution, setConstitution] = useState<string>("");
    const [intelligence, setIntelligence] = useState<string>("");
    const [wisdom, setWisdom] = useState<string>("");
    const [charisma, setCharisma] = useState<string>("");



    // const handleHP=()=>{}

    const handleSubmit = async  () => {

        const calculatedHP = calculateHP(level, characterClass, constitution);
        const character =  {name, characterClass, calculatedHP, ac, strength,
            dexterity, constitution, intelligence, wisdom, charisma};
        alert(`Submitted: ${name + characterClass + calculatedHP}`);
        await createCharacter( character );
    };
    return (
        <>
            <Form.Control
                type="text"
                placeholder="Enter Character Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <br/>
            <Form.Select aria-label="Select Class" value={characterClass}
                         onChange={(e) => setCharacterClass(e.target.value)}>
                <option value="Select Class">Select Class</option>
                <option value="Barbarian">Barbarian</option>
                <option value="Bard">Bard</option>
                <option value="Cleric">Cleric</option>
                <option value="Druid">Druid</option>
                <option value="Fighter">Fighter</option>
                <option value="Monk">Monk</option>
                <option value="Paladin">Paladin</option>
                <option value="Ranger">Ranger</option>
                <option value="Rogue">Rogue</option>
                <option value="Sorcerer">Sorcerer</option>
                <option value="Warlock">Warlock</option>
                <option value="Wizard">Wizard</option>
            </Form.Select>

            <Form.Select aria-label="Select Character Level" value={level}
                         onChange={(e) => setLevel(e.target.value)}>
                <option value="Select Character Level">Select Character Level</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="17">17</option>
                <option value="18">18</option>
                <option value="19">19</option>
                <option value="20">20</option>
            </Form.Select>
            <Form.Control
                type="text"
                placeholder="Enter AC"
                min={10}
                max={20}
                value={ac}
                onChange={(e) => setAc(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Strength"
                min={3}
                max={20}
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Dexterity"
                min={3}
                max={20}
                value={dexterity}
                onChange={(e) => setDexterity(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Constitution"
                min={3}
                max={20}
                value={constitution}
                onChange={(e) => setConstitution(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Intelligence"
                min={3}
                max={20}
                value={intelligence}
                onChange={(e) => setIntelligence(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Wisdom"
                min={3}
                max={20}
                value={wisdom}
                onChange={(e) => setWisdom(e.target.value)}
            />
            <Form.Control
                type="text"
                placeholder="Enter Charisma"
                min={3}
                max={20}
                value={charisma}
                onChange={(e) => setCharisma(e.target.value)}
            />
            <Button variant="primary" onClick={handleSubmit}>
                Submit
            </Button>
        </>
    )
}

export default CharacterCreation;