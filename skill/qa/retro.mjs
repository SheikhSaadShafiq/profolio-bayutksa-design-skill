#!/usr/bin/env node
/**
 * The retro: once a design is locked, what it was like to design it with this skill — written
 * by the agent as designs/<feature>/retro.md, joined to what the QA measured — sent to the skill's
 * GitHub repo as a pull request, with the components the design proposes, so the skill's owner
 * fixes what got in the way (SKILL.md → THE FLOW, step 6). Run from the skill's folder:
 *
 *   node qa/retro.mjs designs/<feature>              check, assemble, push, open the PR
 *   node qa/retro.mjs designs/<feature> --no-push    check and assemble only: the files stay in
 *                                                    designs/<feature>/qa/retro/
 *
 * It refuses until: flow.json has "locked" (the date the PM or designer called the design final);
 * the last full QA run passed; retro.md has its four sections; and retro.md holds no e-mail
 * address or phone number (the repo is public: the retro is about the skill, not the product).
 *
 * The PR adds, to the skill's repo:
 *   feedback/retros/<date>-<feature>.md              the retro, and the QA's own numbers
 *   storybook/proposed/<feature>/<component>.html     each new component the chosen direction adds
 *   storybook/proposed/<feature>/<component>.json     (flow.json directions[].components), its
 *                                                     markup and meta: the Storybook's "Proposed"
 * It needs git and the GitHub CLI signed in (gh auth status); without push rights to the repo it
 * forks it. Where neither is available (claude.ai), it says so and leaves the files to send.
 *
 * Exit: 0 pushed (or assembled, with --no-push) · 1 not ready (it says what is missing) ·
 * 3 assembled, not pushed: no git or gh here · 2 a usage error.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv.slice(2).find((a) => !a.startsWith('--'));
const PUSH = !process.argv.includes('--no-push');
if (!target) { console.error('  usage: node qa/retro.mjs designs/<feature> [--no-push]'); process.exit(2); }
const DIR = resolve(process.cwd(), target);
const read = (p) => readFileSync(p, 'utf8');
const json = (p, d = null) => (existsSync(p) ? JSON.parse(read(p)) : d);
const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };

const flow = json(join(DIR, 'flow.json'), {});
const feature = flow.name || DIR.split('/').pop();
const reg = json(join(SKILL, 'registry.json'), {});
need(/^\d{4}-\d{2}-\d{2}$/.test(flow.locked || ''), 'flow.json "locked": the date the PM or designer called the design final (YYYY-MM-DD). The retro runs on a locked design only');
const runs = existsSync(join(DIR, 'qa', 'runs.jsonl')) ? read(join(DIR, 'qa', 'runs.jsonl')).trim().split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
const full = runs.filter((r) => r.ran && !r.partial);
need(full.length && full[full.length - 1].errors === 0, 'the last full QA run did not pass: run node qa/prototype.mjs designs/<feature> --shots until it exits 0');

/* the agent's part: four sections */
const RETRO = join(DIR, 'retro.md');
const text = existsSync(RETRO) ? read(RETRO) : '';
const SECTIONS = ['What was asked', 'Decisions', 'Where the skill got in the way', 'Suggestions for the skill'];
need(text, `designs/${feature}/retro.md is missing — write it (SKILL.md → THE FLOW, step 6): ${SECTIONS.map((s) => `"## ${s}"`).join(', ')}`);
for (const s of SECTIONS) need(!text || new RegExp(`^##\\s+${s}`, 'mi').test(text), `retro.md has no "## ${s}" section`);
const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/), phone = text.match(/(?:\+|00)\d{1,3}[\s-]?\d[\d\s-]{7,}\d|\b05\d[\s-]?\d{3}[\s-]?\d{4}\b/);   /* +966 55 …, 05x xxx xxxx */
if (email || phone) need(false, `retro.md holds ${email ? `an e-mail address (${email[0]})` : `a phone number (${phone[0].trim()})`}: the repo is public — describe the skill's problems, not the product's data`);
if (problems.length) { console.log(`  the retro is not ready:\n${problems.map((p) => `  - ${p}`).join('\n')}`); process.exit(1); }

