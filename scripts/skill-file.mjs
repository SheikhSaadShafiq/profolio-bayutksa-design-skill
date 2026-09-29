#!/usr/bin/env node
/**
 * The .skill file — what someone installs; everything else stays on GitHub.
 *
 * A .skill is a zip of one folder holding SKILL.md (claude.ai installs it under
 * Settings → Capabilities → Skills; Claude Code unzips it into ~/.claude/skills).
 * It carries what a session reads on every task: the instructions (SKILL.md,
 * INTAKE.md, the worked example), the indexes (registry.json, tokens.md), the
 * design knowledge base (kb/), the product knowledge base (product/) and the
 * scripts (qa/). The stylesheets and the compiled pages (about 450 MB) stay in
 * the public repo: qa/fetch.py downloads what a PRD needs from
 * registry.source.raw + the file's path, at registry.source.ref.
 *
 *   SKILL_REF=main npm run package && npm run skill:file
 *
 * Writes dist/profolio-ksa-design.skill — attach it to a GitHub release.
 */
import { mkdirSync, rmSync, cpSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skill');
const NAME = 'profolio-ksa-design';
const STAGE = join(ROOT, '.build', 'skill-file', NAME);
const CARRIED = ['SKILL.md', 'INTAKE.md', 'registry.json', 'tokens.md', 'kb', 'product', 'qa', 'examples/worked-example.md'];
for (const f of CARRIED) if (!existsSync(join(SKILL, f))) { console.error(`  missing skill/${f} — run npm run package`); process.exit(2); }
const { source } = JSON.parse(readFileSync(join(SKILL, 'registry.json'), 'utf8'));
if (!source?.raw || !source?.assets?.length) { console.error('  registry.json has no source.raw / source.assets — run npm run package'); process.exit(2); }
rmSync(join(ROOT, '.build', 'skill-file'), { recursive: true, force: true });
for (const f of CARRIED) { mkdirSync(dirname(join(STAGE, f)), { recursive: true }); cpSync(join(SKILL, f), join(STAGE, f), { recursive: true }); }
mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', `${NAME}.skill`);
rmSync(out, { force: true });
execFileSync('zip', ['-qr', '-X', out, NAME, '-x', '*.DS_Store', '*/__pycache__/*'], { cwd: join(ROOT, '.build', 'skill-file') });
console.log(`  dist/${NAME}.skill — ${(statSync(out).size / 1048576).toFixed(1)} MB; pages and css/ fetched from ${source.raw}`);
if (source.ref !== 'main') console.log(`  note: it fetches from the branch "${source.ref}" — a release is built with SKILL_REF=main`);
