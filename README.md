# Customer Inquiry Management System

Staff sign in, record customer inquiries, find them later, and move them through New, In Progress and Resolved.

Stack: Next.js (React) | Node.js + Express | PostgreSQL

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 15 or newer

## Setup

### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE inquiries;"
```

### 2. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set your own values:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/inquiries
JWT_SECRET=any_long_random_text
PORT=4000
FRONTEND_URL=http://localhost:3000
```

Create the tables and test users:

```bash
npm run migrate
npm run seed
npm run dev
```

The API runs on http://localhost:4000.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm run dev
```

Open http://localhost:3000.

## Test accounts

| Email | Password | Role |
|---|---|---|
| alice@example.com | Alice123! | staff |
| bob@example.com | Bob123! | staff |
| admin@example.com | Admin123! | admin |

## Run tests

Backend (needs the database running, stop the dev server first):

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

## Main API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/login | Sign in (sets httpOnly cookie) |
| POST | /api/auth/logout | Sign out |
| GET | /api/auth/me | Current user |
| GET | /api/inquiries?status=&q=&page= | List and search |
| POST | /api/inquiries | Create |
| GET | /api/inquiries/:id | View one |
| PATCH | /api/inquiries/:id/status | Change status |

Errors always use this shape: `{ "error": { "code": "...", "message": "..." } }`

## Testing gaps

- No end-to-end browser test.
- No frontend test for the list page or the stale-tab message.
- Backend tests use the same database as development and delete only rows with a subject starting with `TEST-`.