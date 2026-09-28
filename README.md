# 🌿 CIVICCARE

**See it. Report it. Track it. Improve India.**

CIVICCARE is a **simple citizen problem-reporting app**. A person photographs a public problem (pothole, garbage, broken streetlight…), AI helps describe it, and the user can track the complaint from **Open → Assigned → In Progress → Completed → Resolved**.

**Features:**
- 📱 **Two ways to log in** — mobile number + OTP (real SMS once a provider is configured; demo OTP shown on screen until then) **or** email + password
- 🏛️ **Authority portal** — municipal staff can assign, start, complete (with mandatory AFTER photo proof) and resolve complaints, and post update notes (a separate login, normal users cannot access it)
- 🛠️ **Before / After proof photos** — every complaint shows a BEFORE photo; authorities must upload an AFTER photo to mark work completed
- 🌐 **4 languages** — English, हिन्दी, తెలుగు, தமிழ் (switchable from the navbar or Profile)
- 🎬 **Interactive 30-second demo** on the landing page that walks through the whole flow
- ✨ **AI assistance (Gemini, backend-only)** — AI *suggests*, the user *confirms*; AI never auto-submits

> ⚠️ This is a citizen-reporting **concept / MVP**. It is not an official government website.

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
│   ├── public/samples/    # Before/after proof photos for the sample complaints + demo
│   └── src/
│       ├── App.jsx            # Routes (citizen + /authority/*)
│       ├── api.js             # Tiny fetch helper (adds JWT token; separate authority session)
│       ├── auth.jsx           # Citizen + authority sessions (two independent tokens)
│       ├── i18n.jsx           # Language context (en/hi/te/ta, English fallback)
│       ├── locales/           # en.json, hi.json, te.json, ta.json
│       ├── constants.js       # Categories, statuses, helpers
│       ├── components/        # Layout (navbar + language switcher + bottom nav),
│       │                      # DemoVideo (interactive 30-second walkthrough), Logo
│       └── pages/             # Landing, Login (phone+OTP / email), Dashboard,
│                              # NewComplaint, ComplaintDetail, Profile,
│                              # Authority/{Login,Dashboard,Complaint}
├── server/            # The brain (Express API)
│   ├── index.js         # Routes: auth (+OTP), complaints, AI, authority portal
│   ├── db.js            # Supabase client + in-memory demo mode + seeding
│   ├── auth.js          # JWT sign/verify (role: user | authority)
│   ├── ai.js            # Gemini integration (with mock fallback)
│   ├── otp.js           # OTP store (expiry, attempts, rate limit)
│   ├── sms.js           # SMS provider (mock now, Twilio-ready)
│   ├── constants.js
│   ├── .env.example     # Copy to .env and fill in
│   └── package.json
├── schema.sql         # Supabase tables v2 (safe to re-run)
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

**Demo data** is created automatically (in-memory in demo mode, or seeded into Supabase on first run after [schema.sql](schema.sql) v2 is applied):

| Role      | Login                                   | Password   |
| --------- | --------------------------------------- | ---------- |
| Citizen   | phone `9876543210` (+91) **or** `demo@civiccare.in` | `Demo@123` |
| Authority | `9999999999` (+91) at the **Authority Login** (`/authority/login`) | `Demo@123` |

3 sample complaints come with full status histories and before/after photos (resolved pothole, in-progress garbage, completed streetlight). Demo-mode (in-memory) data resets when the server restarts.

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
| `GEMINI_API_KEY`             | no*      | From Google AI Studio (any current key format works). **Secret — backend only.** |
| `GEMINI_MODEL`               | no       | Default `gemini-3.6-flash`.                                   |
| `SAMPLE_BASE_URL`            | no       | Public URL that serves `/samples/*.jpg` (your Vercel URL in production; empty locally) |
| `SMS_PROVIDER`               | no       | `mock` (default; OTP shown on screen) or `twilio`             |
| `TWILIO_ACCOUNT_SID` etc.    | no       | Only when `SMS_PROVIDER=twilio` — then OTPs are sent by real SMS and never shown on screen |

\* Without these the app runs in **demo mode** (in-memory DB, mocked AI).

### `client/.env` (public, non-secret)

| Variable            | Notes                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Empty in local dev (Vite proxies `/api` → port 4000). In production set it to your **Render** API URL. |

## Supabase setup (3 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the entire contents of [`schema.sql`](schema.sql), press **Run**.
3. Copy **Project URL**, **anon key** and **service_role key** from **Project Settings → API** into `server/.env`.

