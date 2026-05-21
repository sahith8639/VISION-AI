from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, classes, students, teachers, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
