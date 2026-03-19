import { type CharacterStats, getCharacters } from "../../api/CharactersGet.ts";
import React, { useEffect, useState } from "react";

// violating DRY - must put this code in an interface file
export interface Character {
    stats: CharacterStats;
    weapons?: string[];
    spells?: string[];
}

const LoadCharacter: React.FC = () => {
    const [loadingCharacters, setLoadingCharacters] = useState<boolean>(false);
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        const fetchCharacters = async () => {
            setLoadingCharacters(true);
            try {
                const data: Character[] = await getCharacters();
                setCharacters(data);
                console.log("Characters loaded", characters);
                // console.log("Characters loaded", data);
            } catch (err) {
                console.error("Error fetching characters", err);
            } finally {
                setLoadingCharacters(false);
                console.log(loadingCharacters);
            }
        };
        fetchCharacters();
    }, []);

    return <> hello hwy </>;
};

export default LoadCharacter;