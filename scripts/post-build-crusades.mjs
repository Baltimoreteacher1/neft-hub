import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "assignments", "social-studies", "crusades-graphic-novel.html");
const TARGET_DIR = path.join(ROOT, "dist", "apps", "crusades-graphic-novel");
const TARGET = path.join(TARGET_DIR, "index.html");

if (!fs.existsSync(SOURCE)) {
  throw new Error(`Crusades source HTML not found: ${SOURCE}`);
}

fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.copyFileSync(SOURCE, TARGET);

console.log("Added Crusades Graphic Novel route -> /apps/crusades-graphic-novel/");
