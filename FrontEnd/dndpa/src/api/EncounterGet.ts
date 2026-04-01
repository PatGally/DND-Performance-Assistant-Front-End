import axiosTokenInstance from "./AxiosTokenInstance.ts";

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
    mapdata: any;
}

export const getEncounter = async (eid: string): Promise<Encounter | null> => {
    try {
        const response = await axiosTokenInstance.get(`/encounter/${eid}/state`);
        console.log(response.data);

        if (!response.data || typeof response.data !== "object") {
            console.error("Unexpected response format:", response.data);
            return null;
        }

        return response.data;
    } catch (error) {
        console.error(`Failed to fetch encounter ${eid}:`, error);
        return null;
    }
};