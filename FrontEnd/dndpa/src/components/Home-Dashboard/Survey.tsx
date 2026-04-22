import { useState } from "react";
import Loading from "./LoadingScreen.tsx";

function Survey() {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <Loading isLoaded={isLoaded} />
            <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSdGb_oks9IQEadOTXAf79pZh4MmoHsTdT3J_EzL_dzmMTajMQ/viewform?usp=sharing&ouid=100384879607942541356"
                width="100%"
                height="100%"
                title="Aplha Testing Survey"
                onLoad={() => setIsLoaded(true)}
                style={{ border: "none" }}
            >
                Loading…
            </iframe>
        </div>
    );
}

export default Survey;