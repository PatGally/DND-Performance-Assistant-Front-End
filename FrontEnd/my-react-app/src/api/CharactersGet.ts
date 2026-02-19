// import axios from "axios";
//
// const BASE_URL = "http://127.0.0.1:8000";
//
// export const getCharacters = async () => {
//     const response = await axios.get(`${BASE_URL}/dashboard/player`);
//     return response.data;
// };
//

import axios from "axios";

// Define the types
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

const BASE_URL = "http://127.0.0.1:8000";

// Safe API call to get characters
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




