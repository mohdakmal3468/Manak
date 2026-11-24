from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app import models
from app.routers import auth, projects, reviews


@asynccontextmanager
async def lifespan(_: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="MANAK API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(reviews.router)
