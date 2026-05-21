from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Classroom(BaseModel):
    class_id: str = Field(..., alias="_id")
    join_code: str
    teacher_id: str
    student_ids: List[str] = []
    status: str = "active" # active, ended
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

class ClassroomCreate(BaseModel):
    teacher_id: str
    subject: str
