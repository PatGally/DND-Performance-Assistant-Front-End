import { useState } from "react";
import Container from "react-bootstrap/Container";
import { Form } from "react-bootstrap";
import type { EncounterFormData } from "../../components/Home-Dashboard/CreateEncounter";
import { fetchUUID } from "../../api/UUIDGet.ts";
import { uuidPolyfill } from "../../api/uuidPolyfill.ts";
import { EncounterPost } from "../../api/EncounterPost.ts";
import { normalizePlayer } from "../../utils/normalizePlayer.ts";
import { normalizeMonster } from "../../utils/normalizeMonster";
import '../../css/EncounterCreationNav.css'

import {
    ArtificerToken,
    BarbarianToken,
    BardToken,
    ClericToken,
    DruidToken,
    FighterToken,
    MonkToken,
    PaladinToken,
    RangerToken,
    RogueToken,
    SorcererToken,
    WarlockToken,
    WizardToken,
    AberrationToken,
    BeastToken,
    CelestialToken,
    ConstructToken,
    DragonToken,
    ElementalToken,
    FeyToken,
    FiendToken,
    GiantToken,
    HumanoidToken,
    MonstrosityToken,
    OozeToken,
    PlantToken,
    UndeadToken,
} from "../../assets/importTokens.ts";

uuidPolyfill();

export type ActivePanel =
    | "SET_ENCOUNTERNAME"
    | "ADD_CHARACTERS"
    | "ADD_MONSTERS"
    | "ADD_INITIATIVE"
    | "ADD_MAPLINK"
    | "ADD_GRIDSIZE";

type EncounterCreationNavProps = {
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
    formData: EncounterFormData;
    onSuccess: () => void;
    encounterLimitReached: boolean;
};

const panelOrder: ActivePanel[] = [
    "SET_ENCOUNTERNAME",
    "ADD_CHARACTERS",
    "ADD_MONSTERS",
    "ADD_INITIATIVE",
    "ADD_MAPLINK",
    "ADD_GRIDSIZE",
];
const playerTokenMap: Record<string, string> = {
    artificer: ArtificerToken,
    barbarian: BarbarianToken,
    bard: BardToken,
    cleric: ClericToken,
    druid: DruidToken,
    fighter: FighterToken,
    monk: MonkToken,
    paladin: PaladinToken,
    ranger: RangerToken,
    rogue: RogueToken,
    sorcerer: SorcererToken,
    warlock: WarlockToken,
    wizard: WizardToken,
};
const monsterTokenMap: Record<string, string> = {
    aberration: AberrationToken,
    beast: BeastToken,
    celestial: CelestialToken,
    construct: ConstructToken,
    dragon: DragonToken,
    elemental: ElementalToken,
    fey: FeyToken,
    fiend: FiendToken,
    giant: GiantToken,
    humanoid: HumanoidToken,
    monstrosity: MonstrosityToken,
    ooze: OozeToken,
    plant: PlantToken,
    undead: UndeadToken,
};

const normalizeKey = (value: string | undefined | null): string =>
    (value ?? "").trim().toLowerCase();

const getPlayerTokenImage = (characterClass: string | undefined): string => {
    return playerTokenMap[normalizeKey(characterClass)] ?? HumanoidToken;
};

const getMonsterTokenImage = (creatureType: string | undefined): string => {
    return monsterTokenMap[normalizeKey(creatureType)] ?? MonstrosityToken;
};

function isPanelValid(panel: ActivePanel, formData: EncounterFormData): boolean {
    switch (panel) {
        case "SET_ENCOUNTERNAME":
            const nameEntry = formData.name.trim();
            if (nameEntry.length >= 3 && nameEntry.length <= 20) {
                return true
            }
            else return false
        case "ADD_CHARACTERS":
            return formData.characters.length >= 1;

        case "ADD_MONSTERS":
            return formData.monsters.length >= 1;

        case "ADD_INITIATIVE": {
            const entries = formData.initiative.filter((e) => e.turnType !== "lairAction");
            const totalParticipants = formData.characters.length + formData.monsters.length;
            if (entries.length !== totalParticipants) return false;
            if (entries.some((e) => e.iValue <= 0)) return false;
            return true;
        }

        case "ADD_MAPLINK":
            return formData.maplink.trim().length > 0;

        case "ADD_GRIDSIZE":
            return formData.gridSize.rows >= 10 && formData.gridSize.cols >= 10;

        default:
            return false;
    }
}

