import { useState } from "react";
import Loading from "./LoadingScreen.tsx";

function BugReport() {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div style={{position: "relative", width: "100%", height: "100vh" }}>
            <Loading isLoaded={isLoaded} />
            <iframe
                src={"https://docs.google.com/forms/d/e/1FAIpQLSebRfJ44fULPbu6wWxHkEKN6FUoIJfKWcz2QplMYjU5BTViLA/viewform?usp=sharing&ouid=105060040195645478902"}
                width="100%"
                height="100%"
                title="Bug Report Form"
                onLoad={() => setIsLoaded(true)}
                style={{ border: "none" }}
            >
                Loading…
            </iframe>
        </div>
    );
}

export default BugReport;