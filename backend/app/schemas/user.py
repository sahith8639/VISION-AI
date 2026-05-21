from typing import Optional
from pydantic import BaseModel, EmailStr, Field

try:
    from pydantic import ConfigDict
    PYDANTIC_V2 = True
except ImportError:
    PYDANTIC_V2 = False

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: str = "student" # student, teacher, admin

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    
    if PYDANTIC_V2:
        model_config = ConfigDict(
            populate_by_name=True,
            from_attributes=True
        )
    else:
        class Config:
            allow_population_by_field_name = True
            orm_mode = True

class User(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
