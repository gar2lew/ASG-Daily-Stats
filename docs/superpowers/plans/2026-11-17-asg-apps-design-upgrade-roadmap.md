# ASG Apps Design Upgrade Roadmap

**Goal:** Align the six ASG web apps to one approved visual system while keeping each app’s workflow, calculations, access model, and outputs intact.

**Architecture:** Treat the approved ASG Web App Design System as the shared design contract, then align one app at a time in its own source repository. Begin each app with a baseline and repository-specific implementation plan; only consider shared code after confirming that the repositories, build stacks, and release cadence can support it safely.

**Tech Stack:** Six existing web apps with separate deployments; frameworks and repository locations are to be confirmed during discovery.

**Spec:** `docs/ASG-WEB-APP-DESIGN-SYSTEM.md`; entry screen detail: `docs/ASG-WEB-LOGIN-DESIGN-SPEC.md`.

## Global Constraints

- Use the navy, gold, ivory, Georgia display, and IBM Plex Sans interface roles in the ASG design system.
- Share brand tokens and interaction behavior while keeping app layouts appropriate to their tasks.
- Preserve routes, authentication and authorization, field meaning, calculations, data flow, generated files, and familiar action placement unless separately approved.
- Do not commit, push, or deploy app changes until the user initiates that upgrade phase and its release scope is clear.
- Keep each app’s changes reviewable and independently verifiable.
- Keep the SMSF app’s redesign behind a functional baseline review because the user previously reported that the Vercel app was not fully working.

## Review Focus

- **Data integrity:** Existing calculator formulas, financial assumptions, precision, report export, and saved report behavior must remain the same; capture representative before/after outputs.
- **Workflow continuity:** Checklist progress, DRAPS tally/output, invoice entry, Print Studio creation choices, and app URLs must remain discoverable and unchanged in meaning.
- **Access boundaries:** Rep and administrator sign-in paths, staff selection, and authorization behavior must not be weakened by visual changes.
- **Failure states:** Rep/adviser/staff loading, network failure, empty selection, validation, and retry states must remain understandable and preserve user input.
- **Responsive access:** At 375, 768, 1280, and 1920px widths and 200% zoom, controls, results, and primary actions must reflow without overlap or hidden task-critical content.

---

## Roadmap

### Phase 0 — Source and baseline inventory

1. Locate the canonical GitHub repository and local working copy for each app:
   - PIA Calculator
   - Sales Checklist
   - Daily DRAPS
   - ID + Awards Studio
   - ASG Invoice Hub
   - SMSF Comparison
2. For each repo, record current branch, uncommitted changes, framework, build/test/lint commands, deployment URL, entry route, and design-token/component locations. Preserve any existing local work.
3. Capture baseline screenshots for entry and the main task screen at desktop and phone widths. Record expected behavior and one representative output for any calculator/export flow.
4. Track known issues separately from design gaps:
   - DRAPS rep list showed `prompt() is not supported` in the review browser; identify a supported staff-add flow and determine whether it is an environment artifact or production bug.
   - SMSF Vercel app has a prior user-reported functionality issue; verify the core comparison, save/share, and export behavior before visual work.
5. Write one implementation plan per repository after inspecting its source. Do not invent source file paths before that inspection.

**Exit condition:** All six repos and current states are identified, local changes are protected, and each app has an agreed baseline plus a repo-specific plan.

### Phase 1 — Shared visual foundation

1. Mark `ASG-WEB-APP-DESIGN-SYSTEM.md` as approved or record the user’s requested adjustments.
2. In each repository plan, map the agreed color, type, spacing, control, focus, and responsive tokens to that app’s current styling system.
3. Decide whether to use a small shared package or local token copies only after checking framework compatibility, ownership, versioning, and deployment coupling. Default to simple per-repo tokens if a package would create unnecessary release dependencies.
4. Define the visual acceptance baseline for entry screens and operational workspaces separately.

**Exit condition:** All implementations have a clear token mapping and component reuse decision with no change to business logic.

### Phase 2 — Entry screen alignment

Recommended order:

