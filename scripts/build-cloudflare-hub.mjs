import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const CACHE = path.join(ROOT, ".cache", "source-repos");
const REGISTRY_PATH = path.join(ROOT, "app-registry.json");
const CHECK_ONLY = process.argv.includes("--check");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function run(cmd, args, options = {}) {
  execFileSync(cmd, args, {
    stdio: "inherit",
    cwd: options.cwd || ROOT,
    env: { ...process.env, CI: "true" }
  });
}

function copyDir(src, dest, options = {}) {
  ensureDir(dest);
  const skip = new Set([".git", "node_modules", "dist", "build", ".next", ".cache", ".DS_Store", "package-lock.json"]);
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(item.name)) continue;
    if (options.skipRootFiles?.has(item.name)) continue;
    const from = path.join(src, item.name);
    const to = path.join(dest, item.name);
    if (item.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function appUrl(slug) {
  return `/apps/${slug}/`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function appGroup(app) {
  return app.group || app.category || "Other";
}

function appGroupOrder(app) {
  const order = Number(app.groupOrder);
  return Number.isFinite(order) ? order : 999;
}

function sortApps(apps) {
  return [...apps].sort((a, b) =>
    appGroupOrder(a) - appGroupOrder(b) ||
    appGroup(a).localeCompare(appGroup(b)) ||
    a.title.localeCompare(b.title)
  );
}

function groupApps(registry) {
  const groups = new Map();

  for (const app of sortApps(registry.apps)) {
    const name = appGroup(app);
    if (!groups.has(name)) {
      groups.set(name, { name, order: appGroupOrder(app), apps: [] });
    }
    groups.get(name).apps.push(app);
  }

  return [...groups.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function detectStaticSource(repoDir) {
  const htmlCandidates = ["index.html", "Index.html", "app.html"];
  for (const candidate of htmlCandidates) {
    if (fs.existsSync(path.join(repoDir, candidate))) return repoDir;
  }
  const entries = fs.readdirSync(repoDir, { withFileTypes: true });
  const nested = entries.find((entry) => entry.isDirectory() && fs.existsSync(path.join(repoDir, entry.name, "index.html")));
  return nested ? path.join(repoDir, nested.name) : null;
}

function buildNpmApp(repoDir) {
  const pkgPath = path.join(repoDir, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = readJson(pkgPath);
  if (!pkg.scripts?.build) return null;

  if (fs.existsSync(path.join(repoDir, "package-lock.json"))) run("npm", ["ci"], { cwd: repoDir });
  else run("npm", ["install"], { cwd: repoDir });

  run("npm", ["run", "build"], { cwd: repoDir });

  for (const candidate of ["dist", "build", "public"]) {
    const full = path.join(repoDir, candidate);
    if (fs.existsSync(path.join(full, "index.html"))) return full;
  }
  return null;
}

function cloneOrUpdate(repoFullName) {
  const safeName = repoFullName.replaceAll("/", "__");
  const repoDir = path.join(CACHE, safeName);
  const url = `https://github.com/${repoFullName}.git`;

  if (fs.existsSync(path.join(repoDir, ".git"))) {
    run("git", ["fetch", "--depth", "1", "origin", "main"], { cwd: repoDir });
    run("git", ["checkout", "main"], { cwd: repoDir });
    run("git", ["reset", "--hard", "origin/main"], { cwd: repoDir });
  } else {
    ensureDir(CACHE);
    run("git", ["clone", "--depth", "1", url, repoDir]);
  }
  return repoDir;
}

function generateHome(registry, copiedApps) {
  const groups = groupApps(registry);

  function renderAppCard(app) {
    const status = copiedApps.has(app.slug) ? "Ready" : "Check source";
    const tags = (app.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    const searchable = [
      app.title,
      app.description,
      app.category,
      appGroup(app),
      app.audience,
      ...(app.tags || [])
    ].filter(Boolean).join(" ").toLowerCase();

    return `
      <article class="app-card" data-title="${escapeHtml(searchable)}" data-category="${escapeHtml(app.category)}" data-group="${escapeHtml(appGroup(app))}">
        <div class="app-card__topline">
          <span class="pill">${escapeHtml(app.category)}</span>
          <span class="status">${status}</span>
        </div>
        <h3>${escapeHtml(app.title)}</h3>
        <p>${escapeHtml(app.description)}</p>
        <div class="tag-row">${tags}</div>
        <a class="button button-card" href="${appUrl(app.slug)}">Launch App</a>
      </article>`;
  }

  const appGroups = groups.map((group) => `
    <section class="app-group" data-group="${escapeHtml(group.name)}">
      <div class="app-group__heading">
        <div>
          <p class="group-kicker">Folder</p>
          <h3>${escapeHtml(group.name)}</h3>
        </div>
        <span class="group-count">${group.apps.length} ${group.apps.length === 1 ? "app" : "apps"}</span>
      </div>
      <div class="app-grid">
        ${group.apps.map(renderAppCard).join("\n")}
      </div>
    </section>`).join("\n");

  const groupOptions = groups.map((group) => `<option value="${escapeHtml(group.name)}">${escapeHtml(group.name)}</option>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(registry.site.title)}</title>
  <meta name="description" content="${escapeHtml(registry.site.description)}" />
  <link rel="stylesheet" href="/assets/neft-cloudflare-hub.css" />
</head>
<body>
  <a class="skip-link" href="#apps">Skip to apps</a>
  <header class="hero">
    <div>
      <p class="eyebrow">${escapeHtml(registry.site.eyebrow)}</p>
      <h1>${escapeHtml(registry.site.title)}</h1>
      <p class="hero__text">${escapeHtml(registry.site.description)}</p>
      <div class="hero__actions">
        <a class="button button-primary" href="#apps">Open App Library</a>
        <a class="button button-ghost" href="/apps/">View Folder Index</a>
      </div>
    </div>
    <aside class="hero-panel">
      <h2>Cloudflare Strategy</h2>
      <ol>
        <li>One Pages project.</li>
        <li>Many apps under <code>/apps/</code>.</li>
        <li>No more one-project-per-activity sprawl.</li>
      </ol>
    </aside>
  </header>

  <main class="page-shell">
    <section class="toolbar-card" aria-label="Search and filter apps">
      <div>
        <h2>App Launcher</h2>
        <p>Search by standard, topic, skill, or app name.</p>
      </div>
      <div class="toolbar-controls">
        <label for="searchBox">Search</label>
        <input id="searchBox" type="search" placeholder="Search apps..." />
        <label for="categoryFilter">Unit / Folder</label>
        <select id="categoryFilter">
          <option value="all">All folders</option>
          ${groupOptions}
        </select>
      </div>
    </section>

    <section id="apps" class="app-library" aria-label="Apps">
      ${appGroups}
    </section>

    <section class="info-card">
      <h2>Cloudflare Pages Build Settings</h2>
      <div class="settings-grid">
        <div><strong>Framework preset</strong><span>None / Static HTML</span></div>
        <div><strong>Build command</strong><span><code>npm run build</code></span></div>
        <div><strong>Build output directory</strong><span><code>dist</code></span></div>
        <div><strong>Production branch</strong><span><code>main</code></span></div>
      </div>
    </section>
  </main>

  <footer class="site-footer">Built as a single Cloudflare Pages hub for Neft Teacher classroom tools.</footer>
  <script src="/assets/neft-cloudflare-hub.js"></script>
</body>
</html>`;
}

function generateAppsIndex(registry, copiedApps) {
  const sections = groupApps(registry).map((group) => {
    const links = group.apps.map((app) => `<li><a href="${appUrl(app.slug)}">${escapeHtml(app.title)}</a> <span>${copiedApps.has(app.slug) ? "Ready" : "Check source"}</span></li>`).join("\n");
    return `<section class="folder-group"><h2>${escapeHtml(group.name)}</h2><ul class="folder-list">${links}</ul></section>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Apps · Neft Teacher</title><link rel="stylesheet" href="/assets/neft-cloudflare-hub.css"></head><body><main class="simple-page"><a class="button button-ghost-dark" href="/">Back to Library</a><h1>Apps Folder Index</h1><p>Every item below is served from this single Cloudflare Pages project.</p><div class="folder-index">${sections}</div></main></body></html>`;
}

function generateMissingApp(app) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(app.title)}</title><link rel="stylesheet" href="/assets/neft-cloudflare-hub.css"></head><body><main class="simple-page"><a class="button button-ghost-dark" href="/">Back to Library</a><h1>${escapeHtml(app.title)}</h1><p>This app slot is registered, but the build could not find a static <code>index.html</code> or a working npm build in <code>${escapeHtml(app.repo)}</code>.</p><p>Fix the source repo or replace this folder with the final HTML app.</p></main></body></html>`;
}

function main() {
  const registry = readJson(REGISTRY_PATH);
  const copiedApps = new Set();
  const failures = [];

  if (!registry.apps?.length) throw new Error("app-registry.json must include at least one app.");

  if (CHECK_ONLY) {
    console.log(`Registry contains ${registry.apps.length} apps.`);
    const slugs = new Set();
    for (const app of registry.apps) {
      if (!app.title || !app.slug || !app.repo || !app.category || !app.group) throw new Error(`Invalid app entry: ${JSON.stringify(app)}`);
      if (!Number.isFinite(Number(app.groupOrder))) throw new Error(`Invalid groupOrder for ${app.slug}`);
      if (slugs.has(app.slug)) throw new Error(`Duplicate slug: ${app.slug}`);
      slugs.add(app.slug);
    }
    console.log("Registry check passed.");
    return;
  }

  cleanDir(DIST);
  ensureDir(path.join(DIST, "apps"));
  ensureDir(path.join(DIST, "assets"));

  for (const app of registry.apps) {
    const target = path.join(DIST, "apps", app.slug);
    cleanDir(target);
    try {
      const repoDir = cloneOrUpdate(app.repo);
      const buildSource = buildNpmApp(repoDir) || detectStaticSource(repoDir);
      if (!buildSource) throw new Error("No static index.html or npm build output found.");
      copyDir(buildSource, target);
      copiedApps.add(app.slug);
      console.log(`Built ${app.title} -> /apps/${app.slug}/`);
    } catch (error) {
      failures.push(`${app.title}: ${error.message}`);
      writeText(path.join(target, "index.html"), generateMissingApp(app));
      console.warn(`Warning: ${app.title} could not be copied. ${error.message}`);
    }
  }

  writeText(path.join(DIST, "index.html"), generateHome(registry, copiedApps));
  writeText(path.join(DIST, "apps", "index.html"), generateAppsIndex(registry, copiedApps));
  writeText(path.join(DIST, "404.html"), generateHome(registry, copiedApps));
  writeText(path.join(DIST, "assets", "neft-cloudflare-hub.css"), fs.readFileSync(path.join(ROOT, "assets", "neft-cloudflare-hub.css"), "utf8"));
  writeText(path.join(DIST, "assets", "neft-cloudflare-hub.js"), fs.readFileSync(path.join(ROOT, "assets", "neft-cloudflare-hub.js"), "utf8"));
  writeText(path.join(DIST, "_headers"), fs.readFileSync(path.join(ROOT, "cloudflare", "_headers"), "utf8"));
  writeText(path.join(DIST, "_redirects"), fs.readFileSync(path.join(ROOT, "cloudflare", "_redirects"), "utf8"));

  const report = {
    builtAt: new Date().toISOString(),
    totalApps: registry.apps.length,
    copiedApps: copiedApps.size,
    failures
  };
  writeText(path.join(DIST, "build-report.json"), JSON.stringify(report, null, 2));
  console.log(`Cloudflare hub build complete: ${copiedApps.size}/${registry.apps.length} apps copied.`);
  if (failures.length) console.warn(`Build completed with ${failures.length} app warnings. See dist/build-report.json.`);
}

main();
