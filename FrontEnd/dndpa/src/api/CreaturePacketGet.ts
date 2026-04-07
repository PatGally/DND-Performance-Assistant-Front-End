import axiosTokenInstance from "./AxiosTokenInstance";
import type { EncounterPacket } from "../types/encounter";


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