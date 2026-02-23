import axios from "axios";
import BASE_URL from "./BASE_URL.ts";

export interface Monster {
    stats: { name: string };
}

export interface Player {
    stats: { name: string };
}

export interface Encounter {
    name: string;
    date: string;
    eid: string;
    completed: boolean;
}


export const getEncounters = async (): Promise<Encounter[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/dashboard/encounters`);
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



