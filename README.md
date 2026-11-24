# MANAK – Project Portfolio Evaluation Platform

MANAK is a community-driven platform for showcasing software projects, receiving
structured peer reviews, and tracking project quality across versions. Reviewers
score each project version on five criteria and provide a written comment.

## Features

- Browse projects and filter by category or technology tag.
- Create an account and sign in with email and password.
- Submit projects with GitHub and optional live-demo links.
- Review other developers' projects on five 1–5 criteria.
- View project reviews, per-version scores, and score changes over time.
- Submit a new project version and track its performance on the owner dashboard.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| Authentication | JWT bearer tokens |

## Project structure

```text
Manak/
├── backend/
│   ├── app/
│   │   ├── routers/          # Authentication, project, and review endpoints
│   │   ├── services/         # Link verification and score aggregation
│   │   ├── database.py       # PostgreSQL connection and session dependency
│   │   ├── dependencies.py   # Authentication dependencies
│   │   ├── main.py           # FastAPI app, CORS, and table initialization
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic request and response schemas
│   │   └── security.py       # Password hashing and JWT helpers
│   └── requirements.txt
├── frontend/
│   ├── src/app/              # Next.js routes and shared app styles
│   ├── src/components/       # Pages, forms, charts, and reusable UI
│   ├── src/lib/              # API client and frontend types
│   ├── .env.example
│   └── package.json
├── .env.example              # Backend configuration template
└── README.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js and npm
- PostgreSQL server
- A PostgreSQL database named `manak`

## Configuration

The backend reads `.env` from the project root (the same directory as this
README). Copy the template and edit it:

```powershell
cd C:\Users\ERMOH\Desktop\Manak
Copy-Item .env.example .env
notepad .env
```

Configure these values:

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection string | `postgresql+psycopg://manak:your-password@localhost:5432/manak` |
| `FRONTEND_ORIGIN` | Frontend origin allowed by CORS | `http://localhost:3000` |
| `JWT_SECRET_KEY` | Secret used to sign access tokens; use a random secret with at least 32 characters | Replace the example value |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime in minutes | `60` |

For example, the connection string has the form
`postgresql+psycopg://<user>:<password>@localhost:5432/manak`. If the password
contains reserved URL characters, URL-encode them in the connection string.
Do not commit `.env` or use the example JWT secret outside local development.

Create the `manak` database using your PostgreSQL administration tool, or run
this in a terminal where `psql` is available:

```powershell
psql -U postgres -c "CREATE DATABASE manak;"
```

The database server must be running before you start the backend.

## Run locally on Windows

Start the backend and frontend in two separate PowerShell terminals. Keep both
terminals open while using the app.

### 1. Set up and run the backend

From the project root:

```powershell
cd C:\Users\ERMOH\Desktop\Manak
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Make sure the root `.env` is configured and PostgreSQL is running. Then start
FastAPI from the backend directory:

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

The API is served at `http://localhost:8000`. Interactive API documentation is
available at `http://localhost:8000/docs`; the OpenAPI schema is at
`http://localhost:8000/openapi.json`.

On startup, SQLAlchemy creates the application tables if they do not already
exist. This is a simple development setup; it does not use a database migration
tool.

### 2. Set up and run the frontend

In a second PowerShell terminal:

```powershell
cd C:\Users\ERMOH\Desktop\Manak\frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend is served at `http://localhost:3000`. The provided
`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`. If your backend uses
a different URL, update it in `frontend\.env.local` and restart the frontend
server.

## Application pages

| URL | Description |
| --- | --- |
| `/` | Landing page and featured projects |
| `/explore` | Browse and filter projects |
| `/submit` | Submit a project |
| `/projects/{projectId}` | Project information, scores, reviews, and review form |
| `/dashboard` | List projects owned by the signed-in user |
| `/dashboard/{projectId}` | Version history, score chart, criterion changes, and new-version form |
| `/signup` | Create an account |
| `/login` | Sign in |

