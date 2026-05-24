# Neft Teacher App Library — Cloudflare Pages Hub

This repository is now configured as a **single Cloudflare Pages project** that can host many classroom apps under clean `/apps/<app-slug>/` routes.

Instead of creating one Cloudflare Pages project for every HTML activity, this hub pulls selected public GitHub app repositories during the build and publishes them together from the `dist` folder.

## Cloudflare Pages settings

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

## What gets built

The build script reads `app-registry.json`, clones each listed public GitHub repo, and publishes each app to:

```text
/apps/<slug>/
```

Example final URLs after Cloudflare deployment:

```text
https://<your-cloudflare-project>.pages.dev/
https://<your-cloudflare-project>.pages.dev/apps/hebrew-reading-practice/
https://<your-cloudflare-project>.pages.dev/apps/volume-rectangular-prisms/
https://<your-cloudflare-project>.pages.dev/apps/interactive-area-mission/
```

## How to add another app

1. Make sure the source app repo is public and has either:
   - a root `index.html`, or
   - a working `package.json` with a `build` script that produces `dist/index.html` or `build/index.html`.
2. Open `app-registry.json`.
3. Add a new object to the `apps` array.
4. Give it a clean lowercase hyphenated slug.
5. Commit to `main`.
6. Cloudflare will rebuild the hub and add the app under `/apps/<slug>/`.

Template:

```json
{
  "title": "New App Title",
  "slug": "new-app-title",
  "repo": "Baltimoreteacher1/source-repo-name",
  "category": "Math · Grade 6",
  "audience": "Students",
  "description": "One sentence description of what the app does.",
  "tags": ["tag one", "tag two"]
}
```

## Important notes

- This does **not** delete your old Cloudflare Pages projects.
- Once this hub is deployed and tested, old individual Cloudflare Pages projects can be deleted from Cloudflare to free project slots.
- Existing old `*.pages.dev` URLs will stop working if those old Pages projects are deleted.
- For apps with absolute asset paths or complex build assumptions, the source repo may need a small fix before it works perfectly under `/apps/<slug>/`.

## Local check

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
