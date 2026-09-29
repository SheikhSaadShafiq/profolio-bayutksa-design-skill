#!/usr/bin/env node
/**
 * The skill for claude.ai — a zip of the core, to upload as a skill.
 *
 * claude.ai takes a skill as a zip whose folder holds SKILL.md. The whole
 * package is about 450 MB (every compiled page and state); the core is what a
 * session reads on every task — SKILL.md, INTAKE.md, the registry, tokens, the
 * design knowledge base, product/, css/, qa/, the worked example and the
 * prototype script. Pages and components are fetched from the public repo by
 * path when a task needs them (python3 qa/fetch.py), at registry.source.ref.
 *
 *   node scripts/skill-zip.mjs        (npm run skill:zip, after npm run package)
 *
 * Writes dist/profolio-ksa-design.zip.
 */
import { mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skill');
const NAME = 'profolio-ksa-design';
const STAGE = join(ROOT, '.build', 'zip', NAME);
const CORE = ['SKILL.md', 'INTAKE.md', 'registry.json', 'tokens.md', 'kb', 'product', 'css', 'qa', 'examples/worked-example.md', 'pages/prototype.js'];
for (const f of CORE) if (!existsSync(join(SKILL, f))) { console.error(`  missing skill/${f} — run npm run package`); process.exit(2); }
rmSync(join(ROOT, '.build', 'zip'), { recursive: true, force: true });
for (const f of CORE) { mkdirSync(dirname(join(STAGE, f)), { recursive: true }); cpSync(join(SKILL, f), join(STAGE, f), { recursive: true }); }
mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', `${NAME}.zip`);
rmSync(out, { force: true });
execFileSync('zip', ['-qr', '-X', out, NAME, '-x', '*.DS_Store', '*/__pycache__/*'], { cwd: join(ROOT, '.build', 'zip') });
console.log(`  dist/${NAME}.zip — ${(statSync(out).size / 1048576).toFixed(1)} MB (the core; pages fetched by path)`);
