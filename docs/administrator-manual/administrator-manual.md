# Administrator Manual

## Scope

This manual describes administrator workflows for TAC moderation stories in Tables 34, 35, and 36.

## Table 34: Reviewing Safety Reports

### Objective

As an Administrator, review submitted misconduct and safety reports so risky behavior can be investigated quickly.

### Steps

1. Open `Admin > Misconduct & Safety > Safety Reports`.
2. Use the status filter (`All`, `New`, `Investigating`, `Resolved`) to find cases.
3. Use `Details` to open a report case page.
4. Confirm case summary fields: reported user, reporter, reason, status, and description.

### Expected Outcome

- Reports are visible in one table.
- Cases can be triaged by status.
- Admin can access detailed context before taking action.

## Table 35: Investigating and Resolving Reports

### Objective

As an Administrator, move reports through investigation and resolution with auditability and reporter notification.

### Steps

1. Open report details from `Safety Reports`.
2. For a new case, click `Mark as Investigating`.
3. Enter a resolution note and click `Resolve and Notify Reporter`.
4. Verify `Case Timeline` shows investigating/resolved events with actor and timestamp.

### Guardrails

- Resolved cases are locked from further status changes.
- Resolution note is stored with the report.
- Reporter receives an in-app notification for resolution.

### Expected Outcome

- Workflow states are consistent (`new -> investigating -> resolved`).
- Timeline records admin actions.
- Reporter receives resolution update in the notification bell.

## Table 36: Enforcing Content Standards

### Objective

As an Administrator, remove inappropriate review content from the moderation workflow so harmful content is hidden on public-facing pages.

### Enforcing Content Standards Procedure

1. Open `Admin > Misconduct & Safety > Review Moderation`.
2. Locate a flagged review and click `Remove Review`.
3. Confirm the review disappears from the moderation list.
4. Open the related public profile page and verify the removed review content is no longer shown to normal users.

### Policy Interpretation

- `deleted` reviews are hidden on public pages.
- `reported` reviews remain visible until an admin decision is made.
- This prevents abuse where unjustified reporting could suppress legitimate negative feedback.

### Audit and Compliance

- Removal uses soft delete (`reviews.status = deleted`).
- Each moderation action writes an audit entry (`review_removed`) in `user_activity_logs`.

### Expected Outcome

- Inappropriate review content is hidden without hard deletion.
- Moderation remains traceable for accountability and review.

## Operational Notes

- Use seeded moderation accounts and review fixtures in local test environments.
- Keep moderation actions focused and reversible where possible.
- Do not expose admin-only controls to non-admin users.

## Verification Checklist (Tables 34-36)

Use this quick checklist before submission:

1. Reports are visible in `Admin > Misconduct & Safety` and can be filtered by status.
2. Admin can mark a case as investigating and then resolve it with a note.
3. Resolved reports are locked from further status changes.
4. Reporter receives a resolution notification in the notification bell.
5. Review moderation can soft-remove a flagged review (`status = deleted`).
6. `user_activity_logs` contains moderation audit events (`report_investigating`, `report_resolved`, `review_removed`).
7. Deleted reviews are hidden on public profile pages for normal users.
