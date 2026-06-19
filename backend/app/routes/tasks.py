from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.database.connection import get_database
from app.schemas.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.authentication.auth_handler import get_current_user

router = APIRouter()

def task_to_response(task: dict) -> TaskResponse:
    return TaskResponse(
        id=str(task["_id"]),
        userId=str(task["userId"]),
        title=task["title"],
        category=task["category"],
        priority=task["priority"],
        taskType=task["taskType"],
        date=task["date"],
        completed=task["completed"],
        notes=task.get("notes"),
        reminderTime=task.get("reminderTime"),
        color=task.get("color", "#6366f1"),
        icon=task.get("icon", "✅"),
        order=task.get("order", 0),
        createdAt=task["createdAt"]
    )

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    month: Optional[int] = None,
    year: Optional[int] = None,
    date: Optional[str] = None,
    category: Optional[str] = None,
    completed: Optional[bool] = None,
    user_id: str = Depends(get_current_user)
):
    db = get_database()
    query = {"userId": ObjectId(user_id)}
    
    if date:
        query["date"] = date
    elif month and year:
        prefix = f"{year}-{month:02d}"
        query["date"] = {"$regex": f"^{prefix}"}
    
    if category:
        query["category"] = category
    if completed is not None:
        query["completed"] = completed
    
    tasks = await db.tasks.find(query).sort("order", 1).to_list(1000)
    return [task_to_response(t) for t in tasks]

@router.post("", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    count = await db.tasks.count_documents({"userId": ObjectId(user_id), "date": task_data.date})
    
    task_doc = {
        "userId": ObjectId(user_id),
        "title": task_data.title,
        "category": task_data.category,
        "priority": task_data.priority,
        "taskType": task_data.taskType,
        "date": task_data.date,
        "completed": False,
        "notes": task_data.notes,
        "reminderTime": task_data.reminderTime,
        "color": task_data.color,
        "icon": task_data.icon,
        "order": count,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return task_to_response(task_doc)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_data: TaskUpdate, user_id: str = Depends(get_current_user)):
    db = get_database()
    task = await db.tasks.find_one({"_id": ObjectId(task_id), "userId": ObjectId(user_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_data.dict().items() if v is not None}
    
    if "completed" in update_data and update_data["completed"] and not task["completed"]:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"totalCompleted": 1, "xp": 10}}
        )
        await _check_and_award_badges(db, user_id)
    
    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})
    updated = await db.tasks.find_one({"_id": ObjectId(task_id)})
    return task_to_response(updated)

@router.delete("/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    result = await db.tasks.delete_one({"_id": ObjectId(task_id), "userId": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

async def _check_and_award_badges(db, user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    
    total = user.get("totalCompleted", 0)
    badges = user.get("badges", [])
    new_badges = []
    
    if total >= 1 and "first_task" not in badges:
        new_badges.append("first_task")
    if total >= 10 and "ten_tasks" not in badges:
        new_badges.append("ten_tasks")
    if total >= 100 and "century" not in badges:
        new_badges.append("century")
    
    if new_badges:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"badges": {"$each": new_badges}}}
        )
    
    xp = user.get("xp", 0)
    level = max(1, xp // 100 + 1)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"level": level}})
