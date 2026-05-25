# Neft Hub

**Neft Hub** is the single home base for Joel's classroom apps, GitHub navigation, notebook and lesson-plan engines, Hebrew/family learning tools, and Cloudflare Pages deployment.

The goal is simple: **one hub, one Cloudflare Pages project, many organized tools.**

Instead of creating a separate Cloudflare Pages project for every activity, Neft Hub publishes apps under clean routes like:

```text
/apps/<app-slug>/
```

## Start Here

| Need | Open |
|---|---|
| Main app library | `/` |
| All app folders | `/apps/` |
| Control center | `/apps/neft-hub-control-center/` |
| App registry | `app-registry.json` |
| Build script | `scripts/build-cloudflare-hub.mjs` |

## Cloudflare Pages Settings

Use these settings when connecting this repo to Cloudflare Pages:

| Setting | Value |
|---|---|
| Repository | `Baltimoreteacher1/student-notebooks-site` |
| Production branch | `main` |
| Framework preset | `None` or `Static HTML` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | blank / repository root |
| Node version | 20+ |

## Main Routes

After Cloudflare deployment, the site should look like this:

```text
https://<your-cloudflare-project>.pages.dev/
https://<your-cloudflare-project>.pages.dev/apps/
https://<your-cloudflare-project>.pages.dev/apps/neft-hub-control-center/
https://<your-cloudflare-project>.pages.dev/apps/noam-hebrew/
https://<your-cloudflare-project>.pages.dev/apps/grade-6-math-units/
```

## What Gets Built

The build script reads `app-registry.json`, clones each listed public GitHub repo or copies each listed local folder, and publishes each app to:

```text
/apps/<slug>/
```

The homepage and `/apps/` folder index are grouped by each app's `group` and sorted by `groupOrder`.

## What Belongs in Neft Hub

| Type | Where It Goes |
|---|---|
| Student-facing classroom apps | Add to `app-registry.json` |
| Family learning apps | Add to `app-registry.json` |
| GitHub navigation links | Keep in `/apps/neft-hub-control-center/` |
| Notebook and lesson-plan engines | Link from the control center |
| Experimental apps | Keep in GitHub until stable, then add to the registry |
| Cloudflare deployment notes | Keep in this README |

## How to Add Another App

1. Make sure the source app repo is public and has either:
   - a root `index.html`, or
   - a working `package.json` with a `build` script that produces `dist/index.html` or `build/index.html`.
2. For a local bundled folder, place it under `assignments/<folder>/` with its own `index.html` and use a `repo` value like `./assignments/<folder>`.
3. Open `app-registry.json`.
4. Add a new object to the `apps` array.
5. Give it a clean lowercase hyphenated slug.
6. Set `group` to the unit/folder where the app belongs.
7. Set `groupOrder` so folders sort correctly.
8. Commit to `main`.
9. Cloudflare rebuilds Neft Hub and adds the app under `/apps/<slug>/`.

Template:

```json
{
  "title": "New App Title",
  "slug": "new-app-title",
  "repo": "Baltimoreteacher1/source-repo-name",
  "category": "Math · Grade 6",
  "group": "Unit 5 · Geometry and Measurement",
  "groupOrder": 50,
  "audience": "Students",
  "description": "One sentence description of what the app does.",
  "tags": ["tag one", "tag two"]
}
```

## Local Check

Run:

```bash
npm run check
npm run build
```

The build creates:

```text
dist/
  index.html
  apps/
    <slug>/
      index.html
  assets/
  _headers
  _redirects
  build-report.json
```

Open `dist/build-report.json` after building to see which apps copied successfully and which source repos need cleanup.

## Important Rules

- Keep **one Cloudflare Pages project** for the hub.
- Do not create a new Pages project unless the app truly needs to be separate.
- Do not delete old Cloudflare Pages projects until the hub version is tested.
- Existing old `*.pages.dev` URLs will stop working if those old projects are deleted.
- For apps with absolute asset paths or complex build assumptions, the source repo may need a small fix before it works perfectly under `/apps/<slug>/`.

## Recommended Future Rename

The current GitHub repo is still named:

```text
student-notebooks-site
```

For clarity, rename it later in GitHub to:

```text
neft-hub
```

Do this only after confirming Cloudflare still builds correctly from the renamed repo.
