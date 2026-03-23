import axiosTokenInstance from "./AxiosTokenInstance.ts";

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
        const response = await axiosTokenInstance.get(`/dashboard/weapons`);
        return response.data as Weapon[];
    } catch (err) {
        console.error("Failed to fetch weapons", err);
        return [];
    }
};
