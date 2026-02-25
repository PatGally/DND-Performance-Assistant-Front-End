// import {Button, Form} from "react-bootstrap";
// import {useState} from "react";

// import { createCharacter } from "../../api/Characters";
// import calculateHP from '../../utils/calculateHP.js';
// import type {CharacterPayload} from "../../types/character.ts";

//needed for when you do sign and log in components
//required: true,
//pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// better pattern? /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
// validate: (value) => value.includes("@"),
// minlength, max length

import {type SubmitHandler, useForm} from "react-hook-form";
import React from "react";

type formFields = {
    name: string;
    characterClass: string;
}

const CharacterCreation: React.FC = () => {
    const { register, handleSubmit, formState: {errors, isSubmitting}, setError } = useForm<formFields>();
    //handlesubmit prevents default behavior and make sure that our formFields are valid
    // what I noticed is that useForm puts my submitted data into a json format
    // we are giving onSubmit as an argument to handleSubmit
    //data is the object of formFields with their corresponding values

    const onSubmit: SubmitHandler<formFields> = async (data) => {
        try{
            await new Promise(resolve => setTimeout(resolve, 1000));
            throw new Error();
            console.log(data);
        } catch (error) {
            setError("name",{message: "This is an example error " +
                    "great for when you are doing passwords later on"});
        }

    }

    return (
       <form onSubmit={handleSubmit(onSubmit)}>
            <input {...register("name",
                {required: "Name is Required"})} type="text" placeholder="CharacterName"/> {/* register can take another parameter*/}
           {errors.name && (<div className="text-red-500">{errors.name.message}</div>)} {/* error message */}
            <input {...register("characterClass",
                {required: "CharacterClass is Required"})}
                   type="text" placeholder="CharacterClass"/>
           {errors.characterClass && (<div className="text-red-500">{errors.characterClass.message}</div>)}
            <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Loading..." : "Submit"}
            </button>

       </form>
    )
}

export default CharacterCreation;

