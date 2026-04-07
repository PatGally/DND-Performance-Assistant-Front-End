import axiosTokenInstance from "./AxiosTokenInstance";
import type {MonsterCreature} from "../types/creature";


export const getMonsters = async (): Promise<MonsterCreature[]> => {
    try {
        const response = await axiosTokenInstance.get(`dashboard/monsters`);

        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }

        return response.data as MonsterCreature[];
    } catch (error) {
        console.error("Failed to fetch monsters:", error);
        return [];
    }
};