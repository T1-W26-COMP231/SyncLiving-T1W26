# FRONTEND_RULES.md - Frontend & UI Standards

This document outlines the rules and conventions for frontend development in SyncLiving.

## 1. UI Architecture
- **Source of Truth:** All design specs and Tailwind tokens come from the **Stitch MCP Server**.
- **Directory Structure:**
  - `src/components/ui/`: Atomic components (buttons, badges, inputs, cards, etc.).
  - `src/components/layout/`: Global elements (Navbar, Footer, sidebars).
  - `src/components/[feature]/`: Feature-specific logic and UI components (e.g., `admin`, `discovery`, `messaging`, `support`, `rooms`, `profile`).

## 2. Tailwind CSS v4 Usage
- **Semantic Classes:** Use naming like `bg-primary`, `text-secondary`, `border-accent`.
- **Theme Config:** All custom variables are managed in `app/globals.css` under the `@theme` block.
- **Utility First:** Prefer Tailwind utility classes over custom CSS.

## 3. Client vs. Server Components
- **Server Components:** Default choice for data fetching (Direct DB or Server Action calls). They offer better performance and SEO.
- **Client Components:** Use ONLY for interactive features (forms, modals, buttons, real-time listeners). Mark with `'use client';` at the top.
- **Interleaving:** Pass Server Components as `children` to Client Components if you need to wrap server-rendered content inside client-side state providers.

## 4. Components Logic Patterns
- **Data Fetching:** Fetch data in Server Components or Page components (`page.tsx`). Pass data down as props to children components.
- **Client Hooks:** Use custom hooks for shared client-side state or side-effects (e.g., Supabase realtime subscriptions).
- **Modals:** Use the Next.js **Intercepting Routes (@modal)** pattern for smooth, shareable modal experiences where applicable.

## 5. Global Mocking & Constants
- **Mocking:** Use standard mocks in `src/test/setup.ts` for icons (lucide-react), navigation (next/navigation), and links (next/link).
- **Icons:** Use `lucide-react` for all iconography to ensure consistency.

## 6. Testing Standards
- **Vitest & React Testing Library:** Mandatory tests for all business logic and transformations in `src/utils/` and `src/services/`.
- **Test ID:** Use `data-testid` for selecting elements in tests when semantic labels or roles are not sufficient.
- **Async Safety:** Always use `async/await` with `findBy` or `waitFor` for UI state updates in tests.

## 7. Image Management
- Use Next.js `next/image` component for all static and external assets to ensure proper optimization.
- Store local static assets in `public/`.
- For user-generated content, use URLs from Supabase Storage.
