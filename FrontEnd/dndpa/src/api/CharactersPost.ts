import type { CharacterPayload } from "../types/creature.ts";
import axiosTokenInstance from "./AxiosTokenInstance.ts";
import axios from "axios";

export const createCharacter = async (character: CharacterPayload) => {
    try {
        const response = await axiosTokenInstance.post(`/dashboard/players`, character);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("BACKEND ERROR:", error.response?.data);
        }
        throw new Error("Character creation failed");
    }
};