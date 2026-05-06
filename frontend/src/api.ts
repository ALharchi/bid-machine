const API_BASE = "http://localhost:8000";

// --- Types ---

export interface ParsedBid {
    reference: string;
    objet: string;
    acheteur: string;
    date_limite: string;
    procedure: string;
    categorie: string;
    lieu_execution: string;
}

export interface Project {
    id: number;
    reference: string;
    objet: string;
    acheteur: string;
    date_limite: string;
    procedure: string;
    categorie: string;
    lieu_execution: string;
    source_url: string;
    status: string;
    created_at: string;
    has_documents: boolean;
}

export interface FileNode {
    name: string;
    path: string;
    type: "file" | "directory";
    size?: number;
    children?: FileNode[];
}

export interface CategoryNode {
    id: number;
    name: string;
    parent_id: number | null;
    sort_order: number;
    children: CategoryNode[];
}

export interface ContentImage {
    id: number;
    content_block_id: number;
    file_path: string;
    file_name: string;
    caption: string;
    sort_order: number;
}

export interface ContentBlock {
    id: number;
    category_id: number | null;
    title: string;
    body: string;
    tags: string;
    metadata_json: string;
    usage_count: number;
    created_at: string;
    updated_at: string;
    images: ContentImage[];
}

// --- Projects ---

export async function parseUrl(url: string): Promise<ParsedBid> {
    const res = await fetch(`${API_BASE}/api/parse-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to parse URL"); }
    return res.json();
}

export async function parseHtml(html: string): Promise<ParsedBid> {
    const res = await fetch(`${API_BASE}/api/parse-html`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html }) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to parse HTML"); }
    return res.json();
}

export async function getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/api/projects`);
    return res.json();
}

export async function getProject(id: number): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`);
    if (!res.ok) throw new Error("Project not found");
    return res.json();
}

export async function createProject(data: Omit<Project, "id" | "status" | "created_at" | "has_documents">): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
}

export async function deleteProject(id: number): Promise<void> {
    await fetch(`${API_BASE}/api/projects/${id}`, { method: "DELETE" });
}

export async function uploadZip(projectId: number, file: File): Promise<{ files: FileNode[] }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/upload`, { method: "POST", body: formData });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Upload failed"); }
    return res.json();
}

export async function getProjectFiles(projectId: number): Promise<{ files: FileNode[] }> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/files`);
    return res.json();
}

export function getDownloadUrl(projectId: number, filePath: string): string {
    return `${API_BASE}/api/projects/${projectId}/files/download?path=${encodeURIComponent(filePath)}`;
}

export function getPreviewUrl(projectId: number, filePath: string): string {
    return `${API_BASE}/api/projects/${projectId}/files/preview?path=${encodeURIComponent(filePath)}`;
}

export function isPreviewable(filename: string): boolean {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return ["pdf", "png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "xlsx", "xls", "csv", "docx", "txt"].includes(ext);
}

// --- Categories ---

export async function getCategories(): Promise<CategoryNode[]> {
    const res = await fetch(`${API_BASE}/api/categories`);
    return res.json();
}

export async function createCategory(data: { name: string; parent_id?: number | null; sort_order?: number }): Promise<CategoryNode> {
    const res = await fetch(`${API_BASE}/api/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
}

export async function updateCategory(id: number, data: { name: string; parent_id?: number | null; sort_order?: number }): Promise<CategoryNode> {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update category");
    return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
    await fetch(`${API_BASE}/api/categories/${id}`, { method: "DELETE" });
}

// --- Content Blocks ---

export async function getBlocks(params?: { category_id?: number; search?: string }): Promise<ContentBlock[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.set("category_id", String(params.category_id));
    if (params?.search) query.set("search", params.search);
    const res = await fetch(`${API_BASE}/api/blocks?${query.toString()}`);
    return res.json();
}

export async function getBlock(id: number): Promise<ContentBlock> {
    const res = await fetch(`${API_BASE}/api/blocks/${id}`);
    if (!res.ok) throw new Error("Block not found");
    return res.json();
}

