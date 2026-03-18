import BASE_URL from "./BASE_URL.ts";

interface UserCreate {
    username: string;
    email: string;
    password: string;
}

interface UserPublic {
    id: string;
    username: string;
    email: string;
}

export const signup = async (user: UserCreate): Promise<UserPublic> => {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
    });

    console.log("Status  ", res.status);
    if (!res.ok) {
        const error = await res.json();
        console.log("BACKEND ERROR:", error);
        throw new Error("Signup failed");
    }

    return res.json();
};