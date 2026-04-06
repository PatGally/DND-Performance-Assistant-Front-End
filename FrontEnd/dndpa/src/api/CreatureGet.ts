// CreatureGet.ts

import axiosTokenInstance from "./AxiosTokenInstance";
import type {Creature, PlayerCreature} from "../types/creature.ts";

export function isPlayerCreature(creature: Creature): creature is PlayerCreature {
  return "stats" in creature;
}

export default async function creatureGet(
  eid: string,
  cid: string
): Promise<Creature | null> {
  try {
    const response = await axiosTokenInstance.get(`/encounter/${eid}/creature/${cid}`);
    return response.data as Creature;
  } catch (error) {
    console.error("Failed to fetch creature", error);
    return null;
  }
}