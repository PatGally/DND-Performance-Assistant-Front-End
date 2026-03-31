import axiosTokenInstance from "./AxiosTokenInstance";

export type InitiativeEntry = {
  name: string;
  iValue: number;
  turnType: string;
  currentTurn: boolean;
  actionResource: number;
  bonusActionResource: number;
  movementResource: number;
  hp: number;
  maxhp: number;
  ac: number;
  cid: string;
};

export default async function initiativeGet(
  eid: string
): Promise<InitiativeEntry[]> {
  try {
    const response = await axiosTokenInstance.get(`/encounter/${eid}/initiative`);
    return response.data as InitiativeEntry[];
  } catch (error) {
    console.error("Failed to fetch initiative", error);
    return [];
  }
}