import os
import datetime
import uuid
import shutil
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import get_db, engine, Base, SessionLocal
from models import Admin, BlogPost, Photo, Note, Skill, ContactMessage, Project
from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token,
    encrypt_note,
    decrypt_note,
    generate_cloudinary_signature
)

# ─── Rate Limiter Configuration ───────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warning for default key fallbacks
    from security import JWT_SECRET
    if JWT_SECRET == "super-secret-key-for-jwt-signing-000000000000000000000000":
        print("WARNING: Using insecure default JWT_SECRET! Please configure the JWT_SECRET environment variable in production.")
    
    notes_key = os.getenv("NOTES_ENCRYPTION_KEY", "default-32-byte-key-for-dev-only-0000")
    if notes_key == "default-32-byte-key-for-dev-only-0000":
        print("WARNING: Using insecure default NOTES_ENCRYPTION_KEY! Please configure the NOTES_ENCRYPTION_KEY environment variable in production.")

    # Startup: create tables and seed admin user
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('photos')]
        if 'category' not in columns:
            db.execute(text("ALTER TABLE photos ADD COLUMN category VARCHAR"))
            db.commit()
            print("Added column 'category' to 'photos' table.")

        # Migrate skills table to add is_visible column if missing
        columns_skills = [c['name'] for c in inspector.get_columns('skills')]
        if 'is_visible' not in columns_skills:
            db.execute(text("ALTER TABLE skills ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true"))
            db.commit()
            print("Added column 'is_visible' to 'skills' table.")

        # Migrate blog_posts table to add read_time column if missing
        columns_blogs = [c['name'] for c in inspector.get_columns('blog_posts')]
        if 'read_time' not in columns_blogs:
            db.execute(text("ALTER TABLE blog_posts ADD COLUMN read_time INTEGER"))
            db.commit()
            print("Added column 'read_time' to 'blog_posts' table.")

        admin_count = db.query(Admin).count()
        if admin_count == 0:
            initial_password = os.getenv("ADMIN_INITIAL_PASSWORD", "admin123")
            hashed = hash_password(initial_password)
            seed_admin = Admin(password_hash=hashed)
            db.add(seed_admin)
            db.commit()
            print("Database tables created and Admin user seeded successfully.")

        # Seed initial skills if table is empty
        skill_count = db.query(Skill).count()
        if skill_count == 0:
            initial_skills = [
                # Machine Learning
                Skill(name='Python', category='Machine Learning', icon_key='python', status='mastered', display_order=1),
                Skill(name='PyTorch', category='Machine Learning', icon_key='pytorch', status='mastered', display_order=2),
                Skill(name='TensorFlow', category='Machine Learning', icon_key='tensorflow', status='mastered', display_order=3),
                Skill(name='scikit-learn', category='Machine Learning', icon_key='scikitlearn', status='mastered', display_order=4),
                Skill(name='NumPy', category='Machine Learning', icon_key='numpy', status='mastered', display_order=5),
                Skill(name='Pandas', category='Machine Learning', icon_key='pandas', status='mastered', display_order=6),
                # Programming
                Skill(name='C', category='Programming', icon_key='c', status='mastered', display_order=7),
                Skill(name='C++', category='Programming', icon_key='cplusplus', status='mastered', display_order=8),
                Skill(name='Java', category='Programming', icon_key='java', status='mastered', display_order=9),
                # Web Development
                Skill(name='HTML', category='Web Development', icon_key='html5', status='mastered', display_order=10),
                Skill(name='CSS', category='Web Development', icon_key='css3', status='mastered', display_order=11),
                Skill(name='JavaScript', category='Web Development', icon_key='javascript', status='mastered', display_order=12),
                Skill(name='React', category='Web Development', icon_key='react', status='mastered', display_order=13),
                Skill(name='FastAPI', category='Web Development', icon_key='fastapi', status='mastered', display_order=14),
                # Data Science
                Skill(name='Matplotlib', category='Data Science', icon_key='matplotlib', status='mastered', display_order=15),
                Skill(name='Jupyter Notebook', category='Data Science', icon_key='jupyter', status='mastered', display_order=16),
                Skill(name='Kaggle', category='Data Science', icon_key='kaggle', status='mastered', display_order=17),
                # Tools & Platforms
                Skill(name='Git', category='Tools & Platforms', icon_key='git', status='mastered', display_order=18),
                Skill(name='GitHub', category='Tools & Platforms', icon_key='github', status='mastered', display_order=19),
                Skill(name='VS Code', category='Tools & Platforms', icon_key='visualstudiocode', status='mastered', display_order=20),
                Skill(name='Vercel', category='Tools & Platforms', icon_key='vercel', status='mastered', display_order=21),
                Skill(name='Linux', category='Tools & Platforms', icon_key='linux', status='mastered', display_order=22),
            ]
            db.add_all(initial_skills)
            db.commit()
            print("Initial skills seeded successfully.")

        # Seed initial projects if projects table is empty
        project_count = db.query(Project).count()
        if project_count == 0:
            initial_projects = [
                Project(
                    title="Shinobi Portfolio",
                    description="A highly dynamic, interactive, and responsive portfolio dashboard themed around the Naruto universe. Built using React, Vite, TailwindCSS, and FastAPI.",
                    github_url="https://github.com/borno18/My-Portfolio",
                    live_url="https://joydipmajumdar.vercel.app",
                    tech_stack="React, FastAPI, PostgreSQL, TailwindCSS",
                    display_order=1,
                    is_visible=True
                ),
                Project(
                    title="Leaf Village Library",
                    description="A smart library administration system used to keep track of scrolls, Jutsu books, and ninja borrowing logs. Supports user role access levels and automated alerts.",
                    github_url="https://github.com/borno18/leaf-library",
                    live_url="https://leaf-library.onrender.com",
                    tech_stack="Python, Flask, SQLite, Bootstrap",
                    display_order=2,
                    is_visible=True
                )
            ]
            db.add_all(initial_projects)
            db.commit()
            print("Initial projects seeded successfully.")

        # Audit and backfill skill icons
        try:
            import urllib.request
            valid_slugs = set()
            url = "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/slugs.md"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read().decode('utf-8')
                for line in html.split('\n'):
                    parts = line.split('|')
                    if len(parts) >= 3:
                        slug = parts[2].replace('`', '').strip()
                        if slug and slug != 'Brand slug' and not slug.startswith(':'):
                            valid_slugs.add(slug.lower())
            print(f"Loaded {len(valid_slugs)} valid slugs from Simple Icons GitHub.")
        except Exception as e:
            print(f"Error fetching simpleicons slugs for audit: {e}")
            # Fallback popular slugs
            valid_slugs = {
                "python", "javascript", "react", "fastapi", "c", "cplusplus", "java", "html5", "css3",
                "git", "github", "docker", "postgresql", "mongodb", "nodejs", "typescript", "nextdotjs",
                "tailwindcss", "pytorch", "tensorflow", "scikitlearn", "numpy", "pandas", "matplotlib",
                "jupyter", "kaggle", "visualstudiocode", "vercel", "linux"
            }

        # Select all skills and audit icon_key
        skills_to_audit = db.query(Skill).all()
        for s in skills_to_audit:
            slug = s.icon_key.strip().lower() if s.icon_key else ""
            if not slug or slug not in valid_slugs:
                # Try to auto-match based on name
                name_clean = re.sub(r'[^a-z0-9]', '', s.name.lower())
                matched = False
                for vs in valid_slugs:
                    if vs == name_clean or vs.replace('dot', '') == name_clean:
                        s.icon_key = vs
                        matched = True
                        print(f"Autocorrected skill '{s.name}' icon key to '{vs}'")
                        break
                if not matched:
                    # Try prefix match (avoid mapping 'java' to 'javascript' or similar false positives)
                    for vs in valid_slugs:
                        if (vs.startswith(name_clean) or name_clean.startswith(vs)) and not (name_clean == 'java' and vs.startswith('js')):
                            s.icon_key = vs
                            matched = True
                            print(f"Autocorrected skill '{s.name}' icon key to '{vs}' (prefix match)")
                            break
        db.commit()

    except Exception as e:
        print(f"Error seeding database or running migrations: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="Portfolio Backend API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create static/uploads directory if not exists
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ─── CORS Middleware ──────────────────────────────────────────────────────────
# Allow origins from environment or standard defaults
raw_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:5173,http://127.0.0.1:5173,https://joydipmajumdar.vercel.app,https://www.joydipmajumdar.vercel.app"
)
origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://(my-portfolio-.*-joydip-majumdar-bornos-projects|joydipmajumdar(-.*)?)\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Request Schemas ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    password: str

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    cover_image_url: Optional[str] = None
    status: Optional[str] = 'draft' # 'draft' | 'published'
    read_time: Optional[int] = None # Manual read time in minutes

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    status: Optional[str] = None # 'draft' | 'published'
    read_time: Optional[int] = None # Manual read time in minutes

