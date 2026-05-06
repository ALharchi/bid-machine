import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

function MainLayout() {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw", maxWidth: "100%", overflow: "hidden" }}>
            <Navbar />
            <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
                <Outlet />
            </Box>
        </Box>
    );
}

export default MainLayout;