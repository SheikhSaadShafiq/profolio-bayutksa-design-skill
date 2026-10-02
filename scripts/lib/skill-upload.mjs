/**
 * What claude.ai checks when a skill zip is uploaded, checked here first, so a
 * .skill it would refuse is never built (scripts/skill-file.mjs for the main
 * skill, scripts/design-skills.mjs for each design-* skill).
 *
 * Documented (claude.com/docs/skills/how-to, the Agent Skills specification):
 *   - the zip holds one folder, named as SKILL.md's `name`, with SKILL.md in it;
 *   - `name`: lowercase letters, digits and hyphens, at most 64 characters, and
 *     neither "anthropic" nor "claude";
 *   - `description`: 1 to 1,024 characters, no XML tags.
 * Found by uploading (2026-10):
 *   - at most 200 entries, folders included: "Zip contains too many files
 *     (maximum 200)";
 *   - no zip inside it, whatever its name (.zip, .skill, .jar, an Office file):
 *     "Zip cannot contain nested zip files".
 *
 *   checkSkillZip(file) -> { entries, problems: [..], warnings: [..], biggest }
 */
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

export const LIMIT = 200;
export const WARN = 150;

const READ = `
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
rows, skill = [], {}
for i in z.infolist():
    link = (i.external_attr >> 16) & 0o170000 == 0o120000
    head = b'' if i.is_dir() else z.open(i).read(4)
    rows.append([i.filename, i.is_dir(), head.hex(), link])
    if i.filename.count('/') == 1 and i.filename.endswith('/SKILL.md'):
        skill[i.filename] = z.read(i).decode('utf-8', 'replace')
print(json.dumps({'rows': rows, 'skill': skill}))
`;

const front = (md) => {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const get = (k) => { const x = m[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return x ? x[1].trim().replace(/^(["'])([\s\S]*)\1$/, '$2') : null; };
  return { name: get('name'), description: get('description') };
};

export function checkSkillZip(file) {
  const { rows, skill } = JSON.parse(execFileSync('python3', ['-c', READ, file], { maxBuffer: 64 << 20 }).toString());
  const problems = [], warnings = [];
  const tops = [...new Set(rows.map(([n]) => n.split('/')[0]))];
  if (tops.length !== 1 || rows.some(([n, dir]) => !dir && !n.includes('/'))) problems.push(`the zip must hold one folder; it holds ${tops.slice(0, 4).join(', ')}`);
  const top = tops[0];
  const md = skill[`${top}/SKILL.md`];
  const f = md && front(md);
  if (!md) problems.push(`no ${top}/SKILL.md`);
  else if (!f) problems.push('SKILL.md has no frontmatter');
  else {
    if (!/^[a-z0-9-]{1,64}$/.test(f.name || '')) problems.push(`name "${f.name}" — lowercase letters, digits and hyphens, at most 64`);
    if (f.name !== top) problems.push(`name "${f.name}" is not the folder's, ${top}`);
    if (/anthropic|claude/.test(f.name || '')) problems.push(`name "${f.name}" uses a reserved word`);
    const d = f.description || '';
    if (!d || d.length > 1024) problems.push(`description is ${d.length} characters (1 to 1,024)`);
    if (/<\/?[A-Za-z][^>]*>/.test(d)) problems.push('description holds an XML tag');
  }
  const zips = rows.filter(([n, dir, head]) => !dir && (/^504b(0304|0506|0708)/.test(head) || /\.(zip|skill|jar)$/i.test(n))).map(([n]) => n);
  if (zips.length) problems.push(`a zip inside the zip — claude.ai refuses it: ${zips.slice(0, 4).join(', ')}${zips.length > 4 ? ` +${zips.length - 4}` : ''}`);
  const links = rows.filter(([, , , link]) => link).map(([n]) => n);
  if (links.length) problems.push(`symbolic links: ${links.slice(0, 4).join(', ')}`);
  const by = {};
  for (const [n, dir] of rows) if (!dir) { const d = dirname(n.slice(top.length + 1)); by[d] = (by[d] || 0) + 1; }
  const biggest = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, n]) => `${d === '.' ? '(top)' : d} ${n}`).join(' · ');
  if (rows.length > LIMIT) problems.push(`${rows.length} entries, folders included — claude.ai takes ${LIMIT} at most. Biggest: ${biggest}`);
  else if (rows.length > WARN) warnings.push(`${rows.length} of claude.ai's ${LIMIT} entries — make what grows one file before it reaches ${LIMIT}. Biggest: ${biggest}`);
  return { entries: rows.length, problems, warnings, biggest };
}
