#!/usr/bin/env node
/**
 * The .skill file — what someone installs. It needs nothing else: no repo, no link, no network.
 *
 * A .skill is a zip of one folder holding SKILL.md (claude.ai installs it under
 * Settings → Capabilities → Skills; Claude Code unzips it into ~/.claude/skills).
 * It carries the instructions (SKILL.md, INTAKE.md, the worked example), the
 * indexes (registry.json, tokens.md), the design knowledge base (kb/), the
 * product knowledge base (product/), the scripts (qa/), the stylesheets (css/,
 * pages/prototype.js) and screens.tar.xz: every compiled page, state and
 * component, about 450 MB of HTML packed into about 7 MB by
 * scripts/pack-screens.py. qa/fetch.py unpacks what a design opens.
 *
 *   npm run package && npm run skill:file
 *
 * Writes dist/profolio-ksa-design.skill — share the file, or publish it to the
 * organisation's skills. Fails over 30 MB unpacked (a skill's upload limit) or
 * when a link to the repo is inside: the file is shared without it.
 */
import { mkdirSync, rmSync, cpSync, existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skill');
const NAME = 'profolio-ksa-design';
const BUILD = join(ROOT, '.build', 'skill-file');
const STAGE = join(BUILD, NAME);
const LIMIT = 30 * 1048576;
const CARRIED = ['SKILL.md', 'INTAKE.md', 'registry.json', 'tokens.md', 'kb', 'product', 'qa', 'css', 'pages/prototype.js', 'examples/worked-example.md'];
for (const f of CARRIED) if (!existsSync(join(SKILL, f))) { console.error(`  missing skill/${f} — run npm run package`); process.exit(2); }
const { source } = JSON.parse(readFileSync(join(SKILL, 'registry.json'), 'utf8'));
if (source?.archive !== 'screens.tar.xz' || !source?.assets?.length) { console.error('  registry.json has no source.archive / source.assets — run npm run package'); process.exit(2); }

rmSync(BUILD, { recursive: true, force: true });
const keep = (p) => !/(^|\/)(__pycache__|\.DS_Store)(\/|$)/.test(p);
for (const f of CARRIED) { mkdirSync(dirname(join(STAGE, f)), { recursive: true }); cpSync(join(SKILL, f), join(STAGE, f), { recursive: true, filter: keep }); }
execFileSync('python3', [join(ROOT, 'scripts', 'pack-screens.py'), join(STAGE, 'screens.tar.xz')], { stdio: 'inherit' });

const sizeOf = (d) => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? sizeOf(join(d, e.name)) : statSync(join(d, e.name)).size), 0);
const unpacked = sizeOf(STAGE);
if (unpacked > LIMIT) { console.error(`  ${(unpacked / 1048576).toFixed(1)} MB unpacked — over the 30 MB a skill may be`); process.exit(1); }
let links = '';
try { links = execFileSync('grep', ['-rlI', '-e', 'github.com/SheikhSaad', '-e', 'raw.githubusercontent', NAME], { cwd: BUILD }).toString().trim(); } catch (e) { if (e.status !== 1) throw e; }
if (links) { console.error(`  a link to the repo is inside — the file is shared without it:\n${links}`); process.exit(1); }

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', `${NAME}.skill`);
rmSync(out, { force: true });
execFileSync('zip', ['-qr', '-X', out, NAME], { cwd: BUILD });
console.log(`  dist/${NAME}.skill — ${(statSync(out).size / 1048576).toFixed(1)} MB; ${(unpacked / 1048576).toFixed(1)} MB unpacked (a skill may be 30 MB); no network needed`);
