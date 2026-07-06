# RIPPLE-Anoymous Chat Platform for NITK 

RIPPLE is a real-time, campus-focused chat platform that enables anonymous and pseudonymous communication. It features secure group chats, peer-to-peer direct messaging within groups, and a powerful AI-driven moderation system that automatically flags and retracts toxic messages in real time.

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Setup & Development Guidelines](#setup--development-guidelines)
- [Deployment Configuration](#deployment-configuration)
- [API Documentation](#api-documentation)

---

## 🚀 Project Overview

The system is composed of three main components:
1. **Client (`/client`)**: A modern, responsive React frontend utilizing Vite and TailwindCSS. Features real-time UI updates and fluid animations.
2. **Server (`/server`)**: A robust Node.js/Express backend providing RESTful APIs, JWT-based authentication, and Socket.io for real-time bi-directional communication.
3. **AI Moderation Worker (`/server2`)**: A background Python worker that listens to a Redis queue. It uses a Hugging Face `Toxic-BERT` model to analyze messages and instantly flags/retracts toxic content from the Supabase database.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19, Vite
- **Styling:** TailwindCSS, Radix UI
- **Animations:** Framer Motion
- **Networking:** Axios, Socket.io-client
- **Icons & Extras:** Tabler Icons, Emoji Picker React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-time:** Socket.io
- **Auth/Security:** JWT (JSON Web Tokens), bcryptjs
- **Database Connection:** PostgreSQL (`postgres.js`), Supabase JS Client

### AI Background Worker
- **Language:** Python 3
- **Machine Learning:** PyTorch, Transformers (Hugging Face `unitary/toxic-bert`)
- **Queue/PubSub:** Redis

### Infrastructure & Databases
- **Primary Database:** Supabase (PostgreSQL)
- **Message Queue/Cache:** Upstash Redis

---

## 🗄️ Database Schema

The primary data is stored in PostgreSQL (via Supabase). The schema includes:

- **`group_chat_rooms`** (Inferred)
  - Stores room metadata (id, name, created_at, campus_id).
- **`group_chat_members`**
  - Links users to group chats.
  - Fields: `member_id` (TEXT), `group_id` (UUID), `anon_name` (Pseudonym/TEXT).
- **`group_chat_messages`**
  - Stores messages for group chats.
  - Fields: `id` (UUID), `chat_id` (UUID), `member_id` (TEXT), `text` (TEXT), `timestamp`, `is_toxic` (BOOLEAN).
- **`group_direct_chats`**
  - Tracks 1-on-1 direct messaging pairings within groups.
  - Fields: `id` (UUID), `group_id` (UUID), `member1_id` (TEXT), `member2_id` (TEXT), `created_at`. (Unique constraint on group_id, member1_id, member2_id).
- **`group_direct_messages`**
  - Stores direct messages.
  - Fields: `id` (UUID), `chat_id` (UUID - references `group_direct_chats`), `author_id` (TEXT), `text` (TEXT), `timestamp`, `is_toxic` (BOOLEAN).

*(Note: Auth is likely managed by Supabase Auth or a custom `users` table handling email, password hashes, and OTPs).*

---

## 💻 Setup & Development Guidelines

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Redis Server (or Upstash account)
- Supabase Project

### 1. Backend Setup (`/server`)
```bash
cd server
npm install
```
**Environment Variables (`server/.env`):**
Create a `.env` file containing your configurations (e.g., `PORT`, `CLIENT_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `REDIS_URL`).

Run the server:
```bash
npm run start
```

### 2. Frontend Setup (`/client`)
```bash
cd client
npm install
```
**Environment Variables (`client/.env`):**
Create a `.env` file containing your configurations (e.g., `VITE_API_URL`, `VITE_SOCKET_URL`).

Run the dev server:
```bash
npm run dev
```

### 3. AI Worker Setup (`/server2`)
The Python worker listens for new messages via Redis and analyzes them using `Toxic-BERT`.

```bash
cd server2
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```
**Environment Variables (`server2/.env`):**
Create a `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
REDIS_URL=your_redis_url
```

Run the worker:
```bash
python worker.py
```
*(Note: The first run will download the Toxic-BERT model into memory, which may take a few minutes).*

---

## ☁️ Deployment Configuration

- **Frontend (Client):** 
  - Host on **Vercel** or **Netlify**.
  - Build command: `npm run build` (Outputs to `/dist`).
  - Set `VITE_API_URL` and `VITE_SOCKET_URL` in the platform's environment variables.
  
- **Backend (Node Server):** 
  - Host on **Render**, **Railway**, or **Heroku**.
  - Start command: `node index.js`.
  - Ensure CORS `CLIENT_URL` matches your deployed frontend domain.
  
- **AI Worker (Python Server):** 
  - Host as a **Background Worker** on **Render** or **Railway**.
  - Provide at least 1GB-2GB of RAM (required to load the PyTorch Transformer model).
  - Start command: `python worker.py`.

---

## 📡 API Documentation

Base URL: `http://localhost:<PORT>`

### Authentication Routes (`/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Register a new user | No |
| POST | `/verify` | Verify OTP or email | No |
| POST | `/login` | Authenticate and receive JWT | No |
| POST | `/logout` | Clear JWT cookies/tokens | Yes |

### Group Chat Routes (`/groupchat` or `/directChat`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/group/create/:id` | Create a new group chat room | Yes |
| POST | `/group/join/:id/:roomId` | Join an existing group room | Yes |
| POST | `/group/leave/:id/:roomId` | Leave a group room | Yes |
| GET | `/group/active/:id` | Fetch all active groups for a user | Yes |
| POST | `/group/:id/:roomId/sendmessage` | Send a message to a group | Yes (Room Member) |
| GET | `/group/:id/:roomId/getmessages` | Get message history for a group | Yes (Room Member) |

### Direct Chat Routes (`/groupchat` or `/directChat`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/direct/pair/:id` | Start a direct 1-on-1 chat in a group | Yes |
| POST | `/direct/leave/:id` | End a direct chat | Yes |
| GET | `/direct/chats/:id/:groupId` | Get user's active direct chats | Yes |
| POST | `/direct/:id/:groupId/:chatId/sendmessage` | Send a direct message | Yes |
| GET | `/direct/:id/:groupId/:chatId/getmessages` | Get history of a direct chat | Yes |

*Note: Most chat and messaging interactions also leverage real-time Socket.io events (`send_message`, `receive_message`, `toxic_retraction`) for instant UI updates.*
