import React from "react";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import calculateHP from "../../utils/calculateHP.ts";
import { SpellsGet } from "../../api/SpellsGet.ts";

type FormFields = {
    name: string;
    characterClass: string;
    cid: string;
    level: number;
    ac: number;
    hp: number;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    weapons: string[];
};
// todo fix the weapons net is not supposed to be here check with backend
const ALL_WEAPONS = [
    "Club",
    "Dagger",
    "Greatclub",
    "Handaxe",
    "Javelin",
    "Light Hammer",
    "Mace",
    "Quarterstaff",
    "Sickle",
    "Spear",
    "Light Crossbow",
    "Dart",
    "Shortbow",
    "Sling",
    "Battleaxe",
    "Flail",
    "Glaive",
    "Greataxe",
    "Greatsword",
    "Halberd",
    "Lance",
    "Longsword",
    "Maul",
    "Morningstar",
    "Pike",
    "Rapier",
    "Scimitar",
    "Shortsword",
    "Trident",
    "War Pick",
    "Warhammer",
    "Whip",
    "Blowgun",
    "Hand Crossbow",
    "Heavy Crossbow",
    "Longbow",
    "Net",
];
// Todo add ability for user to select spells from a given list
// Todo disable send button until at least one spell is selected
// Todo GET Request - you send class and level and get data to display list of spells that is choosable
// Todo Display list of spells as
// Todo sned the full object Fireball for example to frontend



const CharCreation: React.FC = () => {
    const {
        register,
        handleSubmit, watch,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({
        defaultValues: {
            ac: 10,
            weapons: [],
        },
    });
    const level = watch("level");
    const characterClass = watch("characterClass");

    const [spells, setSpells] = useState<any[]>([]);
    const [loadingSpells, setLoadingSpells] = useState<boolean>(false);


    useEffect(() => {
        // Only fetch if both fields have values
        if (!level || !characterClass) return;

        const fetchSpells = async () => {
            try {
                setLoadingSpells(true);
                console.log(`1 - Fetching spells for ${characterClass} level ${level}`);

                const result = await SpellsGet(level, characterClass.toLowerCase());


                console.log("2 - Fetched spells:", result); // check results
                console.log(result[0].spellname);
                setSpells(result);
            } catch (err) {
                console.error("3 - Failed to fetch spells", err);
                setSpells([]); // clear on error
            } finally {
                setLoadingSpells(false);
            }
        };

        fetchSpells();
    }, [level, characterClass]);




    const onSubmit: SubmitHandler<FormFields> = async (data) => {
        const cid = crypto.randomUUID();
        if (!data.characterClass || !data.level || !data.constitution) {
            return;
        }

        const calculatedHP = calculateHP(data.level, data.characterClass, data.constitution);
        // const spells = SpellsGet(data.level, data.characterClass, ); //change this to GET Request
        const payload = {
            ...data,
            calculatedHP,
            spells, // spells that user changes is put here
            cid
        };

        console.log("Character Payload:", payload);
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)} className="p-4">

            <Form.Group className="mb-3">
                <Form.Label>Character Name</Form.Label>
                <Form.Control
                    type="text"
                    isInvalid={!!errors.name}
                    {...register("name", {
                        required: "Character name is required",
                        minLength: { value: 2, message: "Name too short" },
                    })}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.name?.message}
                </Form.Control.Feedback>
            </Form.Group>


            <Form.Group className="mb-3">
                <Form.Label>Class</Form.Label>
                <Form.Select
                    isInvalid={!!errors.characterClass}
                    {...register("characterClass", {
                        required: "Class is required",
                    })}>
                    <option value="">Select Class</option>
                    {[
                        "Barbarian","Bard","Cleric","Druid","Fighter",
                        "Monk","Paladin","Ranger","Rogue",
                        "Sorcerer","Warlock","Wizard"
                    ].map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                    {errors.characterClass?.message}
                </Form.Control.Feedback>
            </Form.Group>

            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Level</Form.Label>
                        <Form.Control
                            type="number"
                            isInvalid={!!errors.level}
                            {...register("level", {
                                required: "Level is Required",
                                min: { value: 1, message: "Min level is 1" },
                                max: { value: 20, message: "Max level is 20" },
                                valueAsNumber: true,
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.level?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label>Armor Class</Form.Label>
                        <Form.Control
                            type="number"
                            isInvalid={!!errors.ac}
                            {...register("ac", {
                                required: "Armor Class is required",
                                min: { value: 10, message: "AC too low" },
                                max: { value: 30, message: "AC too high" },
                                valueAsNumber: true,
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.ac?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                {[
                    "strength",
                    "dexterity",
                    "constitution",
                    "intelligence",
                    "wisdom",
                    "charisma",
                ].map((stat) => (
                    <Col md={2} className="mb-3" key={stat}>
                        <Form.Group>
                            <Form.Label className="text-capitalize">{stat}</Form.Label>
                            <Form.Control
                                type="number"
                                isInvalid={!!errors[stat as keyof FormFields]}
                                {...register(stat as keyof FormFields, {
                                    required: `${stat} is required`,
                                    min: { value: 3, message: "Min 3" },
                                    max: { value: 20, message: "Max 20" },
                                    valueAsNumber: true,
                                })}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors[stat as keyof FormFields]?.message as string}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                ))}
            </Row>


            <Form.Group className="mb-4">
                <Form.Label>Weapons</Form.Label>

                <div className="d-flex flex-wrap gap-3">
                    {ALL_WEAPONS.map((weapon) => (
                        <Form.Check
                            key={weapon}
                            type="checkbox"
                            label={weapon}
                            value={weapon}
                            {...register("weapons", {
                                validate: (v) => v.length > 0 || "Select at least one weapon",
                            })}
                        />
                    ))}
                </div>

                {errors.weapons && (
                    <div className="text-danger mt-1">
                        {errors.weapons.message}
                    </div>
                )}
            </Form.Group>

            {level && characterClass &&
                <Form.Group className="mb-4">
                    {loadingSpells && <Form.Label>Loading spells...</Form.Label>}
            </Form.Group>}

            <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Character"}

            </Button>

        </Form>
    );
};

export default CharCreation;