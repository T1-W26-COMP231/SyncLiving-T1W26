# BACKEND_RULES.md - Server-Side Development Standards

This document outlines the rules and conventions for backend development in SyncLiving.

## 1. Server Actions (Priority 1)
- **File Location:** Keep feature-specific actions in `app/[feature]/actions.ts`.
- **Top Directive:** ALWAYS include `'use server';` at the top of the file.
- **Client Access:** Only use `actions.ts` for logic triggered by UI events. Avoid standard `API routes` unless absolutely necessary.

### Standard Pattern:
```typescript
'use server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function myAction(param: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('my_table')
    .insert({ user_id: user.id, content: param });

  if (error) throw new Error(error.message);
  revalidatePath('/my-page');
  return { success: true };
}
```

## 2. Authentication & Authorization
- **Admins:** Use `isAdmin()` helper from `app/admin/actions.ts` to protect administrative actions.
- **Identity:** Always fetch the user using `supabase.auth.getUser()` in server actions, never rely on client-passed IDs for sensitive operations.

## 3. Security Checks
- **Sensitive Keywords:** All user-generated content (messages, bios) should be checked using `checkMessageForSensitiveWords()` before or during submission.
- **Input Validation:** Use Zod or simple type checking to validate input parameters in all server actions.

## 4. Activity Logging
- All significant user actions (match request response, status update, profile creation) MUST be logged using `logActivity()` from `@/utils/activity-logger`.

## 5. Error Handling
- Never leak sensitive database error details to the frontend.
- Log errors to the server console for debugging.
- Return user-friendly error messages through the standard error throwing mechanism.

## 6. Realtime Support
- Do not use Server Actions to "listen" for data changes.
- Use PostgreSQL triggers or Client-Side Supabase channels for live UI updates.
