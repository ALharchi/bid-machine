import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Typography,
    Box,
    Button,
    TextField,
    Stack,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, Link2, CheckCircle, Upload, SkipForward } from "lucide-react";
import type { ParsedBid } from "../api";
import { parseUrl, parseHtml, createProject, uploadZip } from "../api";

const steps = ["Enter URL", "Review Information", "Upload Documents"];

function AddProjectPage() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [htmlFallback, setHtmlFallback] = useState(false);
    const [rawHtml, setRawHtml] = useState("");
    const [parsedData, setParsedData] = useState<ParsedBid>({
        reference: "",
        objet: "",
        acheteur: "",
        date_limite: "",
        procedure: "",
        categorie: "",
        lieu_execution: "",
    });
    const [projectId, setProjectId] = useState<number | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleParseUrl = async () => {
        if (!url.trim()) {
            setError("Please enter a URL");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const data = await parseUrl(url);
            setParsedData(data);
            setActiveStep(1);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to parse URL";
            setError(msg + " -- Try pasting the page HTML below instead.");
            setHtmlFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const handleParseHtml = async () => {
        if (!rawHtml.trim()) {
            setError("Please paste the page HTML");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const data = await parseHtml(rawHtml);
            setParsedData(data);
            setActiveStep(1);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to parse HTML";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError("");
        try {
            const project = await createProject({
                ...parsedData,
                source_url: url,
            });
            setProjectId(project.id);
            setActiveStep(2);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to create project";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadedFile || !projectId) return;
        setUploading(true);
        setError("");
        try {
            await uploadZip(projectId, uploadedFile);
            navigate(`/projects/${projectId}`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Upload failed";
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleSkipUpload = () => {
        if (projectId) {
            navigate(`/projects/${projectId}`);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setUploadedFile(acceptedFiles[0]);
            }
        },
        accept: { "application/zip": [".zip"] },
        multiple: false,
    });

    const updateField = (field: keyof ParsedBid, value: string) => {
        setParsedData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Button
                    onClick={() => navigate("/projects")}
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ mb: 3, color: "text.secondary" }}
                >
                    Back to Projects
                </Button>

                <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                    Add New Project
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Tender URL
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Paste the URL of the bid consultation page. The system will extract the relevant information automatically.
                        </Typography>
                        <TextField
                            fullWidth
                            label="URL"
                            placeholder="https://www.marchespublics.gov.ma/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={loading ? undefined : <Link2 size={18} />}
                            onClick={() => void handleParseUrl()}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Parse URL"}
                        </Button>

                        {htmlFallback && (
                            <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    The URL could not be fetched (site may block automated requests).
                                    Open the page in your browser, right-click, "View Page Source", copy all, and paste below:
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Page HTML Source"
                                    multiline
                                    rows={8}
                                    value={rawHtml}
                                    onChange={(e) => setRawHtml(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => void handleParseHtml()}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "Parse HTML"}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}

                {activeStep === 1 && (
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Review Extracted Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Verify and edit the extracted data. Click confirm when everything looks correct.
                        </Typography>
                        <Stack spacing={2.5}>
                            <TextField fullWidth label="Reference" value={parsedData.reference} onChange={(e) => updateField("reference", e.target.value)} />
                            <TextField fullWidth label="Objet" value={parsedData.objet} onChange={(e) => updateField("objet", e.target.value)} multiline rows={3} />
                            <TextField fullWidth label="Acheteur Public" value={parsedData.acheteur} onChange={(e) => updateField("acheteur", e.target.value)} />
                            <TextField fullWidth label="Date Limite de Remise des Plis" value={parsedData.date_limite} onChange={(e) => updateField("date_limite", e.target.value)} />
                            <TextField fullWidth label="Procedure" value={parsedData.procedure} onChange={(e) => updateField("procedure", e.target.value)} />
                            <TextField fullWidth label="Categorie" value={parsedData.categorie} onChange={(e) => updateField("categorie", e.target.value)} />
                            <TextField fullWidth label="Lieu d'execution" value={parsedData.lieu_execution} onChange={(e) => updateField("lieu_execution", e.target.value)} />
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={() => setActiveStep(0)}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={loading ? undefined : <CheckCircle size={18} />}
                                onClick={() => void handleConfirm()}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : "Confirm & Continue"}
                            </Button>
                        </Stack>
                    </Paper>
                )}

                {activeStep === 2 && (
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Upload Documents
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Upload a ZIP file containing the bid documents.
                        </Typography>
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
                                mb: 3,
                                "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                            }}
                        >
                            <input {...getInputProps()} />
                            {uploadedFile ? (
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{uploadedFile.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <Box sx={{ mb: 1.5, opacity: 0.4 }}>
                                        <Upload size={32} />
                                    </Box>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        {isDragActive ? "Drop the ZIP file here" : "Drag & drop a ZIP file here, or click to select"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Only .zip files are accepted</Typography>
                                </Box>
                            )}
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" startIcon={<SkipForward size={16} />} onClick={handleSkipUpload}>
                                Skip for now
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={uploading ? undefined : <Upload size={18} />}
                                onClick={() => void handleUpload()}
                                disabled={!uploadedFile || uploading}
                            >
                                {uploading ? <CircularProgress size={24} /> : "Upload & Finish"}
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Box>
        </Container>
    );
}

export default AddProjectPage;