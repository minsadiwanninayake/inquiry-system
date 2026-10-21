# Decisions

## Assumptions

- A small team where each staff member handles their own inquiries.
- Contact is free text (phone or email), so the API only checks a minimum length.
- Seeded accounts replace registration.
- One database is used for development and tests.

## Design choices

**1. Ownership and access.**
Staff see only the inquiries they created. An admin sees all of them. The rule is in the SQL query (`created_by = user id`), so it cannot be bypassed from the UI. If a user opens someone else's inquiry, the API returns 404, not 403, so it does not reveal that the record exists. Every `/api/inquiries` route is behind the auth middleware, which returns 401 without a valid cookie.

**2. Status rules.**
The flow is New to In Progress to Resolved. A Resolved inquiry can be reopened to In Progress. New to Resolved is not allowed. An invalid change returns 409 `INVALID_TRANSITION`. The UI only shows the allowed next buttons, but the API enforces the rule on its own.

**3. Missing data and duplicates.**
The form checks the fields first and shows errors under each field. The API validates again with zod and returns 400 with field messages, so bad data is rejected even if the UI is bypassed. If the same user submits the same contact and subject within 10 minutes, the API returns 409 `DUPLICATE`. The form keeps what the user typed, and the save button is disabled while saving.

## Trade-off accepted

Stale tabs are detected when the user saves, not live. Each inquiry has a `version` number. The status update runs `WHERE id = $2 AND version = $3`. If another tab already changed the inquiry, no row matches and the API returns 409 `STALE_VERSION`. The UI then shows "changed in another tab" with a Reload button. I did not add polling or websockets, so a tab can show an old status until the user acts or reloads. This keeps the code simple and never overwrites a newer change by mistake.

## Other choices

- JWT stored in an httpOnly cookie, so JavaScript in the browser cannot read the token.
- Raw SQL with the `pg` package instead of an ORM, so every query is easy to read and explain.
- One error format for all failures: `{ "error": { "code", "message" } }`.
- UI states designed as part of the workflow: loading skeleton, empty state, error with Retry, and a "not found or no access" page.

## What I would improve next

- Assign an inquiry to another staff member.
- A history of status changes (who changed it and when).
- Pagination controls in the list page.
- End-to-end browser tests.
- A separate database for tests.

## Testing

- Backend (Jest and Supertest): 401 without a cookie, 400 for missing fields and a bad id, 404 when another user opens my inquiry, 409 for an invalid transition and for a stale version.
- Frontend (Vitest and Testing Library): empty form shows field errors and does not call the API, and a duplicate rejection keeps the typed text.
- Gaps: no end-to-end test, and no frontend test for the list page or the stale-tab message.

## Use of AI

I used AI (Claude) as a development helper. It helped me plan the steps, write the first version of the routes, components and tests, and fix setup errors, such as the TypeScript 7 and ts-jest conflict and the Vitest version conflict.

Suggestions I changed or rejected:
- I checked the generated code by running it myself: I tested every API rule with requests (201, 400, 401, 404, 409) and tested the stale-tab and access cases in the browser.
- I moved the `[id]` page folder to the correct place after it was created inside `new`.
- I used the Suspense wrapper on the detail page to remove a Next.js warning about `useParams`.

I can explain every file in this project.