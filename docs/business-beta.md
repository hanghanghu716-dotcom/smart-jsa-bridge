# Phase 6 — free Pro / Business beta

This release provides a 30-day, one-time, opt-in free trial. It has no payment gateway, card capture, paid subscription, checkout, invoice or automatic conversion. Free authoring, public reuse and export remain available. The Pro/Business preference is an expression of interest, not a purchase. New Business labels are Korean and English; other UI locales use the English fallback.

## User flow

1. Open **My Library → Business workspace** and start the free trial.
2. Private project saves now retain revisions. Select a project in Personal revision history to preview a previous snapshot or restore it as another revision. History begins with trial saves; no historical states are invented.
3. Create an organization (up to three per owner), create a one-use invitation, and copy/send the link yourself. Links last seven days. No invitations or emails are sent automatically.
4. In Document Designer, choose the organization in Company templates to save or explicitly apply a company layout. Personal defaults stay personal. Only the owner/editor can change shared templates; changes require the current version.
5. In Business workspace, select one of your saved private projects and explicitly share a full copy, including participants/photos, with all organization members. This never turns the original into a public JSA.
6. Choose a reviewer other than the version editor and submit. Submitted content is immutable. Only that assigned member, with the current reviewer/owner role, can approve or request changes. Self-approval is rejected on the server. A change request needs a comment.
7. To edit team content, open a private copy, save it through the existing editor, then explicitly replace the team draft from that saved project. Approved content first needs a new draft revision. Restoring history also creates a new revision rather than changing old approvals.

## Expiry and permissions

The server sets the trial start/end; repeated enrollment does not extend it and clients cannot write the entitlement table. New team writes depend on the organization owner's active trial. Existing documents, templates and history remain readable after expiry. The owner can still revoke invitations, remove members or lower/change roles; members can leave. Applying/copying already-readable data does not delete the source.

All eight new tables use RLS. Clients have SELECT only; write operations use one authenticated security-invoker RPC and a private security-definer dispatcher. Its branches validate ownership, current membership/role, target organization, expiry and expected document/template version. The definer implementation is necessary for atomic first-owner creation, one-use token redemption, immutable history and privileged aggregate/state writes. It has an empty search path, no anonymous execute grant, no dynamic SQL and no arbitrary user-ID authorization override. Personal revision restoration checks owner, private visibility and updated_at.

Membership changes, invite redemption/revocation and document transitions serialize per organization. Invitation tokens contain two random UUIDs, are stored only as SHA-256 hashes, and are placed in a URL fragment. Business/login entry pages do not initialize advertising or analytics; cross-origin referrers are suppressed. The recipient still needs to sign in and choose Accept invitation. An invitation grants access to whoever possesses it, not to a preverified email address.

## Validation and rollout

- `scripts/business-rls.sql` runs fixtures in a transaction that ends in ROLLBACK. It verifies nonrenewable entitlement, direct-write denial, personal history/restore concurrency, private imports, template sanitization, invitation reuse rejection, role isolation, immutable submitted content, self-approval rejection, versioned approval history, expiry and removal of member access.
- All 68 automated tests passed. The full build rendered 957 static routes and verified all 683 current case-study snapshots; the dynamic-route exclusion and clean public HTML shell check passed. The final client bundle also passed.
- Automated tests cover action version forwarding, error propagation, safe company editor copies, template exclusions and unauthenticated behavior.
- Run the reproducible browser flow with a local dev server on port 5173 and `npm run test:business:browser` (Chrome at the Windows path in that script). Screenshots are written under `.cache/business-qa`.
- Browser tests exercise trial enrollment, organization/invitation creation, sharing, reviewer approval, viewer restrictions, personal restore, company template save/apply, expiry and mobile rendering using intercepted fixture data. No real invitations, memberships or trial enrollments are created during those tests.
- New migrations are additive and applied to the linked database. Frontend work remains a draft PR, stacked on Phase 5. No merge or production frontend deployment was performed.
- Security advisor results introduced no new findings. Pre-existing function search-path/execution warnings, public-schema extensions and disabled leaked-password protection remain outside these changes. See [Supabase advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

Paid subscriptions, tax/business registration, payment/refund policies, billing invoices and paid-plan provisioning remain intentionally pending a separately authorized commercial launch. Approval records are internal workflow records; exporting a private editable copy does not transfer its approved status.
