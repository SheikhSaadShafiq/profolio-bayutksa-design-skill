#!/usr/bin/env node
/**
 * The .skill file — what someone installs; the pages stay on GitHub, at its own tag.
 *
 * A .skill is a zip of one folder holding SKILL.md (claude.ai installs it under
 * Settings → Capabilities → Skills; Claude Code unzips it into ~/.claude/skills).
 * It carries what a session reads on every task:
 *   - the instructions: SKILL.md, INTAKE.md, and the worked examples (Leads Marketplace
 *     without its built bundles);
 *   - the indexes: registry.json, tokens.md;
 *   - the knowledge bases: design (kb/) and product (product/);
 *   - the scripts (qa/);
 *   - the kit (kit/): the runtime, the patterns, the wireframe kit, the Design QA;
 *   - the design-* skills, as one file: skills/design-skills.zip (qa/fetch.py --skill <name>
 *     unpacks one where it is not installed). The stylesheets and the compiled pages (about 450 MB) stay in
 * the public repo: qa/fetch.py downloads what a PRD needs from registry.source —
 * raw.githubusercontent.com, or github.com through git where that is blocked.
 *
 * A release pins its pages to a tag, so they always match the registry it carries:
 *
 *   SKILL_REF=skill-vX.Y npm run package && git commit -am "skill-vX.Y" && git tag skill-vX.Y
 *   git push saad HEAD skill-vX.Y && npm run skill:file
 *
 * Writes dist/profolio-ksa-design.skill — share the file, or publish it to the
 * organisation's skills. Refuses a tag that is not on GitHub or holds another skill/.
 *
 * claude.ai refuses a skill zip of more than 200 entries, so the build counts them and
 * refuses past LIMIT, and warns past WARN while there is still room to act. What grows
 * travels as one file: the design-* family as skills/design-skills.zip, every copy area in
 * product/copy/areas.md. Only what grows with the product's pages is a file each
 * (product/pages/, product/copy/rendered/).
 *
 *   node scripts/skill-file.mjs --check    count only, no tag needed (CI)
 */
import { mkdirSync, rmSync, cpSync, existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skill');
const NAME = 'profolio-ksa-design';
const STAGE = join(ROOT, '.build', 'skill-file', NAME);
const CARRIED = ['SKILL.md', 'INTAKE.md', 'registry.json', 'tokens.md', 'context.json', 'kb', 'product', 'qa', 'kit', 'examples/worked-example.md', 'examples/leads-marketplace'];
const LIMIT = 200, WARN = 150;
const CHECK = process.argv.includes('--check');
const fail = (msg) => { console.error(`  ${msg}`); process.exit(2); };
const git = (...args) => execFileSync('git', args, { cwd: ROOT }).toString().trim();
for (const f of CARRIED) if (!existsSync(join(SKILL, f))) fail(`missing skill/${f} — run npm run package`);
const family = existsSync(join(SKILL, 'skills')) ? readdirSync(join(SKILL, 'skills')).filter((d) => existsSync(join(SKILL, 'skills', d, 'SKILL.md'))).sort() : [];
if (!family.length) fail('skill/skills/ holds no design-* skill — run node scripts/design-skills.mjs');
const { source } = JSON.parse(readFileSync(join(SKILL, 'registry.json'), 'utf8'));
if (!source?.raw || !source?.git || !source?.assets?.length) fail('registry.json has no source.raw / source.git / source.assets — run npm run package');

/* a tag: on GitHub, and holding exactly this skill/, so every page it fetches matches this registry */
const tag = source.ref.startsWith('refs/tags/') ? source.ref.slice('refs/tags/'.length) : null;
if (tag && !CHECK) {
  const remote = git('ls-remote', source.git, source.ref).split(/\s/)[0];
  if (!remote) fail(`the tag ${tag} is not on GitHub — git tag ${tag} && git push saad ${tag}`);
  let local = '';
  try { local = git('rev-parse', `${source.ref}^{commit}`); } catch { /* no local tag */ }
  if (remote !== local) fail(`the tag ${tag} on GitHub (${remote.slice(0, 8)}) is not the local one (${local.slice(0, 8) || 'none'})`);
  try { git('diff', '--quiet', tag, '--', 'skill'); } catch { fail(`skill/ differs from the tag ${tag} — commit, re-tag and push it first`); }
}

rmSync(join(ROOT, '.build', 'skill-file'), { recursive: true, force: true });
/* not the caches, and not what a build writes: the bundles and the QA's shots stay on GitHub */
const keep = (p) => !/(^|\/)(__pycache__|\.DS_Store|shots)(\/|$)/.test(p) && !/examples\/[^/]+\/(prototype|wireframe)\.html$/.test(p.split('\\').join('/'));
for (const f of CARRIED) { mkdirSync(dirname(join(STAGE, f)), { recursive: true }); cpSync(join(SKILL, f), join(STAGE, f), { recursive: true, filter: keep }); }
/* the design-* skills: one entry, not ~200 — qa/fetch.py --skill <name> unpacks one */
mkdirSync(join(STAGE, 'skills'), { recursive: true });
execFileSync('zip', ['-qr', '-X', join(STAGE, 'skills', 'design-skills.zip'), ...family, '-x', '*/__pycache__/*', '*.pyc', '*/.DS_Store'], { cwd: join(SKILL, 'skills') });
mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = CHECK ? join(ROOT, '.build', 'skill-file', `${NAME}.check.skill`) : join(ROOT, 'dist', `${NAME}.skill`);
rmSync(out, { force: true });
execFileSync('zip', ['-qr', '-X', out, NAME], { cwd: join(ROOT, '.build', 'skill-file') });

/* what claude.ai counts: every entry of the zip, folders included */
const entries = execFileSync('python3', ['-c', 'import sys, zipfile; print("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))', out]).toString().trim().split('\n');
const by = {};
for (const e of entries.filter((x) => !x.endsWith('/'))) { const d = dirname(e.slice(NAME.length + 1)); by[d] = (by[d] || 0) + 1; }
const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, n]) => `${d === '.' ? '(top)' : d} ${n}`).join(' · ');
if (entries.length > LIMIT) { rmSync(out, { force: true }); fail(`${entries.length} entries — claude.ai takes ${LIMIT} at most. Pack what grows into one file, as skills/ and product/copy/ are: ${top}`); }
if (entries.length > WARN) console.warn(`  warning: ${entries.length} of claude.ai's ${LIMIT} entries — pack what grows before it reaches ${LIMIT}: ${top}`);
if (CHECK) { console.log(`  the .skill holds ${entries.length} entries (claude.ai takes ${LIMIT}) — ${top}`); process.exit(0); }
console.log(`  dist/${NAME}.skill — ${(statSync(out).size / 1048576).toFixed(1)} MB, ${entries.length} entries of claude.ai's ${LIMIT}; ${family.length} design-* skills in skills/design-skills.zip; pages and css/ fetched from ${source.raw}`);
if (!tag) console.log(`  note: it fetches from the branch at ${source.ref}, not a tag — a release is built with SKILL_REF=skill-vX.Y`);