export async function createBlock(data: { category_id?: number | null; title: string; body?: string; tags?: string; metadata_json?: string }): Promise<ContentBlock> {
    const res = await fetch(`${API_BASE}/api/blocks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to create block");
    return res.json();
}

export async function updateBlock(id: number, data: { category_id?: number | null; title?: string; body?: string; tags?: string; metadata_json?: string }): Promise<ContentBlock> {
    const res = await fetch(`${API_BASE}/api/blocks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update block");
    return res.json();
}

export async function deleteBlock(id: number): Promise<void> {
    await fetch(`${API_BASE}/api/blocks/${id}`, { method: "DELETE" });
}

export async function uploadBlockImage(blockId: number, file: File, caption?: string): Promise<ContentImage> {
    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);
    const res = await fetch(`${API_BASE}/api/blocks/${blockId}/images`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to upload image");
    return res.json();
}

export async function deleteBlockImage(blockId: number, imageId: number): Promise<void> {
    await fetch(`${API_BASE}/api/blocks/${blockId}/images/${imageId}`, { method: "DELETE" });
}

export function getLibraryImageUrl(filePath: string): string {
    return `${API_BASE}/api/library/images/${filePath}`;
}


// --- Layouts ---

export interface LayoutPageData {
    id: number;
    layout_id: number;
    name: string;
    page_type: string;
    html_content: string;
    css_content: string;
    sort_order: number;
}

export interface LayoutData {
    id: number;
    name: string;
    page_size: string;
    orientation: string;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
    global_css: string;
    created_at: string;
    updated_at: string;
    pages: LayoutPageData[];
}

export async function getLayouts(): Promise<LayoutData[]> {
    const res = await fetch(`${API_BASE}/api/layouts`);
    return res.json();
}

export async function getLayout(id: number): Promise<LayoutData> {
    const res = await fetch(`${API_BASE}/api/layouts/${id}`);
    if (!res.ok) throw new Error("Layout not found");
    return res.json();
}

export async function createLayout(data: { name: string; page_size?: string; orientation?: string; margin_top?: number; margin_bottom?: number; margin_left?: number; margin_right?: number }): Promise<LayoutData> {
    const res = await fetch(`${API_BASE}/api/layouts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to create layout");
    return res.json();
}

export async function updateLayout(id: number, data: { name?: string; page_size?: string; orientation?: string; margin_top?: number; margin_bottom?: number; margin_left?: number; margin_right?: number; global_css?: string }): Promise<LayoutData> {
    const res = await fetch(`${API_BASE}/api/layouts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update layout");
    return res.json();
}

export async function deleteLayout(id: number): Promise<void> {
    await fetch(`${API_BASE}/api/layouts/${id}`, { method: "DELETE" });
}

export async function createLayoutPage(layoutId: number, data: { name: string; page_type?: string; html_content?: string; css_content?: string; sort_order?: number }): Promise<LayoutPageData> {
    const res = await fetch(`${API_BASE}/api/layouts/${layoutId}/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to create page");
    return res.json();
}

export async function updateLayoutPage(layoutId: number, pageId: number, data: { name?: string; page_type?: string; html_content?: string; css_content?: string; sort_order?: number }): Promise<LayoutPageData> {
    const res = await fetch(`${API_BASE}/api/layouts/${layoutId}/pages/${pageId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update page");
    return res.json();
}

export async function deleteLayoutPage(layoutId: number, pageId: number): Promise<void> {
    await fetch(`${API_BASE}/api/layouts/${layoutId}/pages/${pageId}`, { method: "DELETE" });
}

export function getLayoutPdfUrl(layoutId: number): string {
    return `${API_BASE}/api/layouts/${layoutId}/preview-pdf`;
}

export function getLayoutPreviewHtmlUrl(layoutId: number): string {
    return `${API_BASE}/api/layouts/${layoutId}/preview-html`;
}

// --- Settings ---

export interface CompanyProfileData {
    id: number;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    architect_name: string;
    architect_title: string;
    rc_number: string;
    cnss_number: string;
    if_number: string;
    ice_number: string;
    patente_number: string;
    bank_name: string;
    bank_agency: string;
    bank_account: string;
    logo_path: string;
}

export async function getCompanyProfile(): Promise<CompanyProfileData> {
    const res = await fetch(`${API_BASE}/api/settings/company`);
    return res.json();
}

export async function updateCompanyProfile(data: Partial<CompanyProfileData>): Promise<CompanyProfileData> {
    const res = await fetch(`${API_BASE}/api/settings/company`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
}

export async function uploadCompanyLogo(file: File): Promise<{ logo_path: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/settings/company/logo`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to upload logo");
    return res.json();
}

export function getLogoUrl(path: string): string {
    return `${API_BASE}/api/settings/logo/${path}`;
}