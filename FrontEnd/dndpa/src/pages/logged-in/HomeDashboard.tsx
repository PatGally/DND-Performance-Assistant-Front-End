import HomeDashNav from '../../components/nav/HomeDashNav';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter";
import EncounterView from "../../components/Home-Dashboard/EncounterView";
import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";
import UserMenu from "./UserMenu.tsx";
import { useEffect, useState } from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation";
import { getMonsters} from "../../api/MonstersGet";
import type {MonsterCreature} from "../../types/creature";
import { getEncounters } from "../../api/EncountersGet";
import creaturePacketGet from "../../api/CreaturePacketGet";
import type { EncounterWithPacket, EncounterDash } from "../../types/encounter";
import {deleteEncounter} from "../../api/DeleteEncounter"
import {deletePlayer} from "../../api/DeletePlayer";
import HowToUse from "../../components/Home-Dashboard/HowToUse";
import Survey from "../../components/Home-Dashboard/Survey"

import PixelBlast from '../../css/PixelBlast';

//TODO remove creaturePacket - since you most likely will not display how many creatures are in an encounter
// for encounter view component - it's unnecessary and may be slowing down loading time for image on encounter

//TODO add username to account when they pull the drop down. They should see that
function HomeDashboard() {
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');
    const [monsters, setMonsters] = useState<MonsterCreature[]>([]);
    const [encounters, setEncounters] = useState<EncounterWithPacket[]>([]);
    const [loadingEncounter, setLoadingEncounter] = useState<boolean>(false);

    useEffect(() => {
        const fetchMonsters = async () => {
            const data = await getMonsters();
            setMonsters(data);
        };
        fetchMonsters();
    }, []);

    const handleDeleteEncounter = async (eid: string) => {
        try {
            await deleteEncounter(eid);
            await fetchEncounters();
        } catch (err) {
            console.error("Error deleting encounter", err);
        }
    };

    const onDeletePlayer = async (cid: string) => {
        try{
            await deletePlayer(cid);
        }catch(err){
            console.error("Error deleting player", err);
        }
    }

    const fetchEncounters = async () => {
        setLoadingEncounter(true);
        try {
            const data: EncounterDash[] = await getEncounters();

            const encountersWithPackets: EncounterWithPacket[] = data.map((enc) => ({
                ...enc,
                packet: undefined,
            }));
            setEncounters(encountersWithPackets);

            for (const encounterItem of encountersWithPackets) {
                try {
                    const packet = await creaturePacketGet(encounterItem.eid);
                    setEncounters((prev) =>
                        prev.map((e) =>
                            e.eid === encounterItem.eid ? { ...e, packet } : e
                        )
                    );
                } catch (err) {
                    console.error(`Error fetching packet for ${encounterItem.eid}`, err);
                }
            }
        } catch (err) {
            console.error("Error fetching encounters", err);
        } finally {
            setLoadingEncounter(false);
        }
    };

    useEffect(() => {
        fetchEncounters();
    }, []);

    const handleEncounterCreated = async() => {
        await fetchEncounters();
        setActivePage("SAVED_ENCOUNTERS");
    };

    return (
        // <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        //     <PixelBlast
        //         variant="square"
        //         pixelSize={3}
        //         color="#ff4013"
        //         patternScale={2}
        //         patternDensity={1}
        //         pixelSizeJitter={0}
        //         enableRipples
        //         rippleSpeed={0.4}
        //         rippleThickness={0.12}
        //         rippleIntensityScale={1.5}
        //         liquid={false}
        //         liquidStrength={0.12}
        //         liquidRadius={1.2}
        //         liquidWobbleSpeed={5}
        //         speed={0.5}
        //         edgeFade={0.25}
        //         transparent
        //     />
        //     <div
        //         className="text-white px-3 d-flex align-items-center justify-content-between"
        //         style={{ flexShrink: 0, height: '56px', zIndex: 1000, backgroundColor: "rgba(15, 24, 40, 0.85)", }}
        //     >
        //         <h3 className="mb-0">dndpa</h3>
        //         <UserMenu />
        //     </div>
        //
        //     <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        //
        //         <div
        //             className="p-2"
        //             style={{ width: '70px',
        //                 backgroundColor: "rgba(15, 24, 40, 0.85)"}}
        //         >
        //             <HomeDashNav setActivePage={setActivePage} />
        //         </div>
        //
        //         <div style={{ flex: 1, overflowY: 'auto' }}>
        //             {activePage === 'SAVED_ENCOUNTERS' && <EncounterView encounters={encounters} loadingEncounter={loadingEncounter} onDeleteEncounter={handleDeleteEncounter} />}
        //             {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter monsters={monsters} onEncounterCreated={handleEncounterCreated} />}
        //             {activePage === 'LOAD_CHARACTERS' && <LoadCharacter onDeletePlayer={onDeletePlayer} />}
        //             {activePage === 'CREATE_CHARACTER' && <CharCreation />}
        //             {activePage === 'HOW_TO_USE' && <HowToUse />}
        //             {activePage === 'SURVEY' && <Survey />}
        //         </div>
        //
        //     </div>
        // </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh',
            overflow: 'hidden', background: "#1A0703" }}>

            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <PixelBlast
                    variant="square"
                    pixelSize={3}
                    color="#ff4013"
                    patternScale={3}
                    patternDensity={1}
                    pixelSizeJitter={0}
                    enableRipples
                    rippleSpeed={0.3}
                    rippleThickness={0.12}
                    rippleIntensityScale={1.5}
                    liquid={false}
                    liquidStrength={0.12}
                    liquidRadius={1.2}
                    liquidWobbleSpeed={5}
                    speed={0.5}
                    edgeFade={0.25}
                    transparent
                />
            </div>

            <div
                className="text-white px-3 d-flex align-items-center justify-content-between"
                style={{ flexShrink: 0, height: '56px', zIndex: 1000, backgroundColor: "rgba(15, 24, 40, 0.85)" }}
            >
                <h3 className="mb-0">dndpa</h3>
                <UserMenu />
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div
                    className="p-2"
                    style={{ width: '70px', backgroundColor: "rgba(15, 24, 40, 0.85)" }}
                >
                    <HomeDashNav setActivePage={setActivePage} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activePage === 'SAVED_ENCOUNTERS' && <EncounterView encounters={encounters} loadingEncounter={loadingEncounter} onDeleteEncounter={handleDeleteEncounter} />}
                    {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter monsters={monsters} onEncounterCreated={handleEncounterCreated} />}
                    {activePage === 'LOAD_CHARACTERS' && <LoadCharacter onDeletePlayer={onDeletePlayer} />}
                    {activePage === 'CREATE_CHARACTER' && <CharCreation />}
                    {activePage === 'HOW_TO_USE' && <HowToUse />}
                    {activePage === 'SURVEY' && <Survey />}
                </div>
            </div>
        </div>
    );
}

export default HomeDashboard;