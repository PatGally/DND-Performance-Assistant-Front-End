import axiosTokenInstance from "./AxiosTokenInstance";
import axios from "axios";
import type {EncounterFull} from "../types/encounter";

export const EncounterPost = async (encounter: EncounterFull) => {
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