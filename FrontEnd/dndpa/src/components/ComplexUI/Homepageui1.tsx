import "./HomePageUI1.css";

export default function HomePageUI1() {
    return (
        <section className="hpu1-section">
            {/*<div className="hpu1-frame hpu1-frame--tl">*/}
            {/*    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">*/}
            {/*        <polyline points="0,70 0,0 70,0" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none"/>*/}
            {/*        <polyline points="0,90 0,0 90,0" stroke="rgba(255,255,255,0.09)" strokeWidth="1" fill="none"/>*/}
            {/*    </svg>*/}
            {/*</div>*/}

            {/*<div className="hpu1-banner">*/}
            {/*    <div className="hpu1-banner__teal" />*/}
            {/*    <div className="hpu1-banner__dark-overlay" />*/}
            {/*    <div className="hpu1-banner__diagonal-cut" />*/}
            {/*    /!* Silhouette shape suggestion *!/*/}
            {/*    <div className="hpu1-banner__figure" />*/}
            {/*</div>*/}

            {/* Main content row */}
            <div className="hpu1-content">
                <div className="hpu1-title-col">
                    <h1 className="hpu1-title">DNDPA</h1>
                </div>

                <div className="hpu1-text-col">
                    <p className="hpu1-body">
                        Manage your encounter anywhere! Set your characters pick your your monsters and enter your very own encounter simulation
                    </p>
                    <p className="hpu1-body">
                        Our custom built system will give you the best recommendations for every turn!
                        Automate and Manage your encounter whether you are playing in person or online!
                    </p>
                </div>
            </div>


            <div className="hpu1-footer-bar" />
        </section>
    );
}