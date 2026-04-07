import BASE_URL from "./BASE_URL";
import {login} from "./Login";

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

    if (!res.ok) {
        const error = await res.json();
        throw new Error("Signup failed error: ", error);
    }

    const data = await res.json();
    await login({ username: user.username, password: user.password });
    return data;
};