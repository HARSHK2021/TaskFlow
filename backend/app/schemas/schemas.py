from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TaskType(str, Enum):
    daily_habit = "daily_habit"
    one_time = "one_time"
    goal = "goal"
    reminder = "reminder"

class Category(str, Enum):
    health = "health"
    study = "study"
    work = "work"
    personal = "personal"
    finance = "finance"
    other = "other"

class HabitFrequency(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"

# Auth Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    createdAt: datetime
    level: int = 1
    xp: int = 0
    totalCompleted: int = 0
    currentStreak: int = 0
    bestStreak: int = 0
    badges: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: Category = Category.personal
    priority: Priority = Priority.medium
    taskType: TaskType = TaskType.one_time
    date: str  # YYYY-MM-DD
    notes: Optional[str] = None
    reminderTime: Optional[str] = None
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "✅"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[Category] = None
    priority: Optional[Priority] = None
    taskType: Optional[TaskType] = None
    date: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None
    reminderTime: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None

class TaskResponse(BaseModel):
    id: str
    userId: str
    title: str
    category: str
    priority: str
    taskType: str
    date: str
    completed: bool
    notes: Optional[str] = None
    reminderTime: Optional[str] = None
    color: str = "#6366f1"
    icon: str = "✅"
    order: int = 0
    createdAt: datetime

# Habit Schemas
class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: Category = Category.health
    icon: str = "🎯"
    color: str = "#6366f1"
    frequency: HabitFrequency = HabitFrequency.daily
    targetDays: List[int] = [0, 1, 2, 3, 4, 5, 6]  # 0=Monday, 6=Sunday
    reminderTime: Optional[str] = None

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Category] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    targetDays: Optional[List[int]] = None
    reminderTime: Optional[str] = None
    active: Optional[bool] = None

class HabitCompletion(BaseModel):
    date: str  # YYYY-MM-DD
    completed: bool

class HabitResponse(BaseModel):
    id: str
    userId: str
    name: str
    category: str
    icon: str
    color: str
    frequency: str
    targetDays: List[int]
    completionHistory: Dict[str, bool] = {}
    reminderTime: Optional[str] = None
    active: bool = True
    currentStreak: int = 0
    bestStreak: int = 0
    totalCompleted: int = 0
    createdAt: datetime

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    month: int
    year: int
    dailyCompletion: Dict[str, float]
    weeklyData: List[Dict[str, Any]]
    totalTasks: int
    completedTasks: int
    completionRate: float
    productivityScore: float
    topHabits: List[Dict[str, Any]]
    heatmapData: List[Dict[str, Any]]

# Profile Schemas
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
