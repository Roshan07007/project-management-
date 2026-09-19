# ⚡ TaskFlow - Full-Stack Project Management Tool

> **CodeAlpha Internship Project** — A modern, professional, and deployment-ready full-stack collaborative project management platform built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, **MongoDB Atlas**, and **Mongoose**.

---

## 🌟 Application Features

- **Authentication & Security**:
  - Secure registration and login with `bcryptjs` password hashing.
  - JWT (JSON Web Token) authentication with protected client routes and API middleware.
  - User profile customization (name, bio, dynamic avatar color palette) and password changing.
- **Project Management**:
  - Create, read, update, and delete projects.
  - Set project title, description, status (`Active`, `In Progress`, `Completed`, `On Hold`), start date, and target deadline.
  - Real-time aggregate progress percentage calculations and workload stats.
- **Team Collaboration & Permissions**:
  - Invite registered users by email to any project.
  - Role-based permissions (`Owner`, `Admin`, `Member`, `Viewer`).
  - Task assignment validation (prevents assigning tasks to non-project members).
- **Interactive Kanban Board**:
  - Three distinct workflow columns: **To Do**, **In Progress**, and **Completed**.
  - HTML5 drag-and-drop and 1-click status transitions.
  - Filter tasks by project, priority (`Low`, `Medium`, `High`), assignee, and search query.
- **Task Management & Live Comments**:
  - Comprehensive task creation and editing with priority badges and due date countdowns.
  - Task discussion threads with author attribution, timestamps, and author deletion permissions.
- **Dashboard & Actionable Analytics**:
  - 6 KPI stat cards: Total Projects, Total Tasks, To Do, In Progress, Completed, Overdue Tasks.
  - Recent projects and tasks feeds with quick completion toggles.
- **Theme & Health Diagnostics**:
  - Modern dark/light mode toggle persisted in local storage.
  - Live MongoDB Atlas connectivity health check indicator (`GET /api/health`).

---

## 💻 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React Icons |
| **Backend** | Node.js, Express.js, Mongoose ODM, JWT, bcryptjs, CORS, Dotenv |
| **Database** | MongoDB Atlas (Cloud Database) |
| **Frontend Hosting** | Netlify |
| **Backend Hosting** | Render |

---

## 📁 Clean Folder Structure

```
project-management/
├── backend/                  # Express + Mongoose REST API Backend
│   ├── src/
│   │   ├── config/           # Database connection (db.js)
│   │   ├── controllers/      # Route controllers (auth, project, task, comment)
│   │   ├── middleware/       # JWT protection & centralized error handling
│   │   ├── models/           # Mongoose schemas (User, Project, Task, Comment)
│   │   ├── routes/           # RESTful route definitions
│   │   └── server.js         # Express app entry & sequential DB startup
│   ├── .env.example          # Backend environment variables template
│   ├── package.json          # Backend dependencies & scripts
│   └── test-api.js           # Automated integration test suite
├── frontend/                 # React + Vite + Tailwind Frontend
│   ├── public/
│   │   └── _redirects        # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/       # Reusable layout, common, project & task modals
│   │   ├── context/          # AuthContext & ThemeContext providers
│   │   ├── pages/            # 10 Application pages (Dashboard, Kanban, Projects, Profile, etc.)
│   │   ├── services/         # Axios API communication layer
│   │   ├── App.jsx           # Route tree & context integration
│   │   ├── index.css         # Tailwind & custom glassmorphism styles
│   │   └── main.jsx          # React DOM entry point
│   ├── .env.example          # Frontend environment variables template
│   ├── index.html            # Single page HTML entry
│   ├── tailwind.config.js    # Tailwind theme & color configurations
│   ├── vite.config.js        # Vite build & local API proxy configuration
│   └── package.json          # Frontend dependencies & scripts
├── .gitignore                # Global git ignore configuration
├── package.json              # Root scripts for running backend & frontend
└── README.md                 # Complete project documentation
```

---

## ⚙️ Environment Variables Configuration

### 1. Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority

# Secret key used to sign JWT tokens (Use any long random string)
JWT_SECRET=taskflow_super_secret_jwt_key_2026_codealpha

# Backend Port
PORT=5000

# Frontend URL (For CORS whitelist in production)
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

> **Security Reminder**: `.env` files are included in `.gitignore` and must **never** be committed to public repositories.

---