class PhotoCreate(BaseModel):
    image_url: str
    thumbnail_url: Optional[str] = None
    story: Optional[str] = None
    camera: Optional[str] = None
    lens: Optional[str] = None
    settings: Optional[str] = None
    taken_at: Optional[datetime.date] = None
    display_order: Optional[int] = 0
    category: Optional[str] = 'Street'

class PhotoUpdate(BaseModel):
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    story: Optional[str] = None
    camera: Optional[str] = None
    lens: Optional[str] = None
    settings: Optional[str] = None
    taken_at: Optional[datetime.date] = None
    display_order: Optional[int] = None
    category: Optional[str] = None

class ProjectCreate(BaseModel):
    title: str
    description: str
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    tech_stack: Optional[str] = None
    display_order: Optional[int] = 0
    is_visible: Optional[bool] = True

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    tech_stack: Optional[str] = None
    display_order: Optional[int] = None
    is_visible: Optional[bool] = None

class NoteCreate(BaseModel):
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = 'General'
    icon_key: Optional[str] = None
    status: Optional[str] = 'mastered'  # 'learning' | 'mastered'
    display_order: Optional[int] = 0
    is_visible: Optional[bool] = True

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    icon_key: Optional[str] = None
    status: Optional[str] = None
    display_order: Optional[int] = None
    is_visible: Optional[bool] = None

