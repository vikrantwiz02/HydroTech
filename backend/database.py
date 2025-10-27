from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import List, Optional
import os
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables from .env.local (development) or system env (production)
load_dotenv('.env.local')  # This will be ignored in production

# MongoDB connection string from environment
MONGODB_URI = os.getenv('MONGODB_URI')
DATABASE_NAME = "hydrotech"

if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in environment variables. Please set it in .env.local (dev) or environment (production)")

class MongoDB:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        cls.client = AsyncIOMotorClient(MONGODB_URI)
        print("✅ Connected to MongoDB!")
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("❌ Closed MongoDB connection")
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        return cls.client[DATABASE_NAME]

# Database helper functions
async def save_prediction_to_db(prediction_data: dict):
    """Save prediction to MongoDB"""
    db = MongoDB.get_database()
    collection = db.predictions
    
    # Add timestamp
    prediction_data["created_at"] = datetime.utcnow()
    
    # Insert document
    result = await collection.insert_one(prediction_data)
    return str(result.inserted_id)

async def get_user_predictions(user_id: str, limit: int = 50):
    """Get predictions for a specific user"""
    db = MongoDB.get_database()
    collection = db.predictions
    
    cursor = collection.find({"userId": user_id}).sort("created_at", -1).limit(limit)
    predictions = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for pred in predictions:
        pred["_id"] = str(pred["_id"])
    
    return predictions

async def get_predictions_by_zone(user_id: str, zone: str, limit: int = 50):
    """Get predictions filtered by zone"""
    db = MongoDB.get_database()
    collection = db.predictions
    
    cursor = collection.find({
        "userId": user_id,
        "result.aquifer_zone": zone
    }).sort("created_at", -1).limit(limit)
    
    predictions = await cursor.to_list(length=limit)
    
    for pred in predictions:
        pred["_id"] = str(pred["_id"])
    
    return predictions

async def get_zone_historical_data(zone: str, days: int = 30):
    """Get historical predictions for a zone for time-series analysis"""
    db = MongoDB.get_database()
    collection = db.predictions
    
    # Get predictions from last N days
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    cursor = collection.find({
        "result.aquifer_zone": zone,
        "created_at": {"$gte": cutoff_date}
    }).sort("created_at", 1)
    
    predictions = await cursor.to_list(length=1000)
    
    return predictions

async def save_user_to_db(user_data: dict):
    """Save or update user in database"""
    db = MongoDB.get_database()
    collection = db.users
    
    # Upsert user (insert if not exists, update if exists)
    result = await collection.update_one(
        {"id": user_data["id"]},
        {"$set": {
            **user_data,
            "last_login": datetime.utcnow()
        }},
        upsert=True
    )
    
    return result

async def delete_prediction(prediction_id: str, user_id: str):
    """Delete a prediction (only if it belongs to the user)"""
    db = MongoDB.get_database()
    collection = db.predictions
    
    result = await collection.delete_one({
        "_id": ObjectId(prediction_id),
        "userId": user_id
    })
    
    return result.deleted_count > 0
