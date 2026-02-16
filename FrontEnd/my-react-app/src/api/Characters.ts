import type { CharacterPayload } from "../types/character";

export const createCharacter = async (character: CharacterPayload) => {
    const res =  await fetch("http://127.0.0.1:8000/dashboard/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),

    });
    console.log(res.status);
    if (!res.ok){
        throw new Error("Character creation failed");
    }

    return res.json();
};