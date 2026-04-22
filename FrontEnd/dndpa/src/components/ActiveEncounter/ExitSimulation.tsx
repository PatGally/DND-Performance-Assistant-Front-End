import { useState, useRef, useEffect } from "react";
import { BoxArrowRight, Escape } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import '../../css/ExitSimulation.css'

const UserMenu = () => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReNavigate = async () => {
        try {
            navigate("/user-dashboard");
        } catch (e) {
            console.error("Exiting sim failed", e);
        }
    };

    return (
        <div ref={menuRef} className="pa-exit">
            <button
                type="button"
                className="pa-exit__trigger"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Open exit menu"
                aria-expanded={open}
            >
                <Escape size={26} />
            </button>

            {open && (
                <div className="pa-exit__menu" role="menu">
                    <div className="pa-exit__divider" />

                    <button
                        type="button"
                        className="pa-exit__item pa-exit__item--danger"
                        onClick={handleReNavigate}
                        role="menuitem"
                    >
                        <BoxArrowRight size="1.3rem" />
                        <span>Exit Encounter</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;