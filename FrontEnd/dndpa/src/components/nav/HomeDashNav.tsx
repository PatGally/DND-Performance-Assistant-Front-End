import { CloudArrowDown, PersonGear, QuestionSquare, Archive, Journals } from 'react-bootstrap-icons';
import Dock from '../../css/Dock';

type ActivePanel =
    | 'SAVED_ENCOUNTERS'
    | 'LOAD_CHARACTERS'
    | 'CREATE_CHARACTER'
    | 'CREATE_ENCOUNTER'
    | 'HOW_TO_USE';

type NavigationSignedInProps = {
    setActivePage: (page: ActivePanel) => void;
};



function HomeDashNav({ setActivePage }: NavigationSignedInProps) {
    const items = [
        { icon: <Archive size={18} />, label: 'Archive', onClick: () => setActivePage('SAVED_ENCOUNTERS') },
        { icon: <Journals size={18} />, label: 'Create Encounter', onClick: () => setActivePage('CREATE_ENCOUNTER') },
        { icon: <CloudArrowDown size={18} />, label: 'Load Players', onClick: () => setActivePage('LOAD_CHARACTERS') },
        { icon: <PersonGear size={18} />, label: 'Create Player', onClick: () => setActivePage('CREATE_CHARACTER') },
        { icon: <QuestionSquare size={18} />, label: 'How To', onClick: () => setActivePage('HOW_TO_USE')},
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