import axiosTokenInstance from "./AxiosTokenInstance.ts";

export interface CharacterStats {
    cid: string;
    name: string;
    level: string;
    characterClass: string;
    hp: string;
    maxhp: string;
    ac: string;
    position: number[];
    statArray: Record<string, string>;
    saveProfs: Record<string, string>;
    spellSlots: string[][];
    conImmunes: string[];
    damImmunes: string[];
    damResists: string[];
    damVulns: string[];
    activeStatusEffects: string[];
    activeConditions: string[];
}

export interface Character {
    stats: CharacterStats;
    weapons?: string[];
    spells?: string[];
}

export const getCharacters = async (): Promise<Character[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/players`);

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




