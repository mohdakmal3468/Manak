import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and configure it.")

engine = create_engine(database_url, pool_pre_ping=True)


class Base(DeclarativeBase):
    pass


def get_db():
    with Session(engine) as session:
        yield session