The tables are:

- `users` — id, name, email (nullable), phone (unique, nullable), language, password_hash, created_at
- `authorities` — id, name, phone (unique), department, area, password_hash, is_demo, created_at
- `complaints` — id, user_id, authority_id, title, category, description, location, photo, before_image, after_image, status, created_at, updated_at
- `complaint_history` — id, complaint_id, status, message, actor, role (user/authority/system), created_at

> **Upgrading an existing project:** schema v2 adds `phone`/`language` to `users`, the `authorities` table, `before_image`/`after_image`/`authority_id` on `complaints`, and the `complaint_history` table. Re-running `schema.sql` is safe (all statements use `if not exists`).

## How AI works (and stays safe)

1. The user picks a photo and/or types a note.
2. The browser sends them to `POST /api/ai/analyze` (the **server**).
3. The server calls Gemini (the API key lives only in `server/.env`) and returns a **suggested** category, title, description, severity and confidence.
4. The UI clearly labels it *"AI suggestion — please review"*, fills the form, and **the user must confirm and press Submit**. AI never submits or decides anything on its own.
5. Without a key, a clearly-labelled **mock** suggestion is returned instead (demo mode).

## API reference

| Method | Endpoint                                | Auth       | Description                                   |
| ------ | --------------------------------------- | ---------- | --------------------------------------------- |
| GET    | `/api/health`                           | no         | Demo mode / AI / SMS status                   |
| POST   | `/api/auth/signup`                      | no         | Create account (bcrypt + JWT)                 |
| POST   | `/api/auth/login`                       | no         | Log in with email + password                  |
| POST   | `/api/auth/otp/send`                    | no         | Send OTP (+91 10-digit); demo OTP returned when no SMS provider is set |
| POST   | `/api/auth/otp/verify`                  | no         | Verify OTP; creates the account on first use  |
| GET    | `/api/me`                               | ✅ user    | Current user                                  |
| GET    | `/api/complaints`                       | ✅ user    | List **my** complaints                        |
| POST   | `/api/complaints`                       | ✅ user    | Create a complaint (photo is stored as `before_image` too) |
| GET    | `/api/complaints/:id`                   | ✅ user    | Get one of **my** complaints (+history)       |
| PUT    | `/api/complaints/:id`                   | ✅ user    | Update one of **my** complaints (text only)   |
| DELETE | `/api/complaints/:id`                   | ✅ user    | Delete one of **my** complaint                |
| POST   | `/api/ai/analyze`                       | ✅ user    | Gemini: photo/note → suggested details        |
| POST   | `/api/ai/improve`                       | ✅ user    | Gemini: rewrite my note formally              |
| POST   | `/api/authority/login`                  | no         | Authority login (phone + password) → `role: authority` JWT |
| GET    | `/api/authority/me`                     | 🔏 auth    | Current authority                             |
| GET    | `/api/authority/complaints?status=`     | 🔏 auth    | List all complaints (optionally filtered)     |
| GET    | `/api/authority/complaints/:id`         | 🔏 auth    | Get any complaint (+history)                  |
| POST   | `/api/authority/complaints/:id/action`  | 🔏 auth    | `assign` / `start` / `resolve` (+optional note) |
| POST   | `/api/authority/complaints/:id/complete`| 🔏 auth    | Mark completed — **requires AFTER photo**     |
| POST   | `/api/authority/complaints/:id/note`    | 🔏 auth    | Post an update note                           |

Citizen ownership is enforced in the database layer — a user can never read or change another user's complaint. Authority routes use a **separate JWT role** — a citizen token is rejected with 403.

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

Delivered in this build:

- ✅ Mobile number + OTP login (alongside email login)
- ✅ Authority portal (assign → start → complete with proof → resolve, update notes, full history)
- ✅ Before / After proof photos (after photo required to complete work)
- ✅ Multilingual UI — English, Hindi, Telugu, Tamil (`src/i18n.jsx`, keys in `src/locales/*.json`)
- ✅ Interactive onboarding demo on the landing page
- ✅ 3 sample complaints with full histories and before/after photos (auto-seeded)

Planned next:

- 📬 Notifications (in-app, SMS, email)
- 🧾 PDF complaint summary download
- 🔁 Duplicate detection, admin analytics dashboard
- 🏛️ Verified government/municipal API integrations (clearly labelled where present)

---

*“See it. Report it. Track it. Improve India.”* — A citizen-reporting concept. Not an official government website unless explicitly stated for a verified integration.
