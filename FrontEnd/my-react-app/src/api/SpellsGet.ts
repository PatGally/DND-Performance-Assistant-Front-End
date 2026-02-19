import axios from 'axios';

const BASE_URL = "http://127.0.0.1:8000";

export interface Spell {
    spellname: string;
    classes: string[];
    level: number;
    targeting: any[]; // optional, can type more strictly later
}


export const SpellsGet = async (level: number, classid: string): Promise<Spell[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/dashboard/player/availablespells`, {
            params: {
                classid,
                level
            }
        });
        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }
        console.log("Your fetched data in SpellsGet", response.data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Axios error response:", error.response?.data);
            console.error("Status code:", error.response?.status);
            console.error("Request config:", error.config);
        } else {
            console.error("Unknown error:", error);
        }
        return [];
    }
};
