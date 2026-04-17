import React from 'react';

interface HiringStat {
    value: string;
    label: string;
}

/**
 * AboutUs
 * -------------
 * Two-column split. The left half is a light-colored panel with the heading,
 * subtitle, two stat cards, and a primary CTA. The right half holds a large
 * image that bleeds to the edge, separated from the light panel by a
 * diagonal cut (created with `clip-path` in CSS).
 */
const AboutUs: React.FC = () => {
    const stats: HiringStat[] = [
        { value: '000', label: 'Lorem positions' },
        { value: '00', label: 'Lorem offices' },
    ];

    return (
        <section className="pa-hiring" aria-labelledby="hiring-heading">
            {/* LEFT PANEL — light background */}
            <div className="pa-hiring__panel">
                <div className="pa-hiring__content">
                    <h2 id="hiring-heading" className="pa-hiring__headline">Our Project!</h2>
                    <p className="pa-hiring__subtitle">
                        DNDPA is a capstone project developed by a team of three students, designed to
                        streamline Dungeons & Dragons 5e combat through encounter management,
                        interactive mapping, and real-time action recommendations. It helps players and
                        Dungeon Masters run encounters more efficiently while staying aligned with
                        Dungeons & Dragons 5th Edition (2014 Core Ruleset)
                    </p>

                    {/*<div className="pa-hiring__stats">*/}
                    {/*    {stats.map((s) => (*/}
                    {/*        <div key={s.label} className="pa-hiring__stat">*/}
                    {/*            <div className="pa-hiring__stat-value">{s.value}</div>*/}
                    {/*            <div className="pa-hiring__stat-label">{s.label}</div>*/}
                    {/*        </div>*/}
                    {/*    ))}*/}
                    {/*</div>*/}

                    {/*<a href="#careers" className="pa-hiring__cta">Explore Careers</a>*/}
                </div>
            </div>

            {/* RIGHT IMAGE — replace background with <img> if preferred */}
            {/*TODO remove or rename unused hiring styles*/}
            <div
                className="pa-hiring__image"
                style={{ backgroundImage: 'url(/placeholder-hiring.jpg)' }}
                role="img"
                aria-label="Hiring section visual"
            />
        </section>
    );
};

export default AboutUs;