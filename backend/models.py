import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, func
from database import Base

class Admin(Base):
    __tablename__ = 'admin'
    
    id = Column(Integer, primary_key=True, index=True)
    password_hash = Column(String, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=func.now(), 
        onupdate=func.now()
    )

class BlogPost(Base):
    __tablename__ = 'blog_posts'
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    cover_image_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default='draft') # 'draft' | 'published'
    read_time = Column(Integer, nullable=True) # Manual read time in minutes
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        default=func.now(), 
        onupdate=func.now()
    )

class Photo(Base):
    __tablename__ = 'photos'
    
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    story = Column(Text, nullable=True)
    camera = Column(String, nullable=True)
    lens = Column(String, nullable=True)
    settings = Column(String, nullable=True)
    taken_at = Column(Date, nullable=True)
    display_order = Column(Integer, default=0)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class Note(Base):
    __tablename__ = 'notes'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), 
        default=func.now(), 
        onupdate=func.now()
    )

class Skill(Base):
    __tablename__ = 'skills'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, default='General')
    icon_key = Column(String, nullable=True)  # Simple Icons slug, e.g. 'python', 'react'
    status = Column(String, nullable=False, default='mastered')  # 'learning' | 'mastered'
    display_order = Column(Integer, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)  # False = hidden from public site
    created_at = Column(DateTime(timezone=True), default=func.now())

class ContactMessage(Base):
    __tablename__ = 'contact_messages'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    github_url = Column(String, nullable=True)
    live_url = Column(String, nullable=True)
    tech_stack = Column(String, nullable=True) # Comma-separated list of technologies
    display_order = Column(Integer, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

