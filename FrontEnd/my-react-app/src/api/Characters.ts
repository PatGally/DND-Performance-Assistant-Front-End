export const createCharacter = async (character: { name: string; characterClass: string; ac: string }) => {
    return fetch("http://localhost:8001/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
    });
};