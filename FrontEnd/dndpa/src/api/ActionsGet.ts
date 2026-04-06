import axiosTokenInstance from "./AxiosTokenInstance.ts";
import {type CreatureAction} from "../types/action.ts";

export async function actionsGet(
  eid: string,
  cid: string
): Promise<CreatureAction[]> {
    try{
         const response = await axiosTokenInstance.get(`/encounter/${eid}/creature/${cid}/actions`);
    if( !response.data ) {
        console.error("Data not found in call", response.data);
    }
    return response.data as CreatureAction[];
    }
    catch (error) {
        console.error("Failed to fetch actions", error);
        return [];
    }
}