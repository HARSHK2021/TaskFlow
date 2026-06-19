from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.database.connection import get_database
from app.schemas.schemas import HabitCreate, HabitUpdate, HabitCompletion, HabitResponse
from app.authentication.auth_handler import get_current_user

router = APIRouter()

def calculate_streaks(completion_history: dict) -> tuple:
    if not completion_history:
        return 0, 0
    
    sorted_dates = sorted([d for d, v in completion_history.items() if v], reverse=True)
    if not sorted_dates:
        return 0, 0
    
    current_streak = 0
    today = date.today()
    check_date = today
    
    for d_str in sorted_dates:
        d = datetime.strptime(d_str, "%Y-%m-%d").date()
        if d == check_date or d == check_date - timedelta(days=1):
            current_streak += 1
            check_date = d - timedelta(days=1)
        else:
            break
    
    # Best streak
    best = 0
    current = 0
    prev = None
    for d_str in sorted(completion_history.keys()):
        if completion_history[d_str]:
            d = datetime.strptime(d_str, "%Y-%m-%d").date()
            if prev and (d - prev).days == 1:
                current += 1
            else:
                current = 1
            best = max(best, current)
            prev = d
    
    return current_streak, best

def habit_to_response(habit: dict) -> HabitResponse:
    history = habit.get("completionHistory", {})
    current_streak, best_streak = calculate_streaks(history)
    total_completed = sum(1 for v in history.values() if v)
    
    return HabitResponse(
        id=str(habit["_id"]),
        userId=str(habit["userId"]),
        name=habit["name"],
        category=habit["category"],
        icon=habit["icon"],
        color=habit["color"],
        frequency=habit["frequency"],
        targetDays=habit["targetDays"],
        completionHistory=history,
        reminderTime=habit.get("reminderTime"),
        active=habit.get("active", True),
        currentStreak=current_streak,
        bestStreak=best_streak,
        totalCompleted=total_completed,
        createdAt=habit["createdAt"]
    )

@router.get("", response_model=List[HabitResponse])
async def get_habits(user_id: str = Depends(get_current_user)):
    db = get_database()
    habits = await db.habits.find({"userId": ObjectId(user_id), "active": True}).to_list(100)
    return [habit_to_response(h) for h in habits]

@router.post("", response_model=HabitResponse)
async def create_habit(habit_data: HabitCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    habit_doc = {
        "userId": ObjectId(user_id),
        "name": habit_data.name,
        "category": habit_data.category,
        "icon": habit_data.icon,
        "color": habit_data.color,
        "frequency": habit_data.frequency,
        "targetDays": habit_data.targetDays,
        "completionHistory": {},
        "reminderTime": habit_data.reminderTime,
        "active": True,
        "createdAt": datetime.utcnow()
    }
    result = await db.habits.insert_one(habit_doc)
    habit_doc["_id"] = result.inserted_id
    return habit_to_response(habit_doc)

@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: str, habit_data: HabitUpdate, user_id: str = Depends(get_current_user)):
    db = get_database()
    habit = await db.habits.find_one({"_id": ObjectId(habit_id), "userId": ObjectId(user_id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    update_data = {k: v for k, v in habit_data.dict().items() if v is not None}
    await db.habits.update_one({"_id": ObjectId(habit_id)}, {"$set": update_data})
    updated = await db.habits.find_one({"_id": ObjectId(habit_id)})
    return habit_to_response(updated)

@router.post("/{habit_id}/complete", response_model=HabitResponse)
async def toggle_completion(habit_id: str, completion: HabitCompletion, user_id: str = Depends(get_current_user)):
    db = get_database()
    habit = await db.habits.find_one({"_id": ObjectId(habit_id), "userId": ObjectId(user_id)})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    await db.habits.update_one(
        {"_id": ObjectId(habit_id)},
        {"$set": {f"completionHistory.{completion.date}": completion.completed}}
    )
    
    if completion.completed:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"xp": 15}})
    
    updated = await db.habits.find_one({"_id": ObjectId(habit_id)})
    return habit_to_response(updated)

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    result = await db.habits.update_one(
        {"_id": ObjectId(habit_id), "userId": ObjectId(user_id)},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted"}
