import { useState, useRef, useEffect } from "react";
import { BoxArrowRight, Escape } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

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
        <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    color: "white",
                }}
            >
                <Escape size={28} />
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        background: "#1a1a2e",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        minWidth: "180px",
                        zIndex: 1000,
                        overflow: "hidden",
                        animation: "fadeIn 0.15s ease",
                    }}
                >
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(-6px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                        .menu-item {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 12px 16px;
                            cursor: pointer;
                            color: #e0e0e0;
                            font-size: 14px;
                            transition: background 0.15s;
                            border: none;
                            background: none;
                            width: 100%;
                            text-align: left;
                        }
                        .menu-item:hover {
                            background: rgba(255,255,255,0.07);
                        }
                        .menu-divider {
                            height: 1px;
                            background: rgba(255,255,255,0.08);
                            margin: 0;
                        }
                        .logout-item {
                            color: #ff6b6b !important;
                        }
                    `}</style>



                    <div className="menu-divider" />

                    <button className="menu-item logout-item" onClick={handleReNavigate}>
                        <BoxArrowRight size={'1.4rem'} />
                        <span>Exit Encounter</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;