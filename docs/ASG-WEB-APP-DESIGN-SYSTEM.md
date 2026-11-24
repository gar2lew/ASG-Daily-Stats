# ASG Web App Design System

**Status:** Proposed v1 for review  
**Scope:** Shared visual language for ASG internal web apps, including entry screens and working interfaces.  
**Source relationship:** `ASG-WEB-LOGIN-DESIGN-SPEC.md` remains the detailed source for login and welcome screens. This document extends those brand decisions to the app workspace.

## Direction

Use a calm, confident ASG identity built from deep navy, warm ivory, and restrained gold. Georgia headings provide the editorial character; IBM Plex Sans keeps data entry, labels, and dense operational content clear. Keep layouts specific to each task: a tally tool, appointment workflow, document studio, and financial calculator should share the same design language without sharing one page template.

The system should feel like one company through consistent type, color roles, controls, spacing, focus states, and copy tone. Avoid forcing every screen into a login-style split panel or a grid of identical cards.

## App review

This is a visual review of the live entry or landing screen, plus supplied screenshots where useful. It does not certify calculations, data handling, or full workflow behavior.

| App | Observed entry / visual strengths | Alignment opportunity |
| --- | --- | --- |
| PIA Calculator | Entry uses the ASG navy and gold brand panel, ivory form panel, Georgia display type, and clear consultant selection. | Keep the current entry composition. Bring workspace controls and calculator/report typography into the shared system while preserving the report’s dense financial table format. |
| Sales Checklist | Welcome screen uses the full ASG split layout, readable hierarchy, clear appointment choices, and a “What happens next?” explanation. Workspace screenshot has a useful progress timeline, summary, form, preview, and persistent actions. | Treat the existing welcome screen as the reference implementation. Standardize workspace fields, status labels, section spacing, and action hierarchy without removing the preview or workflow controls. |
| Daily DRAPS | Entry follows the split-screen spec; tally workspace screenshot shows grouped counters beside a live formatted output. | Preserve the task-first two-column tally/output workspace. In the live review, the rep list displayed “Could not load names” because `prompt()` is unsupported in the browser environment; investigate that separately as a functional issue. |
| ID + Awards Studio | Landing page has a strong navy canvas, large product title, and three clear creation choices. | Retain the focused tool-selection layout. Adopt shared button, focus, type, and spacing rules; use ivory surfaces where they improve legibility without replacing the studio’s task-led workspace. |
| ASG Invoice Hub | Login provides rep-name/PIN and separate administrator access. The supplied workspace screenshot uses a left navigation rail and broad invoice forms. | Bring the login into the shared entry-screen language. Keep the navigation rail and form-oriented workspace, while aligning typography, field sizing, selected states, and gold primary action. |
| SMSF Comparison | Entry uses the branded split layout and adviser selection. Supplied calculator screenshot uses side-by-side scenario inputs, a prominent result band, and a projection chart. | Retain the direct comparison model. Standardize inputs, result hierarchy, charts, and save/share actions. User previously noted the Vercel app was not fully working; visual review does not validate that status. |

## Design principles

1. **Task first.** Put the primary work and its next action in the first viewport. Keep welcome copy brief and keep operational screens free of marketing-style hero sections.
2. **One brand, multiple workspaces.** Share the tokens and component behavior; choose the page layout that supports the app’s main job.
3. **Readable before decorative.** Prioritize legible labels, values, status, and errors. Use gold for emphasis, not long body copy or large filled surfaces everywhere.
4. **Predictable controls.** Inputs, buttons, links, selection states, and focus rings behave consistently across apps.
5. **Preserve trusted workflows.** Visual alignment does not authorize changing routes, calculation logic, field meaning, data flow, access controls, or familiar action placement.

## Core tokens

Use CSS custom properties as the implementation source of truth. Do not introduce app-specific near-duplicate colors without recording a reason.

