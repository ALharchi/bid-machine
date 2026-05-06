import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Stack,
} from "@mui/material";
import { Plus, Trash2, FileCheck, FileX, MapPin, Clock } from "lucide-react";
import type { Project } from "../api";
import { getProjects, deleteProject } from "../api";

function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const load = useCallback(async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this project?")) return;
        await deleteProject(id);
        setLoading(true);
        void load();
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Projects
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Plus size={18} />}
                        onClick={() => navigate("/projects/add")}
                    >
                        Add Project
                    </Button>
                </Stack>

                {loading ? (
                    <Typography color="text.secondary">Loading...</Typography>
                ) : projects.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: "center" }}>
                        <Box sx={{ mb: 2, opacity: 0.4 }}>
                            <FileX size={48} />
                        </Box>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            No projects yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Add your first bid project to get started.
                        </Typography>
                        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate("/projects/add")}>
                            Add Project
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "divider" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.50" }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Object</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Buyer</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Deadline</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Docs</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((p) => (
                                    <TableRow
                                        key={p.id}
                                        hover
                                        sx={{ cursor: "pointer" }}
                                        onClick={() => navigate(`/projects/${p.id}`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {p.reference}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {p.objet}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {p.acheteur}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Clock size={12} />}
                                                label={p.date_limite}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <MapPin size={13} />
                                                {p.lieu_execution}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {p.has_documents ? (
                                                <Chip icon={<FileCheck size={12} />} label="Yes" size="small" color="success" variant="outlined" />
                                            ) : (
                                                <Chip icon={<FileX size={12} />} label="No" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(p.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Container>
    );
}

export default ProjectsPage;