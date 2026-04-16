import "../../css/HowTo.css";

function HowToUse() {
    return (
        <div className="howto-container">

            <nav className="howto-sidebar">
                <h3>How To</h3>

                <ul className="howto-nav">

                    {/* Getting Started */}
                    <li className="nav-section">Getting Started
                        <ul>
                            <li><a href="#welcome">Welcome</a></li>
                            <li><a href="#new-to-dnd">New To D&D?</a></li>
                            <li><a href="#pa-assistant">What is the PA?</a></li>
                            <li><a href="#system-limits">System Limitations</a></li>
                            <li><a href="#planned-features">Post Capstone Features</a></li>
                        </ul>
                    </li>

                    {/* System Setup */}
                    <li className="nav-section">System Setup
                        <ul>
                            <li><a href="#create-player">Creating a Player</a></li>
                            <li><a href="#map">Google Drive Image Share Link</a></li>
                            <li><a href="#creating-encounter">Creating an Encounter</a></li>
                        </ul>
                    </li>

                    {/* Encounter Simulation */}
                    <li className="nav-section">Encounter Simulation
                        <ul>
                            <li><a href="#manual-mode">Using Manual Mode</a></li>
                            <li><a href="#action-list">Using Action List</a></li>
                            <li><a href="#initiative">Using Initiative List</a></li>
                            <li><a href="#lair">Lair Actions</a></li>
                            <li><a href="#spells">Managing Spells</a></li>
                        </ul>
                    </li>

                </ul>
            </nav>

            <div className="howto-content">


                <section id="welcome">
                    <h2>Getting Started</h2>
                    <h3>Welcome</h3>
                    <p className="description-bg">Welcome to DNDPA! We are a development team of 3 and this is our capstone.</p>
                </section>

                <section id="new-to-dnd">
                    <h3>New To D&D?</h3>
                    <p className="description-bg" >Explain basics for new users...</p>
                </section>

                <section id="pa-assistant">
                    <h3>What is the PA?</h3>
                    <p className="description-bg">Explain your system...</p>
                </section>

                <section id="system-limits">
                    <h3>System Limitations</h3>
                    {/* TODO fix description*/}
                    <p className="description-bg">
                        PA(Performance Assistant) does not account for structures and flying creatures
                    </p>
                </section>

                <section id="planned-features">
                    <h3>Post Capstone Features</h3>
                    <p className="description-bg">Future roadmap...</p>
                </section>

                <section id="create-player">
                    <h2>System Setup</h2>
                    <h3>Creating a Player</h3>
                    <p className="description-bg">Steps to create a player...</p>
                </section>

                <section id="map">
                    <h3>Using Google Drive Image Share Links</h3>
                    <div className="description-bg">

                        <p>
                            Google Drive image share links are required to display maps during an encounter.
                        </p>

                        <p><strong>Setup Steps:</strong></p>
                        <ul>
                            <li>Create a <strong>Google account</strong> if you do not already have one</li>
                            <li>Upload your map image to <strong>Google Drive</strong></li>
                            <li>Open the image and click <strong>"Share"</strong></li>
                            <li>Change access to <strong>"Anyone with the link"</strong></li>
                            <li>Copy the share link and paste it into your encounter setup</li>
                        </ul>

                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>If the image is set to <strong>restricted</strong>, the map will not display</li>
                        </ul>

                        <p><strong>Existing Encounters:</strong></p>
                        <ul>
                            <li>If you change an image to <strong>restricted</strong> after creating an encounter, the map will stop displaying</li>
                            <li>Ensure the image remains accessible for the duration of the encounter</li>
                        </ul>

                    </div>
                </section>

                <section id="creating-encounter">
                    <h3>Creating an Encounter</h3>
                    <p className="description-bg">Steps to create an encounter...</p>
                </section>


                <section id="manual-mode">
                    <h2>Encounter Simulation</h2>
                    <h3>Using Manual Mode</h3>
                    <p className="description-bg">Explain manual control...</p>
                </section>

                <section id="action-list">
                    <h3>Using Action List</h3>
                    <p className="description-bg">Explain actions...</p>
                </section>

                <section id="initiative">
                    <h3>Using Initiative List</h3>
                    <p className="description-bg">Explain initiative system.444..</p>
                </section>

                <section id="lair">
                    <h3>Lair Actions</h3>
                    <div className="description-bg">
                        <p>
                            Lair actions are special abilities tied to certain monsters and always occur at an initiative count of <strong>20</strong>.
                        </p>

                        <p><strong>Current System Behavior:</strong></p>
                        <ul>
                            <li>You are given <strong>one lair action slot</strong> in the initiative order.</li>
                            <li>Entering a lair action will automatically place you into <strong>manual mode</strong>.</li>
                            <li>This is required since all lair actions resolve at initiative 20.</li>
                            <li>While in <strong>manual mode</strong> make changes to creatures accordingly.</li>
                        </ul>

                        <p><strong>While in Manual Mode, you can modify the following for a player:</strong></p>
                        <ul>
                            <li>HP (Health Points)</li>
                            <li>AC (Armor Class)</li>
                            <li>Stats</li>
                            <li>Switch Side</li>
                            <li>Save Proficiencies</li>
                            <li>Spell Slots</li>
                            <li>Condition Immunities</li>
                            <li>Active Conditions</li>
                            <li>Active Status Effects</li>
                            <li>Damage Resistances</li>
                            <li>Damage Immunities</li>
                            <li>Damage Vulnerabilities</li>
                        </ul>
                        <p><strong>While in Manual Mode, you can modify the following for a monster:</strong></p>
                        <ul>
                            <li>HP (Health Points)</li>
                            <li>AC (Armor Class)</li>
                            <li>Stats</li>
                            <li>Switch Side</li>
                            <li>Save Proficiencies</li>
                            {/*<li>Spell Slots(If applicable)</li>*/}
                            <li>Condition Immunities</li>
                            <li>Active Conditions</li>
                            <li>Active Status Effects</li>
                            <li>Damage Resistances</li>
                            <li>Damage Immunities</li>
                            <li>Damage Vulnerabilities</li>
                        </ul>

                        <p><strong>Exiting a Lair Action:</strong></p>
                        <ul>
                            <li>Click <strong>"Submit"</strong> at the top of the Encounter Simulation page</li>
                            <li>Then click <strong>"Next"</strong> to proceed to the next creature</li>
                        </ul>

                        <p><strong>Troubleshooting:</strong></p>
                        <ul>
                            <li>If manual mode does not load, try closing and reopening the initiative tab</li>
                        </ul>
                    </div>
                </section>

                <section id="spells">
                    <h3>Managing Spells</h3>
                    <p className="description-bg">Your existing lorem ipsum is fine here.</p>
                </section>

            </div>
        </div>
    );
}

export default HowToUse;