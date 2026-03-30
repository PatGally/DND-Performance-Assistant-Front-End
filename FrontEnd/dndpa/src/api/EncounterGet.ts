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
    maplink: string;
}


export const getEncounters = async (): Promise<Encounter[]> => {
    try {
        const response = await axiosTokenInstance.get(`/dashboard/encounters`);
        // Ensure the backend returned an array
        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }
        return response.data;
    } catch (error) {
        console.error("Failed to fetch encounters:", error);
        return [];
    }
};



