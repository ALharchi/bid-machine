from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from sqlmodel import Session, select
import httpx
from bs4 import BeautifulSoup
import zipfile
import shutil
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from .database import create_db_and_tables, get_session
from .models import (
    Project, ProjectCreate, ParsedBid,
    Category, CategoryCreate,
    ContentBlock, ContentBlockCreate, ContentBlockUpdate,
    ContentImage,
    Layout, LayoutCreate, LayoutUpdate,
    LayoutPage, LayoutPageCreate, LayoutPageUpdate,
    CompanyProfile, CompanyProfileUpdate,
)

app = FastAPI(title="Bid Machine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECTS_DIR = Path("/app/data/projects")
LIBRARY_DIR = Path("/app/data/library/images")
SETTINGS_DIR = Path("/app/data/settings")

PAGE_SIZES = {
    "A3": {"width": "420mm", "height": "297mm"},
    "A4": {"width": "297mm", "height": "210mm"},
    "A2": {"width": "594mm", "height": "420mm"},
    "Letter": {"width": "279mm", "height": "216mm"},
    "Tabloid": {"width": "432mm", "height": "279mm"},
}

# Aspect ratios for preview rendering
PAGE_RATIOS = {
    "A3": {"landscape": 420 / 297, "portrait": 297 / 420},
    "A4": {"landscape": 297 / 210, "portrait": 210 / 297},
    "A2": {"landscape": 594 / 420, "portrait": 420 / 594},
    "Letter": {"landscape": 279 / 216, "portrait": 216 / 279},
    "Tabloid": {"landscape": 432 / 279, "portrait": 279 / 432},
}


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    LIBRARY_DIR.mkdir(parents=True, exist_ok=True)
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
def hi():
    return {"message": "Bid Machine API"}


# ============================================================
# PARSE / SCRAPE
# ============================================================

class ParseURLRequest(BaseModel):
    url: str


class ParseHTMLRequest(BaseModel):
    html: str


def extract_bid_data(soup: BeautifulSoup) -> ParsedBid:
    parsed = ParsedBid()
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_dateHeureLimiteRemisePlis")
    if el:
        parsed.date_limite = el.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_reference")
    if el:
        parsed.reference = el.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_objet")
    if el:
        parsed.objet = el.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_entiteAchat")
    if el:
        parsed.acheteur = el.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_typeProcedure")
    if el:
        parsed.procedure = el.get_text(strip=True)
    mode = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_modePassation")
    if mode:
        parsed.procedure += " " + mode.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_categoriePrincipale")
    if el:
        parsed.categorie = el.get_text(strip=True)
    el = soup.find(id="ctl0_CONTENU_PAGE_idEntrepriseConsultationSummary_lieuxExecutions")
    if el:
        parsed.lieu_execution = el.get_text(strip=True)
    return parsed


@app.post("/api/parse-url", response_model=ParsedBid)
async def parse_url(payload: ParseURLRequest):
    url = payload.url
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
    }
    try:
        async with httpx.AsyncClient(timeout=30, verify=False, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    soup = BeautifulSoup(response.text, "html.parser")
    return extract_bid_data(soup)


@app.post("/api/parse-html", response_model=ParsedBid)
async def parse_html(payload: ParseHTMLRequest):
    soup = BeautifulSoup(payload.html, "html.parser")
    return extract_bid_data(soup)


# ============================================================
# PROJECTS
# ============================================================

@app.get("/api/projects", response_model=list[Project])
def list_projects(session: Session = Depends(get_session)):
    return session.exec(select(Project).order_by(Project.id.desc())).all()


@app.post("/api/projects", response_model=Project)
def create_project(data: ProjectCreate, session: Session = Depends(get_session)):
    project = Project(**data.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@app.get("/api/projects/{project_id}", response_model=Project)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dir = PROJECTS_DIR / str(project_id)
    if project_dir.exists():
        shutil.rmtree(project_dir)
    session.delete(project)
    session.commit()
    return {"message": "Deleted"}


@app.post("/api/projects/{project_id}/upload")
async def upload_zip(project_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dir = PROJECTS_DIR / str(project_id)
    if project_dir.exists():
        shutil.rmtree(project_dir)
    project_dir.mkdir(parents=True, exist_ok=True)
    zip_path = project_dir / "upload.zip"
    content = await file.read()
    with open(zip_path, "wb") as f:
        f.write(content)
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(project_dir)
    except zipfile.BadZipFile:
        shutil.rmtree(project_dir)
        raise HTTPException(status_code=400, detail="Invalid zip file")
    zip_path.unlink()
    project.has_documents = True
    session.add(project)
    session.commit()
    return {"message": "Files uploaded successfully", "files": get_file_tree(project_dir)}


@app.get("/api/projects/{project_id}/files")
def list_files(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dir = PROJECTS_DIR / str(project_id)
    if not project_dir.exists():
        return {"files": []}
    return {"files": get_file_tree(project_dir)}


@app.get("/api/projects/{project_id}/files/download")
def download_file(project_id: int, path: str, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dir = PROJECTS_DIR / str(project_id)
    file_path = (project_dir / path).resolve()
    if not str(file_path).startswith(str(project_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(file_path), filename=file_path.name, media_type="application/octet-stream")


@app.get("/api/projects/{project_id}/files/preview")
def preview_file(project_id: int, path: str, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project_dir = PROJECTS_DIR / str(project_id)
    file_path = (project_dir / path).resolve()
    if not str(file_path).startswith(str(project_dir.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    ext = file_path.suffix.lower()
    media_types = {
        ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain", ".csv": "text/csv",
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(path=str(file_path), filename=file_path.name, media_type=media_type, headers={"Content-Disposition": "inline"})


def get_file_tree(base_path: Path, relative_to: Path = None):
    if relative_to is None:
        relative_to = base_path
    items = []
    for item in sorted(base_path.iterdir()):
        if item.name.startswith("."):
            continue
        rel_path = str(item.relative_to(relative_to))
        if item.is_dir():
            children = get_file_tree(item, relative_to)
            items.append({"name": item.name, "path": rel_path, "type": "directory", "children": children})
        else:
            items.append({"name": item.name, "path": rel_path, "type": "file", "size": item.stat().st_size})
    return items


# ============================================================
# CATEGORIES
# ============================================================

@app.get("/api/categories")
def list_categories(session: Session = Depends(get_session)):
    categories = session.exec(select(Category).order_by(Category.sort_order, Category.name)).all()
    return build_category_tree(categories)


@app.post("/api/categories", response_model=Category)
def create_category_endpoint(data: CategoryCreate, session: Session = Depends(get_session)):
    category = Category(**data.model_dump())
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@app.put("/api/categories/{category_id}", response_model=Category)
def update_category_endpoint(category_id: int, data: CategoryCreate, session: Session = Depends(get_session)):
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = data.name
    category.parent_id = data.parent_id
    category.sort_order = data.sort_order
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@app.delete("/api/categories/{category_id}")
def delete_category_endpoint(category_id: int, session: Session = Depends(get_session)):
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    children = session.exec(select(Category).where(Category.parent_id == category_id)).all()
    for child in children:
        child.parent_id = category.parent_id
        session.add(child)
    blocks = session.exec(select(ContentBlock).where(ContentBlock.category_id == category_id)).all()
    for block in blocks:
        block.category_id = None
        session.add(block)
    session.delete(category)
    session.commit()
    return {"message": "Deleted"}


def build_category_tree(categories: list[Category]):
    cat_map = {c.id: {"id": c.id, "name": c.name, "parent_id": c.parent_id, "sort_order": c.sort_order, "children": []} for c in categories}
    roots = []
    for c in categories:
        node = cat_map[c.id]
        if c.parent_id and c.parent_id in cat_map:
            cat_map[c.parent_id]["children"].append(node)
        else:
            roots.append(node)
    return roots


# ============================================================
# CONTENT BLOCKS
# ============================================================

@app.get("/api/blocks")
def list_blocks(category_id: Optional[int] = Query(None), search: Optional[str] = Query(None), session: Session = Depends(get_session)):
    query = select(ContentBlock).order_by(ContentBlock.updated_at.desc())
    if category_id is not None:
        all_cats = session.exec(select(Category)).all()
        cat_ids = get_descendant_ids(category_id, all_cats)
        cat_ids.append(category_id)
        query = query.where(ContentBlock.category_id.in_(cat_ids))
    blocks = session.exec(query).all()
    if search:
        search_lower = search.lower()
        blocks = [b for b in blocks if search_lower in b.title.lower() or search_lower in b.body.lower() or search_lower in b.tags.lower()]
    result = []
    for block in blocks:
        images = session.exec(select(ContentImage).where(ContentImage.content_block_id == block.id).order_by(ContentImage.sort_order)).all()
        result.append({**block.model_dump(), "images": [img.model_dump() for img in images]})
    return result


@app.post("/api/blocks")
def create_block_endpoint(data: ContentBlockCreate, session: Session = Depends(get_session)):
    block = ContentBlock(**data.model_dump())
    session.add(block)
    session.commit()
    session.refresh(block)
    return {**block.model_dump(), "images": []}


@app.get("/api/blocks/{block_id}")
def get_block(block_id: int, session: Session = Depends(get_session)):
    block = session.get(ContentBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    images = session.exec(select(ContentImage).where(ContentImage.content_block_id == block_id).order_by(ContentImage.sort_order)).all()
    return {**block.model_dump(), "images": [img.model_dump() for img in images]}


@app.put("/api/blocks/{block_id}")
def update_block_endpoint(block_id: int, data: ContentBlockUpdate, session: Session = Depends(get_session)):
    block = session.get(ContentBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(block, key, value)
    block.updated_at = datetime.now().isoformat()
    session.add(block)
    session.commit()
    session.refresh(block)
    images = session.exec(select(ContentImage).where(ContentImage.content_block_id == block_id).order_by(ContentImage.sort_order)).all()
    return {**block.model_dump(), "images": [img.model_dump() for img in images]}


@app.delete("/api/blocks/{block_id}")
def delete_block_endpoint(block_id: int, session: Session = Depends(get_session)):
    block = session.get(ContentBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    images = session.exec(select(ContentImage).where(ContentImage.content_block_id == block_id)).all()
    for img in images:
        img_path = LIBRARY_DIR / str(block_id) / img.file_name
        if img_path.exists():
            img_path.unlink()
        session.delete(img)
    img_dir = LIBRARY_DIR / str(block_id)
    if img_dir.exists():
        shutil.rmtree(img_dir)
    session.delete(block)
    session.commit()
    return {"message": "Deleted"}


@app.post("/api/blocks/{block_id}/images")
async def upload_block_image(block_id: int, file: UploadFile = File(...), caption: str = "", session: Session = Depends(get_session)):
    block = session.get(ContentBlock, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    img_dir = LIBRARY_DIR / str(block_id)
    img_dir.mkdir(parents=True, exist_ok=True)
    file_name = file.filename or "image"
    file_path = img_dir / file_name
    counter = 1
    stem = file_path.stem
    suffix = file_path.suffix
    while file_path.exists():
        file_name = f"{stem}_{counter}{suffix}"
        file_path = img_dir / file_name
        counter += 1
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    existing = session.exec(select(ContentImage).where(ContentImage.content_block_id == block_id)).all()
    max_order = max((img.sort_order for img in existing), default=-1)
    image = ContentImage(content_block_id=block_id, file_path=str(file_path.relative_to(LIBRARY_DIR)), file_name=file_name, caption=caption, sort_order=max_order + 1)
    session.add(image)
    session.commit()
    session.refresh(image)
    return image.model_dump()


@app.delete("/api/blocks/{block_id}/images/{image_id}")
def delete_block_image(block_id: int, image_id: int, session: Session = Depends(get_session)):
    image = session.get(ContentImage, image_id)
    if not image or image.content_block_id != block_id:
        raise HTTPException(status_code=404, detail="Image not found")
    file_path = LIBRARY_DIR / image.file_path
    if file_path.exists():
        file_path.unlink()
    session.delete(image)
    session.commit()
    return {"message": "Deleted"}


@app.get("/api/library/images/{path:path}")
def serve_library_image(path: str):
    file_path = (LIBRARY_DIR / path).resolve()
    if not str(file_path).startswith(str(LIBRARY_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    ext = file_path.suffix.lower()
    media_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml"}
    return FileResponse(path=str(file_path), media_type=media_types.get(ext, "image/jpeg"))


def get_descendant_ids(parent_id: int, all_cats: list[Category]) -> list[int]:
    children = [c.id for c in all_cats if c.parent_id == parent_id]
    descendants = list(children)
    for child_id in children:
        descendants.extend(get_descendant_ids(child_id, all_cats))
    return descendants


# ============================================================
# LAYOUTS
# ============================================================

@app.get("/api/layouts")
def list_layouts(session: Session = Depends(get_session)):
    layouts = session.exec(select(Layout).order_by(Layout.updated_at.desc())).all()
    result = []
    for layout in layouts:
        pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout.id).order_by(LayoutPage.sort_order)).all()
        result.append({**layout.model_dump(), "pages": [p.model_dump() for p in pages]})
    return result


@app.post("/api/layouts")
def create_layout(data: LayoutCreate, session: Session = Depends(get_session)):
    layout = Layout(**data.model_dump())
    session.add(layout)
    session.commit()
    session.refresh(layout)
    defaults = [
        LayoutPage(layout_id=layout.id, name="Cover", page_type="cover", sort_order=0, html_content=DEFAULT_COVER_HTML, css_content=""),
        LayoutPage(layout_id=layout.id, name="Table of Contents", page_type="toc", sort_order=1, html_content=DEFAULT_TOC_HTML, css_content=""),
        LayoutPage(layout_id=layout.id, name="Section Divider", page_type="divider", sort_order=2, html_content=DEFAULT_DIVIDER_HTML, css_content=""),
        LayoutPage(layout_id=layout.id, name="Content Page", page_type="content", sort_order=3, html_content=DEFAULT_CONTENT_HTML, css_content=""),
    ]
    for page in defaults:
        session.add(page)
    session.commit()
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout.id).order_by(LayoutPage.sort_order)).all()
    return {**layout.model_dump(), "pages": [p.model_dump() for p in pages]}


@app.get("/api/layouts/{layout_id}")
def get_layout(layout_id: int, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout_id).order_by(LayoutPage.sort_order)).all()
    return {**layout.model_dump(), "pages": [p.model_dump() for p in pages]}


@app.put("/api/layouts/{layout_id}")
def update_layout(layout_id: int, data: LayoutUpdate, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(layout, key, value)
    layout.updated_at = datetime.now().isoformat()
    session.add(layout)
    session.commit()
    session.refresh(layout)
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout_id).order_by(LayoutPage.sort_order)).all()
    return {**layout.model_dump(), "pages": [p.model_dump() for p in pages]}


@app.delete("/api/layouts/{layout_id}")
def delete_layout(layout_id: int, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout_id)).all()
    for page in pages:
        session.delete(page)
    session.delete(layout)
    session.commit()
    return {"message": "Deleted"}


# Layout Pages

@app.post("/api/layouts/{layout_id}/pages")
def create_layout_page(layout_id: int, data: LayoutPageCreate, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    page = LayoutPage(layout_id=layout_id, **data.model_dump())
    session.add(page)
    session.commit()
    session.refresh(page)
    return page.model_dump()


@app.put("/api/layouts/{layout_id}/pages/{page_id}")
def update_layout_page(layout_id: int, page_id: int, data: LayoutPageUpdate, session: Session = Depends(get_session)):
    page = session.get(LayoutPage, page_id)
    if not page or page.layout_id != layout_id:
        raise HTTPException(status_code=404, detail="Page not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(page, key, value)
    page.updated_at = datetime.now().isoformat()
    session.add(page)
    session.commit()
    session.refresh(page)
    return page.model_dump()


@app.delete("/api/layouts/{layout_id}/pages/{page_id}")
def delete_layout_page(layout_id: int, page_id: int, session: Session = Depends(get_session)):
    page = session.get(LayoutPage, page_id)
    if not page or page.layout_id != layout_id:
        raise HTTPException(status_code=404, detail="Page not found")
    session.delete(page)
    session.commit()
    return {"message": "Deleted"}


# PDF Generation

@app.get("/api/layouts/{layout_id}/preview-pdf")
def generate_layout_pdf(layout_id: int, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout_id).order_by(LayoutPage.sort_order)).all()

    size = PAGE_SIZES.get(layout.page_size, PAGE_SIZES["A3"])
    if layout.orientation == "landscape":
        page_width = size["width"]
        page_height = size["height"]
    else:
        page_width = size["height"]
        page_height = size["width"]

    pages_html = ""
    pages_css = ""
    for i, page in enumerate(pages):
        page_class = f"page-{i}"
        pages_html += f'<div class="page {page_class}">{page.html_content}</div>\n'
        if page.css_content:
            pages_css += f".{page_class} {{ {page.css_content} }}\n"

    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

@page {{
    size: {page_width} {page_height};
    margin: {layout.margin_top}mm {layout.margin_right}mm {layout.margin_bottom}mm {layout.margin_left}mm;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Inter', -apple-system, sans-serif; font-size: 10pt; line-height: 1.6; color: #000; }}
.page {{ page-break-after: always; width: 100%; min-height: 100vh; position: relative; padding: 15mm; }}
.page:last-child {{ page-break-after: avoid; }}
h1 {{ font-family: 'Space Grotesk', sans-serif; font-size: 36pt; font-weight: 700; letter-spacing: -0.03em; }}
h2 {{ font-family: 'Space Grotesk', sans-serif; font-size: 20pt; font-weight: 600; letter-spacing: -0.02em; }}
h3 {{ font-family: 'Space Grotesk', sans-serif; font-size: 14pt; font-weight: 600; }}
h4 {{ font-family: 'Space Grotesk', sans-serif; font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
p {{ margin-bottom: 8pt; }}
table {{ width: 100%; border-collapse: collapse; }}
td, th {{ border: 0.5pt solid #E8E8E8; padding: 6pt 8pt; text-align: left; font-size: 9pt; }}
th {{ background: #F9F9F9; font-weight: 600; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }}
{layout.global_css}
{pages_css}
</style>
</head>
<body>
{pages_html}
</body>
</html>"""

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=full_html).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{layout.name}.pdf"'},
    )


@app.get("/api/layouts/{layout_id}/preview-html")
def preview_layout_html(layout_id: int, session: Session = Depends(get_session)):
    layout = session.get(Layout, layout_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    pages = session.exec(select(LayoutPage).where(LayoutPage.layout_id == layout_id).order_by(LayoutPage.sort_order)).all()

    # Calculate aspect ratio for responsive preview
    ratio_data = PAGE_RATIOS.get(layout.page_size, PAGE_RATIOS["A3"])
    aspect_ratio = ratio_data.get(layout.orientation, ratio_data["landscape"])

    pages_html = ""
    pages_css = ""
    for i, page in enumerate(pages):
        page_class = f"page-{i}"
        pages_html += f'<div class="page {page_class}">{page.html_content}</div>\n'
        if page.css_content:
            pages_css += f".{page_class} {{ {page.css_content} }}\n"

    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #000;
    background: #f0f0f0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}}
.page {{
    width: 100%;
    max-width: 100%;
    aspect-ratio: {aspect_ratio};
    background: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
    padding: {layout.margin_top}mm {layout.margin_right}mm {layout.margin_bottom}mm {layout.margin_left}mm;
    position: relative;
    overflow: hidden;
}}
h1 {{ font-family: 'Space Grotesk', sans-serif; font-size: 36pt; font-weight: 700; letter-spacing: -0.03em; }}
h2 {{ font-family: 'Space Grotesk', sans-serif; font-size: 20pt; font-weight: 600; letter-spacing: -0.02em; }}
h3 {{ font-family: 'Space Grotesk', sans-serif; font-size: 14pt; font-weight: 600; }}
h4 {{ font-family: 'Space Grotesk', sans-serif; font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
p {{ margin-bottom: 8pt; }}
table {{ width: 100%; border-collapse: collapse; }}
td, th {{ border: 0.5pt solid #E8E8E8; padding: 6pt 8pt; text-align: left; font-size: 9pt; }}
th {{ background: #F9F9F9; font-weight: 600; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }}
{layout.global_css}
{pages_css}
</style>
</head>
<body>
{pages_html}
</body>
</html>"""

    return Response(content=full_html, media_type="text/html")


# ============================================================
# DEFAULT LAYOUT TEMPLATES
# ============================================================

DEFAULT_COVER_HTML = """<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:0;">
    <!-- Top bar -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:9pt;text-transform:uppercase;letter-spacing:0.15em;color:#666;">
            {{company_name}}
        </div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:9pt;text-transform:uppercase;letter-spacing:0.15em;color:#666;">
            Concours d'Architecture
        </div>
    </div>

    <!-- Center content -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:40mm 0;">
        <div style="border-top:2px solid #000;padding-top:20pt;margin-bottom:16pt;">
            <h1 style="font-family:'Space Grotesk',sans-serif;font-size:42pt;font-weight:700;line-height:1.1;margin:0;letter-spacing:-0.03em;">
                {{project_name}}
            </h1>
        </div>
        <div style="font-family:'Inter',sans-serif;font-size:12pt;color:#666;line-height:1.6;max-width:70%;">
            {{project_reference}} | {{acheteur}}
        </div>
    </div>

    <!-- Bottom -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #E8E8E8;padding-top:12pt;">
        <div style="font-family:'Inter',sans-serif;font-size:8pt;color:#666;line-height:1.6;">
            <div>{{company_address}}</div>
            <div>{{company_phone}} | {{company_email}}</div>
        </div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:9pt;color:#000;letter-spacing:0.05em;">
            {{date}}
        </div>
    </div>
</div>"""

DEFAULT_TOC_HTML = """<div style="display:flex;flex-direction:column;height:100%;">
    <!-- Header -->
    <div style="margin-bottom:30pt;border-bottom:2px solid #000;padding-bottom:12pt;">
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0;">
            Sommaire
        </h2>
    </div>

    <!-- TOC entries -->
    <div style="flex:1;font-family:'Inter',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10pt 0;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:10pt;font-weight:500;">01 &mdash; Note de Presentation</span>
            <span style="font-size:9pt;color:#666;">03</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10pt 0;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:10pt;font-weight:500;">02 &mdash; Descriptif des Materiaux</span>
            <span style="font-size:9pt;color:#666;">05</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10pt 0;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:10pt;font-weight:500;">03 &mdash; Dispositifs de Developpement Durable</span>
            <span style="font-size:9pt;color:#666;">09</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10pt 0;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:10pt;font-weight:500;">04 &mdash; Dispositifs de Securite Incendie</span>
            <span style="font-size:9pt;color:#666;">12</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10pt 0;border-bottom:1px solid #E8E8E8;">
            <span style="font-size:10pt;font-weight:500;">05 &mdash; Annexes</span>
            <span style="font-size:9pt;color:#666;">14</span>
        </div>
    </div>

    <!-- Footer -->
    <div style="font-family:'Inter',sans-serif;font-size:7pt;color:#666;border-top:1px solid #E8E8E8;padding-top:8pt;">
        {{company_name}} | {{project_reference}}
    </div>
</div>"""

DEFAULT_DIVIDER_HTML = """<div style="display:flex;flex-direction:column;justify-content:center;height:100%;position:relative;">
    <!-- Large section number -->
    <div style="position:absolute;top:0;right:0;font-family:'Space Grotesk',sans-serif;font-size:200pt;font-weight:700;color:#F0F0F0;line-height:1;">
        02
    </div>

    <!-- Section title -->
    <div style="position:relative;z-index:1;max-width:60%;">
        <div style="font-family:'Space Grotesk',sans-serif;font-size:9pt;text-transform:uppercase;letter-spacing:0.2em;color:#666;margin-bottom:12pt;">
            Section
        </div>
        <div style="border-top:2px solid #000;padding-top:16pt;">
            <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32pt;font-weight:700;margin:0;line-height:1.2;letter-spacing:-0.02em;">
                Descriptif des Materiaux
            </h2>
        </div>
        <p style="font-family:'Inter',sans-serif;font-size:10pt;color:#666;margin-top:12pt;line-height:1.6;">
            Specifications techniques des materiaux de construction, revetements, et finitions prevus pour le projet.
        </p>
    </div>

    <!-- Bottom bar -->
    <div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;border-top:1px solid #E8E8E8;padding-top:8pt;">
        <span style="font-family:'Inter',sans-serif;font-size:7pt;color:#666;">{{company_name}}</span>
        <span style="font-family:'Inter',sans-serif;font-size:7pt;color:#666;">{{project_reference}}</span>
    </div>
</div>"""

DEFAULT_CONTENT_HTML = """<div style="display:flex;flex-direction:column;height:100%;">
    <!-- Page header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20pt;padding-bottom:8pt;border-bottom:1px solid #E8E8E8;">
        <span style="font-family:'Space Grotesk',sans-serif;font-size:8pt;text-transform:uppercase;letter-spacing:0.15em;color:#666;">
            Descriptif des Materiaux
        </span>
        <span style="font-family:'Inter',sans-serif;font-size:8pt;color:#666;">
            {{project_reference}}
        </span>
    </div>

    <!-- Content -->
    <div style="flex:1;font-family:'Inter',sans-serif;font-size:10pt;line-height:1.7;columns:2;column-gap:20mm;">
        <h3 style="font-family:'Space Grotesk',sans-serif;font-size:14pt;font-weight:600;margin:0 0 8pt 0;column-span:all;">
            2.1 Revetements de Sol
        </h3>

        <h4 style="font-family:'Space Grotesk',sans-serif;font-size:10pt;font-weight:600;margin:12pt 0 4pt 0;text-transform:uppercase;letter-spacing:0.05em;">
            Halls et Circulations
        </h4>
        <p style="margin:0 0 8pt 0;color:#333;">
            Revetement de sol en granit naturel poli, teinte gris uniforme, format 60x60 cm, epaisseur 2 cm. Pose collee sur chape de mortier, colle speciale pierre naturelle a double encollage. Joints de 2 mm au coulis de ciment. Traitement hydrofuge et oleofuge apres pose.
        </p>

        <h4 style="font-family:'Space Grotesk',sans-serif;font-size:10pt;font-weight:600;margin:12pt 0 4pt 0;text-transform:uppercase;letter-spacing:0.05em;">
            Sanitaires
        </h4>
        <p style="margin:0 0 8pt 0;color:#333;">
            Carrelage en gres cerame antiderapant 30x30 cm, classement R11. Pose collee avec pente vers siphon 1.5% minimum. Joints epoxy antibacteriens.
        </p>

        <h4 style="font-family:'Space Grotesk',sans-serif;font-size:10pt;font-weight:600;margin:12pt 0 4pt 0;text-transform:uppercase;letter-spacing:0.05em;">
            Bureaux et Salles de Cours
        </h4>
        <p style="margin:0 0 8pt 0;color:#333;">
            Carrelage gres cerame rectifie 60x60 cm, teinte claire. Classement UPEC U4P3E2C2. Pose collee double encollage, joints 2 mm.
        </p>

        <h4 style="font-family:'Space Grotesk',sans-serif;font-size:10pt;font-weight:600;margin:12pt 0 4pt 0;text-transform:uppercase;letter-spacing:0.05em;">
            Locaux Techniques
        </h4>
        <p style="margin:0 0 8pt 0;color:#333;">
            Revetement en resine epoxy autolissante ep. 2-3 mm. Application sur support beton prepare par grenaillage. Finition satinee, coloris gris RAL 7035.
        </p>
    </div>

    <!-- Page footer -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12pt;padding-top:8pt;border-top:1px solid #E8E8E8;">
        <span style="font-family:'Inter',sans-serif;font-size:7pt;color:#666;">
            {{company_name}}
        </span>
        <span style="font-family:'Space Grotesk',sans-serif;font-size:8pt;color:#000;">
            05
        </span>
    </div>
</div>"""


# ============================================================
# SETTINGS / COMPANY PROFILE
# ============================================================

@app.get("/api/settings/company")
def get_company_profile(session: Session = Depends(get_session)):
    profile = session.exec(select(CompanyProfile)).first()
    if not profile:
        profile = CompanyProfile()
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile.model_dump()


@app.put("/api/settings/company")
def update_company_profile(data: CompanyProfileUpdate, session: Session = Depends(get_session)):
    profile = session.exec(select(CompanyProfile)).first()
    if not profile:
        profile = CompanyProfile()
        session.add(profile)
        session.commit()
        session.refresh(profile)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    profile.updated_at = datetime.now().isoformat()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile.model_dump()


@app.post("/api/settings/company/logo")
async def upload_company_logo(file: UploadFile = File(...), session: Session = Depends(get_session)):
    profile = session.exec(select(CompanyProfile)).first()
    if not profile:
        profile = CompanyProfile()
        session.add(profile)
        session.commit()
        session.refresh(profile)
    logo_path = SETTINGS_DIR / "logo"
    logo_path.mkdir(parents=True, exist_ok=True)
    file_name = file.filename or "logo.png"
    dest = logo_path / file_name
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    profile.logo_path = f"logo/{file_name}"
    profile.updated_at = datetime.now().isoformat()
    session.add(profile)
    session.commit()
    return {"logo_path": profile.logo_path}


@app.get("/api/settings/logo/{path:path}")
def serve_logo(path: str):
    file_path = (SETTINGS_DIR / path).resolve()
    if not str(file_path).startswith(str(SETTINGS_DIR.resolve())):
        raise HTTPException(status_code=403)
    if not file_path.exists():
        raise HTTPException(status_code=404)
    return FileResponse(path=str(file_path), media_type="image/png")