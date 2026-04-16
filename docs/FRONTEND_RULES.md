# FRONTEND_RULES.md - Frontend & UI Standards

This document outlines the rules and conventions for frontend development in SyncLiving.

## 1. UI Architecture
- **Source of Truth:** All design specs and Tailwind tokens come from the **Stitch MCP Server**.
- **Directory Structure:**
  - `src/components/ui/`: Atomic components (buttons, badges, inputs).
  - `src/components/layout/`: Global elements (Navbar, Footer, Providers).
  - `src/components/[page]/`: Feature-specific logic components.

## 2. Tailwind CSS v4 Usage
- **Semantic Classes:** Use naming like `bg-primary`, `text-secondary`, `border-accent`.
- **Theme Config:** All custom variables are managed in `app/globals.css` under the `@theme` block.
- **Utility First:** Prefer Tailwind utility classes over custom CSS.

## 3. Client vs. Server Components
- **Server Components:** Default choice for data fetching (Direct DB or Server Action calls).
- **Client Components:** Use for interactive features (forms, modals, buttons). Mark with `'use client';` at the top.

## 4. Components Logic Patterns
- **Data Fetching:** Fetch data in Server Components or Page components. Pass data down as props to children.
- **Client Hooks:** Use custom hooks in `src/hooks/` for shared state or side-effects.
- **Modals:** Use the Next.js **Intercepting Routes (@modal)** pattern for smooth, shareable modal experiences.

## 5. Global Mocking & Constants
- **Mocking:** Use standard mocks in `src/test/setup.ts` for icons (lucide-react), navigation (next/navigation), and links (next/link).
- **Icons:** Use `lucide-react` for all iconography.

## 6. Testing Standards
- **Vitest:** Mandatory tests for all business logic and transformations in `src/utils/` and `src/services/`.
- **Test ID:** Use `data-testid` for selecting elements in tests when labels are not sufficient.
- **Async Safety:** Always use `async/await` with `findBy` or `waitFor` for UI state updates.

## 7. Image Management
- Use Next.js `Image` component for all assets.
- Store static assets in `public/`.
- For user-generated content, use URLs from Supabase Storage.
