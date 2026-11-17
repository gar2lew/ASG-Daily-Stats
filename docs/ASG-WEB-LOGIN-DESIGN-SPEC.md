# ASG Web App Login Design Spec

Reusable design standard for the entry or welcome screen used by ASG web apps. This is based on the supplied Client Appointment Checklist login reference. Match its centered gold-edged frame, panel proportions, larger typography, branding, and form scale; change only the app name, purpose copy, fields, and primary action.

## Layout

- Use a warm ivory page ground and center a framed login composition in the viewport.
- Desktop at 900px and wider: frame width up to 1344px, minimum height up to 820px, 32px outer margin, thin gold border, 24px rounded corners, and a broad soft shadow.
- Split the frame into a 40% navy brand panel and a 60% ivory form panel. Center both panels' content vertically.
- Keep brand copy to 520px, form heading to 540px, and form fields/actions to 500px maximum; align form field and action edges.
- At viewport heights below 760px, reduce vertical padding and type scale slightly so the full form remains balanced.
- Below 900px: stack the panels inside a frame with 12–16px outer margins and 20px corners. Keep full-width controls in a centered column.
- On narrow phones, use 16px inner gutters, readable 16px inputs, controls at least 44px tall, and no horizontal overflow.

## Brand panel

- Deep navy gradient background: `#0a1f3d` through `#04101f`; white title and copy.
- ASG lockup: prominent gold `#c9a45c` serif letters (76px desktop, 58px stacked), a fine gold divider, and uppercase white `AMPLIFY / SOLUTIONS / GROUP` wordmark (15px desktop).
- Main app title: Georgia or similar serif, 54–68px desktop, 38–52px stacked; regular weight and close to 1.08 line height.
- Optional short uppercase gold strapline: 14–16px, bold, with generous letter spacing. Purpose copy: 16–18px with 1.6 line height and a comfortable 38-character measure.
- Use restrained line art or a subtle radial navy gradient as background texture. Keep it decorative and behind content.

## Form panel

- Warm ivory background: `#f6f2e8` to `#efe9dc`. Use dark navy `#0a1f3d` for headings and body copy `#3a4a63`.
- Small uppercase gold section label, 15px, bold, letter spacing around `.3em`.
- Form heading: Georgia, 42–48px, semibold, 1.1 line height. Center it on the panel.
- Place a thin gold line and small lock/security mark beneath the heading, followed by one concise instruction line.
- Form fields sit in a quiet ivory/white card with a fine warm border, 18px corners, 24–26px padding, and a soft shadow. Labels are uppercase, 13–14px; input text is 18px desktop and at least 16px on phones.
- Primary action spans the form column, is 66px high (60px stacked), and uses a gold gradient (`#8a6a2f`, `#d4af6a`, `#a8843d`), bold navy text at 17–18px, 14px corners, and a soft shadow. Disabled state uses pale stone and muted text.

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

- At desktop width, a centered gold-edged frame is visible, split 40/60, with larger, readable brand and form text.
- At 375px width, the framed panels stack, controls fit inside the viewport, and there is no horizontal page scroll.
- ASG lockup, navy/gold/ivory palette, serif display headings, and consistent form/action widths match this spec.
- App-specific fields and copy fit without changing the shared spacing, hierarchy, or responsive behavior.
