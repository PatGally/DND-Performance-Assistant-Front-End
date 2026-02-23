import React from "react";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import calculateHP from "../../utils/calculateHP.ts";
import { SpellsGet } from "../../api/SpellsGet.ts";
import { WeaponsGet, type Weapon} from "../../api/WeaponsGet.ts";
import {createCharacter} from "../../api/CharactersPost.ts";
import calcAttributes from "../../utils/calcAttributes.ts";
import calcSpellSlots from "../../utils/calcSpellSlots.ts";

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
    spells: string[];
};



const CharCreation: React.FC = () => {
    const {
        register,
        handleSubmit, watch, resetField, reset,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({
        defaultValues: {
            level: 1,
            ac: 10,
            weapons: [],
            spells: [],
        },
    });
    const level = watch("level");
    const characterClass = watch("characterClass");

    const [spells, setSpells] = useState<any[]>([]); //specify type
    const [loadingSpells, setLoadingSpells] = useState<boolean>(false);

    const [allWeapons, setAllWeapons] = useState<Weapon[]>([]); // specify type
    const [loadingWeapons, setLoadingWeapons] = useState(false);

    useEffect(() => {
        const fetchWeapons = async () => {
            setLoadingWeapons(true);
            const weapons = await WeaponsGet();
            setAllWeapons(weapons);
            setLoadingWeapons(false);
        };
        fetchWeapons();
    }, []);

    useEffect(() => {
        if (!level || !characterClass) return;

        resetField("spells");

        const fetchSpells = async () => {
            try {
                setLoadingSpells(true);

                const result = await SpellsGet(level, characterClass.toLowerCase());

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

        const selectedWeapons = allWeapons
            .filter(w => data.weapons.includes(w.name))
            .flatMap(w => {
                const statArray = w.properties.weaponStat;
                const damageArray = Array.isArray(w.properties.damage)
                    ? w.properties.damage
                    : [w.properties.damage];

                // Pick corresponding weaponStat for each damage option
                const statOptions = Array.isArray(statArray)
                    ? statArray
                    : [statArray];

                // Make sure we have one stat per damage
                return damageArray.map((damage, i) => ({
                    name: w.name + (damageArray.length > 1 ? ` (${i + 1})` : ""), // optional suffix to differentiate
                    properties: {
                        damage,
                        damageType: w.properties.damageType,
                        weaponStat: statOptions[i] || statOptions[0],
                    },
                }));
            });

        const selectedSpells = spells.filter(spell =>
            data.spells.includes(spell.spellname)
        );
        const attributes = calcAttributes(data.level, data.characterClass);
        const spellSlots = calcSpellSlots(data.level, data.characterClass);
        console.log("Even bigger test here ",spellSlots);

        const calculatedHP = calculateHP(data.level, data.characterClass, data.constitution);


        const payload = {
            stats: {
                name: data.name,
                level: data.level.toString(),
                ac: data.ac.toString(),
                hp: calculatedHP.toString(),
                maxhp: calculatedHP.toString(),
                cid: cid,
                position: [0, 0],

                characterClass: data.characterClass.toLowerCase(),
                conImmunities: [],
                activeStatusEffects: [],
                activeConditions: [],

                saveProfs: {
                    STR: "0",
                    DEX: "4",
                    CON: "2",
                    INT: "-1",
                    WIS: "5",
                    CHA: "2"
                },

                spellSlots: spellSlots,

                damImmunes: [],
                damResists: [],
                damVulns: [],

                statArray: {
                    STR: data.strength.toString(),
                    DEX: data.dexterity.toString(),
                    CON: data.constitution.toString(),
                    INT: data.intelligence.toString(),
                    WIS: data.wisdom.toString(),
                    CHA: data.charisma.toString()
                },
            },

            spells: selectedSpells,
            weapons: selectedWeapons,

            ...attributes
        };

        //add correct attribute depending on class - create your own file to
        console.log(selectedWeapons);
        // console.log("Character Payload:", payload);
        console.log(JSON.stringify(payload, null, 2));

        try{
            await createCharacter( payload );
            reset();
            console.log("Form cleared and ready for the next character!");

        } catch (error) {
        console.error("Submission failed, keeping data in form", error);
    }
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
                                // setValueAs: (v) => (v === "" ? 0 : Number(v)),
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

                {loadingWeapons && <div>Loading weapons...</div>}

                {!loadingWeapons && (
                    <div className="d-flex flex-wrap gap-3">
                        {allWeapons.map((weapon) => (
                            <Form.Check
                                key={weapon.name}
                                type="checkbox"
                                label={weapon.name}
                                value={weapon.name}
                                {...register("weapons", {
                                    validate: (v) => v.length > 0 || "Select at least one weapon",
                                })}
                            />
                        ))}
                    </div>
                )}

                {errors.weapons && (
                    <div className="text-danger mt-1">{errors.weapons.message}</div>
                )}
            </Form.Group>

            {level && characterClass &&(
                <Form.Group className="mb-4">
                    <Form.Label>Available Spells</Form.Label>

                    {loadingSpells && <div>Loading spells...</div>}

                    {!loadingSpells && spells.length > 0 && (
                        <div className="d-flex flex-wrap gap-3">
                            {spells.map((spell) => (
                                <Form.Check
                                    key={spell.id}
                                    type="switch"
                                    label={spell.spellname}
                                    value={spell.spellname}
                                    {...register("spells", {
                                        validate: (v) =>
                                            v.length > 0 || "Select at least one spell",
                                    })}
                                />
                            ))}
                        </div>
                    )}

                    {errors.spells && (
                        <div className="text-danger mt-1">
                            {errors.spells.message}
                        </div>
                    )}
                </Form.Group>
            )}

            <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Character"}

            </Button>
        </Form>
    );
};

export default CharCreation;