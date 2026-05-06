import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Hexagon, FolderOpen, Database, Layout, Settings } from "lucide-react";

function Navbar() {
    const location = useLocation();
    const isProjects = location.pathname.startsWith("/projects");
    const isResources = location.pathname.startsWith("/resources");
    const isLayouts = location.pathname.startsWith("/layouts");
    const isSettings = location.pathname.startsWith("/settings");

    const navButton = (to: string, label: string, icon: React.ReactNode, active: boolean) => (
        <Button
            component={RouterLink}
            to={to}
            color="inherit"
            startIcon={icon}
            sx={{
                fontWeight: active ? 700 : 500,
                color: active ? "text.primary" : "text.secondary",
                borderBottom: active ? "2px solid" : "2px solid transparent",
                borderColor: active ? "primary.main" : "transparent",
                borderRadius: 0,
                px: 2,
            }}
        >
            {label}
        </Button>
    );

    return (
        <AppBar
            position="sticky"
            color="default"
            sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
        >
            <Toolbar sx={{ height: 56, px: 3 }}>
                <Box
                    component={RouterLink}
                    to="/projects"
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "text.primary" }}
                >
                    <Hexagon size={22} strokeWidth={2.5} />
                    <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: "-0.03em", fontSize: "1.05rem" }}>
                        bid machine
                    </Typography>
                </Box>

                <Box
                    component="nav"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, position: "absolute", left: "50%", transform: "translateX(-50%)" }}
                >
                    {navButton("/projects", "Projects", <FolderOpen size={15} />, isProjects)}
                    {navButton("/resources", "Resources", <Database size={15} />, isResources)}
                    {navButton("/layouts", "Layouts", <Layout size={15} />, isLayouts)}
                </Box>

                <Box sx={{ ml: "auto" }}>
                    <Tooltip title="Settings">
                        <IconButton
                            component={RouterLink}
                            to="/settings"
                            sx={{ color: isSettings ? "primary.main" : "text.secondary" }}
                        >
                            <Settings size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;