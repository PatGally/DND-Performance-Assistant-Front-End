import axios from "axios";
import BASE_URL from "./BASE_URL.ts";

export interface CharacterStats {
    cid: string;
    name: string;
    level: number;
    characterClass: string;
    hp: number;
    maxHP: number;
    ac: number;
}

export interface Character {
    stats: CharacterStats;
    weapons?: { name: string }[];
    spells?: { spellname: string }[];
}

export const getCharacters = async (): Promise<Character[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/dashboard/player`);

        // Ensure the response is an array
        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }

        return response.data as Character[];
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        return [];
    }
};




