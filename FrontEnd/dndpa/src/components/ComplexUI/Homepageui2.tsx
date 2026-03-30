import "./HomePageUI2.css";
import {useState} from "react";

const SLIDES = [
    {
        number: "01",
        title: "Add your characters",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
        number: "02",
        title: "Select your monsters",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae.",
    },
    {
        number: "03",
        title: "Enter a google drive image link",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio, et tempus feugiat. Nullam varius turpis quis ligula scelerisque tincidunt.",
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
                <h2 className="hpu2-heading">GAMEPLAY FEATURES</h2>
                <div className="hpu2-heading-ornament">
                    {/*<span className="hpu2-ornament-line" />*/}
                    {/*<svg className="hpu2-ornament-icon" viewBox="0 0 40 12" fill="none">*/}
                    {/*    <path d="M0 6 Q10 0 20 6 Q30 12 40 6" stroke="currentColor" strokeWidth="1" fill="none"/>*/}
                    {/*</svg>*/}
                    {/*<span className="hpu2-ornament-line" />*/}
                </div>
            </div>

            {/* Main panel */}
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