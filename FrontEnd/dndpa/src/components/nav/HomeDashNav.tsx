import { CloudArrowDown, PersonGear, QuestionSquare, Archive, Journals, BarChart, House, Bug } from 'react-bootstrap-icons';
import Dock from '../Information/Dock.tsx';

type ActivePanel =
    | 'LANDING_PAGE'
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'CREATE_CHARACTER'
    | 'CREATE_ENCOUNTER'
    | 'HOW_TO_USE'
    | 'SURVEY'
    | 'BUG_REPORT';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};



function HomeDashNav({ setActivePage }: NavigationSignedInProps) {
    const items = [
        { icon: <House size={18} />, label: 'Home', onClick: () => setActivePage('LANDING_PAGE') },
        { icon: <Archive size={18} />, label: 'Archive', onClick: () => setActivePage('SAVED_ENCOUNTERS') },
        { icon: <Journals size={18} />, label: 'Create Encounter', onClick: () => setActivePage('CREATE_ENCOUNTER') },
        { icon: <CloudArrowDown size={18} />, label: 'Load Players', onClick: () => setActivePage('LOAD_CHARACTERS') },
        { icon: <PersonGear size={18} />, label: 'Create Player', onClick: () => setActivePage('CREATE_CHARACTER') },
        { icon: <QuestionSquare size={18} />, label: 'User Guide', onClick: () => setActivePage('HOW_TO_USE')},
        { icon: <BarChart size={18} />, label: 'Survey', onClick: () => setActivePage('SURVEY') },
        { icon: <Bug size={18} />, label: 'Bug Report', onClick: () => setActivePage('BUG_REPORT') },
    ];

    return(
        <Dock
            items={items}
            panelHeight={50}
            baseItemSize={45}
            magnification={58}
        />
    )
}

export default HomeDashNav;