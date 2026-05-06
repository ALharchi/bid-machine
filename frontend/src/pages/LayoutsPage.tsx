import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
} from "@mui/material";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import type { LayoutData } from "../api";
import { getLayouts, createLayout, deleteLayout, getLayoutPdfUrl } from "../api";

const PAGE_SIZE_OPTIONS = ["A2", "A3", "A4", "Letter", "Tabloid"];
const ORIENTATION_OPTIONS = ["landscape", "portrait"];

function LayoutsPage() {
    const [layouts, setLayouts] = useState<LayoutData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newSize, setNewSize] = useState("A3");
    const [newOrientation, setNewOrientation] = useState("landscape");
    const navigate = useNavigate();

    const load = useCallback(async () => {
        try {
            const data = await getLayouts();
            setLayouts(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await createLayout({ name: newName.trim(), page_size: newSize, orientation: newOrientation });
        setDialogOpen(false);
        setNewName("");
        void load();
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this layout?")) return;
        await deleteLayout(id);
        void load();
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Layouts</Typography>
                    <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>
                        New Layout
                    </Button>
                </Stack>

                {loading ? (
                    <Typography color="text.secondary">Loading...</Typography>
                ) : layouts.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: "center" }}>
                        <Box sx={{ mb: 2, opacity: 0.3 }}><FileText size={48} /></Box>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No layouts yet</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Create a document layout template for your bid submissions.
                        </Typography>
                        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>
                            New Layout
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={2.5}>
                        {layouts.map((layout) => (
                            <Grid key={layout.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Paper
                                    sx={{
                                        p: 3,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        cursor: "pointer",
                                        "&:hover": { borderColor: "text.secondary" },
                                        transition: "border-color 0.15s",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                    onClick={() => navigate(`/layouts/${layout.id}`)}
                                >
                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{layout.name}</Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); void handleDelete(layout.id); }}
                                            sx={{ p: 0.25 }}
                                        >
                                            <Trash2 size={14} />
                                        </IconButton>
                                    </Stack>
                                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                        <Chip label={layout.page_size} size="small" variant="outlined" />
                                        <Chip label={layout.orientation} size="small" variant="outlined" />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {layout.pages.length} page{layout.pages.length !== 1 ? "s" : ""}
                                    </Typography>
                                    <Box sx={{ mt: "auto", pt: 2 }}>
                                        <Button
                                            size="small"
                                            startIcon={<Download size={13} />}
                                            component="a"
                                            href={getLayoutPdfUrl(layout.id)}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                            sx={{ fontSize: "0.75rem" }}
                                        >
                                            PDF
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>New Layout</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField fullWidth label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Concours A3 Paysage" />
                        <FormControl fullWidth>
                            <InputLabel>Page Size</InputLabel>
                            <Select value={newSize} label="Page Size" onChange={(e) => setNewSize(e.target.value)}>
                                {PAGE_SIZE_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Orientation</InputLabel>
                            <Select value={newOrientation} label="Orientation" onChange={(e) => setNewOrientation(e.target.value)}>
                                {ORIENTATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={() => void handleCreate()} variant="contained" disabled={!newName.trim()}>Create</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default LayoutsPage;