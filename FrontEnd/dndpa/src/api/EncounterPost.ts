import BASE_URL from "./BASE_URL.ts";

export const EncounterPost = async (encounter: Object) => {
    const res =  await fetch(`${BASE_URL}/encounter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( encounter ),
    });
    console.log("Status  ", res.status);
    if (!res.ok){
        const error = await res.json();
        console.log("BACKEND ERROR:", error);
        throw new Error("Encounter creation failed");
    }

    return res.json();
}