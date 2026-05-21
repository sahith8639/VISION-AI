import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Any, Optional

from pydantic import BaseModel

router = APIRouter()

class ClassCreateRequest(BaseModel):
    teacher_email: str

class ClassJoinRequest(BaseModel):
    student_email: str
    join_code: str
    registration_number: Optional[str] = None
    full_name: Optional[str] = None

def generate_join_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/create")
async def create_class(
    request: ClassCreateRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    teacher = await db["users"].find_one({"email": request.teacher_email, "role": "teacher"})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    join_code = generate_join_code()
    class_id = f"CLS_{random.randint(100000, 999999)}"
    
    new_class = {
        "_id": class_id,
        "join_code": join_code,
        "teacher_id": str(teacher["_id"]),
        "teacher_email": request.teacher_email,
        "status": "active",
        "created_at": datetime.utcnow(),
        "students": []
    }
    
    await db["classes"].insert_one(new_class)
    return {"class_id": class_id, "join_code": join_code}

@router.post("/join")
async def join_class(
    request: ClassJoinRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    classroom = await db["classes"].find_one({"join_code": request.join_code, "status": "active"})
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found or inactive")
    
    student = await db["users"].find_one({"email": request.student_email, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if already joined
    if request.student_email not in classroom["students"]:
        await db["classes"].update_one(
            {"_id": classroom["_id"]},
            {"$push": {"students": request.student_email}}
        )
    
    return {
        "class_id": classroom["_id"],
        "teacher_id": classroom["teacher_id"],
        "message": "Joined successfully"
    }
