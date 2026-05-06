import {useState, useEffect} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
} from "@mui/material";
import {X, Download, FileText} from "lucide-react";
import {getPreviewUrl, getDownloadUrl} from "../api";

interface FilePreviewDialogProps {
    open: boolean;
    onClose: () => void;
    fileName: string;
    filePath: string;
    projectId: number;
}

function FilePreviewDialog({open, onClose, fileName, filePath, projectId}: FilePreviewDialogProps) {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const previewUrl = getPreviewUrl(projectId, filePath);
    const downloadUrl = getDownloadUrl(projectId, filePath);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slotProps={{
                paper: {
                    sx: {height: "85vh", maxHeight: "85vh", display: "flex", flexDirection: "column"},
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1.5,
                    px: 3,
                }}
            >
                <Box sx={{display: "flex", alignItems: "center", gap: 1.5, overflow: "hidden"}}>
                    <FileText size={18}/>
                    <Typography
                        variant="body1"
                        sx={{fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}
                    >
                        {fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{textTransform: "uppercase"}}>
                        {ext}
                    </Typography>
                </Box>
                <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                    <IconButton
                        size="small"
                        component="a"
                        href={downloadUrl}
                        title="Download"
                    >
                        <Download size={16}/>
                    </IconButton>
                    <IconButton size="small" onClick={onClose}>
                        <X size={18}/>
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{p: 0, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
                <PreviewContent ext={ext} previewUrl={previewUrl}/>
            </DialogContent>
        </Dialog>
    );
}

function PreviewContent({ext, previewUrl}: { ext: string; previewUrl: string }) {
    if (["pdf"].includes(ext)) {
        return <PdfPreview url={previewUrl}/>;
    }
    if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) {
        return <ImagePreview url={previewUrl}/>;
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
        return <ExcelPreview url={previewUrl}/>;
    }
    if (["docx"].includes(ext)) {
        return <DocxPreview url={previewUrl}/>;
    }
    if (["txt"].includes(ext)) {
        return <TextPreview url={previewUrl}/>;
    }
    return (
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "center", flex: 1}}>
            <Typography color="text.secondary">Preview not available for this file type.</Typography>
        </Box>
    );
}

function PdfPreview({url}: { url: string }) {
    return (
        <iframe
            src={url}
            style={{width: "100%", height: "100%", border: "none", flex: 1}}
            title="PDF Preview"
        />
    );
}

function ImagePreview({url}: { url: string }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                p: 3,
                overflow: "auto",
                bgcolor: "grey.100",
            }}
        >
            <img
                src={url}
                alt="Preview"
                style={{maxWidth: "100%", maxHeight: "100%", objectFit: "contain"}}
            />
        </Box>
    );
}

function TextPreview({url}: { url: string }) {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(url)
            .then((res) => res.text())
            .then((text) => {
                setContent(text);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [url]);

    if (loading) return <LoadingState/>;

    return (
        <Box sx={{flex: 1, overflow: "auto", p: 3, bgcolor: "grey.50"}}>
            <Typography
                component="pre"
                variant="body2"
                sx={{fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", m: 0}}
            >
                {content}
            </Typography>
        </Box>
    );
}

function ExcelPreview({url}: { url: string }) {
    const [sheets, setSheets] = useState<{ name: string; data: string[][] }[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(url);
                const buffer = await res.arrayBuffer();
                const XLSX = await import("xlsx");
                const workbook = XLSX.read(buffer, {type: "array"});
                const parsed = workbook.SheetNames.map((name) => {
                    const sheet = workbook.Sheets[name];
                    const data = XLSX.utils.sheet_to_json<string[]>(sheet, {header: 1}) as string[][];
                    return {name, data};
                });
                setSheets(parsed);
            } catch {
                setError("Failed to parse spreadsheet");
            } finally {
                setLoading(false);
            }
        })();
    }, [url]);

    if (loading) return <LoadingState/>;
    if (error) return <ErrorState message={error}/>;
    if (sheets.length === 0) return <ErrorState message="No data found"/>;

    const current = sheets[activeTab];

    return (
        <Box sx={{flex: 1, display: "flex", flexDirection: "column", overflow: "hidden"}}>
            {sheets.length > 1 && (
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{borderBottom: 1, borderColor: "divider", minHeight: 36, bgcolor: "grey.50"}}
                >
                    {sheets.map((s, i) => (
                        <Tab key={i} label={s.name} sx={{minHeight: 36, py: 0, textTransform: "none"}}/>
                    ))}
                </Tabs>
            )}
            <TableContainer component={Paper} sx={{flex: 1, overflow: "auto", boxShadow: "none"}}>
                <Table size="small" stickyHeader>
                    {current.data.length > 0 && (
                        <TableHead>
                            <TableRow>
                                {current.data[0].map((cell, ci) => (
                                    <TableCell
                                        key={ci}
                                        sx={{
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                            bgcolor: "grey.100",
                                            fontSize: "0.75rem"
                                        }}
                                    >
                                        {cell ?? ""}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                    )}
                    <TableBody>
                        {current.data.slice(1, 200).map((row, ri) => (
                            <TableRow key={ri} hover>
                                {row.map((cell, ci) => (
                                    <TableCell key={ci} sx={{whiteSpace: "nowrap", fontSize: "0.75rem"}}>
                                        {cell ?? ""}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {current.data.length > 201 && (
                <Typography variant="caption" color="text.secondary"
                            sx={{p: 1, textAlign: "center", borderTop: 1, borderColor: "divider"}}>
                    Showing first 200 rows of {current.data.length - 1}
                </Typography>
            )}
        </Box>
    );
}

function DocxPreview({url}: { url: string }) {
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(url);
                const buffer = await res.arrayBuffer();
                const mammoth = await import("mammoth");
                const result = await mammoth.convertToHtml({arrayBuffer: buffer});
                setHtml(result.value);
            } catch {
                setError("Failed to parse document");
            } finally {
                setLoading(false);
            }
        })();
    }, [url]);

    if (loading) return <LoadingState/>;
    if (error) return <ErrorState message={error}/>;

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                p: 4,
                "& img": {maxWidth: "100%"},
                "& table": {borderCollapse: "collapse", width: "100%"},
                "& td, & th": {border: "1px solid #ddd", p: 1},
                fontSize: "0.875rem",
                lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{__html: html}}
        />
    );
}

function LoadingState() {
    return (
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 2}}>
            <CircularProgress size={24}/>
            <Typography color="text.secondary">Loading preview...</Typography>
        </Box>
    );
}

function ErrorState({message}: { message: string }) {
    return (
        <Box sx={{display: "flex", alignItems: "center", justifyContent: "center", flex: 1}}>
            <Typography color="error">{message}</Typography>
        </Box>
    );
}

export default FilePreviewDialog;