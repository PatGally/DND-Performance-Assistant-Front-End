import BASE_URL from "./BASE_URL.ts";

interface LoginPayload {
    username: string;
    password: string;
}

export const login = async (credentials: LoginPayload) => {
    const formData = new URLSearchParams();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        credentials: "include",
    });

    console.log("Status  ", res.status);
    if (!res.ok) {
        const error = await res.json();
        console.log("BACKEND ERROR:", error);
        throw new Error("Login failed");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
};