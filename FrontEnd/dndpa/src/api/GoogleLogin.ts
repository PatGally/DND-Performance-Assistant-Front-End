import BASE_URL from "./BASE_URL";

interface GoogleAuthPayload {
    id_token: string;
}

export const googleLogin = async (idToken: string) => {
    const res = await fetch(`${BASE_URL}/auth/google`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken } as GoogleAuthPayload),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json();
        console.log("BACKEND ERROR:", error);
        throw new Error("Google login failed");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return data;
};