import Container from "react-bootstrap/Container";
import type { EncounterFormData } from "../../components/Home-Dashboard/CreateEncounter";
import { Form } from "react-bootstrap";
import {fetchUUID} from "../../api/UUIDGet.ts"
import { uuidPolyfill } from '../../api/uuidPolyfill.ts';
import {EncounterPost} from '../../api/EncounterPost.ts'
import {normalizePlayer} from "../../utils/normalizePlayer.ts";
import { normalizeMonster } from '../../utils/normalizeMonster';
uuidPolyfill();

export type ActivePanel =
    | 'SET_ENCOUNTERNAME'
    | 'ADD_CHARACTERS'
    | 'ADD_MONSTERS'
    | 'ADD_INITIATIVE'
    | 'ADD_MAPLINK'
    | 'ADD_GRIDSIZE';

type EncounterCreationNavProps = {
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
    formData: EncounterFormData;
    onSuccess: () => void; // ← added
};

const panelOrder: ActivePanel[] = [
    'SET_ENCOUNTERNAME',
    'ADD_CHARACTERS',
    'ADD_MONSTERS',
    'ADD_INITIATIVE',
    'ADD_MAPLINK',
    'ADD_GRIDSIZE',
];

function isPanelValid(panel: ActivePanel, formData: EncounterFormData): boolean {
    switch (panel) {
        case 'SET_ENCOUNTERNAME':
            return formData.name.trim().length >= 3;
        case 'ADD_CHARACTERS':
            return formData.characters.length >= 1;
        case 'ADD_MONSTERS':
            return formData.monsters.length >= 1;
        case 'ADD_INITIATIVE': {
            const entries = formData.initiative;
            const totalParticipants = formData.characters.length + formData.monsters.length;
            if (entries.length !== totalParticipants) return false;
            if (entries.some((e) => e.iValue <= 0)) return false;
            return true;
        }
        case 'ADD_MAPLINK':
            return formData.maplink.trim().length > 0;
        case 'ADD_GRIDSIZE':
            return formData.gridSize.rows >= 10 && formData.gridSize.cols >= 10;
        default:
            return false;
    }
}

function EncounterCreationNavAndSubmit({ activePanel, setActivePanel, formData, onSuccess }: EncounterCreationNavProps) {
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
        const { characters, monsters, ...rest } = formData;
        let eid;
        try {
            eid = await fetchUUID();
        } catch (error) {
            console.error(error);
        }
        if (!eid) {
            console.error("No EID generated");
            return;
        }
        const payload = {
            ...rest,
            eid,
            date: new Date().toISOString(),
            players: characters.map(normalizePlayer),
            monsters: monsters.map(normalizeMonster),
            initiative: rest.initiative.map(({ key, ...entry }) => entry),
            completed: false
        };

        try {
            await EncounterPost(payload);
            onSuccess(); // ← fires instead of navigate, HomeDashboard re-fetches
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Container fluid className="p-3 sticky-top bg-dark mx-0">
            <div className="d-flex gap-2">
                <button
                    className={`btn border-0 ${activePanel === 'SET_ENCOUNTERNAME' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => setActivePanel('SET_ENCOUNTERNAME')}
                >
                    Name
                </button>
                <button
                    className={`btn border-0 ${activePanel === 'ADD_CHARACTERS' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => isUnlocked('ADD_CHARACTERS') && setActivePanel('ADD_CHARACTERS')}
                    disabled={!isUnlocked('ADD_CHARACTERS')}
                >
                    Add Players
                </button>
                <button
                    className={`btn border-0 ${activePanel === 'ADD_MONSTERS' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => isUnlocked('ADD_MONSTERS') && setActivePanel('ADD_MONSTERS')}
                    disabled={!isUnlocked('ADD_MONSTERS')}
                >
                    Add Monsters
                </button>
                <button
                    className={`btn border-0 ${activePanel === 'ADD_INITIATIVE' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => isUnlocked('ADD_INITIATIVE') && setActivePanel('ADD_INITIATIVE')}
                    disabled={!isUnlocked('ADD_INITIATIVE')}
                >
                    Initiative
                </button>
                <button
                    className={`btn border-0 ${activePanel === 'ADD_MAPLINK' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => isUnlocked('ADD_MAPLINK') && setActivePanel('ADD_MAPLINK')}
                    disabled={!isUnlocked('ADD_MAPLINK')}
                >
                    Map Link
                </button>
                <button
                    className={`btn border-0 ${activePanel === 'ADD_GRIDSIZE' ? 'btn-secondary' : 'btn-dark'}`}
                    onClick={() => isUnlocked('ADD_GRIDSIZE') && setActivePanel('ADD_GRIDSIZE')}
                    disabled={!isUnlocked('ADD_GRIDSIZE')}
                >
                    Grid Size
                </button>

                <div className="d-flex gap-2 ms-auto">
                    <button
                        className="btn btn-dark border-0"
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                    >
                        Back
                    </button>
                    <Form onSubmit={handleSubmit}>
                        {isLastPanel ? (
                            <button
                                className="btn btn-success border-0"
                                type="submit"
                                disabled={!isCurrentValid}
                            >
                                Submit
                            </button>
                        ) : (
                            <button
                                className="btn btn-dark border-0"
                                onClick={goNext}
                                disabled={!isCurrentValid}
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