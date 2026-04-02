import "./HomePageUI2.css";
import {useState} from "react";

const SLIDES = [
    {
        number: "01",
        title: "Personal Assistant",
        body: "Powerful, fast, incredibly brutal you name it! Personal Assistant is an amazing tool" +
            " for DM's. It tracks your encounters, sending" +
            " you smart data driven suggestions on every turn." +
            " DND PA will assist your decision making making every encounter more " +
            "manageable so can you focus on what's most important!" +
            " TPKs! "
    },
    {
        number: "02",
        title: "Manual Mode",
        body: "Gives you full control over your encounter",
    },
    {
        number: "03",
        title: "Google Drive Image Link",
        body: "Paste your google drive images when creating an encounter and we'll load your map every time.",
    },
    {
        number: "04",
        title: "Dynamic Weighting",
        body: "This is what makes the Personal Assistant more... brutal",
    },
];

export default function HomePageUI2() {
    const [active, setActive] = useState(0);

    const prev = () => setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);
    const next = () => setActive((i) => (i + 1) % SLIDES.length);

    const slide = SLIDES[active];

    return (
        <section className="hpu2-section">
            {/* Section heading */}
            <div className="hpu2-heading-wrap">
                <h2 className="hpu2-heading">CORE FEATURES</h2>
                <div className="hpu2-heading-ornament">
                </div>
            </div>


            <div className="hpu2-panel">
                {/* Left: image placeholder */}
                <div className="hpu2-image-col">
                    <div className="hpu2-image-placeholder">
                        {/* Drop your <img> here */}
                    </div>
                </div>

                {/* Right: text */}
                <div className="hpu2-text-col">
                    <span className="hpu2-slide-number">{slide.number}</span>
                    <h3 className="hpu2-slide-title">{slide.title}</h3>
                    <p className="hpu2-slide-body">{slide.body}</p>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="hpu2-nav">
                <button className="hpu2-arrow hpu2-arrow--prev" onClick={prev} aria-label="Previous">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <div className="hpu2-tabs">
                    {SLIDES.map((s, i) => (
                        <button
                            key={s.number}
                            className={`hpu2-tab ${i === active ? "hpu2-tab--active" : ""}`}
                            onClick={() => setActive(i)}
                        >
                            <span className="hpu2-tab-label">{s.number}</span>
                            <span className="hpu2-tab-bar" />
                        </button>
                    ))}
                </div>

                <button className="hpu2-arrow hpu2-arrow--next" onClick={next} aria-label="Next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </section>
    );
}