# Signal Clone - Fullstack Real-Time Messaging Application

A high-performance, feature-rich Signal-clone web messaging application built with Next.js (TypeScript) frontend, FastAPI (Python) backend, SQLite database, and real-time WebSockets communication.

---

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS with Signal dark theme design tokens (`#111214`, `#17181c`, `#202226`, `#2b2d33`, `#2c6bed`), Lucide Icons.
- **Backend**: FastAPI (Python 3.11+), Uvicorn ASGI Server, SQLAlchemy ORM, Pydantic v2, PyJWT.
- **Database**: SQLite (`signal.db`) with async session support (`aiosqlite`) and database seeder (`seed.py`).
- **Real-Time Layer**: FastAPI WebSockets carrying events for instant messages, typing status, checkmark read receipts, presence, and group admin updates.

---

## Architecture Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │                   Next.js 14 Frontend                   │
 │ (AuthContext • ChatContext • SocketContext • Signal UI) │
 └─────────────┬─────────────────────────────┬─────────────┘
               │ HTTP REST APIs              │ WebSockets (ws://)
               ▼                             ▼
 ┌─────────────────────────────────────────────────────────┐
 │                     FastAPI Backend                     │
 │ (Auth • Users • Conversations • WebSocket Handler)      │
 └─────────────┬─────────────────────────────┬─────────────┘
               │ Async SQLAlchemy ORM        │ Broadcast Events
               ▼                             ▼
 ┌─────────────────────────────┐   ┌──────────────────────┐
 │     SQLite Database         │   │ ConnectionManager    │
 │ (signal.db relational tables)│   │ (Active User Sockets)│
 └─────────────────────────────┘   └──────────────────────┘
```

### Communication Flow
1. **Authentication**: Users log in with phone number or username and a fixed OTP (`123456`). Successful verification returns a JWT access token stored in `localStorage` and `cookie`.
2. **REST API Data**: REST endpoints handle initial bootstrap (user profile, contact list, conversation list, message history, image/file upload).
3. **WebSockets Layer**:
   - Sockets connect to `ws://localhost:8000/ws?token=<jwt_token>`.
   - `ConnectionManager` maintains active user sockets and handles real-time broadcasting.
   - Outgoing messages (`message:send`) are written to SQLite and broadcasted to all online conversation participants in real time.
   - Read receipts (`message:read`) and typing status (`typing:start`/`stop`) dispatch live updates.
   - Automatic reconnection with exponential backoff handles temporary socket drops gracefully.

---

## Database Schema (SQLite)

The relational schema is defined in `backend/app/db/models.py`:

```
users
├── id (TEXT PK, UUIDv4)
├── phone (TEXT UNIQUE)
├── username (TEXT UNIQUE)
├── display_name (TEXT)
├── avatar_url (TEXT NULL)
├── about (TEXT)
├── is_online (BOOLEAN)
├── last_seen (DATETIME)
└── created_at (DATETIME)

contacts
├── id (TEXT PK)
├── user_id (TEXT FK -> users.id)
├── contact_user_id (TEXT FK -> users.id)
├── alias (TEXT NULL)
└── created_at (DATETIME)

conversations
├── id (TEXT PK)
├── type (TEXT: 'direct' | 'group')
├── title (TEXT NULL)
├── avatar_url (TEXT NULL)
├── description (TEXT NULL)
├── created_by (TEXT FK -> users.id)
├── created_at (DATETIME)
└── updated_at (DATETIME)

conversation_members
├── id (TEXT PK)
├── conversation_id (TEXT FK -> conversations.id)
├── user_id (TEXT FK -> users.id)
├── role (TEXT: 'admin' | 'member')
├── joined_at (DATETIME)
└── last_read_message_id (TEXT FK -> messages.id)

messages
├── id (TEXT PK)
├── conversation_id (TEXT FK -> conversations.id)
├── sender_id (TEXT FK -> users.id)
├── content (TEXT)
├── message_type (TEXT: 'text' | 'image' | 'file' | 'system')
├── media_url (TEXT NULL)
├── reply_to_id (TEXT FK -> messages.id)
├── is_deleted (BOOLEAN)
└── created_at (DATETIME)

message_receipts
├── id (TEXT PK)
├── message_id (TEXT FK -> messages.id)
├── user_id (TEXT FK -> users.id)
├── status (TEXT: 'sent' | 'delivered' | 'read')
└── timestamp (DATETIME)

message_reactions
├── id (TEXT PK)
├── message_id (TEXT FK -> messages.id)
├── user_id (TEXT FK -> users.id)
├── emoji (TEXT)
└── created_at (DATETIME)
```

---

## Environment Variables

### Backend (`/backend/.env`)
```ini
DATABASE_URL=sqlite+aiosqlite:///./signal.db
SYNC_DATABASE_URL=sqlite:///./signal.db
JWT_SECRET=super-secret-signal-key-2026
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FIXED_OTP=123456
ALLOWED_ORIGINS=*
PORT=8000
```

### Frontend (`/frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Local Setup & Run Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database (Populates 5 users, contacts, 3 direct chats & 1 group chat)
python app/seed.py

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend server will start at `http://localhost:8000`. Swagger API docs available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev -- --port 3000
```
Frontend web application will start at `http://localhost:3000`.

---

## API & WebSocket Endpoints

### Authentication
- `POST /api/auth/send-otp` - Request OTP code for phone or username.
- `POST /api/auth/verify-otp` - Verify OTP code (`123456`) and return JWT access token.
- `POST /api/auth/register` - Complete profile registration for new users.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Users & Contacts
- `POST /api/users/avatar` - Upload profile avatar photo.
- `POST /api/users/attachment` - Upload image or file message attachments.
- `GET /api/users/search?q=query` - Search registered users by name, username, or phone.
- `PUT /api/users/me` - Update current user display name and about status.
- `GET /api/users/contacts` - Fetch user saved contact list.
- `POST /api/users/contacts/{contact_user_id}` - Add user to saved contact list.

### Conversations & Groups
- `GET /api/conversations` - Fetch user's direct and group conversations sorted by recent activity.
- `POST /api/conversations/direct` - Get or create a 1-on-1 conversation.
- `POST /api/conversations/group` - Create a multi-user group chat.
- `POST /api/conversations/{id}/members` - Add members to group (Admin only).
- `DELETE /api/conversations/{id}/members/{user_id}` - Remove member or leave group.
- `GET /api/conversations/{id}/messages` - Fetch message history for a conversation.

### WebSockets
- `WS /ws?token=<jwt_token>` - WebSockets endpoint for real-time messages (`message:send`, `message:new`), read receipts (`message:read`, `receipt:update`), typing indicators (`typing:start`, `typing:stop`), and presence updates.

---

## Seed Data Test Accounts

The seeder script (`python app/seed.py`) pre-populates `signal.db` with test users (OTP for all users is `123456`):
1. **Alice Smith**: `+15550101` / `@alice` (Primary test user)
2. **Bob Johnson**: `+15550102` / `@bob`
3. **Charlie Davis**: `+15550103` / `@charlie`
4. **Diana Prince**: `+15550104` / `@diana`
5. **Ethan Hunt**: `+15550105` / `@ethan`

---

## Production Deployment Guide

### Deploy Backend to Render / Railway / Heroku
1. Push backend repository code.
2. The included `render.yaml` or `Procfile` configures Uvicorn start command:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set environment variable `ALLOWED_ORIGINS` to your deployed Vercel frontend URL (e.g., `https://signal-clone.vercel.app`).

### Deploy Frontend to Vercel
1. Connect frontend GitHub repository to Vercel.
2. The included `vercel.json` provides build command `npm run build`.
3. Set environment variable `NEXT_PUBLIC_API_URL` to your deployed backend API URL (e.g., `https://signal-clone-backend.onrender.com/api`).

---

## Assumptions Made

1. **Mocked Auth**: Authentication utilizes phone number/username + fixed OTP (`123456`) returning standard JWT access tokens.
2. **Placeholder Features**: Voice/Video calls, Stories, Linked Devices, and Real E2EE feature Signal-faithful UI indicators and modal overlays labeled **"Coming Soon"**.
3. **Storage**: User avatars and file attachments are stored locally in `backend/uploads/` and served via static URL mount `/static/uploads/...`.
