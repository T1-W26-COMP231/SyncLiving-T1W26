# CLAUDE.md - Project Guidelines & Structure

This document serves as the primary source of truth for the project's architecture and development rules for **Claude Code**.

---

## 🏗 Project Structure Overview

### 1. **Next.js App Layer (`/app`)**
*   **Purpose:** Contains all routes, UI components (Server/Client), and Server Actions.
*   **Key Files:**
    *   `layout.tsx`: Root layout (Navbar, Footer, Providers).
    *   `page.tsx`: The home page of the application.
    *   `auth/actions.ts`: **Server Actions** for authentication (Login, Signup, Logout).
    *   `auth/callback/route.ts`: (To be added) Route Handler for Supabase Auth redirect.

### 2. **Source Code Layer (`/src`)**
*   **Purpose:** The central repository for all non-routing application logic and reusable UI elements.
*   **Key Directories:**
    *   `components/`: Reusable UI components (Layout, Feature-specific, and Base UI). Refer to the **UI & Design Development Rules** section for detailed sub-structure.
    *   `utils/`: Shared helper functions and core integrations. 
        *   `utils/supabase/`: Contains `client.ts`, `server.ts`, and `middleware.ts` for Supabase initialization.
    *   `hooks/`: Custom React hooks for managing shared state or logic.
    *   `types/`: Global TypeScript interfaces and generated database types (e.g., `src/types/supabase.ts`).
    *   `services/`: External API calls or complex business logic layers.

### 3. **Database & Backend Layer (`/supabase`)**
*   **Purpose:** Contains all configuration and database management files for Supabase.
*   **Key Folders:**
    *   `migrations/`: **CRITICAL.** Contains all SQL migration files for version-controlled schema changes.
    *   `config.toml`: Configuration for the Supabase local CLI.

---

## 🛠 Database Schema Rules (IMPORTANT)

When developers or Claude Code want to **create or update a schema** (tables, policies, triggers), follow these rules:

1.  **NEVER** modify the database structure directly through the Supabase Dashboard (UI) for permanent changes.
2.  **Location:** Always add a new `.sql` file in the `supabase/migrations/` folder.
3.  **Naming Convention:** Use a timestamped prefix followed by a descriptive name:
    *   `YYYYMMDDHHMMSS_description_of_change.sql` (e.g., `20260314120000_add_listings_table.sql`).
4.  **Local Development:** Run `supabase db push` or use the SQL Editor to apply these migrations.
5.  **Types:** After modifying the schema, always regenerate TypeScript types using the Supabase CLI:
    *   `npx supabase gen types typescript --local > src/types/supabase.ts`

---

## 🏗 Database Schema Reference

### **Table: `public.profiles`**
This is the primary table for storing user-specific data, lifestyle preferences, and location information. It is linked to the Supabase Auth system via the `id` field.

| Column | SQL Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | **Primary Key**. References `auth.users.id`. Identifies the user. |
| `full_name` | `text` | The user's displayed name. |
| `avatar_url` | `text` | Link to the profile picture (usually from social login or upload). |
| `age` | `integer` | User's age for matching filters. |
| `location` | `text` | Human-readable address string (e.g., "Scarborough, Toronto"). |
| `location_coords` | `geography` | **PostGIS Point**. Stores longitude/latitude for distance calculations. |
| `role` | `text` | User's objective: `'seeker'` (looking for room) or `'provider'` (listing room). |
| `lifestyle_tags` | `text[]` | Array of habits (e.g., `{'Non-Smoker', 'Quiet'}`). |
| `budget_min` | `integer` | Lower bound of the monthly rent budget. |
| `budget_max` | `integer` | Upper bound of the monthly rent budget. |
| `preferred_gender` | `text` | Preferred gender for potential roommates. |
| `move_in_date` | `date` | Expected date to move into a new space. |
| `updated_at` | `timestamp` | Timestamp of the last profile update. |
| `created_at` | `timestamp` | Timestamp when the profile was first created. |

---

## 📝 General Project Rules

1.  **Language for Comments:** **ALL** comments within the source code files (`.ts`, `.tsx`, `.sql`, `.js`, etc.) must be written in **English**. This ensures international collaboration readiness and matches the project's technical documentation style.
2.  **Naming Conventions:** Use camelCase for variables/functions and PascalCase for components/classes.

---

---

## 🎨 UI & Design Development Rules

1.  **Primary Design Source (Stitch):**
    * **Source of Truth:** All design specifications, interactive flows, and real-time design tokens must be retrieved exclusively via the **MCP Server** (`stitch`).
    * **Workflow:** Use MCP tools to inspect components, extract Tailwind classes, and identify the latest design tokens.
    * **Interactive Logic:** Directly translate the behaviors and states defined in the Stitch prototype into React component logic. **Do not refer to local `/design-drafts/` or static `.jpg` files.**

2.  **UI Component Structure:**
    * **Layout Components:** All shared UI elements (Navbar, Sidebar, Footer) go to `src/components/layout/`.
    * **Page-Specific Components:** Components unique to a page (e.g., `src/components/home/`, `src/components/onboarding/`) go to `src/components/[page-name]/`.
    * **Base UI Components:** Atomic components (Button, Input, Card) go to `src/components/ui/`.

3.  **Tailwind CSS (v4) Rules:**
    * **Colors:** Use semantic names like `bg-primary`, `text-secondary`, `border-accent` as provided by the MCP server.
    * **Theming:** Custom theme variables are managed in `app/globals.css` under the `@theme` block.

4.  **Implementation Workflow:**
    * Analyze the interactive prototype via the **MCP Server** to understand component hierarchy and styling.
    * Convert the Stitch design tokens and structure directly to `.tsx` JSX format.
    * Abstract repetitive parts into reusable React components.
    * Verify consistency with the live prototype behavior and design tokens.

---

## 🤖 Rules for Claude code

1.  **Comments:** All code comments within source files (`.ts`, `.tsx`, `.sql`) must be in **English**.
2.  **Environment Variables:** Always use `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` for client/server initialization.
3.  **Security:** Always enable **Row Level Security (RLS)** for any new table created in a migration.
4.  **State Management:** Prefer **Server Actions** over client-side `fetch` for data mutations.
5.  **Style:** Adhere strictly to the existing **Tailwind CSS** and **TypeScript** standards.

---

## 📝 Documentation Reference
*   Refer to `project.md` for the technical report, user stories, and iteration plans.
*   Refer to `README.md` for standard installation and setup instructions.