```css
:root {
  --asg-navy: #0a1f3d;
  --asg-navy-deep: #04101f;
  --asg-navy-soft: #142a47;
  --asg-gold: #b8924a;
  --asg-gold-bright: #c9a45c;
  --asg-gold-pale: #ead7a9;
  --asg-ivory: #f6f2e8;
  --asg-stone: #efe9dc;
  --asg-surface: #fffdf9;
  --asg-ink: #0a1f3d;
  --asg-body: #3a4a63;
  --asg-muted: #66748a;
  --asg-border: #d6cfc1;
  --asg-success: #237c5b;
  --asg-danger: #a93327;
  --asg-focus: #c9a45c;
}
```

| Role | Standard |
| --- | --- |
| Brand | Navy `#0a1f3d`, deep navy `#04101f`, bright gold `#c9a45c` |
| Page ground | Ivory `#f6f2e8`; use white/ivory for working surfaces |
| Text | Navy for headings and primary values; body `#3a4a63`; muted `#66748a` |
| Borders | Warm neutral `#d6cfc1`; gold reserved for selected, active, or emphasized states |
| Status | Success `#237c5b`, danger `#a93327`; pair color with text/icon/state shape |
| Display type | Georgia, serif; use for page and major section headings |
| Interface type | IBM Plex Sans, sans-serif; use for controls, labels, data, navigation, and body copy |

Do not use green as a general brand accent. Keep it for success and confirmed status; secondary links can use navy with an underline. The login spec’s green field label may remain in existing entry screens during migration, but future components should use navy or gold labels unless green communicates status.

## Type scale

| Token | Size / line height | Use |
| --- | --- | --- |
| Display | `clamp(2.25rem, 4vw, 3.5rem)` / 1.08 | Entry and landing page product title |
| Page heading | `clamp(1.75rem, 2.6vw, 2.5rem)` / 1.15 | Workspace page title |
| Section heading | `1.35rem` / 1.25 | Major task section |
| Subsection heading | `1.05rem` / 1.3 | Form groups and panels |
| Body | `1rem` / 1.5 | Default instructions and explanatory text |
| Supporting | `0.875rem` / 1.45 | Secondary metadata and help copy; do not use for essential instructions |
| Field label | `0.875rem` / 1.3, semibold | Form labels, sentence case preferred |
| Data / table | `0.9375rem` minimum / 1.4 | Operational values; use tabular numerals for aligned amounts |

Tracked uppercase micro-labels are reserved for short section identifiers. Avoid repeating them above every card or heading. Use sentence case for labels and buttons unless an established app convention needs otherwise.

## Layout and spacing

- Base spacing unit: 4px. Common steps: 8, 12, 16, 24, 32, 40, 48px.
- Desktop workspace gutter: 24–32px. Compact layout gutter: 16px; narrow phone gutter: 12px.
- Center reading-oriented forms and reports within a `max-width` of about 1440px. Wide tally boards and comparison tables may use more viewport width when it serves the task.
- Prefer a clear page header followed by the work area. Use a persistent navigation rail only when the app has several real destinations, as in Invoice Hub.
- Use a 12-column responsive grid where needed; allow task regions to size independently rather than forcing equal cards.
- At 900px and below, collapse multi-column workspaces into a logical reading order. On phones, stack primary and secondary regions; no horizontal page scrolling at 375px.
- Tables and chart data may scroll within their own labeled region on narrow screens; keep key totals and actions visible.
- Use cards only to group related information or controls. A page does not need every section inside a bordered, shadowed container.

## Components

### Buttons and links

- **Primary:** gold fill, navy text, semibold; one clear primary action per region. Keep action wording explicit (“Start analysis”, “Save report”).
- **Secondary:** navy outline or navy fill for a secondary action. Avoid making every action gold.
- **Tertiary:** text link or quiet button; use an underline for inline links.
- **Destructive:** danger color and clear wording; preserve existing confirmation behavior.
- Minimum target: 44×44px; prefer 48px for main form actions. Keep visible hover, pressed, disabled, and keyboard-focus states.
- Use real `<button>` for actions and `<a href>` for navigation.

### Forms

- Use persistent visible labels connected to inputs. Placeholder text is an example, never the only label.
- Standard input height: 48px desktop; minimum 44px on touch. Use at least 16px input text on phones.
- Use white or warm-white fields, a 1px warm border, and a modest 8–10px radius. Keep consistent spacing between label, field, help, and error.
- Errors appear beside the relevant control in plain language; preserve entered values after an error and show a working retry path for load failures.
- Use native selects, checkboxes, date inputs, and buttons when they meet the need. Do not replace familiar controls with decorative custom widgets without a task benefit.