## 🍃 MongoDB Atlas Setup Guide

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g., M0 sandbox).
3. **Database Access**: Under *Security > Database Access*, create a database user with password authentication (Read and Write to any database).
4. **Network Access**: Under *Security > Network Access*, add `0.0.0.0/0` (Allow access from anywhere) so Render and your local machine can connect.
5. **Get Connection String**:
   - Go to your Cluster and click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
     ```
   - Paste it into `backend/.env` under `MONGO_URI` with your user credentials.

---

## 🚀 Local Development Setup

### 1. Install all dependencies:
Run from the root directory:
```bash
npm run install:all
```
*(Or navigate to `backend` and `frontend` separately and run `npm install` in each).*

### 2. Start the Backend API server:
```bash
cd backend
npm run dev
```
*Backend runs on: [http://localhost:5000](http://localhost:5000)*
*Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)*

### 3. Start the Frontend React client:
In a new terminal window:
```bash
cd frontend
npm run dev
```
*Frontend runs on: [http://localhost:5173](http://localhost:5173)*

### 4. Run automated test suite:
```bash
cd backend
npm test
```

---

## 📡 Backend REST API Reference

### Health & Status
- `GET /api/health` — Returns real-time MongoDB Atlas status and uptime.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`).
- `POST /api/auth/login` — Sign in and receive JWT bearer token.
- `GET /api/auth/me` — Fetch currently authenticated profile (Protected).
- `PUT /api/auth/profile` — Update user name, bio, and avatar color (Protected).
- `PUT /api/auth/change-password` — Change password (Protected).
- `GET /api/auth/users` — Search registered users (Protected).

### Projects (`/api/projects`)
- `GET /api/projects` — List all projects where user is owner or team member.
- `POST /api/projects` — Create project (`title`, `description`, `status`, `startDate`, `dueDate`).
- `GET /api/projects/:id` — Get project details with populated members and tasks.
- `PUT /api/projects/:id` — Update project metadata (Owner/Admin only).
- `DELETE /api/projects/:id` — Delete project and cascade delete tasks & comments (Owner only).

### Team Members (`/api/projects/:id/members`)
- `POST /api/projects/:id/members` — Invite member by email (`email`, `role: 'Admin'|'Member'|'Viewer'`).
- `DELETE /api/projects/:id/members/:userId` — Remove team member.

### Tasks (`/api/tasks`)
- `GET /api/tasks` — List tasks with query filters (`project`, `status`, `priority`, `assignedTo`, `search`).
- `POST /api/tasks` — Create task (`title`, `description`, `project`, `assignedTo`, `status`, `priority`, `dueDate`).
- `GET /api/tasks/:id` — Get task details with populated comments.
- `PUT /api/tasks/:id` — Update task details and status.
- `DELETE /api/tasks/:id` — Delete task and its comments.

### Comments (`/api/tasks/:taskId/comments` & `/api/comments`)
- `GET /api/tasks/:taskId/comments` — Get comment thread for a task.
- `POST /api/tasks/:taskId/comments` — Post comment on a task (`content`).
- `DELETE /api/comments/:id` — Delete comment (Author or project admin).

---

## 🌐 Production Deployment Guide

### A. Deploy Backend to Render

1. Push your repository to **GitHub**.
2. Sign in to [Render](https://render.com) and click **New + > Web Service**.
3. Connect your GitHub repository.
4. Configure the settings:
   - **Name**: `taskflow-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Add **Environment Variables** in Render Dashboard:
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_secure_jwt_secret`
   - `PORT`: `5000`
   - `FRONTEND_URL`: `https://your-app-name.netlify.app` *(update once frontend is deployed)*
6. Click **Deploy Web Service**. Copy your backend URL (e.g. `https://taskflow-api.onrender.com`).

---

### B. Deploy Frontend to Netlify

1. Sign in to [Netlify](https://www.netlify.com).
2. Click **Add new site > Import an existing project**.
3. Connect your GitHub repository.
4. Configure Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add **Environment Variables** in Netlify:
   - `VITE_API_URL`: `https://taskflow-api.onrender.com/api` *(Your Render backend URL + /api)*
6. Click **Deploy Site**.
7. *(Optional)* Go back to your Render backend environment variables and set `FRONTEND_URL` to your Netlify site URL.

---

## 🛠️ Common Errors & Troubleshooting

| Issue | Cause | Solution |
| --- | --- | --- |
| `MongooseServerSelectionError` | MongoDB Atlas IP not whitelisted | In MongoDB Atlas, go to *Network Access* and add `0.0.0.0/0`. |
| `CORS error in browser` | Frontend origin not matching backend | Verify `FRONTEND_URL` in `backend/.env` matches your Netlify domain. |
| `404 on page refresh in Netlify` | Missing SPA redirect rewrite | Ensure `frontend/public/_redirects` exists with `/* /index.html 200`. |
| `Not authorized, no token provided` | Expired or missing JWT token | Log out and sign back in to refresh token in `localStorage`. |

---

## 👤 Author & Acknowledgments

- **Developer**: CodeAlpha Full-Stack Web Development Intern
- **Assignment**: TaskFlow - Project Management System
- **Year**: 2026
