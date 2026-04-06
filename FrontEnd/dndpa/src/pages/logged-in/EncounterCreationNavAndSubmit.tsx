import { useState } from "react";
import Container from "react-bootstrap/Container";
import { Form } from "react-bootstrap";
import type { EncounterFormData } from "../../components/Home-Dashboard/CreateEncounter";
import { fetchUUID } from "../../api/UUIDGet.ts";
import { uuidPolyfill } from "../../api/uuidPolyfill.ts";
import { EncounterPost } from "../../api/EncounterPost.ts";
import { normalizePlayer } from "../../utils/normalizePlayer.ts";
import { normalizeMonster } from "../../utils/normalizeMonster";

// Player token imports
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
            return formData.name.trim().length >= 3;

        case "ADD_CHARACTERS":
            return formData.characters.length >= 1;

        case "ADD_MONSTERS":
            return formData.monsters.length >= 1;

        case "ADD_INITIATIVE": {
            const entries = formData.initiative;
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
                                           onSuccess,
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
                initiative: rest.initiative.map(({ key, ...entry }) => entry),
                mapdata,
                completed: false,
            };

            console.log(payload);

            await EncounterPost(payload);
            onSuccess();

        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    return (
        <Container fluid className="p-3 mx-0" style={{backgroundColor: "rgba(15, 24, 40, 0.85)"}}>
            <div className="d-flex gap-1">
                <button
                    className={`btn border-0 ${
                        activePanel === "SET_ENCOUNTERNAME" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => setActivePanel("SET_ENCOUNTERNAME")}
                    type="button"
                >
                    Name
                </button>

                <button
                    className={`btn border-0 ${
                        activePanel === "ADD_CHARACTERS" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => isUnlocked("ADD_CHARACTERS") && setActivePanel("ADD_CHARACTERS")}
                    disabled={!isUnlocked("ADD_CHARACTERS")}
                    type="button"
                >
                    Add Players
                </button>

                <button
                    className={`btn border-0 ${
                        activePanel === "ADD_MONSTERS" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => isUnlocked("ADD_MONSTERS") && setActivePanel("ADD_MONSTERS")}
                    disabled={!isUnlocked("ADD_MONSTERS")}
                    type="button"
                >
                    Add Monsters
                </button>

                <button
                    className={`btn border-0 ${
                        activePanel === "ADD_INITIATIVE" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => isUnlocked("ADD_INITIATIVE") && setActivePanel("ADD_INITIATIVE")}
                    disabled={!isUnlocked("ADD_INITIATIVE")}
                    type="button"
                >
                    Initiative
                </button>

                <button
                    className={`btn border-0 ${
                        activePanel === "ADD_MAPLINK" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => isUnlocked("ADD_MAPLINK") && setActivePanel("ADD_MAPLINK")}
                    disabled={!isUnlocked("ADD_MAPLINK")}
                    type="button"
                >
                    Map Link
                </button>

                <button
                    className={`btn border-0 ${
                        activePanel === "ADD_GRIDSIZE" ? "btn-secondary" : "btn-dark"
                    }`}
                    onClick={() => isUnlocked("ADD_GRIDSIZE") && setActivePanel("ADD_GRIDSIZE")}
                    disabled={!isUnlocked("ADD_GRIDSIZE")}
                    type="button"
                >
                    Grid Size
                </button>

                <div className="d-flex gap-2 ms-auto">
                    <button
                        className="btn btn-dark border-0"
                        onClick={goPrev}
                        disabled={currentIndex === 0 || isSubmitting}
                        type="button"
                    >
                        Back
                    </button>

                    <Form onSubmit={handleSubmit}>
                        {isLastPanel ? (
                            <button
                                className="btn btn-success border-0"
                                type="submit"
                                disabled={!isCurrentValid || isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                        ) : (
                            <button
                                className="btn btn-dark border-0"
                                onClick={goNext}
                                disabled={!isCurrentValid || isSubmitting}
                                type="button"
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