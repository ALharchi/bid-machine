import { useEffect, useState, useCallback } from "react";
import {
    Container,
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Stack,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Tooltip,
    Collapse,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import {
    Plus,
    Search,
    Trash2,
    Edit3,
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    X,
    Image,
    Tag,
    Database
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { CategoryNode, ContentBlock, ContentImage } from "../api";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    uploadBlockImage,
    deleteBlockImage,
    getLibraryImageUrl,
} from "../api";

// ============================================================
// CATEGORY TREE SIDEBAR
// ============================================================

function CategoryTreeItem({
    node,
    selectedId,
    onSelect,
    onEdit,
    onDelete,
    depth = 0,
}: {
    node: CategoryNode;
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onEdit: (cat: CategoryNode) => void;
    onDelete: (id: number) => void;
    depth?: number;
}) {
    const [open, setOpen] = useState(true);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <Box>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    pl: 1 + depth * 2,
                    pr: 1,
                    py: 0.75,
                    cursor: "pointer",
                    bgcolor: isSelected ? "grey.100" : "transparent",
                    "&:hover": { bgcolor: "grey.50" },
                    "&:hover .cat-actions": { opacity: 1 },
                    transition: "background-color 0.1s",
                }}
                onClick={() => onSelect(isSelected ? null : node.id)}
            >
                {hasChildren ? (
                    <Box
                        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                        sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}
                    >
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Box>
                ) : (
                    <Box sx={{ width: 14 }} />
                )}
                <Box sx={{ display: "flex", alignItems: "center", color: isSelected ? "primary.main" : "text.secondary" }}>
                    {isSelected ? <FolderOpen size={15} /> : <Folder size={15} />}
                </Box>
                <Typography variant="body2" sx={{ flex: 1, fontWeight: isSelected ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {node.name}
                </Typography>
                <Box className="cat-actions" sx={{ display: "flex", opacity: 0, transition: "opacity 0.15s" }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(node); }} sx={{ p: 0.25 }}>
                        <Edit3 size={12} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} sx={{ p: 0.25 }}>
                        <Trash2 size={12} />
                    </IconButton>
                </Box>
            </Box>
            {hasChildren && (
                <Collapse in={open}>
                    {node.children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

// ============================================================
// BLOCK CARD
// ============================================================

function BlockCard({ block, onEdit, onDelete }: { block: ContentBlock; onEdit: (b: ContentBlock) => void; onDelete: (id: number) => void }) {
    const tags: string[] = (() => { try { return JSON.parse(block.tags); } catch { return []; } })();
    const firstImage = block.images.length > 0 ? block.images[0] : null;

    return (
        <Paper
            sx={{
                p: 0,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
                cursor: "pointer",
                "&:hover": { borderColor: "text.secondary" },
                transition: "border-color 0.15s",
            }}
            onClick={() => onEdit(block)}
        >
            {firstImage && (
                <Box
                    sx={{
                        height: 140,
                        bgcolor: "grey.100",
                        backgroundImage: `url(${getLibraryImageUrl(firstImage.file_path)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}
            <Box sx={{ p: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                        {block.title}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                        sx={{ ml: 1, p: 0.25, color: "text.secondary" }}
                    >
                        <Trash2 size={13} />
                    </IconButton>
                </Stack>
                {block.body && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", mb: 1 }}>
                        {block.body}
                    </Typography>
                )}
                {tags.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                        {tags.slice(0, 4).map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
                        ))}
                        {tags.length > 4 && <Chip label={`+${tags.length - 4}`} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />}
                    </Box>
                )}
                {block.images.length > 1 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                        <Image size={11} />
                        <Typography variant="caption" color="text.secondary">{block.images.length}</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

// ============================================================
// BLOCK EDIT DIALOG
// ============================================================

function BlockEditDialog({
    open,
    onClose,
    block,
    categories,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    block: ContentBlock | null;
    categories: CategoryNode[];
    onSaved: () => void;
}) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [tagsInput, setTagsInput] = useState("");
    const [images, setImages] = useState<ContentImage[]>([]);
    const [saving, setSaving] = useState(false);

    const isNew = !block;

    useEffect(() => {
        if (block) {
            setTitle(block.title);
            setBody(block.body);
            setCategoryId(block.category_id || "");
            const tags: string[] = (() => { try { return JSON.parse(block.tags); } catch { return []; } })();
            setTagsInput(tags.join(", "));
            setImages(block.images);
        } else {
            setTitle("");
            setBody("");
            setCategoryId("");
            setTagsInput("");
            setImages([]);
        }
    }, [block, open]);

    const flatCategories = flattenCategories(categories);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        const tags = JSON.stringify(tagsInput.split(",").map((t) => t.trim()).filter(Boolean));
        const data = {
            title: title.trim(),
            body,
            category_id: categoryId || null,
            tags,
        };
        try {
            if (block) {
                await updateBlock(block.id, data);
            } else {
                await createBlock(data);
            }
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (files: File[]) => {
        if (!block) return;
        for (const file of files) {
            const img = await uploadBlockImage(block.id, file);
            setImages((prev) => [...prev, img]);
        }
    };

    const handleImageDelete = async (imageId: number) => {
        if (!block) return;
        await deleteBlockImage(block.id, imageId);
        setImages((prev) => prev.filter((i) => i.id !== imageId));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => void handleImageUpload(files),
        accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"] },
        multiple: true,
        noClick: false,
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { maxHeight: "90vh" } } }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider", py: 1.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {isNew ? "New Resource" : "Edit Resource"}
                </Typography>
                <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, pt: 3 }}>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Granit poli gris 60x60" />

                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value as number | "")}>
                            <MenuItem value="">Uncategorized</MenuItem>
                            {flatCategories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {"  ".repeat(c.depth)}{c.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Description"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        multiline
                        rows={6}
                        placeholder="Detailed description of the material, specification, supplier, etc."
                    />

                    <TextField
                        fullWidth
                        label="Tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="sol, granit, hall, pierre naturelle"
                        helperText="Comma-separated"
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Tag size={14} /></InputAdornment> } }}
                    />

                    {/* Images section - only for existing blocks */}
                    {block && (
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Images</Typography>
                            {images.length > 0 && (
                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5, mb: 2 }}>
                                    {images.map((img) => (
                                        <Box key={img.id} sx={{ position: "relative", aspectRatio: "1", borderRadius: 0, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                                            <Box
                                                component="img"
                                                src={getLibraryImageUrl(img.file_path)}
                                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => void handleImageDelete(img.id)}
                                                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.6)", color: "white", p: 0.25, "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}
                                            >
                                                <X size={12} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            <Box
                                {...getRootProps()}
                                sx={{
                                    border: "1px dashed",
                                    borderColor: isDragActive ? "primary.main" : "divider",
                                    p: 2.5,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    bgcolor: isDragActive ? "action.hover" : "grey.50",
                                    "&:hover": { borderColor: "primary.main" },
                                }}
                            >
                                <input {...getInputProps()} />
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                    <Image size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                        {isDragActive ? "Drop images here" : "Drop images or click to upload"}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    {isNew && (
                        <Typography variant="caption" color="text.secondary">
                            Save the resource first, then you can add images.
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}>
                <Button onClick={onClose} variant="outlined">Cancel</Button>
                <Button onClick={() => void handleSave()} variant="contained" disabled={saving || !title.trim()}>
                    {saving ? "Saving..." : isNew ? "Create" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================================
// CATEGORY DIALOG
// ============================================================

function CategoryDialog({
    open,
    onClose,
    category,
    categories,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    category: CategoryNode | null;
    categories: CategoryNode[];
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState<number | "">("");
    const isNew = !category;

    useEffect(() => {
        if (category) {
            setName(category.name);
            setParentId(category.parent_id || "");
        } else {
            setName("");
            setParentId("");
        }
    }, [category, open]);

    const flatCats = flattenCategories(categories).filter((c) => c.id !== category?.id);

    const handleSave = async () => {
        if (!name.trim()) return;
        const data = { name: name.trim(), parent_id: parentId || null, sort_order: 0 };
        if (category) {
            await updateCategory(category.id, data);
        } else {
            await createCategory(data);
        }
        onSaved();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{isNew ? "New Category" : "Edit Category"}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Revetements Sols" />
                    <FormControl fullWidth>
                        <InputLabel>Parent Category</InputLabel>
                        <Select value={parentId} label="Parent Category" onChange={(e) => setParentId(e.target.value as number | "")}>
                            <MenuItem value="">None (top level)</MenuItem>
                            {flatCats.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined">Cancel</Button>
                <Button onClick={() => void handleSave()} variant="contained" disabled={!name.trim()}>
                    {isNew ? "Create" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================

function ResourcesPage() {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);

    const loadCategories = useCallback(async () => {
        const cats = await getCategories();
        setCategories(cats);
    }, []);

    const loadBlocks = useCallback(async () => {
        const params: { category_id?: number; search?: string } = {};
        if (selectedCategoryId) params.category_id = selectedCategoryId;
        if (searchQuery.trim()) params.search = searchQuery.trim();
        const data = await getBlocks(params);
        setBlocks(data);
    }, [selectedCategoryId, searchQuery]);

    useEffect(() => {
        void loadCategories().then(() => setLoading(false));
    }, [loadCategories]);

    useEffect(() => {
        void loadBlocks();
    }, [loadBlocks]);

    const handleDeleteBlock = async (id: number) => {
        if (!window.confirm("Delete this resource?")) return;
        await deleteBlock(id);
        void loadBlocks();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Delete this category? Blocks will become uncategorized.")) return;
        await deleteCategory(id);
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        void loadCategories();
        void loadBlocks();
    };

    const handleEditBlock = (block: ContentBlock) => {
        setEditingBlock(block);
        setBlockDialogOpen(true);
    };

    const handleNewBlock = () => {
        setEditingBlock(null);
        setBlockDialogOpen(true);
    };

    const handleEditCategory = (cat: CategoryNode) => {
        setEditingCategory(cat);
        setCatDialogOpen(true);
    };

    const handleNewCategory = () => {
        setEditingCategory(null);
        setCatDialogOpen(true);
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}><Typography>Loading...</Typography></Box>
            </Container>
        );
    }

    return (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Sidebar */}
            <Box
                sx={{
                    width: 280,
                    minWidth: 280,
                    borderRight: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    overflow: "hidden",
                }}
            >
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem", color: "text.secondary" }}>
                            Categories
                        </Typography>
                        <Tooltip title="New category">
                            <IconButton size="small" onClick={handleNewCategory}>
                                <Plus size={15} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
                <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
                    {/* All items */}
                    <Box
                        onClick={() => setSelectedCategoryId(null)}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 2,
                            py: 0.75,
                            cursor: "pointer",
                            bgcolor: selectedCategoryId === null ? "grey.100" : "transparent",
                            "&:hover": { bgcolor: "grey.50" },
                        }}
                    >
                        <Database size={15} />
                        <Typography variant="body2" sx={{ fontWeight: selectedCategoryId === null ? 600 : 400 }}>
                            All Resources
                        </Typography>
                    </Box>

                    {categories.map((cat) => (
                        <CategoryTreeItem
                            key={cat.id}
                            node={cat}
                            selectedId={selectedCategoryId}
                            onSelect={setSelectedCategoryId}
                            onEdit={handleEditCategory}
                            onDelete={(id) => void handleDeleteCategory(id)}
                        />
                    ))}
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Toolbar */}
                <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <TextField
                            size="small"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ width: 320 }}
                            slotProps={{
                                input: {
                                    startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>,
                                },
                            }}
                        />
                        <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleNewBlock}>
                            Add Resource
                        </Button>
                    </Stack>
                </Box>

                {/* Blocks Grid */}
                <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                    {blocks.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Box sx={{ mb: 2, opacity: 0.3 }}><Database size={48} /></Box>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                {searchQuery ? "No results found" : "No resources yet"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {searchQuery ? "Try a different search term." : "Add your first material, specification, or description block."}
                            </Typography>
                            {!searchQuery && (
                                <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleNewBlock}>
                                    Add Resource
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                                {blocks.length} resource{blocks.length !== 1 ? "s" : ""}
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
                                {blocks.map((block) => (
                                    <BlockCard
                                        key={block.id}
                                        block={block}
                                        onEdit={handleEditBlock}
                                        onDelete={(id) => void handleDeleteBlock(id)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Dialogs */}
            <BlockEditDialog
                open={blockDialogOpen}
                onClose={() => setBlockDialogOpen(false)}
                block={editingBlock}
                categories={categories}
                onSaved={() => void loadBlocks()}
            />
            <CategoryDialog
                open={catDialogOpen}
                onClose={() => setCatDialogOpen(false)}
                category={editingCategory}
                categories={categories}
                onSaved={() => void loadCategories()}
            />
        </Box>
    );
}

// ============================================================
// HELPERS
// ============================================================

function flattenCategories(nodes: CategoryNode[], depth = 0): { id: number; name: string; depth: number }[] {
    const result: { id: number; name: string; depth: number }[] = [];
    for (const node of nodes) {
        result.push({ id: node.id, name: node.name, depth });
        if (node.children.length > 0) {
            result.push(...flattenCategories(node.children, depth + 1));
        }
    }
    return result;
}

export default ResourcesPage;