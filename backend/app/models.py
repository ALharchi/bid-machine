from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# --- Projects ---

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    reference: str
    objet: str
    acheteur: str
    date_limite: str
    procedure: str
    categorie: str
    lieu_execution: str
    source_url: str
    status: str = Field(default="active")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    has_documents: bool = Field(default=False)


class ProjectCreate(SQLModel):
    reference: str
    objet: str
    acheteur: str
    date_limite: str
    procedure: str
    categorie: str
    lieu_execution: str
    source_url: str


class ParsedBid(SQLModel):
    reference: str = ""
    objet: str = ""
    acheteur: str = ""
    date_limite: str = ""
    procedure: str = ""
    categorie: str = ""
    lieu_execution: str = ""


# --- Resources ---

class Category(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    parent_id: Optional[int] = Field(default=None, foreign_key="category.id")
    sort_order: int = Field(default=0)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class CategoryCreate(SQLModel):
    name: str
    parent_id: Optional[int] = None
    sort_order: int = 0


class ContentBlock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    title: str
    body: str = ""
    tags: str = Field(default="")
    metadata_json: str = Field(default="{}")
    usage_count: int = Field(default=0)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ContentBlockCreate(SQLModel):
    category_id: Optional[int] = None
    title: str
    body: str = ""
    tags: str = "[]"
    metadata_json: str = "{}"


class ContentBlockUpdate(SQLModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[str] = None
    metadata_json: Optional[str] = None


class ContentImage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content_block_id: int = Field(foreign_key="contentblock.id")
    file_path: str
    file_name: str
    caption: str = ""
    sort_order: int = Field(default=0)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


# --- Layouts ---

class Layout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    page_size: str = Field(default="A3")
    orientation: str = Field(default="landscape")
    margin_top: float = Field(default=10.0)
    margin_bottom: float = Field(default=10.0)
    margin_left: float = Field(default=10.0)
    margin_right: float = Field(default=10.0)
    global_css: str = Field(default="")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class LayoutCreate(SQLModel):
    name: str
    page_size: str = "A3"
    orientation: str = "landscape"
    margin_top: float = 10.0
    margin_bottom: float = 10.0
    margin_left: float = 10.0
    margin_right: float = 10.0


class LayoutUpdate(SQLModel):
    name: Optional[str] = None
    page_size: Optional[str] = None
    orientation: Optional[str] = None
    margin_top: Optional[float] = None
    margin_bottom: Optional[float] = None
    margin_left: Optional[float] = None
    margin_right: Optional[float] = None
    global_css: Optional[str] = None


class LayoutPage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    layout_id: int = Field(foreign_key="layout.id")
    name: str
    page_type: str = Field(default="content")  # cover, toc, content, divider, back
    html_content: str = Field(default="")
    css_content: str = Field(default="")
    sort_order: int = Field(default=0)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class LayoutPageCreate(SQLModel):
    name: str
    page_type: str = "content"
    html_content: str = ""
    css_content: str = ""
    sort_order: int = 0


class LayoutPageUpdate(SQLModel):
    name: Optional[str] = None
    page_type: Optional[str] = None
    html_content: Optional[str] = None
    css_content: Optional[str] = None
    sort_order: Optional[int] = None


# --- Settings ---

class CompanyProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = ""
    address: str = ""
    city: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    architect_name: str = ""
    architect_title: str = ""
    rc_number: str = ""
    cnss_number: str = ""
    if_number: str = ""
    ice_number: str = ""
    patente_number: str = ""
    bank_name: str = ""
    bank_agency: str = ""
    bank_account: str = ""
    logo_path: str = ""
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class CompanyProfileUpdate(SQLModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    architect_name: Optional[str] = None
    architect_title: Optional[str] = None
    rc_number: Optional[str] = None
    cnss_number: Optional[str] = None
    if_number: Optional[str] = None
    ice_number: Optional[str] = None
    patente_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_agency: Optional[str] = None
    bank_account: Optional[str] = None