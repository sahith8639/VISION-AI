from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    await init_collections()
    print(f"--- Connected to MongoDB ---")
    print(f"Host: {settings.MONGODB_URL}")
    print(f"Database: {settings.DATABASE_NAME}")

async def init_collections():
    """
    Initialize database collections and indexes.
    In MongoDB, collections are created on first insert, but we can 
    pre-create them or add indexes here.
    """
    collections = [
        "users", 
        "students", 
        "teachers", 
        "classes", 
        "attendance", 
        "engagement_logs", 
        "alerts"
    ]
    
    existing_collections = await db.db.list_collection_names()
    
    for collection in collections:
        if collection not in existing_collections:
            await db.db.create_collection(collection)
            print(f"Created collection: {collection}")

    # Add indexes for performance
    await db.db["users"].create_index("email", unique=True)
    await db.db["alerts"].create_index("timestamp")
    await db.db["engagement_logs"].create_index([("student_id", 1), ("class_id", 1)])

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.db
