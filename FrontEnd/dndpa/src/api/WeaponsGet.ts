import axiosTokenInstance from "./AxiosTokenInstance";
import type {WeaponAction} from "../types/action";



export const WeaponsGet = async (): Promise<WeaponAction[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/weapons`);
        return response.data as WeaponAction[];
    } catch (err) {
        console.error("Failed to fetch weapons", err);
        return [];
    }
};
