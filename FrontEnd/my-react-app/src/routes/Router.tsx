import React from "react";
import { Routes, Route } from "react-router-dom";
import HomeSignedOut from "../pages/HomeSignedOut.tsx";
import HomeDashboard from "../pages/HomeDashboard.tsx";

const Router: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<HomeSignedOut />} />
            <Route path="/dashboard" element={<HomeDashboard />} />
        </Routes>
    )
}

export default Router
