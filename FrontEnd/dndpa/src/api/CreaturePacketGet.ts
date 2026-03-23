import axiosTokenInstance from "./AxiosTokenInstance.ts";

interface Player {
    name: string;
    level: number;
    characterClass: string;
    location?: string;
}

interface Monster {
    name: string;
    cr: number;
    size: string;
    location?: string;
}

interface EncounterPacket {
    players: Player[];
    monsters: Monster[];
}

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