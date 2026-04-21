import { useEffect, useState } from "react";

type Props = {
    isLoaded: boolean;
};

function Loading({ isLoaded }: Props) {
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        if (isLoaded) {
            const timeout = setTimeout(() => setShouldRender(false), 400);
            return () => clearTimeout(timeout);
        }
    }, [isLoaded]);

    if (!shouldRender) return null;

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(15, 24, 40, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.25rem",
                opacity: isLoaded ? 0 : 1,
                transition: "opacity 400ms ease-out",
                pointerEvents: isLoaded ? "none" : "auto",
            }}
        >
            Loading...
        </div>
    );
}

export default Loading;