import CardNav from './CardNav';
import logo from './logo.jpg'; // make sure this path is correct

const navBarSignedOut = () => {
    const items = [
        {
            label: "About",
            bgColor: "#0D0716",
            textColor: "#fff",
            links: [
                { label: "Company", ariaLabel: "About Company", href: "/company" },
                { label: "Careers", ariaLabel: "About Careers", href: "/careers" }
            ]
        },
        // ... other items
    ];

    return (
        <CardNav
            logo={logo}             // ✅ required
            logoAlt="Company Logo"
            items={items}
            baseColor="#fff"
            menuColor="#000"
            buttonBgColor="#111"
            buttonTextColor="#fff"
            ease="power3.out"
        />
    );
};

export default navBarSignedOut;