1. **Invoice Hub** — align its compact sign-in screen to the ASG entry system while preserving rep PIN and administrator access paths.
2. **PIA Calculator** — retain its existing split entry screen; close any type, scale, or control gaps.
3. **SMSF Comparison** — only after Phase 0 confirms the calculator works; align its adviser entry screen.
4. **Sales Checklist** — use as the entry-screen reference; make only gaps confirmed by the spec review.
5. **Daily DRAPS** — preserve its current gate design and resolve the rep-list failure in a separate, behavior-focused change if confirmed.
6. **ID + Awards Studio** — its landing screen is a tool chooser rather than a sign-in gate; align shared tokens and controls without forcing it into the split login layout.

**Exit condition:** Entry/landing screens share the same ASG identity, readable text scale, labeled inputs, gold primary action, focus/error states, and responsive behavior, without changing sign-in flow.

### Phase 3 — Operational workspace alignment

1. **Sales Checklist:** preserve timeline, appointment summary, form sections, output preview, and persistent actions; align type scale, fields, status treatment, and spacing.
2. **Daily DRAPS:** preserve grouped tally inputs and live report output; align controls, header, statuses, and responsive reading order. Fix any confirmed name-loading issue separately from styling.
3. **PIA Calculator:** align input groups, result/report presentation, table typography, and saved-report controls. Preserve formulas and report values.
4. **SMSF Comparison:** align scenario input panels, projected advantage/result hierarchy, chart, and report actions. Preserve assumptions and computed output.
5. **ASG Invoice Hub:** align navigation, invoice form, selected-company state, totals, and weekly wage controls. Preserve rep/admin separation and permissions.
6. **ID + Awards Studio:** align creation tool selection and each creator workspace where the same components apply; preserve print dimensions and document output.

**Exit condition:** Each main task screen follows the system while retaining app-specific workflow and output behavior.

### Phase 4 — App-level verification and release

For each app separately:

1. Compare before/after screenshots at 375, 768, 1280, and 1920px and at 200% zoom.
2. Exercise primary keyboard paths, focus visibility, labels, error recovery, disabled/loading/empty states, and reduced-motion behavior.
3. Run the repository’s existing checks plus targeted tests for unchanged calculations, access paths, and generated outputs. Add tests only where needed to prove preserved behavior.
4. Review the diff for unrelated changes and run a fresh visual comparison of the primary task path.
5. Present that app’s result and any remaining issues before moving to the next app. Commit and deploy only when the user explicitly includes those actions in the initiated phase.

**Exit condition:** Each app is independently verified and approved for its intended release. Do not treat one app’s pass as evidence for the other five.

## Suggested delivery order

1. **Invoice Hub** — largest entry-screen brand mismatch; useful first calibration for adapting a compact login without changing its dual access paths.
2. **Sales Checklist** — strongest existing entry and workflow reference; verify and document reusable patterns.
3. **Daily DRAPS** — align tally workspace and separately investigate the observed staff-name loading error.
4. **PIA Calculator** — align calculator workspace and dense financial report while preserving calculation precision.
5. **SMSF Comparison** — resolve and baseline functionality first, then align its comparison workspace.
6. **ID + Awards Studio** — align its distinct studio landing and print workflows without imposing a login page pattern.

The order can change if repository access, user priorities, or a production defect makes another app more urgent.

## Out of scope until separately requested

- Rewriting or consolidating apps into one codebase.
- Changing calculations, business rules, staff access, authentication, data retention, or Google integrations.
- Replacing app workflows or moving frequently used controls.
- Publishing a new shared component library or adding dependencies before repository compatibility is known.
- Treating visual review as proof of performance, security, or data correctness.

## Start checklist for the later upgrade session

- [ ] User confirms the design system direction and which app to begin with.
- [ ] Open the correct app repository and inspect current branch/status/diff.
- [ ] Confirm no unrelated user changes will be overwritten.
- [ ] Complete that app’s repository-specific implementation plan and baseline before editing.
- [ ] Agree whether the session includes commit, push, or deployment; otherwise keep work local for review.
