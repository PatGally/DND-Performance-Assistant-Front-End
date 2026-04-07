import axiosTokenInstance from "./AxiosTokenInstance";
import type {EncounterFull} from "../types/encounter";

export const getEncounter = async (eid: string): Promise<EncounterFull | null> => {
    try {
        const response = await axiosTokenInstance.get(`/encounter/${eid}/state`);

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