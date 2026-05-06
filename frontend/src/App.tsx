import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import MainLayout from "./layouts/MainLayout";
import ProjectsPage from "./pages/ProjectsPage";
import AddProjectPage from "./pages/AddProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ResourcesPage from "./pages/ResourcesPage";
import LayoutsPage from "./pages/LayoutsPage";
import LayoutEditorPage from "./pages/LayoutEditorPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Navigate to="/projects" replace />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/add" element={<AddProjectPage />} />
                        <Route path="/projects/:id" element={<ProjectDetailPage />} />
                        <Route path="/resources" element={<ResourcesPage />} />
                        <Route path="/layouts" element={<LayoutsPage />} />
                        <Route path="/layouts/:id" element={<LayoutEditorPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;