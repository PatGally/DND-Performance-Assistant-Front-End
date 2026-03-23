

import axiosTokenInstance from "./AxiosTokenInstance.ts";
import axios from "axios";

export const EncounterPost = async (encounter: Object) => {
    try {
        const response = await axiosTokenInstance.post(`/encounter`, encounter);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("BACKEND ERROR:", error.response?.data);
        }
        throw new Error("Encounter creation failed");
    }
};