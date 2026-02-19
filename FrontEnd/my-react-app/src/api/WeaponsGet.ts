import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; //Todo create a file that holds BASE_URL so we don't have change everything we
// todo we move to production instead

export interface Weapon {
    name: string;
    properties: {
        damage: string;
        damageType: string;
        weaponStat: string;
    };
    [key: string]: any;
}

export const WeaponsGet = async (): Promise<Weapon[]> => {
    try {
        const response = await axios.get(`${BASE_URL}/dashboard/weapons`);
        return response.data as Weapon[];
    } catch (err) {
        console.error("Failed to fetch weapons", err);
        return [];
    }
};
