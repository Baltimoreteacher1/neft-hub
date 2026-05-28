import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, sep } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HUB_ROOT = join(__dirname, "..");
const REGISTRY_PATH = join(HUB_ROOT, "app-registry.json");
const CONTENT_ROOT = "/Users/joelneft/neft-classroom-html-activities";
const REPO = "Baltimoreteacher1/neft-classroom-html-activities";

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "assets", "engine", "vendor", "Noam School", ".claude"]);
const SKIP_NAME_PATTERN = /noam|bar-mitzvah|hebrew/i;

const UNIT_LABELS = {
  1: "Unit 1 · Ratios and Unit Rates",
  2: "Unit 2 · Fractions and Division",
  3: "Unit 3 · Rational Numbers",
  4: "Unit 4 · Number System Operations",
  5: "Unit 5 · Geometry and Measurement",
  6: "Unit 6 · Expressions",
  7: "Unit 7 · Integers",
  8: "Unit 8 · Statistics",
  9: "Unit 9 · Variables and Relationships",
  10: "Unit 10 · End-of-Year Review",
};

const GROUP_ORDER = {
  "Unit 1 · Ratios and Unit Rates": 110,
  "Unit 2 · Fractions and Division": 120,
  "Unit 3 · Rational Numbers": 130,
  "Unit 4 · Number System Operations": 140,
  "Unit 5 · Geometry and Measurement": 150,
  "Unit 6 · Expressions": 160,
  "Unit 7 · Integers": 170,
  "Unit 8 · Statistics": 180,
  "Unit 9 · Variables and Relationships": 190,
  "Unit 10 · End-of-Year Review": 200,
  "Cross-Unit · Math Lab Missions": 210,
  "Other Activities": 999,
};

function toKebab(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugFromRelPath(relPath) {
  return toKebab(relPath.split(sep).join("-"));
}

function titleFromName(name) {
  const cleaned = name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function inferStandard(name) {
  const m = name.match(/6-(ee|ns|rp|sp)(-[a-z])?-(\d+)/i);
  if (!m) return "";
  const strand = m[1].toUpperCase();
  const sub = m[2] ? m[2].replace("-", "").toUpperCase() : "";
  const num = m[3];
  return sub ? `6.${strand}.${sub}.${num}` : `6.${strand}.${num}`;
}

function inferGroup(relPath) {
  const parts = relPath.split(sep);
  const top = parts[0];
  const lower = relPath.toLowerCase();

  if (top === "lessons" && parts.length >= 2) {
    const lead = parseInt(parts[1].split("-")[0], 10);
    if (UNIT_LABELS[lead]) return UNIT_LABELS[lead];
    return "Other Activities";
  }

  if (top === "math" && parts.length >= 2) {
    const um = parts[1].match(/^unit-(\d+)$/);
    if (um && UNIT_LABELS[parseInt(um[1], 10)]) return UNIT_LABELS[parseInt(um[1], 10)];
  }

  if (top === "expressions-equations") return UNIT_LABELS[6];
  if (top === "number-system") return UNIT_LABELS[4];
  if (top === "ratios-proportions") return UNIT_LABELS[3];
  if (top === "statistics-data") return UNIT_LABELS[8];
  if (top === "fractions-soccer") return UNIT_LABELS[2];
  if (top === "math-lab-missions") return "Cross-Unit · Math Lab Missions";

  if (lower.startsWith("math" + sep + "unit-6")) return UNIT_LABELS[6];
  if (lower.startsWith("math" + sep + "unit-4")) return UNIT_LABELS[4];
  if (lower.startsWith("math" + sep + "unit-8")) return UNIT_LABELS[8];

  return "Other Activities";
}

function makeDescription(title, standard, group) {
  const stdPart = standard ? `${standard} ` : "";
  return `${stdPart}interactive activity: ${title} (${group}).`.replace(/\s+/g, " ").trim();
}

function scanActivities(root) {
  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const rel = relative(root, dir);
    if (rel && entries.some((e) => e.isFile() && e.name === "index.html")) {
      results.push(rel);
      // Treat a non-root directory with index.html as a leaf activity — do not
      // register its sub-pages (e.g. multi-chapter activities) separately.
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      // Skip personal (non-classroom) content — Noam's private materials live
      // in their own dashboard, not the shared math hub.
      if (SKIP_NAME_PATTERN.test(entry.name)) continue;
      walk(join(dir, entry.name));
    }
  }
  walk(root);
  return results.sort();
}

function main() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const apps = registry.apps;
  const existingSlugs = new Set(apps.map((a) => a.slug));
  const existingRepos = new Set(apps.map((a) => a.repo));

  if (!existsSync(CONTENT_ROOT) || !statSync(CONTENT_ROOT).isDirectory()) {
    console.error(`Content root not found: ${CONTENT_ROOT}`);
    process.exit(1);
  }

  const relPaths = scanActivities(CONTENT_ROOT);
  const added = [];

  for (const relPath of relPaths) {
    const slug = slugFromRelPath(relPath);
    const repo = `${REPO}/${relPath.split(sep).join("/")}`;
    if (existingSlugs.has(slug) || existingRepos.has(repo)) continue;

    const folderName = relPath.split(sep).pop();
    const title = titleFromName(folderName);
    const standard = inferStandard(folderName);
    const group = inferGroup(relPath);
    const category = relPath.split(sep)[0] === "lessons" ? "lesson" : "activity";
    const groupOrder = GROUP_ORDER[group] ?? 999;

    const entry = {
      title,
      slug,
      repo,
      standard,
      category,
      group,
      groupOrder,
      audience: "Students",
      description: makeDescription(title, standard, group),
      tags: [standard, group].filter(Boolean),
    };

    apps.push(entry);
    existingSlugs.add(slug);
    existingRepos.add(repo);
    added.push(entry);
  }

  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

  const byGroup = {};
  for (const e of added) byGroup[e.group] = (byGroup[e.group] || 0) + 1;

  console.log("Registry sync complete");
  console.log(`  Existing entries (before): ${apps.length - added.length}`);
  console.log(`  Directories scanned:       ${relPaths.length}`);
  console.log(`  Newly added:               ${added.length}`);
  console.log(`  Total entries (after):     ${apps.length}`);
  if (added.length) {
    console.log("  Added by group:");
    for (const g of Object.keys(byGroup).sort()) {
      console.log(`    ${g}: ${byGroup[g]}`);
    }
  }
}

main();
