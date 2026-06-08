# DocuSphere – Real‑Time Collaborative Document Platform

## 🎯 Purpose & Aim
DocuSphere is a **premium‑grade, web‑based collaborative editor** that lets multiple users create, edit, and share rich‑text documents in real time. It is built to feel like a modern, high‑end word processor (think Microsoft Word) while running entirely in the browser and persisting data to a **Supabase‑hosted PostgreSQL** backend.

- **Real‑time collaboration** powered by **Yjs** and **Hocuspocus** (WebSocket server).
- **Secure authentication** with JWT, bcrypt‑hashed passwords, and optional OTP.
- **Admin panel** for full user and document management.
- **Extensible TipTap editor** with a ribbon‑style toolbar, glass‑morphism UI, and micro‑animations.

## 📦 Use‑Case Scenarios
| Scenario | Who Benefits | What They Achieve |

## 🏗️ Architecture Overview
```
- **Frontend**: Next.js App Router, TailwindCSS, Framer Motion for smooth UI.
- **Realtime Layer**: Hocuspocus server (runs on `NEXT_PUBLIC_WEBSOCKET_URL`).
- **Database**: PostgreSQL with Row‑Level Security (RLS) policies defined in `sql/schema.sql`.
- **ORM**: Prisma – generated from the SQL‑first schema.
- **Auth**: JWT + bcrypt, optional OTP via `jose`.

## 📂 Project Structure (key folders)
```
/ (root)
├─ sql/                 # ← SQL schema & seed files (new)
│   ├─ schema.sql
│   └─ seed.sql
├─ prisma/              # Prisma client (generated from sql/schema.sql)
├─ src/
│   ├─ app/
│   │   ├─ admin/       # Admin panel (layout, pages, API)
│   │   ├─ login/       # Login & auth UI
│       ├─ prisma.ts    # Prisma instance helper
│       └─ admin.ts     # Admin‑role helper
```

   ```
## 🚀 Production Launch Checklist
   - `DATABASE_URL` – Supabase PostgreSQL connection string.
   - `JWT_SECRET` – strong random string.
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase client keys.
   - `SUPABASE_SERVICE_ROLE_KEY` – required for server‑side Prisma actions.
   - `NEXT_PUBLIC_WEBSOCKET_URL` – e.g., `ws://localhost:1234`.
4. **Create the database schema** (run once):
   ```bash
   psql "$DATABASE_URL" -f sql/schema.sql
   psql "$DATABASE_URL" -f sql/seed.sql   # creates the admin user
   ```
5. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
6. **Start the development server**:
   ```bash
   npm run dev
   ```
   - Visit `http://localhost:3000` for the main app.
   - Visit `http://localhost:3000/admin` and log in with the admin credentials (`admin@gmail.com` / `123456`).

## 🛡️ Do’s & Don’ts
### Do’s
- **Keep `.env` out of version control** – it contains secrets.
- **Use strong passwords** for admin and user accounts; never store plain‑text passwords.
- **Run migrations via the SQL files** (`sql/schema.sql`) to keep RLS policies in sync.
- **Leverage the admin panel** for user de‑activation rather than deleting rows outright.
- **Test WebSocket connectivity** (`NEXT_PUBLIC_WEBSOCKET_URL`) before deploying.

### Don’ts
- **Don’t commit the `seed.sql` admin credentials** to a public repo.
- **Avoid disabling RLS** – it is the core security model.
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client** (it must stay server‑side only).
- **Do not edit generated Prisma files manually**; always regenerate via `prisma generate`.
- **Don’t mix UI libraries** – stick to TailwindCSS and the custom `admin.css` for a consistent premium look.

## � Production Launch Checklist
1. Confirm `.env` values are configured for production and never committed to Git.
2. Validate your PostgreSQL/Supabase database has the latest schema and seed data:
   - `psql "$DATABASE_URL" -f sql/schema.sql`
   - `psql "$DATABASE_URL" -f sql/seed.sql`
3. Run Prisma client generation before building or deploying:
   - `npx prisma generate`
4. Test local build and linting:
   - `npm run build`
   - `npm run lint`
5. Deploy the app and WebSocket server together or separately:
   - `NEXT_PUBLIC_WEBSOCKET_URL` must point to the live Hocuspocus socket endpoint.
   - `websocket-server.js` must run in the production environment or on a supported Node host.
6. Confirm auth and session cookies work over HTTPS and include the correct domain.
7. Verify admin login and document sharing flows after deployment.

### Recommended hosting
- Vercel is a strong choice for the Next.js frontend and API routes.
- Use a Node-capable host for the WebSocket server, or deploy it as a separate process.
- Ensure the deployed `NEXT_PUBLIC_WEBSOCKET_URL` points to the active Hocuspocus endpoint.

## 🔐 Security Highlights
- **Row‑Level Security** ensures users can only access their own data.
- **JWTs** are signed with `JWT_SECRET` and verified on each request.
- **Password hashing** uses `bcryptjs` with a salt.
- **Admin role** is stored in the `role` column; admin routes check `session.user.role.includes('admin')`.

## 📚 Further Reading & Resources
- **Supabase Docs** – authentication, RLS, and service‑role usage.
- **Prisma Docs** – generating clients from an existing database.
- **Yjs & Hocuspocus** – real‑time collaboration fundamentals.
- **TipTap** – extensible rich‑text editor.
- **Next.js 14** – App Router and server‑components.

---
*Generated by Antigravity, your senior‑engineer AI assistant.*
