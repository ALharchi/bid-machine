import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Stack,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Divider,
} from "@mui/material";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Download,
    Eye,
    Save,
    FileText,
    BookOpen,
    Columns,
    X,
} from "lucide-react";
import type { LayoutData, LayoutPageData } from "../api";
import {
    getLayout,
    updateLayout,
    updateLayoutPage,
    createLayoutPage,
    deleteLayoutPage,
    getLayoutPdfUrl,
    getLayoutPreviewHtmlUrl,
} from "../api";

const PAGE_TYPES = [
    { value: "cover", label: "Cover" },
    { value: "toc", label: "Table of Contents" },
    { value: "content", label: "Content" },
    { value: "divider", label: "Section Divider" },
    { value: "back", label: "Back Cover" },
];

const PAGE_TYPE_ICONS: Record<string, React.ReactNode> = {
    cover: <BookOpen size={14} />,
    toc: <Columns size={14} />,
    content: <FileText size={14} />,
    divider: <Columns size={14} />,
    back: <BookOpen size={14} />,
};

function LayoutEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [layout, setLayout] = useState<LayoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
    const [htmlContent, setHtmlContent] = useState("");
    const [cssContent, setCssContent] = useState("");
    const [globalCss, setGlobalCss] = useState("");
    const [saving, setSaving] = useState(false);
    const [addPageOpen, setAddPageOpen] = useState(false);
    const [newPageName, setNewPageName] = useState("");
    const [newPageType, setNewPageType] = useState("content");
    const [previewOpen, setPreviewOpen] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getLayout(Number(id));
            setLayout(data);
            setGlobalCss(data.global_css);
            if (data.pages.length > 0 && !selectedPageId) {
                setSelectedPageId(data.pages[0].id);
                setHtmlContent(data.pages[0].html_content);
                setCssContent(data.pages[0].css_content);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    const selectedPage = layout?.pages.find((p) => p.id === selectedPageId) || null;

    const handleSelectPage = (page: LayoutPageData) => {
        setSelectedPageId(page.id);
        setHtmlContent(page.html_content);
        setCssContent(page.css_content);
    };

    const handleSavePage = async () => {
        if (!layout || !selectedPageId) return;
        setSaving(true);
        try {
            await updateLayoutPage(layout.id, selectedPageId, { html_content: htmlContent, css_content: cssContent });
            await updateLayout(layout.id, { global_css: globalCss });
            void load();
        } finally {
            setSaving(false);
        }
    };

    const handleAddPage = async () => {
        if (!layout || !newPageName.trim()) return;
        const maxOrder = Math.max(...layout.pages.map((p) => p.sort_order), -1);
        await createLayoutPage(layout.id, { name: newPageName.trim(), page_type: newPageType, sort_order: maxOrder + 1 });
        setAddPageOpen(false);
        setNewPageName("");
        setNewPageType("content");
        void load();
    };

    const handleDeletePage = async (pageId: number) => {
        if (!layout) return;
        if (!window.confirm("Delete this page?")) return;
        await deleteLayoutPage(layout.id, pageId);
        if (selectedPageId === pageId) {
            setSelectedPageId(null);
            setHtmlContent("");
            setCssContent("");
        }
        void load();
    };

    if (loading) {
        return <Box sx={{ p: 4 }}><Typography>Loading...</Typography></Box>;
    }
    if (!layout) {
        return <Box sx={{ p: 4 }}><Typography>Layout not found</Typography></Box>;
    }

    return (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Left Panel - Pages list */}
            <Box sx={{ width: 240, minWidth: 240, borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Button startIcon={<ArrowLeft size={14} />} onClick={() => navigate("/layouts")} size="small" sx={{ mb: 1.5, color: "text.secondary" }}>
                        Back
                    </Button>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{layout.name}</Typography>
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                        <Chip label={layout.page_size} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                        <Chip label={layout.orientation} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                    </Box>
                </Box>

                <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>
                            Pages
                        </Typography>
                        <IconButton size="small" onClick={() => setAddPageOpen(true)}><Plus size={14} /></IconButton>
                    </Stack>
                </Box>

                <Box sx={{ flex: 1, overflow: "auto" }}>
                    {layout.pages.map((page) => (
                        <Box
                            key={page.id}
                            onClick={() => handleSelectPage(page)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 2,
                                py: 1,
                                cursor: "pointer",
                                bgcolor: selectedPageId === page.id ? "grey.100" : "transparent",
                                "&:hover": { bgcolor: "grey.50" },
                                "&:hover .page-del": { opacity: 1 },
                                borderLeft: selectedPageId === page.id ? "2px solid" : "2px solid transparent",
                                borderColor: selectedPageId === page.id ? "primary.main" : "transparent",
                            }}
                        >
                            <Box sx={{ color: "text.secondary" }}>{PAGE_TYPE_ICONS[page.page_type] || <FileText size={14} />}</Box>
                            <Box sx={{ flex: 1, overflow: "hidden" }}>
                                <Typography variant="caption" sx={{ fontWeight: selectedPageId === page.id ? 600 : 400, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {page.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
                                    {page.page_type}
                                </Typography>
                            </Box>
                            <IconButton
                                className="page-del"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); void handleDeletePage(page.id); }}
                                sx={{ opacity: 0, p: 0.25 }}
                            >
                                <Trash2 size={11} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>

                {/* Actions */}
                <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack spacing={1}>
                        <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={13} />}
                            onClick={() => setPreviewOpen(true)}
                        >
                            Preview
                        </Button>
                        <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<Download size={13} />}
                            component="a"
                            href={getLayoutPdfUrl(layout.id)}
                        >
                            Download PDF
                        </Button>
                    </Stack>
                </Box>
            </Box>

            {/* Main Editor */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {selectedPage ? (
                    <>
                        {/* Toolbar */}
                        <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "background.paper" }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPage.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Editing HTML and CSS for this page</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Save size={14} />}
                                onClick={() => void handleSavePage()}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </Box>

                        {/* Editor area */}
                        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
                            {/* HTML Editor */}
                            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid", borderColor: "divider" }}>
                                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.65rem", color: "text.secondary" }}>
                                        HTML
                                    </Typography>
                                </Box>
                                <TextField
                                    multiline
                                    fullWidth
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        "& .MuiInputBase-root": { height: "100%", alignItems: "flex-start", fontFamily: "monospace", fontSize: "0.8rem", p: 2 },
                                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                        "& textarea": { height: "100% !important", overflow: "auto !important" },
                                    }}
                                    placeholder="<div>Your page HTML here...</div>"
                                />
                            </Box>

                            {/* CSS Editor */}
                            <Box sx={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column" }}>
                                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.65rem", color: "text.secondary" }}>
                                        Page CSS
                                    </Typography>
                                </Box>
                                <TextField
                                    multiline
                                    fullWidth
                                    value={cssContent}
                                    onChange={(e) => setCssContent(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        "& .MuiInputBase-root": { height: "100%", alignItems: "flex-start", fontFamily: "monospace", fontSize: "0.8rem", p: 2 },
                                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                        "& textarea": { height: "100% !important", overflow: "auto !important" },
                                    }}
                                    placeholder="/* Page-specific CSS */"
                                />
                                <Divider />
                                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.65rem", color: "text.secondary" }}>
                                        Global CSS
                                    </Typography>
                                </Box>
                                <TextField
                                    multiline
                                    fullWidth
                                    value={globalCss}
                                    onChange={(e) => setGlobalCss(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        "& .MuiInputBase-root": { height: "100%", alignItems: "flex-start", fontFamily: "monospace", fontSize: "0.8rem", p: 2 },
                                        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                        "& textarea": { height: "100% !important", overflow: "auto !important" },
                                    }}
                                    placeholder="/* Applies to all pages */"
                                />
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography color="text.secondary">Select a page from the sidebar to edit</Typography>
                    </Box>
                )}
            </Box>

            {/* Add Page Dialog */}
            <Dialog open={addPageOpen} onClose={() => setAddPageOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add Page</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField fullWidth label="Page Name" value={newPageName} onChange={(e) => setNewPageName(e.target.value)} placeholder="e.g., Materials Section" />
                        <FormControl fullWidth>
                            <InputLabel>Page Type</InputLabel>
                            <Select value={newPageType} label="Page Type" onChange={(e) => setNewPageType(e.target.value)}>
                                {PAGE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setAddPageOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={() => void handleAddPage()} variant="contained" disabled={!newPageName.trim()}>Add</Button>
                </DialogActions>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth={false}
                fullWidth
                slotProps={{ paper: { sx: { width: "95vw", height: "90vh", maxWidth: "95vw" } } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Preview - {layout.name}</Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Button size="small" startIcon={<Download size={13} />} component="a" href={getLayoutPdfUrl(layout.id)} variant="outlined">
                            PDF
                        </Button>
                        <IconButton size="small" onClick={() => setPreviewOpen(false)}><X size={18} /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <iframe
                        src={getLayoutPreviewHtmlUrl(layout.id)}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title="Layout Preview"
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default LayoutEditorPage;