/* the QA's own numbers */
const today = new Date().toISOString().slice(0, 10);
const counts = {};
for (const r of runs) for (const [k, v] of Object.entries(r.checks || {})) counts[k] = (counts[k] || 0) + v;
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
const research = json(join(DIR, 'research', 'research.json'));
const chosen = (flow.directions || []).find((d) => d.id === flow.chosen);
const facts = [
  `- **Skill**: ${(reg.source && reg.source.ref || '').replace('refs/tags/', '') || 'unknown version'} · locked ${flow.locked} · retro ${today}`,
  `- **Path**: ${research ? `${research.depth || '?'} study` : 'no research (a small fix)'} · platforms ${(flow.platforms || []).join(', ') || '—'} · variations ${flow.variations || '—'}`,
  (flow.directions || []).length ? `- **Directions**: ${(flow.directions || []).map((d) => `${d.id} ${d.kind} (${d.layout || '?'})`).join(' · ')} · chosen **${flow.chosen || '—'}**${chosen ? `, “${chosen.title || ''}”` : ''}` : '',
  research ? `- **Research**: ${(research.competitors || []).filter((c) => c.status === 'shortlist').length} competitors shortlisted · ${(research.queries || []).length} Mobbin searches · ${(research.flows || []).length} flows · ${(research.fresh || []).length} findings` : '',
  `- **QA runs**: ${runs.length} (${full.length} full, ${runs.length - full.length} partial) · errors on the first full run: ${full.length ? full[0].errors : '—'} · last: ${full.length ? full[full.length - 1].coverage : '—'}`,
  top.length ? `- **What failed most, over all runs**: ${top.map(([k, v]) => `${k} ${v}`).join(' · ')}` : '- **What failed**: nothing',
].filter(Boolean);

/* the components the chosen direction adds: markup from its web screen, CSS from its new.css */
const proposals = [];
const comps = (chosen && chosen.components) || [];
function elementWith(html, cls) {
  const m = new RegExp(`<(\\w+)\\b[^>]*class="[^"]*\\b${cls}(?![\\w-])[^"]*"[^>]*>`).exec(html);
  if (!m) return null;
  const re = new RegExp(`<${m[1]}\\b[^>]*>|</${m[1]}>`, 'gi');
  re.lastIndex = m.index;
  let depth = 0, x;
  while ((x = re.exec(html))) { if (x[0][1] !== '/') depth++; else if (--depth === 0) return html.slice(m.index, re.lastIndex); }
  return null;
}
if (comps.length) {
  const scr = (flow.screens || [])[0] || {};
  const webFile = scr.directions && scr.directions[flow.chosen] ? scr.directions[flow.chosen].web : null;
  const web = webFile && existsSync(join(DIR, webFile)) ? read(join(DIR, webFile)) : '';
  const cssFile = join(DIR, flow.chosen, 'new.css');
  const css = existsSync(cssFile) ? read(cssFile) : '';
  for (const c of comps) {
    const markup = elementWith(web, c.class);
    if (!markup) continue;
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    proposals.push({ slug, markup, meta: { component: slug, title: c.name, class: c.class, feature, direction: flow.chosen, date: flow.locked, status: 'proposed', why: c.why, based_on: c.based_on || null, css } });
  }
}

