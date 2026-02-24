import axios from "axios";
import BASE_URL from "./BASE_URL.ts";

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

/**
 * Fetches the encounter packet for a given encounter ID (eid)
 * @param eid Encounter ID
 * @returns {Promise<EncounterPacket>}
 */
async function creaturePacketGet(eid: string): Promise<EncounterPacket> {
    try {
        const response = await axios.get<EncounterPacket>(`${BASE_URL}/dashboard/${eid}/packet`);
        return response.data;
    } catch (error) {
        console.error("Error fetching encounter packet:", error);
        throw error;
    }
}

export default creaturePacketGet;