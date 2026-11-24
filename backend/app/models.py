from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    github_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    live_url: Mapped[str | None] = mapped_column(String(2048))
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    tech_tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), nullable=False, default=list)
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ProjectVersion(Base):
    __tablename__ = "project_versions"
    __table_args__ = (
        UniqueConstraint("project_id", "version_number", name="uq_project_version_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    change_note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("version_id", "reviewer_id", name="uq_review_version_reviewer"),
        CheckConstraint("innovation BETWEEN 1 AND 5", name="ck_reviews_innovation_range"),
        CheckConstraint("functionality BETWEEN 1 AND 5", name="ck_reviews_functionality_range"),
        CheckConstraint("ui_ux BETWEEN 1 AND 5", name="ck_reviews_ui_ux_range"),
        CheckConstraint(
            "technical_quality BETWEEN 1 AND 5", name="ck_reviews_technical_quality_range"
        ),
        CheckConstraint("documentation BETWEEN 1 AND 5", name="ck_reviews_documentation_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_id: Mapped[int] = mapped_column(
        ForeignKey("project_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    innovation: Mapped[int] = mapped_column(Integer, nullable=False)
    functionality: Mapped[int] = mapped_column(Integer, nullable=False)
    ui_ux: Mapped[int] = mapped_column(Integer, nullable=False)
    technical_quality: Mapped[int] = mapped_column(Integer, nullable=False)
    documentation: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
