import type { CharacterPayload } from "../types/character";

const BASE_URL = "http://127.0.0.1:8000";

export const createCharacter = async (character: CharacterPayload) => {
    const res =  await fetch(`${BASE_URL}/dashboard/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( character ),

    });
    console.log("Status  ", res.status);
    if (!res.ok){
        // throw new Error("Character creation failed");
        const error = await res.json(); // 👈 ADD THIS
        console.log("BACKEND ERROR:", error); // 👈 THIS WILL TELL US EVERYTHING
        throw new Error("Character creation failed");
    }

    return res.json();
};