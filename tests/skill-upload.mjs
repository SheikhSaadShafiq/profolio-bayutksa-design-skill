#!/usr/bin/env node
/**
 * scripts/lib/skill-upload.mjs refuses what claude.ai refuses on upload: one zip
 * per rule, made here, and one that passes.
 *
 *   node tests/skill-upload.mjs
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { checkSkillZip } from '../scripts/lib/skill-upload.mjs';

const TMP = mkdtempSync(join(tmpdir(), 'skill-upload-'));
/* a zip from { path: text }; a value of null is a folder entry, a Buffer is written as is */
const MAKE = `
import json, sys, zipfile, base64
spec = json.load(sys.stdin)
with zipfile.ZipFile(sys.argv[1], 'w') as z:
    for name, body in spec.items():
        if body is None: z.writestr(zipfile.ZipInfo(name), b'')
        elif body.startswith('b64:'): z.writestr(name, base64.b64decode(body[4:]))
        else: z.writestr(name, body)
`;
const zip = (name, spec) => { const f = join(TMP, name); execFileSync('python3', ['-c', MAKE, f], { input: JSON.stringify(spec) }); return f; };
const skill = (name, desc = 'Checks a thing when asked.') => `---\nname: ${name}\ndescription: ${desc}\n---\n\n# ${name}\n`;
const inner = execFileSync('python3', ['-c', 'import io, zipfile, base64; b = io.BytesIO(); zipfile.ZipFile(b, "w").writestr("a.txt", "a"); print(base64.b64encode(b.getvalue()).decode())']).toString().trim();

let failed = 0;
const expect = (ok, what) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const refused = (file, word) => checkSkillZip(file).problems.some((p) => p.includes(word));

const good = checkSkillZip(zip('good.skill', { 'my-skill/': null, 'my-skill/SKILL.md': skill('my-skill'), 'my-skill/scripts/run.py': 'print(1)' }));
expect(!good.problems.length && good.entries === 3, 'a well-formed skill passes, folder entries counted (3 entries)');

const many = {}; for (let i = 0; i < 200; i++) many[`my-skill/references/r${i}.md`] = 'x';
expect(refused(zip('many.skill', { 'my-skill/SKILL.md': skill('my-skill'), ...many }), '201 entries'), '201 entries are refused (claude.ai: "too many files (maximum 200)")');
const near = {}; for (let i = 0; i < 160; i++) near[`my-skill/references/r${i}.md`] = 'x';
expect(checkSkillZip(zip('near.skill', { 'my-skill/SKILL.md': skill('my-skill'), ...near })).warnings.length === 1, '161 entries pass, with a warning');

expect(refused(zip('nested.skill', { 'my-skill/SKILL.md': skill('my-skill'), 'my-skill/skills/all.zip': `b64:${inner}` }), 'zip inside'), 'a .zip inside is refused (claude.ai: "cannot contain nested zip files")');
expect(refused(zip('hidden.skill', { 'my-skill/SKILL.md': skill('my-skill'), 'my-skill/assets/data.bin': `b64:${inner}` }), 'zip inside'), 'a zip under another name is refused too');
expect(refused(zip('rename.skill', { 'my-skill/SKILL.md': skill('other-skill') }), 'not the folder'), 'a name that is not the folder\'s is refused');
expect(refused(zip('upper.skill', { 'My-Skill/SKILL.md': skill('My-Skill') }), 'lowercase'), 'an uppercase name is refused');
expect(refused(zip('reserved.skill', { 'claude-helper/SKILL.md': skill('claude-helper') }), 'reserved'), 'a reserved word in the name is refused');
expect(refused(zip('long.skill', { 'my-skill/SKILL.md': skill('my-skill', 'x'.repeat(1025)) }), '1,024'), 'a description over 1,024 characters is refused');
expect(refused(zip('tag.skill', { 'my-skill/SKILL.md': skill('my-skill', 'Use <b>this</b> skill.') }), 'XML tag'), 'an XML tag in the description is refused');
expect(refused(zip('flat.skill', { 'SKILL.md': skill('my-skill') }), 'one folder'), 'SKILL.md at the zip\'s root is refused');

rmSync(TMP, { recursive: true, force: true });
console.log(failed ? `\n  ${failed} failed` : '\n  the upload checks refuse what claude.ai refuses');
process.exit(failed ? 1 : 0);
