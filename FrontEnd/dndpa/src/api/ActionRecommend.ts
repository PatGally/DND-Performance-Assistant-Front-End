import axiosTokenInstance from "./AxiosTokenInstance";
import type {Recommendation} from "../types/SimulationTypes.ts";

export async function recommendationGet(
  eid: string,
  cid: string
): Promise<Recommendation[]> {
    try{
         const response = await axiosTokenInstance.get(`/encounter/${eid}/recommendation/${cid}`);
    if( !response.data ) {
        console.error("Data not found in call", response.data);
    }
    return response.data as Recommendation[];
    }
    catch (error) {
        console.error("Failed to fetch actions", error);
        return [];
    }
}
