from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Project, ProjectVersion, Review, User
from app.schemas import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/projects", tags=["reviews"])


@router.post(
    "/{project_id}/versions/{version_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    project_id: int,
    version_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Review:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if project.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project owners cannot review their own projects.",
        )

    version = db.get(ProjectVersion, version_id)
    if version is None or version.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project version not found.",
        )

    # Serialize a user's review submissions so duplicate checks remain effective on existing databases.
    db.scalar(select(User.id).where(User.id == current_user.id).with_for_update())
    existing_review = db.scalar(
        select(Review).where(
            Review.version_id == version_id,
            Review.reviewer_id == current_user.id,
        )
    )
    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this project version.",
        )

    review = Review(
        project_id=project_id,
        version_id=version_id,
        reviewer_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this project version.",
        ) from None
    db.refresh(review)
    return review


@router.get("/{project_id}/reviews", response_model=list[ReviewResponse])
def list_project_reviews(
    project_id: int,
    db: Session = Depends(get_db),
) -> list[Review]:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    return db.scalars(
        select(Review)
        .where(Review.project_id == project_id)
        .order_by(Review.created_at.desc())
    ).all()
