import { useEffect, useState, useCallback } from "react";
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    Grid,
    Alert,
} from "@mui/material";
import { Save, Upload, Building2, User, CreditCard, Globe } from "lucide-react";
import type { CompanyProfileData } from "../api";
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo, getLogoUrl } from "../api";

function SettingsPage() {
    const [profile, setProfile] = useState<CompanyProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getCompanyProfile();
            setProfile(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setSaved(false);
        try {
            const updated = await updateCompanyProfile(profile);
            setProfile(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await uploadCompanyLogo(file);
        if (profile) {
            setProfile({ ...profile, logo_path: result.logo_path });
        }
    };

    const updateField = (field: keyof CompanyProfileData, value: string) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value });
    };

    if (loading || !profile) {
        return <Container maxWidth="md"><Box sx={{ py: 4 }}><Typography>Loading...</Typography></Box></Container>;
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>Settings</Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save size={16} />}
                        onClick={() => void handleSave()}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </Stack>

                {saved && <Alert severity="success" sx={{ mb: 3 }}>Settings saved successfully.</Alert>}

                {/* Company Info */}
                <Paper sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
                        <Building2 size={18} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Company Information</Typography>
                    </Stack>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField fullWidth label="Company Name" value={profile.name} onChange={(e) => updateField("name", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="City" value={profile.city} onChange={(e) => updateField("city", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Address" value={profile.address} onChange={(e) => updateField("address", e.target.value)} multiline rows={2} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Phone" value={profile.phone} onChange={(e) => updateField("phone", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Email" value={profile.email} onChange={(e) => updateField("email", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Website" value={profile.website} onChange={(e) => updateField("website", e.target.value)} />
                        </Grid>
                    </Grid>

                    {/* Logo */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Logo</Typography>
                        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
                            {profile.logo_path && (
                                <Box
                                    component="img"
                                    src={getLogoUrl(profile.logo_path)}
                                    sx={{ height: 60, objectFit: "contain", border: "1px solid", borderColor: "divider", p: 0.5 }}
                                />
                            )}
                            <Button variant="outlined" component="label" startIcon={<Upload size={14} />} size="small">
                                Upload Logo
                                <input type="file" hidden accept="image/*" onChange={(e) => void handleLogoUpload(e)} />
                            </Button>
                        </Stack>
                    </Box>
                </Paper>

                {/* Architect */}
                <Paper sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
                        <User size={18} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Architect / Representative</Typography>
                    </Stack>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Full Name" value={profile.architect_name} onChange={(e) => updateField("architect_name", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Title" value={profile.architect_title} onChange={(e) => updateField("architect_title", e.target.value)} placeholder="Architecte DPLG" />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Legal IDs */}
                <Paper sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
                        <Globe size={18} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Legal Identifiers</Typography>
                    </Stack>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="RC Number" value={profile.rc_number} onChange={(e) => updateField("rc_number", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="CNSS Number" value={profile.cnss_number} onChange={(e) => updateField("cnss_number", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="IF Number" value={profile.if_number} onChange={(e) => updateField("if_number", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="ICE Number" value={profile.ice_number} onChange={(e) => updateField("ice_number", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Patente Number" value={profile.patente_number} onChange={(e) => updateField("patente_number", e.target.value)} />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Bank Info */}
                <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
                        <CreditCard size={18} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Bank Information</Typography>
                    </Stack>
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Bank Name" value={profile.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Agency" value={profile.bank_agency} onChange={(e) => updateField("bank_agency", e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Account Number (RIB)" value={profile.bank_account} onChange={(e) => updateField("bank_account", e.target.value)} />
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Container>
    );
}

export default SettingsPage;