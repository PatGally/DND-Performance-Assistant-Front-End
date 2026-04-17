import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Form, Button, Row, Col } from "react-bootstrap";
import calculateHP from "../../utils/calculateHP.ts";
import { SpellsGet } from "../../api/SpellsGet.ts";
import {WeaponsGet } from "../../api/WeaponsGet.ts";
import {type WeaponAction} from "../../types/action.ts";
import {createCharacter} from "../../api/CharactersPost.ts";
import calcAttributes from "../../utils/calcAttributes.ts";
import calcSpellSlots from "../../utils/calcSpellSlots.ts";
import {fetchUUID} from "../../api/UUIDGet.ts"
import { uuidPolyfill } from '../../api/uuidPolyfill.ts';
import Container from "react-bootstrap/Container";
import '../../css/CharCreation.css';

uuidPolyfill();

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

type Props = {
    onCharacterCreated: () => void;
};

function CharCreation({onCharacterCreated}: Props) {
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

    const [allWeapons, setAllWeapons] = useState<WeaponAction[]>([]);
    const [loadingWeapons, setLoadingWeapons] = useState(false);

    const [loadingCid, loadingSetCid] = useState<boolean>(false);

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
        if (!data.characterClass || !data.level || !data.constitution) {
            return;
        }

        let characterId;

        try {
            loadingSetCid(true);
            characterId = await fetchUUID();
        } catch (err) {
            console.error("Failed to fetch CID", err);
            return;
        } finally {
            loadingSetCid(false);
        }


        const selectedWeapons = allWeapons
            .filter(w => data.weapons.includes(w.name))
            .flatMap(w => {
                const damageArray = Array.isArray(w.properties.damage)
                    ? w.properties.damage
                    : [w.properties.damage];

                if (damageArray.length > 1) {
                    return [
                        `${w.name} ONEHAND`,
                        `${w.name} TWOHAND`
                    ];
                }

                return [w.name];
            });

        const attributes = calcAttributes(data.level, data.characterClass);
        const spellSlots = calcSpellSlots(data.level, data.characterClass);
        const calculatedHP = calculateHP(data.level, data.characterClass, data.constitution);


        const payload = {
            stats: {
                name: data.name,
                level: data.level.toString(),
                ac: data.ac.toString(),
                hp: calculatedHP.toString(),
                maxhp: calculatedHP.toString(),
                cid: characterId,
                position: [[0, 0]],

                characterClass: data.characterClass.toLowerCase(),
                conImmunes: [],
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

            spells: data.spells,
            weapons: selectedWeapons,

            ...attributes
        };

        try{
            await createCharacter( payload );
            reset();
            onCharacterCreated();
        } catch (error) {
        console.error("Submission failed, keeping data in form", error);
    }
    };

    const ABILITY_STATS = [
        'strength',
        'dexterity',
        'constitution',
        'intelligence',
        'wisdom',
        'charisma',
    ] as const;

    const CHARACTER_CLASSES = [
        'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
        'Monk', 'Paladin', 'Ranger', 'Rogue',
        'Sorcerer', 'Warlock', 'Wizard',
    ];

    return (
        <Container fluid className="pa-char-create">
            <Form onSubmit={handleSubmit(onSubmit)} className="pa-char-create__form">

                <div className="pa-char-create__header">
                    <h2 className="pa-char-create__title">Create Your Player's Here</h2>
                </div>

                <section className="pa-char-create__section">
                    <h3 className="pa-char-create__section-title">Identity</h3>

                    <Form.Group className="mb-3">
                        <Form.Label className="pa-char-create__label">Player Name</Form.Label>
                        <Form.Control
                            type="text"
                            className="pa-char-create__input"
                            isInvalid={!!errors.name}
                            {...register('name', {
                                required: 'Player name is required',
                                minLength: { value: 2, message: 'Name too short' },
                            })}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.name?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="pa-char-create__label">Class</Form.Label>
                        <Form.Select
                            className="pa-char-create__input"
                            isInvalid={!!errors.characterClass}
                            {...register('characterClass', { required: 'Class is required' })}
                        >
                            <option value="">Select Class</option>
                            {CHARACTER_CLASSES.map((cls) => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.characterClass?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                </section>

                <section className="pa-char-create__section">
                    <h3 className="pa-char-create__section-title">Core Stats</h3>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="pa-char-create__label">Level</Form.Label>
                                <Form.Control
                                    type="number"
                                    className="pa-char-create__input"
                                    isInvalid={!!errors.level}
                                    {...register('level', {
                                        required: 'Level is Required',
                                        min: { value: 1, message: 'Min level is 1' },
                                        max: { value: 20, message: 'Max level is 20' },
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
                                <Form.Label className="pa-char-create__label">Armor Class</Form.Label>
                                <Form.Control
                                    type="number"
                                    className="pa-char-create__input"
                                    isInvalid={!!errors.ac}
                                    {...register('ac', {
                                        required: 'Armor Class is required',
                                        min: { value: 10, message: 'AC too low' },
                                        max: { value: 30, message: 'AC too high' },
                                        valueAsNumber: true,
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.ac?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </section>

                <section className="pa-char-create__section">
                    <h3 className="pa-char-create__section-title">Ability Scores</h3>
                    <Row>
                        {ABILITY_STATS.map((stat) => (
                            <Col md={2} className="mb-3" key={stat}>
                                <Form.Group className="pa-char-create__stat">
                                    <Form.Label className="pa-char-create__label text-capitalize">
                                        {stat}
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        className="pa-char-create__input pa-char-create__input--stat"
                                        isInvalid={!!errors[stat as keyof FormFields]}
                                        {...register(stat as keyof FormFields, {
                                            required: `${stat} is required`,
                                            min: { value: 3, message: 'Min 3' },
                                            max: { value: 20, message: 'Max 20' },
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
                </section>

                <section className="pa-char-create__section">
                    <h3 className="pa-char-create__section-title">Equipment</h3>

                    <Form.Group className="mb-4">
                        <Form.Label className="pa-char-create__label">Weapons</Form.Label>

                        {loadingWeapons && (
                            <div className="pa-char-create__loading">Loading weapons...</div>
                        )}

                        {!loadingWeapons && (
                            <div className="pa-char-create__options d-flex flex-wrap gap-3">
                                {allWeapons.map((weapon) => (
                                    <Form.Check
                                        key={weapon.name}
                                        type="checkbox"
                                        label={weapon.name}
                                        value={weapon.name}
                                        className="pa-char-create__check"
                                        {...register('weapons', {
                                            validate: (v) => v.length > 0 || 'Select at least one weapon',
                                        })}
                                    />
                                ))}
                            </div>
                        )}

                        {errors.weapons && (
                            <div className="pa-char-create__error mt-1">
                                {errors.weapons.message}
                            </div>
                        )}
                    </Form.Group>
                </section>

                {level && characterClass && (
                    <section className="pa-char-create__section">
                        <h3 className="pa-char-create__section-title">Spells</h3>

                        <Form.Group className="mb-4">
                            <Form.Label className="pa-char-create__label">Available Spells</Form.Label>

                            {loadingSpells && (
                                <div className="pa-char-create__loading">Loading spells...</div>
                            )}

                            {!loadingSpells && spells.length > 0 && (
                                <div className="pa-char-create__options d-flex flex-wrap gap-3">
                                    {spells.map((spell) => (
                                        <Form.Check
                                            key={spell.id}
                                            type="switch"
                                            label={spell.spellname}
                                            value={spell.spellname}
                                            className="pa-char-create__check pa-char-create__check--switch"
                                            {...register('spells', {
                                                validate: (v) => v.length > 0 || 'Select at least one spell',
                                            })}
                                        />
                                    ))}
                                </div>
                            )}

                            {errors.spells && (
                                <div className="pa-char-create__error mt-1">
                                    {errors.spells.message}
                                </div>
                            )}
                        </Form.Group>
                    </section>
                )}

                <div className="pa-char-create__actions">
                    <Button
                        type="submit"
                        className="pa-char-create__submit"
                        disabled={isSubmitting || loadingCid}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Character'}
                    </Button>
                </div>
            </Form>
        </Container>

    );
};

export default CharCreation;