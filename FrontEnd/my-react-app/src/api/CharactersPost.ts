import type { CharacterPayload } from "../types/character";
import BASE_URL from "./BASE_URL.ts";

export const createCharacter = async (character: CharacterPayload) => {
    const res =  await fetch(`${BASE_URL}/dashboard/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( character ),

    });
    console.log("Status  ", res.status);
    if (!res.ok){
        const error = await res.json();
        console.log("BACKEND ERROR:", error);
        throw new Error("Character creation failed");
    }

    return res.json();
};