# 🌿 CIVICCARE

**See it. Report it. Track it. Improve India.**

CIVICCARE is a **simple citizen problem-reporting app**. A person photographs a public problem (pothole, garbage, broken streetlight…), AI helps describe it, and the user can track the complaint from **Open → In Progress → Resolved**.

> ⚠️ This is a citizen-reporting **concept / MVP**. It is not an official government website. Authority portals, OTP login, notifications and before/after proof are on the roadmap (see [Roadmap](#roadmap)).

---

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Frontend  | React 18 + Vite + Tailwind CSS (mobile-first)     |
| Backend   | Node.js + Express (REST API)                      |
| Database  | Supabase (Postgres) — with an **in-memory demo mode** fallback when no keys are set |
| AI        | Google Gemini — **backend only**, key never reaches the browser |
| Auth      | Email + password, **bcrypt** hashing (bcryptjs), JWT sessions |

## Project structure

```
civiccare/
├── client/            # What the user sees (React + Tailwind)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx            # Routes
│       ├── api.js             # Tiny fetch helper (adds JWT token)
│       ├── auth.jsx           # Login/signup/logout context
│       ├── health.js          # Demo-mode banner logic
│       ├── constants.js       # Categories, statuses, helpers
│       ├── components/        # Layout (navbar + mobile bottom nav), Logo
│       └── pages/             # Landing, Login, Signup, Dashboard,
│                              # NewComplaint, ComplaintDetail, Profile
├── server/            # The brain (Express API)
│   ├── index.js         # Routes: auth, complaints, AI
│   ├── db.js            # Supabase client + in-memory demo mode
│   ├── auth.js          # JWT sign/verify middleware
│   ├── ai.js            # Gemini integration (with mock fallback)
│   ├── constants.js
│   ├── .env.example     # Copy to .env and fill in
│   └── package.json
├── schema.sql         # Supabase tables (run once in SQL editor)
├── .gitignore         # Hides .env, node_modules, dist
└── README.md
```

## Quick start (local)

```bash
# 1. Install everything
npm run setup

# 2. Configure the server (optional — demo mode works without any keys)
cd server
cp .env.example .env        # then edit .env if you have keys
cd ..

# 3. Run the API (terminal 1)
npm run dev:server          # → http://localhost:4000

# 4. Run the frontend (terminal 2)
npm run dev:client          # → http://localhost:5173
```

Open **http://localhost:5173**.

**Demo mode** (no keys set): everything works on an in-memory database with sample data. Log in with:

- Email: `demo@civiccare.in`
- Password: `Demo@123`

Demo-mode data resets when the server restarts.

## Environment variables

### `server/.env` (SECRETS — never committed)

| Variable                     | Required | Notes                                                        |
| ---------------------------- | -------- | ------------------------------------------------------------ |
| `PORT`                       | no       | Default `4000`. Render sets this automatically.              |
| `CLIENT_URL`                 | no       | Frontend public URL (Vercel). Used to lock down CORS.        |
| `JWT_SECRET`                 | **yes**  | Long random string that signs login tokens.                  |
| `SUPABASE_URL`               | no*      | From Supabase Dashboard → Project Settings → API.            |
| `SUPABASE_ANON_KEY`          | no*      | Same page. Public-safe, but only the server uses it here.    |
| `SUPABASE_SERVICE_ROLE_KEY`  | no*      | Same page. **Secret — backend only.**                        |
| `GEMINI_API_KEY`             | no*      | From Google AI Studio. **Secret — backend only.**            |
| `GEMINI_MODEL`               | no       | Default `gemini-2.5-flash`.                                   |

\* Without these the app runs in **demo mode** (in-memory DB, mocked AI).

### `client/.env` (public, non-secret)

| Variable            | Notes                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Empty in local dev (Vite proxies `/api` → port 4000). In production set it to your **Render** API URL. |

## Supabase setup (3 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the entire contents of [`schema.sql`](schema.sql), press **Run**.
3. Copy **Project URL**, **anon key** and **service_role key** from **Project Settings → API** into `server/.env`.

The tables created are:

- `users` — id, name, email, password_hash, created_at
- `complaints` — id, user_id, title, category, description, location, photo, status, created_at, updated_at

## How AI works (and stays safe)

1. The user picks a photo and/or types a note.
2. The browser sends them to `POST /api/ai/analyze` (the **server**).
3. The server calls Gemini (the API key lives only in `server/.env`) and returns a **suggested** category, title, description, severity and confidence.
4. The UI clearly labels it *"AI suggestion — please review"*, fills the form, and **the user must confirm and press Submit**. AI never submits or decides anything on its own.
5. Without a key, a clearly-labelled **mock** suggestion is returned instead (demo mode).

## API reference

| Method | Endpoint                    | Auth | Description                              |
| ------ | --------------------------- | ---- | ---------------------------------------- |
| GET    | `/api/health`               | no   | Demo mode / AI status                    |
| POST   | `/api/auth/signup`          | no   | Create account (bcrypt + JWT)            |
| POST   | `/api/auth/login`           | no   | Log in                                   |
| GET    | `/api/me`                   | ✅   | Current user                             |
| GET    | `/api/complaints`           | ✅   | List **my** complaints                   |
| POST   | `/api/complaints`           | ✅   | Create a complaint                       |
| GET    | `/api/complaints/:id`       | ✅   | Get one of **my** complaints             |
| PUT    | `/api/complaints/:id`       | ✅   | Update one of **my** complaints          |
| DELETE | `/api/complaints/:id`       | ✅   | Delete one of **my** complaint           |
| POST   | `/api/ai/analyze`           | ✅   | Gemini: photo/note → suggested details   |
| POST   | `/api/ai/improve`           | ✅   | Gemini: rewrite my note formally         |

Ownership is enforced in the database layer — a user can never read or change another user's complaint.

## Security notes

- All secrets live **only** in `server/.env`, which is in `.gitignore` (`.env`, `node_modules`, `dist`).
- Passwords are **never** stored in plain text (bcrypt, cost 10).
- Sessions use signed **JWT** tokens (7-day expiry).
- **Rate limiting** on all API routes, stricter limits on auth and AI endpoints.
- Image uploads validated: images only, max 4 MB.
- Security headers set (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`).
- Raw errors are never shown to users — friendly messages only.
- The Gemini key is used **server-side only**; the browser never sees it.

**Next hardening steps for production:** enable Supabase RLS policies, add HTTPS (automatic on Render/Vercel), move photos to Supabase Storage, add account deletion.

## Going live (deploy)

This app is built to be deployed with:

- **Frontend (client/)** → **Vercel**
- **Backend (server/)** → **Render** (free web service, root dir `server`)
- **Database** → **Supabase**
- **Code** → GitHub

Deployment is done automatically once the API keys/tokens are provided:

1. Create the GitHub repo and push the code.
2. Create the Render web service (`rootDir: server`, start `npm start`) with env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `JWT_SECRET`, `CLIENT_URL` (Vercel URL).
3. Deploy the client to Vercel with build-time env var `VITE_API_BASE_URL` = Render URL.
4. Open the Vercel link — done.

> Note: free Render services sleep after ~15 min of inactivity; the first request after a pause takes ~30 s to wake up.

## Adding new complaint categories

1. Add the name to `CATEGORIES` in **both** `server/constants.js` and `client/src/constants.js` (plus an emoji in the client `CATEGORIES` map).
2. Done — the category picker, AI prompt and validation all pick it up automatically.

## Roadmap

The original CIVICCARE vision includes more. This MVP intentionally keeps things **simple first**; these are planned next:

- ✅ Mobile number + OTP login (replace/augment email login)
- ✅ Authority portal (assign, inspect, update status, audit log)
- ✅ Before / After proof photos on completion
- ✅ Notifications (in-app, SMS, email)
- ✅ Multilingual UI (Hindi, Telugu, Tamil, …) with `translate(key)` architecture
- ✅ PDF complaint summary download
- ✅ Duplicate detection, admin analytics dashboard
- ✅ Verified government/municipal API integrations (clearly labelled where present)

---

*“See it. Report it. Track it. Improve India.”* — A citizen-reporting concept. Not an official government website unless explicitly stated for a verified integration.
