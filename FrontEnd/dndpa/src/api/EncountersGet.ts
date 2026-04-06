import axiosTokenInstance from "./AxiosTokenInstance.ts";
import {type EncounterDash} from "../types/encounter.ts";


export const getEncounters = async (): Promise<EncounterDash[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/encounters`);
        // Ensure the backend returned an array
        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }
        return response.data;
    } catch (error) {
        console.error("Failed to fetch encounters:", error);
        return [];
    }
};