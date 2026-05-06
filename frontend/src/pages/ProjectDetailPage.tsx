import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Grid,
    Chip,
    Stack,
    Collapse,
    IconButton,
    Tooltip,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import {
    ArrowLeft,
    Folder,
    FolderOpen,
    FileText,
    FileImage,
    FileSpreadsheet,
    File as FileIcon,
    Download,
    Upload,
    Clock,
    MapPin,
    Building2,
    Scale,
    Tag,
    ExternalLink,
    ChevronRight,
    ChevronDown,
    Eye,
} from "lucide-react";
import type { Project, FileNode } from "../api";
import { getProject, getProjectFiles, uploadZip, getDownloadUrl, isPreviewable } from "../api";
import FilePreviewDialog from "../components/FilePreviewDialog";

function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(ext)) {
        return <FileText size={16} />;
    }
    if (["png", "jpg", "jpeg", "gif", "svg", "bmp", "webp", "tiff"].includes(ext)) {
        return <FileImage size={16} />;
    }
    if (["xls", "xlsx", "csv", "ods"].includes(ext)) {
        return <FileSpreadsheet size={16} />;
    }
    return <FileIcon size={16} />;
}

function formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function FileTreeItem({
    node,
    depth = 0,
    projectId,
    onPreview,
}: {
    node: FileNode;
    depth?: number;
    projectId: number;
    onPreview: (name: string, path: string) => void;
}) {
    const [open, setOpen] = useState(true);
    const isDir = node.type === "directory";
    const canPreview = !isDir && isPreviewable(node.name);

    const handleRowClick = () => {
        if (isDir) {
            setOpen(!open);
        } else if (canPreview) {
            onPreview(node.name, node.path);
        }
    };

    return (
        <Box>
            <Box
                onClick={handleRowClick}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pl: 2 + depth * 2.5,
                    pr: 1.5,
                    py: 1,
                    cursor: isDir || canPreview ? "pointer" : "default",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "grey.50" },
                    transition: "background-color 0.15s",
                }}
            >
                {isDir ? (
                    <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Box>
                ) : (
                    <Box sx={{ width: 14 }} />
                )}

                <Box sx={{ display: "flex", alignItems: "center", color: isDir ? "primary.main" : "text.secondary" }}>
                    {isDir ? (open ? <FolderOpen size={16} /> : <Folder size={16} />) : getFileIcon(node.name)}
                </Box>

                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: isDir ? 600 : 400,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {node.name}
                </Typography>

                {!isDir && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                        {node.size !== undefined && (
                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                {formatSize(node.size)}
                            </Typography>
                        )}
                        {canPreview && (
                            <Tooltip title="Preview">
                                <IconButton
                                    size="small"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onPreview(node.name, node.path);
                                    }}
                                    sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                                >
                                    <Eye size={15} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Download">
                            <IconButton
                                size="small"
                                component="a"
                                href={getDownloadUrl(projectId, node.path)}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                            >
                                <Download size={15} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>
            {isDir && node.children && (
                <Collapse in={open}>
                    {node.children.map((child) => (
                        <FileTreeItem
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            projectId={projectId}
                            onPreview={onPreview}
                        />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState({ name: "", path: "" });

    const handlePreview = (name: string, path: string) => {
        setPreviewFile({ name, path });
        setPreviewOpen(true);
    };

    const load = useCallback(async () => {
        if (!id) return;
        try {
            const p = await getProject(Number(id));
            setProject(p);
            if (p.has_documents) {
                const f = await getProjectFiles(Number(id));
                setFiles(f.files);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0 && project) {
                setUploading(true);
                uploadZip(project.id, acceptedFiles[0])
                    .then((result) => {
                        setFiles(result.files);
                        setProject({ ...project, has_documents: true });
                    })
                    .finally(() => {
                        setUploading(false);
                    });
            }
        },
        accept: { "application/zip": [".zip"] },
        multiple: false,
    });

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}><Typography>Loading...</Typography></Box>
            </Container>
        );
    }

    if (!project) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}><Typography>Project not found</Typography></Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Button
                    onClick={() => navigate("/projects")}
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ mb: 3, color: "text.secondary" }}
                >
                    Back to Projects
                </Button>

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {project.reference}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 700 }}>
                            {project.objet}
                        </Typography>
                    </Box>
                    <Chip
                        label={project.status.toUpperCase()}
                        variant="outlined"
                        color={project.status === "active" ? "success" : "default"}
                    />
                </Stack>

                <Paper sx={{ p: 3, mb: 4, border: "1px solid", borderColor: "divider" }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Building2 size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Acheteur Public
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.acheteur}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Clock size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Date Limite
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.date_limite}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <MapPin size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Lieu d'Execution
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.lieu_execution}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Scale size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Procedure
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.procedure}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Tag size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Categorie
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{project.categorie}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <ExternalLink size={14} color="#666" />
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                                    Source
                                </Typography>
                            </Box>
                            <Box
                                component="a"
                                href={project.source_url}
                                target="_blank"
                                sx={{ color: "primary.main", fontSize: "0.875rem", textDecoration: "underline" }}
                            >
                                View Original
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Documents</Typography>
                    {files.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {countFiles(files)} file{countFiles(files) !== 1 ? "s" : ""}
                        </Typography>
                    )}
                </Stack>

                {files.length > 0 ? (
                    <>
                        <Paper sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                            {files.map((node) => (
                                <FileTreeItem
                                    key={node.path}
                                    node={node}
                                    projectId={project.id}
                                    onPreview={handlePreview}
                                />
                            ))}
                        </Paper>
                        <Box sx={{ mt: 2 }}>
                            <Box
                                {...getRootProps()}
                                sx={{
                                    border: "1px dashed",
                                    borderColor: "divider",
                                    p: 2,
                                    textAlign: "center",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 1,
                                    "&:hover": { borderColor: "primary.main", bgcolor: "grey.50" },
                                }}
                            >
                                <input {...getInputProps()} />
                                <Upload size={14} />
                                <Typography variant="body2" color="text.secondary">
                                    {uploading ? "Uploading..." : "Replace documents (drop or click to upload new ZIP)"}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                ) : (
                    <Box
                        {...getRootProps()}
                        sx={{
                            border: "2px dashed",
                            borderColor: isDragActive ? "primary.main" : "divider",
                            bgcolor: isDragActive ? "action.hover" : "grey.50",
                            p: 6,
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                        }}
                    >
                        <input {...getInputProps()} />
                        <Box sx={{ mb: 1.5, opacity: 0.4 }}><Upload size={32} /></Box>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            {uploading ? "Uploading..." : isDragActive ? "Drop the ZIP file here" : "No documents yet. Drag & drop a ZIP file here to upload."}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Only .zip files are accepted</Typography>
                    </Box>
                )}
            </Box>

            {/* Preview Dialog */}
            <FilePreviewDialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                fileName={previewFile.name}
                filePath={previewFile.path}
                projectId={project.id}
            />
        </Container>
    );
}

function countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
        if (node.type === "file") {
            count++;
        } else if (node.children) {
            count += countFiles(node.children);
        }
    }
    return count;
}

export default ProjectDetailPage;