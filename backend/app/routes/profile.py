from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from app.database.connection import get_database
from app.schemas.schemas import ProfileUpdate, UserResponse
from app.authentication.auth_handler import get_current_user

router = APIRouter()

BADGES_INFO = {
    "first_task": {"name": "First Step", "icon": "🎯", "desc": "Completed your first task"},
    "ten_tasks": {"name": "Getting Started", "icon": "⭐", "desc": "Completed 10 tasks"},
    "century": {"name": "Century Club", "icon": "💯", "desc": "Completed 100 tasks"},
    "seven_day_streak": {"name": "7 Day Discipline", "icon": "🔥", "desc": "7-day completion streak"},
    "thirty_day_master": {"name": "30 Day Master", "icon": "👑", "desc": "30-day streak"},
    "habit_hero": {"name": "Habit Hero", "icon": "🦸", "desc": "Created 5+ habits"},
}

@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_tasks = await db.tasks.count_documents({"userId": ObjectId(user_id)})
    completed_tasks = await db.tasks.count_documents({"userId": ObjectId(user_id), "completed": True})
    total_habits = await db.habits.count_documents({"userId": ObjectId(user_id), "active": True})
    
    badges = user.get("badges", [])
    badge_details = [
        {**BADGES_INFO[b], "id": b}
        for b in badges if b in BADGES_INFO
    ]
    
    xp = user.get("xp", 0)
    level = max(1, xp // 100 + 1)
    xp_in_level = xp % 100
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "avatar": user.get("avatar"),
        "createdAt": user.get("createdAt", datetime.utcnow()),
        "level": level,
        "xp": xp,
        "xpInLevel": xp_in_level,
        "xpToNextLevel": 100,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "totalHabits": total_habits,
        "currentStreak": user.get("currentStreak", 0),
        "bestStreak": user.get("bestStreak", 0),
        "badges": badge_details,
        "settings": user.get("settings", {"theme": "dark"})
    }

@router.put("")
async def update_profile(profile_data: ProfileUpdate, user_id: str = Depends(get_current_user)):
    db = get_database()
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if "theme" in update_data:
        update_data = {"settings.theme": update_data.pop("theme")}
    
    if update_data:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}
