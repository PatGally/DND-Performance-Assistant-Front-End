import axiosTokenInstance from "./AxiosTokenInstance.ts";
import type {MonsterCreature, PlayerCreature} from "./CreatureGet.ts";
import type {InitiativeEntry} from "../pages/logged-in/EncounterSimulation.tsx";

export interface Monster {
    stats: { name: string };
}

export interface Player {
    stats: { name: string };
}

interface Encounter {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
    initiative : InitiativeEntry[];
    players : PlayerCreature[];
    monsters: MonsterCreature[];
}

export const getEncounter = async (eid: string): Promise<Encounter | null> => {
    try {
        const response = await axiosTokenInstance.get(`/encounter/${eid}/state`);
        console.log(response.data);

        if (!response.data || typeof response.data !== "object") {
            console.error("Unexpected response format:", response.data);
            return null;
        }

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch encounter ${eid}:`, error);
        return null;
    }
};