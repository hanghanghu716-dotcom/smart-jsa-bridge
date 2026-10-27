# Feedback and case requests

The lower-right “Send feedback” control opens only on request. The desktop dialog becomes a bottom sheet on mobile, follows the current theme and language, and is excluded from print and PDF capture.

Guests can submit a work name, a story, attachments, or a combination. PDF/JPEG/PNG/WebP uploads are limited to three files of 5 MB each. Email and the current path are optional; query strings, private JSA values and draft contents are never collected automatically.

The review screen requires agreement to private review. The browser keeps input after an error. A deterministic server receipt makes prepare retries idempotent; reserved uploads are immutable, expire after 24 hours, and can be resumed. The success receipt appears only after every reserved object exists with the expected size and MIME type and the request has been finalized. Submitter status reads expose the response and linked finished case, never internal notes.

## Operator workflow

Open /ko/community, complete the existing administrator verification, then follow “접수 관리” to /ko/admin/requests. The same inbox is also available on the community page. Only the existing verified administrator role with MFA and a live session can read or modify requests and attachments.

Filter by category or status, open a request, review/download attachments, write private notes and a public reply, and optionally link an existing published Case Study URL. Replies are available through the receipt checker; this release does not send email automatically. Requests and uploaded permits are never published automatically.

The existing private external_requests and external_request_audit tables are retained. New attachment metadata lives in jsa_private.feedback_attachments, with bytes in the private feedback-attachments bucket. Anonymous upload rights are limited to unguessable, previously reserved paths; anonymous reading, listing, overwriting and deleting are blocked. Authorized operators download through Storage RLS. Internal notes remain separate from the submitter response.

Expired drafts cannot receive uploads and are excluded from the inbox. Retention cleanup remains an operator task; no automatic deletion schedule is introduced.

## Article language navigation

A compact disclosure beneath the Case Study title/date lists only actual supported sibling locales from the same post_group_id. Native-language labels, keyboard focus, Escape dismissal, RTL layout and real same-article links work in both themes. The server-rendered HTML uses the same option builder, so the links also work before React loads.

## Verification

- scripts/feedback.test.js: validation, locale completeness, safe sibling URLs and gateway idempotency.
- scripts/feedback-browser.cjs: intercepted requests only; 19 locales, themes, mobile/RTL, file-only/name-only requests, retry, receipts, sibling navigation and print exclusion.
- scripts/feedback-db-check.sql: rollback-only database fixtures for receipts, incomplete uploads, expiry and access controls.
- Existing full test and production release checks remain required.
