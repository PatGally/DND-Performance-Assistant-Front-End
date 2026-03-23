import BASE_URL from "./BASE_URL.ts";

export const logout = async (): Promise<void> => {
    await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    localStorage.removeItem("token");
};