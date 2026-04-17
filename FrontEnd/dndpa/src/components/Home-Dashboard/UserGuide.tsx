import "../../css/UserGuide.css";

function UserGuide() {
    return (
        <div className="howto-container">

            <nav className="howto-sidebar">
                <h2>User Guide</h2>

                <ul className="howto-nav">
                    <li className="nav-section">Getting Started
                        <ul>
                            <li><a href="#welcome">Welcome</a></li>
                            <li><a href="#new-to-dnd">New to Dungeons & Dragons?</a></li>

                            <li><a href="#system-limits">System/Website Limitations</a></li>
                            <li><a href="#planned-features">Post Capstone Features</a></li>
                        </ul>
                    </li>
                    <li className="nav-section"> Core Features
                        <ul>
                            <li><a href="#pa-assistant">Performance Assistant</a></li>
                            <li><a href="#customization-system">Customization System</a></li>
                            <li><a href="#mapping-system">Mapping System</a></li>
                            <li><a href="#dynamic-weighting">Dynamic Weighting</a></li>
                        </ul>

                    </li>

                    <li className="nav-section"> System Setup
                        <ul>
                            <li><a href="#create-player">Creating a Player</a></li>
                            <li><a href="#map">Google Drive Image Share Link</a></li>
                            <li><a href="#creating-encounter">Creating an Encounter</a></li>
                        </ul>
                    </li>

                    <li className="nav-section">Encounter Simulation
                        <ul>
                            <li><a href="#manual-mode">Using Manual Mode</a></li>
                            <li><a href="#action-list">Using Action List</a></li>
                            <li><a href="#lair">Lair Actions</a></li>
                            {/*<li><a href="#spells">Managing Spells</a></li>*/}
                        </ul>
                    </li>

                </ul>
            </nav>

            <div className="howto-content">

                <section id="welcome">

                    <h1>Getting Started</h1>
                    <h2>Welcome</h2>

                    <div className="description-bg">

                        <p>
                            Welcome to <strong>DNDPA</strong> — a real-time encounter management and performance assistant
                            built for Dungeons & Dragons 5e (2014 ruleset).
                        </p>

                        <p>
                            This application helps you run and manage combat encounters by combining:
                        </p>

                        <ul>
                            <li><strong>Encounter simulation tools</strong> for tracking turns, initiative, and combat flow</li>
                            <li><strong>Character and monster management</strong> for building balanced encounters</li>
                            <li><strong>Map-based combat tracking</strong> using grid overlays and image-based battlefields</li>
                            <li><strong>Performance Assistant (PA)</strong> to recommend optimal actions during combat</li>
                        </ul>

                        <p>
                            Whether you're a Dungeon Master or a player, DNDPA is designed to simplify combat,
                            speed up decision-making, and help you focus on storytelling instead of manual tracking.
                        </p>

                        <p>
                            This guide will walk you through everything from setting up your first character
                            to running full combat encounters with real-time recommendations.
                        </p>

                        <p>
                            If you're new, we recommend starting with <strong>Creating a Character</strong> and
                            then moving into <strong>Creating an Encounter</strong>.
                        </p>

                    </div>
                </section>
                <section id="new-to-dnd">
                    <h2>New To Dungeons & Dragons?</h2>
                    <div className="description-bg" >
                        <p>
                            If you're new to Dungeons & Dragons, the <strong>Performance Assistant (PA)</strong> helps you decide
                            what to do on your turn during combat.
                        </p>

                        <p>
                            In D&D 5e, every turn you can take actions like attacking, casting spells, or helping allies.
                            The PA looks at your situation and suggests the <strong>best possible action</strong> for you.
                        </p>

                        <p><strong>What the PA Helps You Do:</strong></p>
                        <ul>
                            <li>
                                Choose the <strong>most effective action</strong> during your turn
                            </li>
                            <li>
                                Decide between options like <strong>attacking, casting spells, or supporting teammates</strong>
                            </li>
                            <li>
                                Avoid wasting actions on targets that are <strong>out of range or invalid</strong>
                            </li>
                        </ul>

                        <p><strong>How It Makes Decisions:</strong></p>
                        <ul>
                            <li>
                                It checks how likely your action is to <strong>succeed</strong>
                            </li>
                            <li>
                                It estimates how much <strong>damage or impact</strong> the action will have
                            </li>
                            <li>
                                It considers <strong>who you can target</strong> and whether they are in range
                            </li>
                        </ul>

                        <p><strong>Special Situations:</strong></p>
                        <ul>
                            <li>
                                <strong>Area Attacks (AOE):</strong> The PA tries to position spells to hit as many enemies as possible
                            </li>
                            <li>
                                <strong>No Good Options:</strong> If nothing useful can be done, it may suggest <strong>skipping your turn</strong>
                            </li>
                            <li>
                                <strong>Concentration Spells:</strong> If you're already maintaining a spell, it avoids replacing it with a weaker one
                            </li>
                        </ul>

                        <p><strong>Why This Is Helpful:</strong></p>
                        <ul>
                            <li>
                                Speeds up your turns so you don’t feel stuck
                            </li>
                            <li>
                                Helps new players learn what actions are strong in different situations
                            </li>
                            <li>
                                Acts like a guide while you’re still learning the rules of the game
                            </li>
                        </ul>
                    </div>
                </section>
                <section id="system-limits">
                    <h2>System/Website Limitations</h2>

                    <div className="description-bg">
                        <strong>System Limitations:</strong>
                        <ul>
                            <li>
                                The Performance Assistant (PA) does <strong>not account for structures, elevation or terrain </strong> yet
                            </li>
                            <li>
                                <strong>Flying creatures are not supported</strong> — meaning height and elevation are not calculated yet
                            </li>
                            <li>
                                All movement and interactions occur on a <strong>flat, ground-level plane</strong> currently
                            </li>
                            <li>
                                There are <strong>no barriers, obstacles, or line-of-sight mechanics</strong>
                            </li>
                            <li>
                                <strong>Fog of war is not implemented</strong>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                See Post Capstone Features to check for upcoming updates
                            </li>
                        </ul>
                        <strong>User Limitations:</strong>
                        <ul>
                            <li>Forgot Password functionality is not yet implemented</li>
                            <li>Account deletion is not yet available</li>
                        </ul>
                    </div>
                </section>
                <section id="planned-features">
                    <h2>Planned Features</h2>
                    <p className="description-bg">
                        <p>
                            The Performance Assistant (PA) is actively being developed, and several enhancements are planned to expand realism, strategy depth, and user control.
                        </p>

                        <strong>Environment & Terrain Enhancements</strong>
                        <ul>
                            <li>Support for terrain features such as structures, elevation, and varied battlefield layouts</li>
                            <li>Introduction of height-based mechanics for flying creatures and vertical movement</li>
                            <li>Implementation of obstacles, barriers, and line-of-sight (LOS) rules for more tactical encounters</li>
                            <li>Fog of war system to improve exploration and hidden information gameplay</li>
                        </ul>

                        <strong>Combat System Improvements</strong>
                        <ul>
                            <li>Expansion from flat, ground-level movement to full 3D spatial awareness</li>
                            <li>More advanced interaction rules based on positioning, cover, and visibility</li>
                        </ul>

                        <strong>User Account Features</strong>
                        <ul>
                            <li>Forgot Password functionality for account recovery</li>
                            <li>Account deletion option for full user data control</li>
                        </ul>
                        <strong>User Guide</strong>
                        <ul>
                            <li>Updates to User Guide</li>
                            <li>Screenshots & videos meant to aid users</li>
                        </ul>
                        <strong>Support Touch Screen and Mobile Use</strong>
                            <li>Updates to zoom and scroll functionality</li>
                            <li>Refactor Website to support mobile use</li>
                        <p>
                            These features are part of the ongoing roadmap to improve realism, flexibility, and user experience.
                            For future updates and post-capstone enhancements, please refer to the <strong>Post Capstone Features</strong> section.
                        </p>
                    </p>

                </section>

                <section id="pa-assistant">
                    <h1>Core Features</h1>
                    <h2>Performance Assistant</h2>
                    <p className="description-bg">
                        <strong>Performance Assistant (PA):</strong>

                        <p>
                            The Performance Assistant (PA) is a real-time decision support system that analyzes available actions
                            during an encounter and recommends the most effective option based on multiple factors.
                        </p>

                        <p><strong>How the PA Works:</strong></p>
                        <ul>
                            <li>
                                The PA evaluates all possible actions at the start of a creature’s turn
                            </li>
                            <li>
                                It considers factors such as <strong>success probability</strong>, <strong>expected damage</strong>, and <strong>overall impact</strong>
                            </li>
                            <li>
                                It then ranks and recommends the best available action
                            </li>
                        </ul>

                        <p><strong>Core Features:</strong></p>

                        <ul>
                            <li>
                                <strong>AOE Optimization:</strong>
                                <ul>
                                    <li>
                                        The PA determines the most effective placement for area-of-effect (AOE) abilities
                                    </li>
                                    <li>
                                        This ensures AOE actions are not undervalued and hit as many valid targets as possible
                                    </li>
                                </ul>
                            </li>

                            <li>
                                <strong>Target Validation:</strong>
                                <ul>
                                    <li>
                                        Only valid targets are considered based on the action’s rules (enemy, ally, self, etc.)
                                    </li>
                                    <li>
                                        Targets must also be within range
                                    </li>
                                    <li>
                                        This prevents invalid or impossible recommendations
                                    </li>
                                </ul>
                            </li>

                            <li>
                                <strong>Fallback Action:</strong>
                                <ul>
                                    <li>
                                        If no valid actions are available (e.g., no targets in range or insufficient resources)
                                    </li>
                                    <li>
                                        The PA will recommend a safe default action such as <strong>"Pass Turn"</strong>
                                    </li>
                                </ul>
                            </li>

                            <li>
                                <strong>Concentration Handling:</strong>
                                <ul>
                                    <li>
                                        If a creature is already concentrating on an effect, the PA accounts for its value
                                    </li>
                                    <li>
                                        New concentration actions are evaluated against the current effect before recommending a replacement
                                    </li>
                                </ul>
                            </li>

                            <li>
                                <strong>Action Ranking System:</strong>
                                <ul>
                                    <li>
                                        Each action is ranked based on multiple analytics:
                                        <ul>
                                            <li>Probability of success</li>
                                            <li>Expected damage</li>
                                            <li>Overall impact</li>
                                        </ul>
                                    </li>
                                    <li>
                                        These rankings are combined into a final score
                                    </li>
                                    <li>
                                        The highest-scoring action is recommended
                                    </li>
                                </ul>
                            </li>
                        </ul>

                    </p>
                </section>
                <section id="customization-system">
                    <h2>Customization System</h2>

                    <div className="description-bg">
                        <strong>How DNDPA Enforces D&D 5e Rules</strong>
                        <p>
                            DNDPA includes a built-in rules engine that automatically enforces core Dungeons & Dragons 5e (2014)
                            combat rules. This ensures that all actions, movement, and abilities stay balanced and consistent with the official ruleset.
                        </p>

                        <p><strong>Spell Slot Enforcement</strong></p>
                        <ul>
                            <li>Only spells that a creature can legally cast are shown during their turn</li>
                            <li>The system checks available spell slots before displaying spell options</li>
                            <li>Spells requiring unavailable slots are hidden to prevent invalid casting</li>
                        </ul>

                        <p><strong>Action Economy Enforcement</strong></p>
                        <ul>
                            <li>Each creature is limited to the correct number of actions per turn</li>
                            <li>Used actions (such as Attack, Bonus Action, or Reaction) cannot be reused in the same turn</li>
                            <li>This prevents creatures from exceeding their allowed action economy</li>
                        </ul>

                        <p><strong>Movement Speed Limits</strong></p>
                        <ul>
                            <li>Creatures cannot move farther than their maximum movement speed per turn</li>
                            <li>The system tracks movement distance in real time during encounters</li>
                            <li>Prevents unintended positional advantages or rule-breaking movement</li>
                        </ul>

                        <p><strong>Concentration Rules</strong></p>
                        <ul>
                            <li>A creature can only maintain one concentration spell at a time</li>
                            <li>Casting a new concentration spell will end the previous one automatically</li>
                            <li>This follows official D&D 5e concentration mechanics</li>
                        </ul>

                        <p><strong>Turn Start Processing</strong></p>
                        <ul>
                            <li>Before a turn begins, the player must select a mode:
                                <ul>
                                    <li><strong>Ruleset Mode</strong> (automated enforcement)</li>
                                    <li><strong>Manual Mode</strong> (full control)</li>
                                </ul>
                            </li>
                            <li>All pre-turn effects (damage over time, saving throws, lingering conditions) are processed automatically</li>
                            <li>This ensures consistent turn timing regardless of mode</li>
                        </ul>

                        <p>
                            Together, these systems ensure that all encounters remain fair, rule-accurate, and aligned with
                            the official D&D 5e combat system while still allowing flexibility for advanced users.
                        </p>

                    </div>
                </section>
                <section id="mapping-system">
                    <h2>Mapping System</h2>


                    <div className="description-bg">
                        <strong>Grid-Based Encounter Movement & Rules</strong>

                        <p>
                            The Mapping System controls how creatures move, interact, and are positioned on the encounter grid.
                            It ensures movement follows D&D 5e rules while keeping combat visually clear and consistent.
                        </p>

                        <p><strong>Grid Occupancy & Collision</strong></p>
                        <ul>
                            <li>Creatures cannot move into a tile already occupied by another creature</li>
                            <li>Space sharing is restricted based on creature size and combat state (e.g., hostile positioning rules)</li>
                            <li><strong>Exceptions:</strong></li>
                            <ul>
                                <li>Tiny creatures may share space with larger creatures when rules allow</li>
                                <li>Manual Mode allows user-controlled overrides for positioning</li>
                            </ul>
                        </ul>

                        <p><strong>Movement Boundaries</strong></p>
                        <ul>
                            <li>Creatures cannot be moved outside the map’s defined grid area</li>
                            <li>Movement is limited by each creature’s <strong>maximum movement speed</strong></li>
                            <li>Dragging a token outside allowed range will be blocked automatically</li>
                        </ul>

                        <p><strong>Map Scaling System</strong></p>
                        <ul>
                            <li>When a map is loaded, all creature tokens are automatically scaled to match grid size</li>
                            <li>Token sizes (Tiny, Small, Medium, Large, etc.) adjust based on map scale (feet-to-pixel ratio)</li>
                            <li>This ensures accurate tactical positioning regardless of map resolution</li>
                        </ul>

                        <p><strong>Encounter Initialization</strong></p>
                        <ul>
                            <li>When an encounter starts, all creatures and objects are automatically placed on the map</li>
                            <li>Each token is anchored to its predefined starting coordinates</li>
                            <li>This prevents manual setup and ensures consistent encounter loading</li>
                        </ul>

                        <p><strong>Environmental Design Choice</strong></p>
                        <ul>
                            <li>The map is treated as a <strong>fully traversable grid</strong></li>
                            <li>There are no built-in obstacles or fog-of-war systems</li>
                            <li>All movement and visibility is handled in a simplified, flat combat space</li>
                        </ul>
                    </div>
                </section>
                <section id="dynamic-weighting">
                    <h2>Dynamic Weighting</h2>
                    <div className="description-bg">
                        <strong>How the System Learns & Prioritizes Information</strong>

                        <p>
                            The Dynamic Weighting System helps the Performance Assistant improve over time by adjusting how it evaluates actions
                            based on the most recent encounter data.
                        </p>

                        <p><strong>Priority on Recent Data</strong></p>
                        <ul>
                            <li>New encounter data (gradients) is prioritized over older data</li>
                            <li>This ensures the system adapts to the most up-to-date combat behavior</li>
                            <li>Prevents outdated information from influencing recommendations</li>
                        </ul>

                        <p><strong>Purpose & Scope</strong></p>
                        <ul>
                            <li>Dynamic weighting is used only to improve <strong>Performance Assistant accuracy</strong></li>
                            <li>It does not affect unrelated systems or core gameplay rules</li>
                            <li>This keeps optimization focused and stable</li>
                        </ul>

                        <p><strong>Update Frequency Limits</strong></p>
                        <ul>
                            <li>Dynamic weights can only update once every <strong>500 uses</strong> of the update action</li>
                            <li>This prevents excessive or unstable changes in system behavior</li>
                            <li>Helps maintain consistent long-term performance</li>
                        </ul>

                        <p><strong>When Updates Occur</strong></p>
                        <ul>
                            <li>Gradient calculations are performed at the end of each encounter</li>
                            <li>This ensures the system learns from complete combat scenarios</li>
                            <li>All actions and outcomes are included in the final evaluation</li>
                        </ul>

                        <p>
                            Overall, the Dynamic Weighting System allows the assistant to continuously improve its recommendations
                            while maintaining stability and consistency across encounters.
                        </p>

                    </div>
                </section>

                <section id="create-player">
                    <h1>System Setup</h1>
                    <h2>Creating a Player</h2>
                    <p className="description-bg">

                        Before creating an encounter, you must first create at least <strong>one character</strong>.

                        <p><strong>Character Setup:</strong></p>
                        <ul>
                            <li>Enter the character’s <strong>name</strong></li>
                            <li>Select <strong>class</strong> and <strong>level</strong></li>
                            <li>Configure <strong>stats</strong></li>
                            <li>Add <strong>weapons</strong></li>
                            <li>Add <strong>spells</strong> (if applicable)</li>
                            <li>Set <strong>Armor Class (AC)</strong></li>
                            <li><strong>HP is calculated automatically</strong></li>
                        </ul>

                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>All characters currently have a default movement speed of <strong>30</strong></li>
                            <li>This will be customizable in a future update</li>
                        </ul>

                        <p><strong>Final Step:</strong></p>
                        <ul>
                            <li>Toggle <strong>"Create Character"</strong> to complete the process</li>
                        </ul>

                    </p>
                </section>

                <section id="map">
                    <h2>Using Google Drive Image Share Links</h2>
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
                    <h2>Creating an Encounter</h2>
                    <div className="description-bg">
                        <p>Follow these steps to create a new encounter:</p>

                        <ul>
                            <li>Enter an <strong>encounter name</strong></li>
                            <li>Select the <strong>players/characters</strong> you have already created</li>
                            <li>Choose from over <strong>300 monsters</strong> in the D&D 5e (2014) core ruleset</li>
                            <li>Set the <strong>initiative order manually</strong></li>
                        </ul>

                        <p><strong>Lair Actions:</strong></p>
                        <ul>
                            <li>One <strong>lair action slot</strong> (If Applicable) is included for convenience</li>
                        </ul>

                        <p><strong>Map Setup:</strong></p>
                        <ul>
                            <li>Paste your <strong>Google Drive image link</strong></li>
                            <li>Set your desired <strong>grid size</strong> (minimum is 10×10, no maximum)</li>
                            <li>If your map already includes a grid, adjust the <strong>sliders</strong> to align it with the generated grid</li>
                        </ul>

                        <p><strong>Finalizing:</strong></p>
                        <ul>
                            <li>Click <strong>"Submit"</strong> once you are satisfied with your setup</li>
                            <li>You will be redirected to the <strong>Archives</strong></li>
                            <li>From there, you can enter your encounter to begin</li>
                        </ul>
                    </div>
                </section>

                <section id="manual-mode">

                    <h1>Encounter Simulation</h1>
                    <h2>Using Manual Mode</h2>

                    <p className="description-bg">

                        <strong>Manual Mode</strong> is a powerful tool that gives you full control over creatures during an encounter.

                        <p><strong>How to Enable Manual Mode:</strong></p>
                        <ul>
                            <li>Toggle the <strong>"Manual Mode"</strong> button at the top of the Encounter Simulation page</li>
                            <li>Ensure the <strong>Initiative List</strong> (left side panel) is open</li>
                            <li>Toggle Submit to lock in your changes</li>
                        </ul>

                        <p><strong>How to Select a Creature:</strong></p>
                        <ul>
                            <li>Click a creature’s <strong>token on the map</strong> to access and modify its stats</li>
                            <li>Or, select a creature from the <strong>Initiative List</strong> using the dropdown in the top-right of its entry</li>
                        </ul>

                        <p><strong>Editable Attributes (All Creatures):</strong></p>
                        <ul>
                            <li>HP (Health Points)</li>
                            <li>AC (Armor Class)</li>
                            <li>Stats</li>
                            <li>Spell Slots</li>
                            <li>Switch Side</li>
                            <li>Saving Throw Proficiencies</li>
                            <li>Condition Immunities</li>
                            <li>Active Conditions</li>
                            <li>Active Status Effects</li>
                            <li>Damage Resistances</li>
                            <li>Damage Immunities</li>
                            <li>Damage Vulnerabilities</li>
                        </ul>

                        <p><strong>Additional Explanation:</strong></p>
                        <ul>
                            <li>
                                <strong>Switch Sides</strong> changes a creature’s alignment (player ↔ enemy, monster ↔ ally).
                            </li>
                            <li>
                                <strong>PA (Performance Assistant)</strong> will recognise changes once submitted.
                            </li>
                        </ul>

                    </p>
                </section>

                <section id="action-list">
                    <h2>Using Action List</h2>
                    <p className="description-bg">Explain actions...</p>
                </section>


                <section id="lair">
                    <h2>Lair Actions</h2>
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

            </div>
        </div>
    );
}
export default UserGuide;