import React from 'react';
import d20 from "../../assets/d20.png";

/**
 * SiteFooter
 * ----------
 * Two rows:
 *   1. Brand mark (left) + legal/policy links (middle) + social icons (right)
 *   2. A thin divider, then cookie prefs (left) + copyright (center) +
 *      "to the surface" back-to-top (right)
 *
 * The back-to-top control uses window.scrollTo — no library needed.
 */
const SiteFooter: React.FC = () => {
    // const primaryLinks: string[] = [
    //     'PRESS',
    //     'SECURITY',
    //     'LEGAL',
    //     'LEADERSHIP',
    //     'CANDIDATE PRIVACY',
    //     'TERMS OF SERVICE',
    //     'PRIVACY NOTICE',
    //     'PLAYER SUPPORT',
    //     'E-VERIFY',
    //     'ACCESSIBILITY',
    // ];
    //
    // const secondaryLinks: string[] = [
    //     'ANNUAL REPORTS',
    //     'PEERING INFORMATION',
    //     'COMMUNITY PACT',
    // ];

    const socials: { id: string; label: string }[] = [
        { id: 'x', label: 'X' },
        { id: 'ig', label: 'Instagram' },
        { id: 'li', label: 'LinkedIn' },
    ];

    const backToTop = (): void => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="pa-footer">
            <div className="pa-footer__top">
                <div className="pa-footer__logo">
                    <img src={d20} alt="D20 Logo" style={{ height: "40px" }}/>
                </div>

                <div className="pa-footer__links">
                    <div className="pa-footer__links-row">
                        {/*{primaryLinks.map((l) => (*/}
                        {/*    <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="pa-footer__link">*/}
                        {/*        {l}*/}
                        {/*    </a>*/}
                        {/*))}*/}
                    </div>
                    <div className="pa-footer__links-row">
                        {/*{secondaryLinks.map((l) => (*/}
                        {/*    <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="pa-footer__link">*/}
                        {/*        {l}*/}
                        {/*    </a>*/}
                        {/*))}*/}
                    </div>
                </div>

                <div className="pa-footer__socials" aria-label="Social links">
                    {socials.map((s) => (
                        <a key={s.id} aria-label={s.label} className="pa-footer__social">
                            {/* Replace with own icons */}
                            <span className="pa-footer__social-placeholder" />
                        </a>
                    ))}
                </div>
            </div>

            <div className="pa-footer__divider" />

            <div className="pa-footer__bottom">
                <a className="pa-footer__small-link"> Alpha Testing </a>
                <span className="pa-footer__copyright">
          © {new Date().getFullYear()} dndpa All Rights Reserved.
        </span>
                <button type="button" className="pa-footer__to-top" onClick={backToTop}>
                    BACK TO TOP ▲
                </button>
            </div>
        </footer>
    );
};

export default SiteFooter;