## Backend API

All routes are relative to `http://localhost:8000`. Use the interactive
documentation at `/docs` to inspect parameters, schemas, and responses.

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | No | Create an account with `name`, `email`, and `password` |
| `POST` | `/auth/login` | No | Sign in; returns a bearer access token and user |
| `POST` | `/projects` | Required | Create a project and its initial version |
| `GET` | `/projects` | No | List projects; optional `category` and `tech_tag` filters |
| `GET` | `/projects/mine` | Required | List projects owned by the signed-in user |
| `GET` | `/projects/{project_id}` | No | Get project details |
| `PUT` | `/projects/{project_id}` | Owner only | Update project fields |
| `POST` | `/projects/{project_id}/versions` | Owner only | Add a version using a `change_note` |
| `GET` | `/projects/{project_id}/scores` | No | Get score averages and review count for every version |
| `GET` | `/projects/{project_id}/analytics` | No | Get version scores and changes from the previous version |
| `GET` | `/projects/{project_id}/reviews` | No | List project reviews and comments |
| `POST` | `/projects/{project_id}/versions/{version_id}/reviews` | Required | Review a version |

Authenticated endpoints expect the header:

```text
Authorization: Bearer <access_token>
```

The login response includes `access_token`, `token_type`, and `user`. The
frontend stores the token in browser local storage and attaches it to
authenticated API requests.

### Project submission fields

Project creation expects `title`, `description`, `github_url`, `category`, and
`tech_tags`. `live_url` is optional. For example:

```json
{
  "title": "Community Library",
  "description": "A web app for organizing and sharing reading lists.",
  "github_url": "https://github.com/example/community-library",
  "live_url": "https://community-library.example.com",
  "category": "Web Development",
  "tech_tags": ["Next.js", "TypeScript"]
}
```

Project responses include `github_verified` and `live_verified` flags. GitHub
links are checked against the public GitHub API. Live links are checked over
HTTP(S); checks are restricted to public hosts and standard HTTP/HTTPS ports
and do not follow redirects. An absent live URL has `live_verified: false`.

### Reviews and scoring

A review contains integer scores from 1 to 5 for `innovation`,
`functionality`, `ui_ux`, `technical_quality`, and `documentation`, plus a
non-empty `comment`. Users cannot review their own projects or review the same
version more than once.

Each version's criterion average is calculated from its reviews. The overall
score is the average across the five criterion averages. A version with no
reviews has `null` averages and a `null` overall score. Analytics reports the
difference between each criterion average and the previous version's average;
changes are `null` for the first version or when either version has no reviews.

## Development checks

From the frontend directory, build the production bundle and run it locally:

```powershell
npm run build
npm start
```

For backend dependency consistency, activate the virtual environment and run:

```powershell
python -m pip check
```

## Troubleshooting

- **`npm` cannot find `package.json`:** Run npm commands from
  `C:\Users\ERMOH\Desktop\Manak\frontend`, not the project root.
- **`ModuleNotFoundError: No module named 'app'`:** Activate `.venv`, change to
  the `backend` directory, then run `python -m uvicorn app.main:app --reload`.
- **`DATABASE_URL is not set`:** Create `.env` in the project root from
  `.env.example`; check that the variable is present and the file is saved.
- **Database connection error:** Confirm PostgreSQL is running, the database
  exists, and the username/password/host/port in `DATABASE_URL` are correct.
- **Frontend cannot reach the API:** Confirm the backend is running and
  `NEXT_PUBLIC_API_URL` in `frontend\.env.local` matches its address. Restart
  the frontend after changing the environment file.
- **Windows blocks a Python executable:** Follow your organization's device
  policy and contact its administrator for an approved development environment.
  Do not disable or bypass application-control protections.

## Security notes

This project is intended as a college-level development project, not a
production-ready service. Keep secrets out of source control, use a unique
`JWT_SECRET_KEY`, and review the authentication and browser token-storage
approach before deploying it or handling real user data.
