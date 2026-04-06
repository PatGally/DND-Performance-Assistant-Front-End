import axiosTokenInstance from "./AxiosTokenInstance";
import type {InitiativeEntryDisplay} from "../types/SimulationTypes.ts";

export default async function initiativeGet(
  eid: string
): Promise<InitiativeEntryDisplay[]> {
  try {
    const response = await axiosTokenInstance.get(`/encounter/${eid}/initiative`);
    return response.data as InitiativeEntryDisplay[];
  } catch (error) {
    console.error("Failed to fetch initiative", error);
    return [];
  }
}