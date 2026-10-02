#!/usr/bin/env node
/**
 * The design-* skills: each folder in design-skills/ is one skill, built into its
 * own .skill file (a zip of the skill's folder) and into the copy the main skill
 * carries (skill/skills/<name>/), which it uses when that skill is not installed.
 *
 * The shared parts are added at build time from design-skills/_shared/, so
 * every skill carries the same context step and none drifts from the others:
 *   _shared/context.md            → references/context.md   (the context step)
 *   _shared/context.schema.json   → schema/context.schema.json
 *   _shared/versioning.md         → references/versioning.md, unless the skill has its own
 *   _shared/_version.py           → scripts/_version.py
 *   _shared/scan.py               → scripts/scan.py           (the context step's scanner)
 *   _shared/validate.py           → scripts/validate.py       (checks an output against its schema)
 *   _shared/measure.mjs           → scripts/measure.mjs       (reads a render), for a skill that names it
 *   _shared/browser.mjs           → scripts/browser.mjs, for a skill whose instructions render or use a browser
 *
 *   node scripts/design-skills.mjs            build dist/design-skills/<name>.skill and skill/skills/
 *   node scripts/design-skills.mjs --check    validate only (CI)
 *
 * Each skill is checked: its frontmatter names its folder, has a version and a
 * description of at most 1,024 characters; CHANGELOG.md has an entry for that
 * version; and nothing in it names a product. A design-* skill is plug and
 * play: the product comes from the context card, never from the skill.
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync, cpSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'design-skills');
const SHARED = join(SRC, '_shared');
const STAGE = join(ROOT, '.build', 'design-skills');
const DIST = join(ROOT, 'dist', 'design-skills');
const CARRY = join(ROOT, 'skill', 'skills');
const CHECK = process.argv.includes('--check');
const PRODUCT = /\b(profolio|bayut|dubizzle|truleads|leads marketplace|rega|wafi)\b/i;     /* the main skill's product and its features: never inside a sub-skill */

const SHARED_AS = new Set(['references/context.md', 'schema/context.schema.json', 'references/versioning.md', 'scripts/_version.py', 'scripts/scan.py', 'scripts/validate.py', 'scripts/measure.mjs', 'scripts/browser.mjs']);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const front = (md) => {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const get = (k) => { const x = m[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm')); return x ? x[1].trim().replace(/^["']|["']$/g, '') : null; };
  return { name: get('name'), version: get('version'), description: get('description') };
};

const skills = readdirSync(SRC, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_')).map((e) => e.name).sort();
const problems = [];
const say = (name, msg) => problems.push(`${name}: ${msg}`);
for (const name of skills) {
  const dir = join(SRC, name);
  if (!existsSync(join(dir, 'SKILL.md'))) { say(name, 'no SKILL.md'); continue; }
  const f = front(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
  if (!f) { say(name, 'SKILL.md has no frontmatter'); continue; }
  if (f.name !== name) say(name, `frontmatter name "${f.name}" is not the folder's`);
  if (!/^design-[a-z0-9-]+$/.test(name) || name.length > 64) say(name, 'a name is design-, then lowercase letters, digits and hyphens, at most 64 characters');
  if (!/^\d+\.\d+\.\d+$/.test(f.version || '')) say(name, `version "${f.version}" is not x.y.z`);
  if (!f.description || f.description.length > 1024) say(name, `description is ${f.description ? f.description.length : 0} characters (1 to 1,024)`);
  const log = existsSync(join(dir, 'CHANGELOG.md')) ? readFileSync(join(dir, 'CHANGELOG.md'), 'utf8') : '';
  if (!log.includes(`## [${f.version}]`)) say(name, `CHANGELOG.md has no entry for ${f.version}`);
  /* claude.ai refuses a skill zip of more than 200 files; the build adds the shared ones */
  { const n = walk(dir).length + SHARED_AS.size; if (n > 200) say(name, `up to ${n} files with the shared ones — claude.ai takes 200 at most`); }
  for (const file of walk(dir)) {
    if (!/\.(md|json|py|mjs|js|html|css|txt)$/.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    const hit = text.match(PRODUCT);
    if (hit) say(name, `${relative(dir, file)} names "${hit[0]}" — a design-* skill takes its product from the context card`);
    /* every file it names, it carries: references/…, scripts/…, schema/…, assets/… (the shared ones are added by the build) */
    if (/\.md$/.test(file)) for (const m of text.matchAll(/`((?:references|scripts|schema|assets)\/[\w./-]+\.(?:md|py|mjs|js|json|css|html))`/g)) {
      if (!existsSync(join(dir, m[1])) && !SHARED_AS.has(m[1])) say(name, `${relative(dir, file)} names ${m[1]}, which the skill does not carry`);
    }
    /* every schema is JSON, with an id, a title, and required fields it defines */
    if (/^schema\/.*\.json$/.test(relative(dir, file).split('\\').join('/')) && !/platforms\.json$/.test(file)) {
      try {
        const j = JSON.parse(text);
        if (!j.$schema && !j.properties) continue;                       /* configuration, not a schema */
        if (!j.$id) say(name, `${relative(dir, file)} has no $id`);
        for (const r of j.required || []) if (!(j.properties || {})[r]) say(name, `${relative(dir, file)} requires "${r}" but does not define it`);
      } catch (e) { say(name, `${relative(dir, file)} is not JSON: ${e.message}`); }
    }
  }
}
if (problems.length) { console.log(problems.map((p) => '  ✗ ' + p).join('\n')); process.exit(1); }
console.log(`  ✓ ${skills.length} design-* skills: ${skills.join(', ')}`);
if (CHECK) process.exit(0);

rmSync(STAGE, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
rmSync(CARRY, { recursive: true, force: true });
mkdirSync(CARRY, { recursive: true });
for (const name of skills) {
  const stage = join(STAGE, name);
  cpSync(join(SRC, name), stage, { recursive: true });
  const put = (from, to, keep = false) => { const dest = join(stage, to); if (keep && existsSync(dest)) return; mkdirSync(dirname(dest), { recursive: true }); cpSync(join(SHARED, from), dest); };
  put('context.md', 'references/context.md');
  put('context.schema.json', 'schema/context.schema.json');
  put('versioning.md', 'references/versioning.md', true);
  put('_version.py', 'scripts/_version.py');
  put('scan.py', 'scripts/scan.py');
  put('validate.py', 'scripts/validate.py');
  if (/measure\.mjs/.test(readFileSync(join(SRC, name, 'SKILL.md'), 'utf8'))) { put('measure.mjs', 'scripts/measure.mjs'); put('browser.mjs', 'scripts/browser.mjs'); }
  if (/\brender|browser\b/.test(readFileSync(join(SRC, name, 'SKILL.md'), 'utf8'))) put('browser.mjs', 'scripts/browser.mjs');
  const out = join(DIST, `${name}.skill`);
  rmSync(out, { force: true });
  execFileSync('zip', ['-qr', '-X', out, name, '-x', '*/__pycache__/*', '*.pyc', '*/.DS_Store'], { cwd: STAGE });
  cpSync(stage, join(CARRY, name), { recursive: true, filter: (p) => !/__pycache__|\.pyc$|\.DS_Store$/.test(p) });
  console.log(`  ${name}.skill — ${(statSync(out).size / 1024).toFixed(0)} KB`);
}
console.log(`  wrote dist/design-skills/ and skill/skills/ (the copies the main skill carries)`);
