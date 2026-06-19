# TaskFlow — Smart Task Manager & Habit Tracker

A production-ready, mobile-first productivity app built with React + FastAPI + MongoDB.

---

## ✨ Features

- 🔐 Auth: Email/password + Google OAuth + Guest mode
- 📅 Smart calendar with month navigation & task status dots
- ⚡ Habit tracker with streaks, history, and mini charts
- 📊 Analytics: area charts, bar charts, pie charts, heatmap
- 📂 Full task history with search & filter
- 🏆 Gamification: XP, levels, achievement badges
- 💡 AI productivity insights
- 🌙 Dark-mode glassmorphism UI
- 📱 PWA-ready (installable on mobile)
- 🔒 Offline/guest mode with local storage

---

## 🗂 Project Structure

```
smart-task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── authentication/
│   │   │   └── auth_handler.py
│   │   ├── database/
│   │   │   └── connection.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── habits.py
│   │   │   ├── analytics.py
│   │   │   └── profile.py
│   │   └── schemas/
│   │       └── schemas.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    ├── src/
    │   ├── App.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── TaskContext.js
    │   ├── pages/
    │   │   ├── LandingPage.js
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── CalendarPage.js
    │   │   ├── HabitsPage.js
    │   │   ├── AnalyticsPage.js
    │   │   ├── HistoryPage.js
    │   │   └── ProfilePage.js
    │   ├── components/
    │   │   └── common/
    │   │       ├── AppShell.js
    │   │       └── LoadingScreen.js
    │   └── services/
    │       └── api.js
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:8000/api

# Start dev server
npm start
```

Frontend will be running at: **http://localhost:3000**

---

## ⚙️ Environment Variables

### Backend `.env`

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=smart_task_manager
SECRET_KEY=your-super-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
GOOGLE_CLIENT_ID=your-google-client-id        # optional
GOOGLE_CLIENT_SECRET=your-google-client-secret  # optional
ENVIRONMENT=development
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id   # optional
```

---

## 🌐 MongoDB Setup Options

### Option A — Local MongoDB
```bash
# macOS
brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt install mongodb && sudo systemctl start mongodb

# Windows
# Download installer from mongodb.com/try/download/community
```

### Option B — MongoDB Atlas (Free Cloud)
1. Go to https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string → paste in `MONGODB_URL`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google-login` | Google OAuth |
| GET | `/api/tasks` | Get tasks (filterable) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/habits` | Get habits |
| POST | `/api/habits` | Create habit |
| POST | `/api/habits/{id}/complete` | Toggle habit completion |
| DELETE | `/api/habits/{id}` | Delete habit |
| GET | `/api/analytics/monthly` | Monthly analytics |
| GET | `/api/analytics/history` | Task history |
| GET | `/api/analytics/insights` | AI insights |
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |

---

## 🚢 Deployment

### Backend — Railway / Render

1. Push backend folder to GitHub
2. Connect to Railway or Render
3. Set environment variables in dashboard
4. Deploy (auto-detected as Python app)

```bash
# Procfile (create in backend root)
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

### Frontend — Vercel / Netlify

```bash
cd frontend
npm run build
# Upload build/ folder to Vercel or Netlify
# Set REACT_APP_API_URL to your deployed backend URL
```

---

## 📱 PWA Installation

On mobile:
1. Open the app in Chrome/Safari
2. Tap the browser menu
3. Select "Add to Home Screen"
4. The app will install like a native app

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6 |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| HTTP | Axios |
| Backend | Python FastAPI |
| Database | MongoDB + Motor (async) |
| Auth | JWT + bcrypt, Google OAuth |
| Dates | date-fns |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for personal or commercial purposes.
