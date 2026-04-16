# GEMINI.md - Project Development Guidelines Index

This document serves as the primary entry point for development guidelines in **SyncLiving**. For detailed instructions, refer to the specialized documentation in the `docs/` folder.

---

## 🏗 Technical Documentation Index

### 1. **Core Architecture**
- **File:** `docs/ARCHITECTURE.md`
- **Focus:** High-level tech stack, project structure, and data flow patterns (Server Actions, Realtime).

### 2. **Database & Schema**
- **File:** `docs/DB_SCHEMA.md`
- **Focus:** Table definitions, geography data (PostGIS), and Row Level Security (RLS) policies.

### 3. **Backend & Server Logic**
- **File:** `docs/BACKEND_RULES.md`
- **Focus:** Server Action conventions, identity verification, activity logging, and error handling.

### 4. **Frontend & UI/UX**
- **File:** `docs/FRONTEND_RULES.md`
- **Focus:** Tailwind CSS v4, component hierarchy, Stitch design integration, and Vitest testing standards.

---

## 📝 Critical Development Rules (Summary)

1.  **English for Code Comments:** ALL comments in source code (`.ts`, `.tsx`, `.sql`, `.js`) MUST be in **English**.
2.  **Strict Type Safety:** Always regenerate TypeScript types after migrations:
    *   `npx supabase gen types typescript --local > src/types/supabase.ts`
3.  **Security First:** Every database table MUST have RLS enabled and a corresponding policy in `docs/DB_SCHEMA.md`.
4.  **Vercel Build Compliance:** All code MUST pass strict TypeScript checks (`npx tsc --noEmit`) to ensure successful deployment.
5.  **Mandatory Tests:** Business logic in `src/utils/` and `src/services/` requires Vitest unit tests.

---

## 📝 Documentation Reference
*   Refer to `project.md` for the technical report and iteration plans.
*   Refer to `README.md` for installation and setup.
