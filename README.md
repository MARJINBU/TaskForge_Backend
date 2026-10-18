# TaskForge Backend

Backend API for the TaskForge PBL task management system. Built with Node.js, Express, and SQLite (via `sql.js`, so no native C++ build tools or WSL are needed).

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the ZIP and open the `TaskForge_Backend` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install packages:
   ```powershell
   npm.cmd install
   ```
4. (Optional) Copy `.env.example` to `.env` and adjust settings.
5. Start the server:
   ```powershell
   npm.cmd start
   ```
6. Open `http://localhost:5000/` or `http://localhost:5000/api/health`.

The database file is created automatically at `data/taskforge.sqlite` and is persisted when data changes. Do not commit the local database if it contains real user data.

## API endpoints
All request bodies should be JSON.

### Users
- `GET /api/users` — list users
- `GET /api/users/:id` — get a user
- `POST /api/users` — create user: `{ "name": "Madhav", "email": "madhav@example.com", "role": "member" }`
- `PUT /api/users/:id` — update user fields
- `DELETE /api/users/:id` — delete user

Roles: `admin`, `member`.

### Projects
- `GET /api/projects` — list projects
- `GET /api/projects/:id` — get project and members
- `POST /api/projects` — create project: `{ "name": "PBL Project", "description": "Team task management", "owner_id": 1 }`
- `PUT /api/projects/:id` — update project
- `POST /api/projects/:id/members` — add member: `{ "user_id": 1 }`
- `DELETE /api/projects/:id/members/:userId` — remove member
- `DELETE /api/projects/:id` — delete project and its tasks

### Tasks
- `GET /api/tasks` — list tasks; optional filters: `?project_id=1`, `?assigned_to=1`, `?status=todo`
- `GET /api/tasks/:id` — get a task
- `POST /api/tasks` — create task: `{ "title": "Build API", "project_id": 1, "assigned_to": 1, "status": "todo", "priority": "medium", "due_date": "2026-11-01" }`
- `PUT /api/tasks/:id` — update task
- `PATCH /api/tasks/:id/status` — change status: `{ "status": "completed" }`
- `DELETE /api/tasks/:id` — delete task

Task statuses: `todo`, `in_progress`, `completed`. Priorities: `low`, `medium`, `high`.

## Important notes
- This is a learning-project backend, not production-ready. It does not include login/authentication or authorization yet.
- Test POST/PUT/PATCH endpoints with Postman, Thunder Client, or your frontend; typing a URL in a browser sends a GET request.
- Never commit passwords, API keys, or private `.env` files.
