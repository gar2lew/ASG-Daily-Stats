# ASG Web App Central Hub

Standalone static site for ASG staff to open the web apps and shared spreadsheets they use.

## Contents

- `index.html` — hub layout, app links, spreadsheet links, and responsive styling.
- `assets/app-previews/` — the supplied app screenshot thumbnails.

The hub is plain HTML, CSS, and JavaScript. It has no build step, package dependencies, API calls, or secrets. To update destinations, edit the `APPS` array in `index.html`.

## Publish as a separate GitHub and Vercel app

1. Create an empty GitHub repository for the hub.
2. Copy the **contents of this folder** (`index.html`, `README.md`, `.gitignore`, and `assets/`) into the new repository root, then commit and push them to `main`.
3. Import that repository as a new Vercel project.
4. Choose the **Other** framework preset. No install or build command is needed; serve the repository root, where `index.html` is the entry page.

The root repository's existing `portal.html` URL redirects to this folder so the current DRAPS portal address remains usable.