### Surfaces, borders, and shadows

- Page background: ivory or a restrained ivory-to-stone wash.
- Main workspace surfaces: white or warm white. Use navy surfaces for brand headers, navigation, key results, and occasional emphasis.
- Gold border: entry frame, selected/high-priority state, or important boundary only.
- Use light, broad shadows sparingly for the centered entry frame or a floating layer. Workspace grouping relies on spacing and hierarchy first.
- Avoid repeated pill badges, icon tiles, and one-card-per-field patterns.

### Charts and financial values

- Use navy and gold as the primary series colors; use a third muted blue-grey only when a comparison requires it.
- Label axes and units; distinguish projected values from current values and illustrative assumptions.
- Align currency and percentage values consistently. Use tabular numerals and retain full-precision business calculations where required.
- Result banners should identify the metric, value, time horizon, and material assumptions. Do not use color alone to imply “better.”

## Entry screen standard

Follow `ASG-WEB-LOGIN-DESIGN-SPEC.md` for the centered 40/60 framed welcome/sign-in experience. The essential shared elements are the ASG lockup, navy identity panel, ivory action panel, Georgia display heading, IBM Plex Sans interface, readable text, and explicit next action.

Allow a compact single-panel sign-in where the application’s authentication flow or screen size benefits from it, but preserve the same tokens, type, button, field, focus, and error rules. Do not change the app’s authentication model to achieve visual similarity.

## Accessibility and responsive behavior

- Maintain WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text and meaningful UI graphics.
- Keep browser zoom enabled. At 200% zoom, content reflows without overlapping or hiding primary actions.
- Provide visible `:focus-visible` outlines using the gold focus token with enough contrast against the surrounding surface.
- Keep heading order semantic, controls keyboard operable, and status text available to assistive technology.
- Respect `prefers-reduced-motion`; avoid motion that is required to understand state.
- Ensure controls and validation remain understandable without color. Use text and icon/shape alongside color for success, warning, and error.
- On narrow layouts, keep form text at least 16px to avoid mobile browser zoom on focus.

## App-specific composition guidance

| App type | Recommended structure |
| --- | --- |
| Daily tally / operations | Compact header with date and global actions; grouped tally controls beside a live output panel on desktop; clear sequential stacking on phone. |
| Multi-step checklist | Progress indicator, completion summary, form sections, and persistent preview/action area. Keep the next required action obvious and maintain familiar workflow controls. |
| Calculator / comparison | Inputs grouped by scenario, calculate/save actions near inputs, results immediately below, then chart and detailed projection. Use a clear visual distinction between current and proposed scenarios. |
| Document studio | Product heading and a small number of direct creation choices; tool-specific creation workspace owns the page after selection. |
| Finance / invoice | Persistent navigation where needed, clear invoice sections, and a strong distinction between editable fields and calculated totals. Keep rep and administrator access paths distinct. |

## Migration and acceptance

Adopt this system in stages when each app is next maintained; do not undertake a visual-only release that risks changing calculations, generated files, access control, or user data. Before closing an app’s alignment pass, verify:

- It uses the shared color roles, typography, form scale, button hierarchy, focus state, and spacing.
- Its layout matches its core task rather than copying another app’s page composition.
- Entry, loading, empty, error, disabled, and success states use the same visual language and clear text.
- At 375px, 768px, 1280px, and 1920px, key controls remain visible and the content order remains clear.
- Keyboard focus, 200% zoom, labels, contrast, and reduced motion remain usable.
- Existing URLs, authorization, calculations, outputs, and familiar actions remain unchanged unless separately approved.

## Review boundary

Live review was visual and read-only. The DRAPS gate showed a rep-list load error in the review browser. The SMSF sign-in screen was visible, but the supplied status caveat about the app not fully working has not been functionally reassessed. Calculations, authentication, persistence, performance, mobile breakpoints, keyboard flow, and screen-reader behavior were not exhaustively tested.
