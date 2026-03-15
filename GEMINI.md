# GEMINI.md - Project Guidelines & Structure

This document serves as the primary source of truth for the project's architecture and development rules for **Gemini CLI**.

---

## 🏗 Project Structure Overview

### 1. **Next.js App Layer (`/app`)**
*   **Purpose:** Contains all routes, UI components (Server/Client), and Server Actions.
*   **Key Files:**
    *   `layout.tsx`: Root layout (Navbar, Footer, Providers).
    *   `page.tsx`: The home page of the application.
    *   `auth/actions.ts`: **Server Actions** for authentication (Login, Signup, Logout).
    *   `auth/callback/route.ts`: (To be added) Route Handler for Supabase Auth redirect.

### 2. **Utility Layer (`/src/utils/supabase`)**
*   **Purpose:** Houses the core Supabase integration logic, strictly separated by environment.
*   **Key Files:**
    *   `client.ts`: Used for **Client Components** (`use client`).
    *   `server.ts`: Used for **Server Components**, **Route Handlers**, and **Server Actions**.
    *   `middleware.ts`: Helper to refresh Supabase sessions in Next.js Middleware.

### 3. **Database & Backend Layer (`/supabase`)**
*   **Purpose:** Contains all configuration and database management files for Supabase.
*   **Key Folders:**
    *   `migrations/`: **CRITICAL.** Contains all SQL migration files for version-controlled schema changes.
    *   `config.toml`: Configuration for the Supabase local CLI.

---

## 🛠 Database Schema Rules (IMPORTANT)

When developers or Gemini CLI want to **create or update a schema** (tables, policies, triggers), follow these rules:

1.  **NEVER** modify the database structure directly through the Supabase Dashboard (UI) for permanent changes.
2.  **Location:** Always add a new `.sql` file in the `supabase/migrations/` folder.
3.  **Naming Convention:** Use a timestamped prefix followed by a descriptive name:
    *   `YYYYMMDDHHMMSS_description_of_change.sql` (e.g., `20260314120000_add_listings_table.sql`).
4.  **Local Development:** Run `supabase db push` or use the SQL Editor to apply these migrations.
5.  **Types:** After modifying the schema, always regenerate TypeScript types using the Supabase CLI:
    *   `npx supabase gen types typescript --local > src/types/supabase.ts`

---

## 📝 General Project Rules

1.  **Language for Comments:** **ALL** comments within the source code files (`.ts`, `.tsx`, `.sql`, `.js`, etc.) must be written in **English**. This ensures international collaboration readiness and matches the project's technical documentation style.
2.  **Naming Conventions:** Use camelCase for variables/functions and PascalCase for components/classes.

---

## 🤖 Rules for Gemini CLI

1.  **Language:** Always respond in **Traditional Chinese (繁體中文)** as per user preference.
2.  **Comments:** All code comments within source files (`.ts`, `.tsx`, `.sql`) must be in **English**.
3.  **Environment Variables:** Always use `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` for client/server initialization.
4.  **Security:** Always enable **Row Level Security (RLS)** for any new table created in a migration.
5.  **State Management:** Prefer **Server Actions** over client-side `fetch` for data mutations.
6.  **Style:** Adhere strictly to the existing **Tailwind CSS** and **TypeScript** standards.

---

## 📝 Documentation Reference
*   Refer to `project.md` for the technical report, user stories, and iteration plans.
*   Refer to `README.md` for standard installation and setup instructions.
