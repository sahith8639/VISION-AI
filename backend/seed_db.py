import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core import security
from app.core.config import settings
from datetime import datetime

async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print(f"Connecting to {settings.MONGODB_URL}...")
    
    # 1. Clear existing users if you want a fresh start (optional)
    # await db["users"].delete_many({})
    # await db["students"].delete_many({})
    # await db["teachers"].delete_many({})

    # 2. Create Teacher
    teacher_email = "teacher@test.com"
    teacher_exists = await db["users"].find_one({"email": teacher_email})
    
    if not teacher_exists:
        hashed_pw = security.get_password_hash("password123")
        teacher_user = {
            "email": teacher_email,
            "full_name": "Test Teacher",
            "role": "teacher",
            "hashed_password": hashed_pw
        }
        result = await db["users"].insert_one(teacher_user)
        user_id = str(result.inserted_id)
        
        await db["teachers"].insert_one({
            "user_id": user_id,
            "email": teacher_email,
            "full_name": "Test Teacher",
            "created_at": datetime.utcnow()
        })
        print(f"Teacher created: {teacher_email} / password123")
    else:
        print(f"Teacher already exists: {teacher_email}")

    # 3. Create Student
    student_email = "student@test.com"
    student_exists = await db["users"].find_one({"email": student_email})
    
    if not student_exists:
        hashed_pw = security.get_password_hash("password123")
        student_user = {
            "email": student_email,
            "full_name": "Test Student",
            "role": "student",
            "hashed_password": hashed_pw
        }
        result = await db["users"].insert_one(student_user)
        user_id = str(result.inserted_id)
        
        await db["students"].insert_one({
            "user_id": user_id,
            "email": student_email,
            "full_name": "Test Student",
            "created_at": datetime.utcnow()
        })
        print(f"Student created: {student_email} / password123")
    else:
        print(f"Student already exists: {student_email}")

    client.close()
    print("Seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed())
