import axiosTokenInstance from "./AxiosTokenInstance.ts";
import type { EncounterPacket } from "../types/encounter.ts";


async function creaturePacketGet(eid: string): Promise<EncounterPacket> {
    try {
        const response = await axiosTokenInstance.get<EncounterPacket>(`/dashboard/${eid}/packet`);
        return response.data;
    } catch (error) {
        console.error("Error fetching encounter packet:", error);
        throw error;
    }
}

export default creaturePacketGet;