function EncounterCreationNavAndSubmit({
                                           activePanel,
                                           setActivePanel,
                                           formData,
                                           onSuccess, encounterLimitReached
                                       }: EncounterCreationNavProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentIndex = panelOrder.indexOf(activePanel);
    const isCurrentValid = isPanelValid(activePanel, formData);
    const isLastPanel = currentIndex === panelOrder.length - 1;

    const isUnlocked = (panel: ActivePanel): boolean => {
        const panelIndex = panelOrder.indexOf(panel);
        return panelOrder.slice(0, panelIndex).every((p) => isPanelValid(p, formData));
    };

    const goNext = () => {
        if (!isLastPanel && isCurrentValid) {
            setActivePanel(panelOrder[currentIndex + 1]);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setActivePanel(panelOrder[currentIndex - 1]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (encounterLimitReached){
            console.log("Limit Test for Encounters ",encounterLimitReached);
            return
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { characters, monsters, maplink, gridSize, ...rest } = formData;

        let eid: string | undefined;
        try {
            eid = await fetchUUID();
        } catch (error) {
            console.error(error);
        }

        if (!eid) {
            console.error("No EID generated");
            setIsSubmitting(false);
            return;
        }

        try {
            const normalizedPlayers = characters.map(normalizePlayer);
            const normalizedMonsters = await Promise.all(monsters.map(normalizeMonster));

            const creatureTokens = [
                ...normalizedPlayers.map((p) => ({
                    cid: p.stats.cid,
                    token_image: getPlayerTokenImage(p.stats.characterClass),
                })),
                ...normalizedMonsters.map((m) => ({
                    cid: m.cid,
                    token_image: getMonsterTokenImage(m.creatureType),
                })),
            ];

            const mapdata = {
                map: {
                    mapLink: maplink,
                    sourceType: "url",
                    naturalSizePx: { w: 0, h: 0 },
                    originPx: { x: 0, y: 0 },
                },
                grid: {
                    cellBounds: { cols: gridSize.cols, rows: gridSize.rows },
                    cellSizePx: 0,
                },
                layers: {
                    creatureTokens,
                    aoeTokens: [] as never[],
                },
            };

            const payload = {
                ...rest,
                eid,
                date: new Date().toISOString(), //TODO fix date so people see a regular x/xx/xxxx
                players: normalizedPlayers,
                monsters: normalizedMonsters,
                initiative: rest.initiative.map(({key, ...entry }) => entry),
                mapdata,
                completed: false,
            };

            await EncounterPost(payload);
            onSuccess();

        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    const STEP_BUTTONS = [
        { panel: 'SET_ENCOUNTERNAME', label: 'Name' },
        { panel: 'ADD_CHARACTERS',    label: 'Add Players' },
        { panel: 'ADD_MONSTERS',      label: 'Add Monsters' },
        { panel: 'ADD_INITIATIVE',    label: 'Initiative' },
        { panel: 'ADD_MAPLINK',       label: 'Map Link' },
        { panel: 'ADD_GRIDSIZE',      label: 'Grid Size' },
    ] as const;

    return (
        <Container fluid className="pa-ecnav p-3 mx-0">
            <div className="d-flex gap-2 flex-wrap">
                {STEP_BUTTONS.map(({ panel, label }) => {
                    const unlocked = panel === 'SET_ENCOUNTERNAME' || isUnlocked(panel);
                    const isActive = activePanel === panel;

                    return (
                        <button
                            key={panel}
                            type="button"
                            className={`btn pa-ecnav__step ${isActive ? 'pa-ecnav__step--active' : ''}`}
                            onClick={() => unlocked && setActivePanel(panel)}
                            disabled={!unlocked}
                        >
                            {label}
                        </button>
                    );
                })}

                {/* Back / Next / Submit — right-aligned */}
                <div className="d-flex gap-2 ms-auto">
                    <button
                        type="button"
                        className="btn pa-ecnav__nav-btn"
                        onClick={goPrev}
                        disabled={currentIndex === 0 || isSubmitting}
                    >
                        Back
                    </button>

                    <Form onSubmit={handleSubmit}>
                        {isLastPanel ? (
                            <button
                                type="submit"
                                className="btn pa-ecnav__nav-btn pa-ecnav__nav-btn--submit"
                                disabled={!isCurrentValid || isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn pa-ecnav__nav-btn pa-ecnav__nav-btn--next"
                                onClick={goNext}
                                disabled={!isCurrentValid || isSubmitting}
                            >
                                Next
                            </button>
                        )}
                    </Form>
                </div>
            </div>
        </Container>
    );
}

export default EncounterCreationNavAndSubmit;