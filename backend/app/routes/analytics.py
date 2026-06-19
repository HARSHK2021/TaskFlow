from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.database.connection import get_database
from app.authentication.auth_handler import get_current_user
import calendar

router = APIRouter()

@router.get("/monthly")
async def get_monthly_analytics(
    month: int = Query(default=None),
    year: int = Query(default=None),
    user_id: str = Depends(get_current_user)
):
    db = get_database()
    today = date.today()
    if not month:
        month = today.month
    if not year:
        year = today.year
    
    prefix = f"{year}-{month:02d}"
    tasks = await db.tasks.find(
        {"userId": ObjectId(user_id), "date": {"$regex": f"^{prefix}"}}
    ).to_list(1000)
    
    days_in_month = calendar.monthrange(year, month)[1]
    daily_completion = {}
    
    for day in range(1, days_in_month + 1):
        day_str = f"{year}-{month:02d}-{day:02d}"
        day_tasks = [t for t in tasks if t["date"] == day_str]
        if day_tasks:
            completed = sum(1 for t in day_tasks if t["completed"])
            daily_completion[day_str] = round(completed / len(day_tasks) * 100, 1)
        else:
            daily_completion[day_str] = 0
    
    # Weekly aggregation
    weekly_data = []
    for week_num in range(1, 6):
        week_start = (week_num - 1) * 7 + 1
        week_end = min(week_num * 7, days_in_month)
        week_tasks = [t for t in tasks if week_start <= int(t["date"].split("-")[2]) <= week_end]
        if week_tasks:
            completed = sum(1 for t in week_tasks if t["completed"])
            rate = round(completed / len(week_tasks) * 100, 1)
        else:
            rate = 0
        weekly_data.append({"week": f"Week {week_num}", "rate": rate, "total": len(week_tasks)})
    
    # Habits analytics
    habits = await db.habits.find({"userId": ObjectId(user_id), "active": True}).to_list(100)
    top_habits = []
    for h in habits:
        history = h.get("completionHistory", {})
        month_completions = sum(1 for k, v in history.items() if k.startswith(prefix) and v)
        top_habits.append({
            "name": h["name"],
            "icon": h["icon"],
            "color": h["color"],
            "completions": month_completions
        })
    top_habits.sort(key=lambda x: x["completions"], reverse=True)
    
    # Heatmap (last 3 months)
    heatmap_data = []
    for i in range(90):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        day_tasks = await db.tasks.count_documents({"userId": ObjectId(user_id), "date": d_str})
        completed = await db.tasks.count_documents({"userId": ObjectId(user_id), "date": d_str, "completed": True})
        level = 0
        if day_tasks > 0:
            rate = completed / day_tasks
            level = 1 if rate < 0.25 else 2 if rate < 0.5 else 3 if rate < 0.75 else 4
        heatmap_data.append({"date": d_str, "level": level, "count": completed})
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t["completed"])
    completion_rate = round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
    
    streak_bonus = min(30, await _get_current_streak(db, user_id))
    productivity_score = min(100, completion_rate * 0.7 + streak_bonus * 1.0)
    
    return {
        "month": month, "year": year,
        "dailyCompletion": daily_completion,
        "weeklyData": weekly_data,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "completionRate": completion_rate,
        "productivityScore": round(productivity_score, 1),
        "topHabits": top_habits[:5],
        "heatmapData": heatmap_data
    }

@router.get("/history")
async def get_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    completed: Optional[bool] = None,
    user_id: str = Depends(get_current_user)
):
    db = get_database()
    query = {"userId": ObjectId(user_id)}
    
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    if category:
        query["category"] = category
    if completed is not None:
        query["completed"] = completed
    
    tasks = await db.tasks.find(query).sort("date", -1).to_list(500)
    
    # Group by month
    monthly_summary = {}
    for task in tasks:
        month_key = task["date"][:7]
        if month_key not in monthly_summary:
            monthly_summary[month_key] = {"total": 0, "completed": 0}
        monthly_summary[month_key]["total"] += 1
        if task["completed"]:
            monthly_summary[month_key]["completed"] += 1
    
    return {
        "tasks": [{
            "id": str(t["_id"]),
            "title": t["title"],
            "date": t["date"],
            "category": t["category"],
            "priority": t["priority"],
            "completed": t["completed"],
            "color": t.get("color", "#6366f1"),
            "icon": t.get("icon", "✅")
        } for t in tasks],
        "monthlySummary": monthly_summary
    }

@router.get("/insights")
async def get_ai_insights(user_id: str = Depends(get_current_user)):
    db = get_database()
    today = date.today()
    month_prefix = today.strftime("%Y-%m")
    
    tasks = await db.tasks.find(
        {"userId": ObjectId(user_id), "date": {"$regex": f"^{month_prefix}"}}
    ).to_list(500)
    
    habits = await db.habits.find({"userId": ObjectId(user_id), "active": True}).to_list(50)
    
    insights = []
    
    if tasks:
        total = len(tasks)
        completed = sum(1 for t in tasks if t["completed"])
        rate = round(completed / total * 100)
        insights.append(f"You've completed {rate}% of your tasks this month. {'Great job! 🎉' if rate > 70 else 'Keep pushing! 💪'}")
        
        # Most productive day
        day_counts = {}
        for t in tasks:
            if t["completed"]:
                d = datetime.strptime(t["date"], "%Y-%m-%d").weekday()
                day_name = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][d]
                day_counts[day_name] = day_counts.get(day_name, 0) + 1
        if day_counts:
            best_day = max(day_counts, key=day_counts.get)
            insights.append(f"Your most productive day is {best_day} 📅")
        
        # Category breakdown
        cats = {}
        for t in tasks:
            if t["completed"]:
                cats[t["category"]] = cats.get(t["category"], 0) + 1
        if cats:
            top_cat = max(cats, key=cats.get)
            insights.append(f"You excel in {top_cat.title()} tasks with {cats[top_cat]} completions this month 🏆")
    
    if habits:
        for h in habits[:3]:
            history = h.get("completionHistory", {})
            month_done = sum(1 for k, v in history.items() if k.startswith(month_prefix) and v)
            if month_done > 0:
                insights.append(f"Your '{h['name']}' {h['icon']} habit has been completed {month_done} times this month!")
    
    if not insights:
        insights = [
            "Start adding tasks and habits to get personalized insights! 🚀",
            "Consistency is key - try to complete at least one task every day 💡",
            "Set up habits to track your daily routines 📊"
        ]
    
    return {"insights": insights}

async def _get_current_streak(db, user_id: str) -> int:
    today = date.today()
    streak = 0
    check = today
    
    for _ in range(365):
        d_str = check.strftime("%Y-%m-%d")
        total = await db.tasks.count_documents({"userId": ObjectId(user_id), "date": d_str})
        if total == 0:
            break
        completed = await db.tasks.count_documents({"userId": ObjectId(user_id), "date": d_str, "completed": True})
        if completed == 0:
            break
        streak += 1
        check -= timedelta(days=1)
    
    return streak
