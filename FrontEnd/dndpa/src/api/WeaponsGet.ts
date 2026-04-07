import axiosTokenInstance from "./AxiosTokenInstance.ts";
import type {WeaponAction} from "../types/action.ts";

// export interface Weapon {
//     name: string;
//     properties: {
//         damage: string;
//         damageType: string;
//         weaponStat: string;
//     };
//     [key: string]: any;
// }

export const WeaponsGet = async (): Promise<WeaponAction[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/weapons`);
        return response.data as WeaponAction[];
    } catch (err) {
        console.error("Failed to fetch weapons", err);
        return [];
    }
};
