# ARCHITECTURE.md - Technical Architecture & Data Flow

This document outlines the high-level architecture and system design for SyncLiving.

## 1. Core Technology Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database & Auth:** Supabase (PostgreSQL + PostGIS + Realtime)
- **Styling:** Tailwind CSS v4 (Semantic Theming)
- **Testing:** Vitest + React Testing Library

## 2. Project Structure
The project follows a modular structure within the Next.js App Router framework:
- `/app`: Routing, Layouts, and Server Actions.
  - `/(auth)`, `/login`, `/signup`: Authentication related routes and actions.
  - `/admin`: Administrative dashboard, announcements, reports, support, and user management.
  - `/dashboard`, `/settings`, `/profile`, `/onboarding`: User account and profile management.
  - `/discovery`, `/rooms`, `/listings`: Core feature modules for finding roommates and rooms.
  - `/matches`, `/messages`, `/reviews`, `/support`: Interaction and communication modules.
- `/src/components`: Reusable UI components.
  - `/ui`: Atomic components (buttons, inputs, cards).
  - `/layout`: Global layout components (navbars, footers).
  - `/[feature]`: Feature-specific components (e.g., `/admin`, `/discovery`, `/messaging`, `/support`).
- `/src/services`: Complex business logic (e.g., `matching.ts` for the matching algorithm).
- `/src/utils`: Helper functions, validation (`validation.ts`), activity logging (`activity-logger.ts`), discovery helpers, and Supabase clients (client/server/middleware).
- `/supabase/migrations`: Database schema definitions, RLS policies, and system triggers.

## 3. Data Flow Pattern
SyncLiving prioritizes **Server Actions** for all data mutations to leverage Next.js performance and security benefits.

### Mutation Flow (Write)
1. User interacts with a Client Component (e.g., `SendMessageForm` or `SubmitTicketForm`).
2. Client Component invokes a **Server Action** (e.g., `sendMessage` in `app/messages/actions.ts`).
3. Server Action validates the request, checks permissions (Admins/Users via RLS), and interacts with Supabase.
4. If successful, Server Action triggers `revalidatePath` to update the UI across the app.

### Realtime Flow (Reactive)
1. For features requiring instant updates (Messaging, Admin Alerts), Client Components use `supabase.channel()` to listen for PostgreSQL `INSERT/UPDATE/DELETE` events.
2. The UI state is updated locally without a full page reload.

## 4. Security Architecture
- **Authentication:** Managed by Supabase Auth with JWT integration.
- **Authorization:** Enforced via **Row Level Security (RLS)** at the database level. Frontend roles (`is_admin`) are for UI logic, but the database is the final source of truth.
- **Content Safety:** Automated sensitive word detection integrated into the messaging pipeline, feeding into `admin_alerts` and `message_reports`.
- **System Integrity:** Activity logging (`activity-logger.ts`) tracks significant system actions for audit trails.

## 5. Deployment
- Hosted on **Vercel** with integrated CI/CD.
- Database hosted on **Supabase Cloud**.
- Type safety is enforced via automated TypeScript generation from the live database schema.