class SignatureRequest(BaseModel):
    params: dict
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    message: str

# ─── Auth Dependency ──────────────────────────────────────────────────────────
def get_current_admin(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session cookie not found"
        )
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
    return payload

# ─── Authentication API Endpoints ─────────────────────────────────────────────

@app.post("/api/auth/login")
@limiter.limit("5/15minute")
def login(request: Request, data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    admin = db.query(Admin).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No admin user seeded in database"
        )
    
    if not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Generate token
    token = create_access_token({"sub": "admin"})
    
    # Set HTTP-only Cookie
    # Note: Secure flag is true in production, but allowed in localhost on Chrome
    # SameSite=Strict makes it highly secure
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=12 * 3600, # 12 hours
        expires=12 * 3600
    )
    return {"status": "success", "message": "Logged in successfully"}

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"status": "success", "message": "Logged out successfully"}

@app.get("/api/auth/me")
def check_auth(request: Request):
    token = request.cookies.get("session_token")
    if not token or not verify_access_token(token):
        return {"authenticated": False}
    return {"authenticated": True}

@app.patch("/api/auth/password")
@limiter.limit("5/minute")
def change_password(request: Request, data: PasswordChangeRequest, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    admin = db.query(Admin).first()
    if not admin or not verify_password(data.currentPassword, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    admin.password_hash = hash_password(data.newPassword)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}

# ─── Contact Messages API ─────────────────────────────────────────────────────

import re

EMAIL_REGEX = re.compile(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)")

@app.post("/api/contact", status_code=201)
@limiter.limit("5/minute")
def create_contact_message(request: Request, data: ContactMessageCreate, db: Session = Depends(get_db)):
    name = data.name.strip()
    email = data.email.strip()
    message = data.message.strip()

    if not name or not email or not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email, and message are required and cannot be empty"
        )

    if len(name) > 100 or len(email) > 100 or len(message) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Input length exceeds maximum allowed limit"
        )

    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )

    msg = ContactMessage(name=name, email=email, message=message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"status": "success", "id": msg.id}

