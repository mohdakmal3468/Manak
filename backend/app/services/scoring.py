from typing import TypedDict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Review


class VersionScores(TypedDict):
    innovation_average: float | None
    functionality_average: float | None
    ui_ux_average: float | None
    technical_quality_average: float | None
    documentation_average: float | None
    overall_score: float | None
    review_count: int


def calculate_version_scores(db: Session, version_id: int) -> VersionScores:
    row = db.execute(
        select(
            func.avg(Review.innovation).label("innovation_average"),
            func.avg(Review.functionality).label("functionality_average"),
            func.avg(Review.ui_ux).label("ui_ux_average"),
            func.avg(Review.technical_quality).label("technical_quality_average"),
            func.avg(Review.documentation).label("documentation_average"),
            func.count(Review.id).label("review_count"),
        ).where(Review.version_id == version_id)
    ).one()

    review_count = row.review_count
    averages = [
        row.innovation_average,
        row.functionality_average,
        row.ui_ux_average,
        row.technical_quality_average,
        row.documentation_average,
    ]
    numeric_averages = [float(average) if average is not None else None for average in averages]
    rounded_averages = [
        round(average, 2) if average is not None else None for average in numeric_averages
    ]
    overall_score = (
        round(sum(average for average in numeric_averages if average is not None) / 5, 2)
        if review_count
        else None
    )

    return {
        "innovation_average": rounded_averages[0],
        "functionality_average": rounded_averages[1],
        "ui_ux_average": rounded_averages[2],
        "technical_quality_average": rounded_averages[3],
        "documentation_average": rounded_averages[4],
        "overall_score": overall_score,
        "review_count": review_count,
    }
