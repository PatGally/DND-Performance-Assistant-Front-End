import axiosTokenInstance from "./AxiosTokenInstance.ts";
import {type CharacterPayload} from "../types/creature.ts";

export const getCharacters = async (): Promise<CharacterPayload[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/players`);

        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }

        return response.data as CharacterPayload[];
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        return [];
    }
};