// import {Button, Form} from "react-bootstrap";
// import {useState} from "react";
// import * as React from "react";
// import { createCharacter } from "../../api/Characters";
// import calculateHP from '../../utils/calculateHP.js';
// import type {CharacterPayload} from "../../types/character.ts";
//
// // so what im understanding what to do is this -
// // use uuid to generate the cid - done
// // next move this json file outside to your backend folder - done did not use a backend folder but used api folder and types folder
// //then find a way for user created data to be given to the json file in the correct format - unsure if done correctly for now
// // at this stage - leave, weapons, spells, empty until you add that to the front-end
//
// //goal - figure out the json data stuff, then add weapons and spells for user to manually add
//
// // todo - use react-bits stepper to create the process for creating a character
// // todo - just like how you did in the example image you sent to group-chat
//
// // name, level, ac, class, spells, stat array, weapons are manual selections
// // hp is autoselected as well as many other things
//
// const CharacterCreation: React.FC = () => {
//     //Hooks to keep track of state and user input
//     const [name, setName] = useState<string>('');
//     const [characterClass, setCharacterClass] = useState<string>('');
//     const [level, setLevel] = useState<number>(0);
//     const [ac, setAc] = useState<number>(0);
//     const [strength, setStrength] = useState<number>(0);
//     const [dexterity, setDexterity] = useState<number>(0);
//     const [constitution, setConstitution] = useState<number>(0);
//     const [intelligence, setIntelligence] = useState<number>(0);
//     const [wisdom, setWisdom] = useState<number>(0);
//     const [charisma, setCharisma] = useState<number>(0);
//     const [weapon, setWeapon] = useState<string[]>([]);
//     // const [spells, setSpells] = useState<string[]>("");
//     // todo - add ability for spells to be selected based on
//     // todo - spellcaster type (their class) and their character level
//
//     // level, ac and calculatedHP need to be int not string
//     // must figure out how to send correct json
//     // we already know what works but need to perfect that here
//     // todo wednesday - fix json format that we send to backend
//     // todo - fix string and int - change the value types needed to send to backend
//     // todo - fix the rendering for when user selected weapons - they need to see what they selected - they also need
//     // todo - to select more than one weapon - so it's an array of number
//     // todo - my vision for weapon selection can look like this - 20 icons
//     // todo - to be selected
//
//     const handleSubmit = async  () => {
//         // e.preventDefault
//         //Uses helper function calculateHP to calculate user hp given the state of use
//         const calculatedHP = calculateHP(level, characterClass, constitution);
//         console.log(calculatedHP);
//         alert(`Submitted: ${"Name: " + name + " " +  "characterClass: " + characterClass + " " +
//         "calculatedHP: " + calculatedHP + " " +  "level: " + level + " " + "weapon: " + weapon}`);
//
//         const cid = crypto.randomUUID();
//
//         const character: CharacterPayload = {
//             stats: {
//                 name: name,
//                 cid: cid,
//                 level: level,
//                 ac: ac,
//                 hp: calculatedHP,
//                 characterClass: characterClass,
//                 position: [0, 0],
//                 conImmunities: [],
//                 activeStatusEffects: [],
//                 activeConditions: [],
//                 saveProfs: [20, 18, 16, 14, 12, 10],
//                 damImmunes: "",
//                 damResists: "",
//                 damVulns: "",
//                 statArray: [strength, dexterity, constitution, intelligence, wisdom, charisma],
//                 spellSlots: []
//             },
//             spells: [],
//             weapons: []
//         };
//         await createCharacter( character );
//     };
//     return (
//         <>
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Character Name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//             />
//             <br/>
//             <Form.Select aria-label="Select Class" type="number" value={characterClass}
//                          onChange={(e) => setCharacterClass(e.target.value)}>
//                 <option value="Select Class">Select Class</option>
//                 <option value="Barbarian">Barbarian</option>
//                 <option value="Bard">Bard</option>
//                 <option value="Cleric">Cleric</option>
//                 <option value="Druid">Druid</option>
//                 <option value="Fighter">Fighter</option>
//                 <option value="Monk">Monk</option>
//                 <option value="Paladin">Paladin</option>
//                 <option value="Ranger">Ranger</option>
//                 <option value="Rogue">Rogue</option>
//                 <option value="Sorcerer">Sorcerer</option>
//                 <option value="Warlock">Warlock</option>
//                 <option value="Wizard">Wizard</option>
//             </Form.Select>
//
//             <Form.Select multiple aria-label="Select Character Level" value={level}
//                          onChange={(e) => setLevel(parseInt(e.target.value))}>
//                 <option value="Select Character Level">Select Character Level</option>
//                 <option value="1">1</option>
//                 <option value="2">2</option>
//                 <option value="3">3</option>
//                 <option value="4">4</option>
//                 <option value="5">5</option>
//                 <option value="6">6</option>
//                 <option value="7">7</option>
//                 <option value="8">8</option>
//                 <option value="9">9</option>
//                 <option value="10">10</option>
//                 <option value="11">11</option>
//                 <option value="12">12</option>
//                 <option value="13">13</option>
//                 <option value="14">14</option>
//                 <option value="15">15</option>
//                 <option value="16">16</option>
//                 <option value="17">17</option>
//                 <option value="18">18</option>
//                 <option value="19">19</option>
//                 <option value="20">20</option>
//             </Form.Select>
//             <Form.Control
//                 type="text"
//                 placeholder="Enter AC"
//                 min={10}
//                 max={20}
//                 value={ac}
//                 onChange={(e) => setAc(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Strength"
//                 min={3}
//                 max={20}
//                 value={strength}
//                 onChange={(e) => setStrength(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Dexterity"
//                 min={3}
//                 max={20}
//                 value={dexterity}
//                 onChange={(e) => setDexterity(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Constitution"
//                 min={3}
//                 max={20}
//                 value={constitution}
//                 onChange={(e) => setConstitution(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Intelligence"
//                 min={3}
//                 max={20}
//                 value={intelligence}
//                 onChange={(e) => setIntelligence(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Wisdom"
//                 min={3}
//                 max={20}
//                 value={wisdom}
//                 onChange={(e) => setWisdom(Number(e.target.value))}
//             />
//             <Form.Control
//                 type="text"
//                 placeholder="Enter Charisma"
//                 min={3}
//                 max={20}
//                 value={charisma}
//                 onChange={(e) => setCharisma(Number(e.target.value))}
//             />
//             <Form.Select aria-label="Select Class" value={weapon} multiple
//                          onChange={(e) => setWeapon([e.target.value])}> // wrap in array
//                 <option value="club">club</option>
//                 <option value="dagger">dagger</option>
//                 <option value="greatclub">greatclub</option>
//                 <option value="handaxe">handaxe</option>
//                 <option value="javelin">javelin</option>
//                 <option value="light hammer">light hammer</option>
//                 <option value="mace">mace</option>
//                 <option value="quarterstaff">quarterstaff</option>
//                 <option value="sickle">sickle</option>
//                 <option value="spear">spear</option>
//                 <option value="light crossbow">light crossbow</option>
//                 <option value="dart">dart</option>
//                 <option value="shortbow">shortbow</option>
//                 <option value="sling">sling</option>
//                 <option value="battleaxe">battleaxe</option>
//                 <option value="flail">flail</option>
//                 <option value="glaive">glaive</option>
//                 <option value="greataxe">greataxe</option>
//                 <option value="greatsword">greatsword</option>
//                 <option value="halberd">halberd</option>
//                 <option value="lance">lance</option>
//                 <option value="longsword">longsword</option>
//                 <option value="maul">maul</option>
//                 <option value="morningstar">morningstar</option>
//                 <option value="pike">pike</option>
//                 <option value="rapier">rapier</option>
//                 <option value="scimitar">scimitar</option>
//                 <option value="shortsword">shortsword</option>
//                 <option value="trident">trident</option>
//                 <option value="war pick">war pick</option>
//                 <option value="warhammer">warhammer</option>
//                 <option value="whip">whip</option>
//                 <option value="crossbow">crossbow</option>
//                 <option value="heavy crossbow">heavy crossbow</option>
//                 <option value="longbow">longbow</option>
//             </Form.Select>
//             <Button variant="primary" onClick={handleSubmit}>
//                 Submit
//             </Button>
//         </>
//     )
// }
//
// export default CharacterCreation;