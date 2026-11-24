from datetime import datetime

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be empty.")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    github_url: AnyHttpUrl
    live_url: AnyHttpUrl | None = None
    category: str = Field(min_length=1, max_length=100)
    tech_tags: list[str] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    github_url: AnyHttpUrl | None = None
    live_url: AnyHttpUrl | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    tech_tags: list[str] | None = None

    @model_validator(mode="after")
    def reject_null_non_nullable_fields(self) -> "ProjectUpdate":
        non_nullable = ("title", "description", "github_url", "category", "tech_tags")
        for field in non_nullable:
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null.")
        return self


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    description: str
    github_url: str
    live_url: str | None
    category: str
    tech_tags: list[str]
    current_version: int
    created_at: datetime
    github_verified: bool
    live_verified: bool


class ProjectVersionCreate(BaseModel):
    change_note: str = Field(min_length=1)

    @field_validator("change_note")
    @classmethod
    def normalize_change_note(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Change note cannot be empty.")
        return normalized


class ProjectVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    version_number: int
    change_note: str
    created_at: datetime


class ReviewCreate(BaseModel):
    innovation: int = Field(ge=1, le=5)
    functionality: int = Field(ge=1, le=5)
    ui_ux: int = Field(ge=1, le=5)
    technical_quality: int = Field(ge=1, le=5)
    documentation: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Comment cannot be empty.")
        return normalized


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    version_id: int
    reviewer_id: int
    innovation: int
    functionality: int
    ui_ux: int
    technical_quality: int
    documentation: int
    comment: str
    created_at: datetime


class VersionScoreResponse(BaseModel):
    version_id: int
    version_number: int
    innovation_average: float | None
    functionality_average: float | None
    ui_ux_average: float | None
    technical_quality_average: float | None
    documentation_average: float | None
    overall_score: float | None
    review_count: int


class CriterionScoreChanges(BaseModel):
    innovation: float | None
    functionality: float | None
    ui_ux: float | None
    technical_quality: float | None
    documentation: float | None


class ProjectVersionAnalytics(BaseModel):
    version_number: int
    date: datetime
    change_note: str
    overall_score: float | None
    innovation_average: float | None
    functionality_average: float | None
    ui_ux_average: float | None
    technical_quality_average: float | None
    documentation_average: float | None
    score_changes: CriterionScoreChanges
