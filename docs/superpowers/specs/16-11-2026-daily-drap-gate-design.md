# Daily DRAPS Input: gate screen (design)

Status: draft for approval. Approach agreed: a gate screen before the tally, as in the sales checklist landing page.

## Intent

Reps see a clear start screen, choose their name (or add it), and press Start. Only then does the tally appear. The gate also makes the rep's timezone explicit before any numbers are entered.

## Goals

- A screen titled **Daily DRAPS Input**, styled from the approved reference in `design/reference/LandingPage_Final` (colours, spacing, type, shadows, two-panel layout).
- Left panel: brand block with the title and a one-line purpose. Right panel: rep dropdown, "Not on the list? Add my name" with state picker, and a **Start** button.
- Start stays disabled until a rep is chosen. Pressing Start opens the tally. A **Change rep** control in the tally returns to the gate.
- The rep's chosen name is remembered on the device (`drapsRepName`), as now, and preselected on the gate.
- Once a rep starts, the date and weekday shown on the tally use that rep's timezone (this also closes the deferred minor about the page date).
- Stacks to one column on phones with a 16px side gutter and no horizontal scroll.

## Non-goals

- No change to the tally itself, the publish record, the email subject or body, or the API.
- No port of the React reference. It is a visual spec only; the production page stays vanilla HTML/CSS/JS in `index.html`.
- No new sign-in. The shared passcode prompt is unchanged.

## Anti-goals

- The gate must never block a rep who has already chosen a name on this device from reaching the tally in one tap.
- Starting must never change or clear numbers already typed.

## Approaches considered

1. **Gate screen, separate view (chosen).** Matches the reference and the approach you chose. Needs a view switch in `index.html`.
2. **Restyle the existing card at the top of the tally.** Smaller change, but it does not give the reference's landing feel and cannot be reused in your other apps as a pattern.

## Reusable pattern

You want this gate in all your company web apps. This build keeps the gate's markup and CSS together in `index.html` so it can be copied. Extracting a shared module across apps is a separate step, after this one works.

## Open items (my calls, can be changed)

- Brand block text: "Daily DRAPS Input", plus one line of purpose and the reporting day shown. Final copy from you.
- Colours and type: taken from the reference's navy and gold tokens. DRAPS's current green palette is replaced on the gate only.
- Start on a phone opens the tally full width, with the gate's rep name shown at the top.
