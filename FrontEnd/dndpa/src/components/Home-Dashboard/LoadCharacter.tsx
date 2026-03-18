import { type CharacterStats, getCharacters } from "../../api/CharactersGet.ts";
import React, { useEffect, useState } from "react";

// violating DRY - must put this code in an interface file
export interface Character {
    stats: CharacterStats;
    weapons?: string[];
    spells?: string[];
}
// TODO Backend works FrontEnd is not getting the info

const LoadCharacter: React.FC = () => {
    const [loadingCharacters, setLoadingCharacters] = useState<boolean>(false);
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        const fetchCharacters = async () => {
            setLoadingCharacters(true);
            try {
                const data: Character[] = await getCharacters();
                setCharacters(data);
                console.log("Characters loaded", data);
            } catch (err) {
                console.error("Error fetching characters", err);
            } finally {
                setLoadingCharacters(false);
            }
        };
        fetchCharacters();
    }, []);

    return <> hello hwy </>;
};

export default LoadCharacter;