import axiosTokenInstance from "./AxiosTokenInstance";

export type Recommendation = {
    name : string;
    prob : number;
    eDam : number;
    impact: number;
    target : string[];
    "probDisplay": number;
    "probInit": number;
    "probParts": unknown[];
    "pareto": boolean;
    "topsis": number;
    "overallRank": number;
}

export async function recommendationGet(
  eid: string,
  cid: string
): Promise<Recommendation[]> {
    try{
        console.log(`/encounter/${eid}/recommendation/${cid}`);
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
