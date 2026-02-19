import axios from "axios";

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
    maplink: string;
    completed: boolean;
    monsters: Monster[];
    players: Player[];
}

const BASE_URL = "http://127.0.0.1:8000";

export const getEncounters = async (): Promise<Encounter[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/encounters`);
        // Ensure the backend returned an array
        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }
        return response.data;
    } catch (error) {
        console.error("Failed to fetch encounters:", error);
        // Return an empty array to prevent runtime errors in the component
        return [];
    }
};
