# ASG Web App Login Design Spec

Reusable design standard for the entry or welcome screen used by ASG web apps. Match the desktop proportions, mobile stacking, branding and form scale in this spec; change only the app name, short purpose line, form fields and primary action label.

## Layout

- Fill the viewport (`min-height: 100vh`, with `100svh` support) and avoid page-level horizontal scrolling.
- Desktop at 900px and wider: two full-height panels. Brand panel is 38% of the width; the light form panel takes the remaining 62%.
- Center brand and form content vertically. Keep brand content to 520px and form content to 440px maximum.
- The primary form card and actions share a 380px maximum width. Align their left and right edges.
- Below 900px: stack the brand panel above the form panel. Keep the brand heading readable and the form within a 380px centered column.
- On narrow phones, use 16–20px side padding, full-width controls, a minimum 44px control height, and no fixed-width elements that cause horizontal overflow.

## Brand panel

- Deep navy gradient background: `#0a1f3d` through `#04101f`; white title and copy.
- ASG lockup: gold `#c9a45c` serif letters, a fine gold divider, and uppercase white `AMPLIFY / SOLUTIONS / GROUP` wordmark.
- Main app title: Georgia or a similar serif, 40px desktop (44px on wide desktop), 32–40px when stacked; regular weight and 1.15 line height.
- Optional short uppercase gold strapline: 12–14px, bold, with generous letter spacing. Purpose copy: 15px with 1.6 line height and a comfortable 36-character measure.
- Use restrained line art or a subtle radial navy gradient as background texture. Keep it decorative and behind content.

## Form panel

- Warm ivory background: `#f6f2e8` to `#efe9dc`. Use dark navy `#0a1f3d` for headings and body copy `#3a4a63`.
- Small uppercase gold section label, 13px, semibold, letter spacing around `.3em`.
- Form heading: Georgia, 36px (40px on wide desktop), semibold, 1.1 line height. Center it on the panel.
- Place a thin gold line and small lock/security mark beneath the heading, followed by one concise instruction line.
- Form fields sit in a quiet ivory/white card with a fine warm border, 12px corners, and a soft shadow. Labels are compact uppercase; input text is at least 16px.
- Primary action spans the form column, is 56px high, and uses a gold gradient (`#8a6a2f`, `#d4af6a`, `#a8843d`), navy text, 13px corners, and a soft shadow. Disabled state uses pale stone and muted text.

## Shared design tokens

| Use | Value |
| --- | --- |
| Navy | `#0a1f3d` |
| Deep navy | `#04101f` |
| Gold | `#b8924a` |
| Bright gold | `#c9a45c` |
| Ivory | `#f6f2e8` |
| Warm stone | `#efe9dc` |
| Ink | `#0a1f3d` |
| Body copy | `#3a4a63` |
| Field border | `#d6cfc1` |
| Display type | Georgia, serif |
| UI type | IBM Plex Sans, sans-serif (Arial fallback acceptable) |

## Accessibility and behavior

- Use one page-level `h1` for the app title and a correctly nested heading for the form title.
- Give every input a visible, programmatically associated label. Keep keyboard focus visible with a gold outline.
- Preserve readable contrast and don't communicate disabled, error, or success states by colour alone.
- Keep the main action explicit (for example, “Start”, “Sign in”, or “Continue”). Provide clear inline error text and a retry path for loading failures.
- The visual gate does not define authentication. Each app must retain its own existing sign-in and authorization behavior.

## Acceptance checklist

- At desktop width, the brand panel is 38% and the form is centered in the remaining panel.
- At 375px width, panels stack, controls fit inside the viewport, and there is no horizontal page scroll.
- ASG lockup, navy/gold/ivory palette, serif display headings, and consistent form/action widths match this spec.
- App-specific fields and copy fit without changing the shared spacing, hierarchy, or responsive behavior.
