from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Project, ProjectVersion, User
from app.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    ProjectVersionCreate,
    ProjectVersionAnalytics,
    ProjectVersionResponse,
    CriterionScoreChanges,
    VersionScoreResponse,
)
from app.services.scoring import calculate_version_scores
from app.services.link_verification import verify_project_links

router = APIRouter(prefix="/projects", tags=["projects"])


def _project_response(project: Project) -> ProjectResponse:
    fields = (
        "id",
        "owner_id",
        "title",
        "description",
        "github_url",
        "live_url",
        "category",
        "tech_tags",
        "current_version",
        "created_at",
    )
    data = {field: getattr(project, field) for field in fields}
    data.update(verify_project_links(project))
    return ProjectResponse.model_validate(data)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    project = Project(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        github_url=str(payload.github_url),
        live_url=str(payload.live_url) if payload.live_url else None,
        category=payload.category,
        tech_tags=payload.tech_tags,
    )
    db.add(project)
    db.flush()
    db.add(
        ProjectVersion(
            project_id=project.id,
            version_number=project.current_version,
            change_note="Initial submission",
        )
    )
    db.commit()
    db.refresh(project)
    return _project_response(project)


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    category: str | None = None,
    tech_tag: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
) -> list[ProjectResponse]:
    statement = select(Project).order_by(Project.created_at.desc())
    if category:
        statement = statement.where(Project.category == category)
    if tech_tag:
        statement = statement.where(Project.tech_tags.any(tech_tag))
    return [_project_response(project) for project in db.scalars(statement).all()]


@router.get("/mine", response_model=list[ProjectResponse])
def list_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectResponse]:
    projects = db.scalars(
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(Project.created_at.desc())
    ).all()
    return [_project_response(project) for project in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)) -> ProjectResponse:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return _project_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can update this project.",
        )

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in ("github_url", "live_url") and value is not None:
            value = str(value)
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return _project_response(project)


@router.post(
    "/{project_id}/versions",
    response_model=ProjectVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project_version(
    project_id: int,
    payload: ProjectVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectVersion:
    project = db.scalar(select(Project).where(Project.id == project_id).with_for_update())
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can submit a new version.",
        )

    project.current_version += 1
    version = ProjectVersion(
        project_id=project.id,
        version_number=project.current_version,
        change_note=payload.change_note,
    )
    db.add(version)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create the project version.",
        ) from None
    db.refresh(version)
    return version


@router.get(
    "/{project_id}/scores",
    response_model=list[VersionScoreResponse],
)
def get_project_version_scores(
    project_id: int,
    db: Session = Depends(get_db),
) -> list[VersionScoreResponse]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    versions = db.scalars(
        select(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .order_by(ProjectVersion.version_number)
    ).all()
    return [
        VersionScoreResponse(
            version_id=version.id,
            version_number=version.version_number,
            **calculate_version_scores(db, version.id),
        )
        for version in versions
    ]


@router.get(
    "/{project_id}/analytics",
    response_model=list[ProjectVersionAnalytics],
)
def get_project_analytics(
    project_id: int,
    db: Session = Depends(get_db),
) -> list[ProjectVersionAnalytics]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    versions = db.scalars(
        select(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .order_by(ProjectVersion.version_number)
    ).all()
    analytics: list[ProjectVersionAnalytics] = []
    previous_scores = None
    criterion_fields = (
        ("innovation", "innovation_average"),
        ("functionality", "functionality_average"),
        ("ui_ux", "ui_ux_average"),
        ("technical_quality", "technical_quality_average"),
        ("documentation", "documentation_average"),
    )

    for version in versions:
        scores = calculate_version_scores(db, version.id)
        changes = {}
        for criterion, field in criterion_fields:
            current_value = scores[field]
            previous_value = previous_scores[field] if previous_scores is not None else None
            changes[criterion] = (
                round(current_value - previous_value, 2)
                if current_value is not None and previous_value is not None
                else None
            )
        analytics.append(
            ProjectVersionAnalytics(
                version_number=version.version_number,
                date=version.created_at,
                change_note=version.change_note,
                overall_score=scores["overall_score"],
                innovation_average=scores["innovation_average"],
                functionality_average=scores["functionality_average"],
                ui_ux_average=scores["ui_ux_average"],
                technical_quality_average=scores["technical_quality_average"],
                documentation_average=scores["documentation_average"],
                score_changes=CriterionScoreChanges(**changes),
            )
        )
        previous_scores = scores
    return analytics