/* the retro file */
const OUT = join(DIR, 'qa', 'retro');
rmSync(OUT, { recursive: true, force: true });
const retroPath = `feedback/retros/${today}-${feature}.md`;
const body = [
  `# Retro — ${flow.title || feature}`, '',
  '*What it was like to design this with the skill, written when the design was locked. About the skill, not the product.*', '',
  '## What the QA measured', '', ...facts, '',
  ...(proposals.length ? ['## Proposed components', '', ...proposals.map((p) => `- **${p.meta.title}** (\`.${p.meta.class}\`): ${p.meta.why} — \`storybook/proposed/${feature}/${p.slug}.html\``), ''] : []),
  text.replace(/^#\s+.*\n+/, '').trim(), '',
].join('\n');
mkdirSync(join(OUT, 'feedback', 'retros'), { recursive: true });
writeFileSync(join(OUT, retroPath), body);
for (const p of proposals) {
  const d = join(OUT, 'storybook', 'proposed', feature);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, `${p.slug}.html`), p.markup + '\n');
  writeFileSync(join(d, `${p.slug}.json`), JSON.stringify(p.meta, null, 1) + '\n');
}
const files = [retroPath, ...proposals.flatMap((p) => [`storybook/proposed/${feature}/${p.slug}.html`, `storybook/proposed/${feature}/${p.slug}.json`])];
console.log(`  the retro: ${relative(process.cwd(), join(OUT, retroPath))}${proposals.length ? ` · ${proposals.length} proposed component(s)` : ''}`);
if (!PUSH) { console.log('  → assembled, not pushed (--no-push)'); process.exit(0); }

/* push: a branch on the skill's repo (or a fork of it) and a pull request */
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const can = (cmd, args) => { try { sh(cmd, args); return true; } catch { return false; } };
if (!can('git', ['--version']) || !can('gh', ['auth', 'status'])) {
  console.log(`  → not pushed: ${can('git', ['--version']) ? 'the GitHub CLI is not signed in here (gh auth login)' : 'git is not here'}.`);
  console.log(`    The files are in ${relative(process.cwd(), OUT)}/: send them to the skill's owner, or run this again where gh is signed in.`);
  process.exit(3);
}
const repo = (reg.source && reg.source.repo) || 'SheikhSaadShafiq/profolio-bayutksa-design-skill';
const me = sh('gh', ['api', 'user', '--jq', '.login']);
const canPush = sh('gh', ['api', `repos/${repo}`, '--jq', '.permissions.push']) === 'true';
let into = repo;
if (!canPush) { try { sh('gh', ['repo', 'fork', repo, '--clone=false']); } catch { /* already forked */ } into = `${me}/${repo.split('/')[1]}`; }
const work = mkdtempSync(join(tmpdir(), 'pf-retro-'));
try {
  sh('gh', ['repo', 'clone', into, work, '--', '--depth', '1']);
  const branch = `retro/${today}-${feature}`.replace(/[^\w./-]+/g, '-');
  sh('git', ['checkout', '-b', branch], { cwd: work });
  cpSync(OUT, work, { recursive: true });
  sh('git', ['add', ...files], { cwd: work });
  sh('git', ['-c', `user.name=${me}`, '-c', `user.email=${me}@users.noreply.github.com`, 'commit', '-m', `Retro: ${flow.title || feature} (${today})`], { cwd: work });
  sh('git', ['push', '-u', 'origin', branch], { cwd: work });
  const url = sh('gh', ['pr', 'create', '--repo', repo, '--base', 'main', '--head', `${into.split('/')[0]}:${branch}`, '--title', `Retro: ${flow.title || feature} (${today})`, '--body', `The retro of a locked design, written by the skill (qa/retro.mjs).\n\n${facts.join('\n')}\n\nFiles: ${files.map((f) => `\`${f}\``).join(', ')}`]);
  writeFileSync(join(DIR, 'qa', 'retro.json'), JSON.stringify({ pr: url, at: new Date().toISOString(), files }, null, 1) + '\n');
  console.log(`  → pushed: ${url}`);
} catch (e) {
  console.log(`  → not pushed: ${String(e.stderr || e.message).trim().split('\n')[0]}`);
  console.log(`    The files are in ${relative(process.cwd(), OUT)}/.`);
  process.exit(3);
} finally { rmSync(work, { recursive: true, force: true }); }