@app.get("/api/admin/messages")
def list_contact_messages(db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return messages

@app.patch("/api/admin/messages/{id}/read")
def mark_message_as_read(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    message = db.query(ContactMessage).filter(ContactMessage.id == id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    message.is_read = True
    db.commit()
    return {"status": "success", "message": "Message marked as read"}

@app.delete("/api/admin/messages/{id}")
def delete_contact_message(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    message = db.query(ContactMessage).filter(ContactMessage.id == id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    db.delete(message)
    db.commit()
    return {"status": "success", "message": "Message deleted successfully"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# ─── Public Blog API ──────────────────────────────────────────────────────────

@app.get("/api/blog")
def list_blog_posts(db: Session = Depends(get_db)):
    posts = db.query(BlogPost).filter(BlogPost.status == 'published').order_by(BlogPost.published_at.desc()).all()
    # Return brief fields for the list view
    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "excerpt": p.content[:150] + "..." if len(p.content) > 150 else p.content,
            "cover_image_url": p.cover_image_url,
            "status": p.status,
            "published_at": p.published_at,
            "read_time": p.read_time
        }
        for p in posts
    ]

@app.get("/api/blog/{slug}")
def get_blog_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    # Return full post
    return post

# ─── Admin Blog API ───────────────────────────────────────────────────────────

@app.get("/api/admin/blog")
def list_blog_posts_admin(db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    posts = db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()
    return posts

@app.post("/api/blog")
def create_blog_post(data: BlogPostCreate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    # Check if slug unique
    existing = db.query(BlogPost).filter(BlogPost.slug == data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blog post with this slug already exists"
        )
    
    published_at = datetime.datetime.utcnow() if data.status == 'published' else None
    
    # Calculate read_time if not provided manually
    read_time = data.read_time
    if not read_time or read_time <= 0:
        import math
        words = len(data.content.split())
        read_time = max(1, math.ceil(words / 200))

    post = BlogPost(
        title=data.title,
        slug=data.slug,
        content=data.content,
        cover_image_url=data.cover_image_url,
        status=data.status,
        published_at=published_at,
        read_time=read_time
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@app.put("/api/blog/{id}")
def update_blog_post(id: int, data: BlogPostUpdate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    post = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    
    # Update fields
    if data.title is not None:
        post.title = data.title
    if data.slug is not None:
        # Check slug unique
        if data.slug != post.slug:
            existing = db.query(BlogPost).filter(BlogPost.slug == data.slug).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Blog post with this slug already exists"
                )
        post.slug = data.slug
    if data.content is not None:
        post.content = data.content
    if data.cover_image_url is not None:
        post.cover_image_url = data.cover_image_url
    if data.status is not None:
        if data.status == 'published' and post.status != 'published':
            post.published_at = datetime.datetime.utcnow()
        elif data.status == 'draft':
            post.published_at = None
        post.status = data.status
    
    # Update read_time if manually provided, otherwise recalculate if content changed
    if data.read_time is not None:
        if data.read_time <= 0:
            import math
            content_to_use = data.content if data.content is not None else post.content
            words = len(content_to_use.split())
            post.read_time = max(1, math.ceil(words / 200))
        else:
            post.read_time = data.read_time
    elif data.content is not None:
        import math
        words = len(data.content.split())
        post.read_time = max(1, math.ceil(words / 200))
        
    db.commit()
    db.refresh(post)
    return post

@app.delete("/api/blog/{id}")
def delete_blog_post(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    post = db.query(BlogPost).filter(BlogPost.id == id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found"
        )
    db.delete(post)
    db.commit()
    return {"status": "success", "message": "Blog post deleted successfully"}

# ─── Public Photos API ────────────────────────────────────────────────────────

@app.get("/api/photos")
def list_photos(db: Session = Depends(get_db)):
    photos = db.query(Photo).order_by(Photo.display_order.asc(), Photo.created_at.desc()).all()
    return photos

@app.get("/api/photos/{id}")
def get_photo(id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == id).first()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    return photo

@app.post("/api/upload")
def upload_file(file: UploadFile = File(...), admin_session = Depends(get_current_admin)):
    file_size = getattr(file, "size", None)
    if file_size is not None and file_size > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit (25MB)"
        )
        
    allowed_mimes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type.lower() not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{file.content_type}' is not supported. Allowed formats: JPEG, PNG, GIF, WEBP"
        )
        
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    if ext not in allowed_exts:
        ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}
        ext = ext_map.get(file.content_type.lower(), ".jpg")
        
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("static/uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/static/uploads/{filename}"}

# ─── Admin Photos API (including Cloudinary upload signatures) ────────────────

@app.post("/api/photos/upload-signature")
def get_upload_signature(request: SignatureRequest, admin_session = Depends(get_current_admin)):
    # Enforce file size check (max 10MB)
    if request.file_size is not None:
        if request.file_size > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowed limit (25MB)"
            )
            
    # Enforce MIME type check
    if request.mime_type is not None:
        allowed_mimes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if request.mime_type.lower() not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MIME type '{request.mime_type}' is not supported. Allowed formats: JPEG, PNG, GIF, WEBP"
            )

    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not api_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloudinary secret key not configured on server"
        )
    
    # Generate signature using security helper
    sig = generate_cloudinary_signature(request.params, api_secret)
    return {"signature": sig}

@app.post("/api/photos")
def create_photo(data: PhotoCreate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    photo = Photo(
        image_url=data.image_url,
        thumbnail_url=data.thumbnail_url,
        story=data.story,
        camera=data.camera,
        lens=data.lens,
        settings=data.settings,
        taken_at=data.taken_at,
        display_order=data.display_order,
        category=data.category
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo

@app.put("/api/photos/{id}")
def update_photo(id: int, data: PhotoUpdate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    photo = db.query(Photo).filter(Photo.id == id).first()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    if data.image_url is not None:
        photo.image_url = data.image_url
    if data.thumbnail_url is not None:
        photo.thumbnail_url = data.thumbnail_url
    if data.story is not None:
        photo.story = data.story
    if data.camera is not None:
        photo.camera = data.camera
    if data.lens is not None:
        photo.lens = data.lens
    if data.settings is not None:
        photo.settings = data.settings
    if data.taken_at is not None:
        photo.taken_at = data.taken_at
    if data.display_order is not None:
        photo.display_order = data.display_order
    if data.category is not None:
        photo.category = data.category
        
    db.commit()
    db.refresh(photo)
    return photo

@app.delete("/api/photos/{id}")
def delete_photo(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    photo = db.query(Photo).filter(Photo.id == id).first()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    db.delete(photo)
    db.commit()
    return {"status": "success", "message": "Photo entry deleted successfully"}

# ─── Admin Notes API (Encrypted Storage, Decrypted Output) ────────────────────

@app.get("/api/notes")
def list_notes(db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    notes = db.query(Note).order_by(Note.created_at.desc()).all()
    # Decrypt all notes before returning
    decrypted_list = []
    for n in notes:
        decrypted_list.append({
            "id": n.id,
            "title": n.title,
            "content": decrypt_note(n.content_encrypted),
            "created_at": n.created_at,
            "updated_at": n.updated_at
        })
    return decrypted_list

@app.post("/api/notes")
def create_note(data: NoteCreate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    encrypted = encrypt_note(data.content)
    note = Note(
        title=data.title,
        content_encrypted=encrypted
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id": note.id,
        "title": note.title,
        "content": data.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at
    }

@app.put("/api/notes/{id}")
def update_note(id: int, data: NoteUpdate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    note = db.query(Note).filter(Note.id == id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content_encrypted = encrypt_note(data.content)
        
    db.commit()
    db.refresh(note)
    
    # Return decrypted response
    return {
        "id": note.id,
        "title": note.title,
        "content": decrypt_note(note.content_encrypted),
        "created_at": note.created_at,
        "updated_at": note.updated_at
    }

@app.delete("/api/notes/{id}")
def delete_note(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    note = db.query(Note).filter(Note.id == id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    db.delete(note)
    db.commit()
    return {"status": "success", "message": "Note deleted successfully"}

# ─── Skills Endpoints ─────────────────────────────────────────────────────────

@app.get("/api/skills")
def get_skills(db: Session = Depends(get_db), all: Optional[bool] = False):
    """Public endpoint – returns visible skills by default. Pass ?all=true (admin) to get all."""
    query = db.query(Skill).order_by(Skill.display_order)
    if not all:
        query = query.filter(Skill.is_visible == True)
    skills = query.all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "icon_key": s.icon_key,
            "status": s.status,
            "display_order": s.display_order,
            "is_visible": s.is_visible,
        }
        for s in skills
    ]

@app.post("/api/skills")
def create_skill(data: SkillCreate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    skill = Skill(
        name=data.name,
        category=data.category,
        icon_key=data.icon_key,
        status=data.status,
        display_order=data.display_order,
        is_visible=data.is_visible if data.is_visible is not None else True,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@app.put("/api/skills/{id}")
def update_skill(id: int, data: SkillUpdate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    skill = db.query(Skill).filter(Skill.id == id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    if data.name is not None:
        skill.name = data.name
    if data.category is not None:
        skill.category = data.category
    if data.icon_key is not None:
        skill.icon_key = data.icon_key
    if data.status is not None:
        skill.status = data.status
    if data.display_order is not None:
        skill.display_order = data.display_order
    if data.is_visible is not None:
        skill.is_visible = data.is_visible
    db.commit()
    db.refresh(skill)
    return skill

@app.delete("/api/skills/{id}")
def delete_skill(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    skill = db.query(Skill).filter(Skill.id == id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"status": "success", "message": "Skill deleted successfully"}

# ─── Projects Endpoints ───────────────────────────────────────────────────────

@app.get("/api/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.is_visible == True).order_by(Project.display_order.asc()).all()
    return projects

@app.get("/api/admin/projects")
def get_admin_projects(db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    projects = db.query(Project).order_by(Project.display_order.asc()).all()
    return projects

@app.post("/api/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    project = Project(
        title=data.title,
        description=data.description,
        github_url=data.github_url,
        live_url=data.live_url,
        tech_stack=data.tech_stack,
        display_order=data.display_order if data.display_order is not None else 0,
        is_visible=data.is_visible if data.is_visible is not None else True
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@app.put("/api/projects/{id}")
def update_project(id: int, data: ProjectUpdate, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if data.title is not None:
        project.title = data.title
    if data.description is not None:
        project.description = data.description
    if data.github_url is not None:
        project.github_url = data.github_url
    if data.live_url is not None:
        project.live_url = data.live_url
    if data.tech_stack is not None:
        project.tech_stack = data.tech_stack
    if data.display_order is not None:
        project.display_order = data.display_order
    if data.is_visible is not None:
        project.is_visible = data.is_visible
    db.commit()
    db.refresh(project)
    return project

@app.delete("/api/projects/{id}")
def delete_project(id: int, db: Session = Depends(get_db), admin_session = Depends(get_current_admin)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"status": "success", "message": "Project deleted successfully"}

