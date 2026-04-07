import "./Homepageui1.css";
import bg_UI1 from '../../assets/bg_UI1.png';

export default function HomePageUI1() {
    return (
        <section className="hpu1-section">

            <img
                src={bg_UI1}
                alt="Company Background"
                className="hpu1-bg-image"
            />

            <div className="hpu1-content">
                <div className="hpu1-title-col">
                    <h1 className="hpu1-title">DNDPA</h1>
                </div>

                <div className="hpu1-text-col">
                    <p className="hpu1-body">
                        Manage your encounter anywhere! Set your characters pick your monsters and enter your very own encounter simulation
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