#!/usr/bin/env node
/**
 * Read registry.json in slices. The whole file is 310 KB (about 80k tokens), so never read it
 * whole: ask for the part a task needs.
 *
 *   node qa/registry.mjs pages                  every page: id · route · title · theme · aliases
 *   node qa/registry.mjs page <id|route|alias>  one page: files, roles, flags, states, labels, components
 *   node qa/registry.mjs components [level]     every component: id · level · anatomy · how many pages
 *   node qa/registry.mjs component <id|class>   one component, whole
 *   node qa/registry.mjs uses <component>       the pages and states that draw it (used_on, used_in_states)
 *   node qa/registry.mjs class <name>           who owns a class: a component, a utility, or nobody
 *   node qa/registry.mjs utilities [prefix]     the utility classes (mb-, fz-, …)
 *   node qa/registry.mjs shell | flows [name] | clock | themes | source | runtime
 *
 * --json prints the slice as JSON instead of text.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const reg = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8'));
const args = process.argv.slice(2).filter((a) => a !== '--json');
const JSON_OUT = process.argv.includes('--json');
const [what, ...rest] = args;
const q = rest.join(' ').trim();
const out = (text, data) => { console.log(JSON_OUT ? JSON.stringify(data, null, 1) : text); };
const list = (xs) => (xs && xs.length ? xs.join(', ') : '—');
const die = (msg) => { console.error(`  ${msg}`); process.exit(2); };

const norm = (s) => String(s || '').toLowerCase().replace(/^\/+|\/+$/g, '');
const findPage = (key) => {
  const k = norm(key);
  const pages = reg.pages;
  if (pages[key]) return [key, pages[key]];
  for (const [id, p] of Object.entries(pages)) if (norm(p.route) === k || norm(p.title) === k || (p.aliases || []).some((a) => norm(a) === k)) return [id, p];
  for (const [id, p] of Object.entries(pages)) if ((p.aliases || []).some((a) => norm(a).includes(k)) || norm(p.title).includes(k)) return [id, p];
  return null;
};
const findComponent = (key) => {
  const c = reg.components;
  if (c[key]) return [key, c[key]];
  for (const [id, v] of Object.entries(c)) if ((v.classes || []).includes(key)) return [id, v];
  const k = norm(key);
  for (const [id, v] of Object.entries(c)) if (norm(id).includes(k)) return [id, v];
  return null;
};
/* states grouped by where they exist: both layouts, web only (@web), phone only (@375 / @360) */
const groupStates = (states) => {
  const g = { both: [], web: [], phone: [] };
  for (const s of states || []) {
    const [id, at] = s.split('@');
    (at === 'web' ? g.web : at ? g.phone : g.both).push(id);
  }
  return g;
};

switch (what) {
  case 'pages': {
    const rows = Object.entries(reg.pages).map(([id, p]) => ({ id, route: p.route, title: p.title, theme: p.theme || 'current', aliases: p.aliases || [] }));
    out(rows.map((r) => `${r.id} · ${r.route} · ${r.title}${r.theme !== 'current' ? ` · theme ${r.theme}` : ''} · ${list(r.aliases)}`).join('\n'), rows);
    break;
  }
  case 'page': {
    const hit = findPage(q) || die(`no page "${q}" — node qa/registry.mjs pages`);
    const [id, p] = hit;
    const st = groupStates(p.states);
    const text = [
      `${id} · ${p.route} · ${p.title}${p.theme ? ` · theme ${p.theme}` : ''}${p.status ? ` · ${p.status}` : ''}`,
      `files: ${p.file}${p.mobile ? ` · ${p.mobile}` : ''} (not in the .skill: python3 qa/fetch.py ${id} [<state>…] [--375])`,
      `aliases: ${list(p.aliases)}`,
      `roles: ${list(p.roles)}${p.state_roles ? ` · state roles: ${JSON.stringify(p.state_roles)}` : ''}`,
      `flags: ${list(p.flags)}`,
      `states, both layouts (${st.both.length}): ${list(st.both)}`,
      `states, web only (${st.web.length}): ${list(st.web)}`,
      `states, phone only (${st.phone.length}): ${list(st.phone)}`,
      `organisms: ${list(p.organisms)}`,
      `molecules: ${list(p.molecules)}`,
      `atoms: ${list(p.atoms)}`,
      p.labels ? `labels (what it shows; ‹…› is data): ${JSON.stringify(p.labels)}` : '',
      p.notes ? `notes: ${typeof p.notes === 'string' ? p.notes : JSON.stringify(p.notes)}` : '',
      p.derived ? `derived (composed, not drawn by the build): ${JSON.stringify(p.derived)}` : '',
      p.spec ? `spec: ${JSON.stringify(p.spec)}` : '',
      `source: ${list([].concat(p.source || []))}`,
      `component detail: node qa/registry.mjs component <id>`,
    ].filter(Boolean).join('\n');
    out(text, { id, ...p });
    break;
  }
  case 'components': {
    const rows = Object.entries(reg.components).filter(([, v]) => !q || v.level === q.replace(/s$/, '')).map(([id, v]) => ({ id, level: v.level, anatomy: v.anatomy || '', pages: (v.used_on || []).length, file: v.file }));
    out(rows.map((r) => `${r.id} · ${r.level} · ${r.pages} page(s)${r.anatomy ? ` · ${r.anatomy}` : ''}`).join('\n'), rows);
    break;
  }
  case 'component': {
    const hit = findComponent(q) || die(`no component "${q}" — node qa/registry.mjs components`);
    const [id, v] = hit;
    out(`${id}\n` + Object.entries(v).map(([k, x]) => `${k}: ${Array.isArray(x) ? list(x) : typeof x === 'object' ? JSON.stringify(x) : x}`).join('\n'), { id, ...v });
    break;
  }
  case 'uses': {
    const hit = findComponent(q) || die(`no component "${q}"`);
    const [id, v] = hit;
    out(`${id}\nused_on: ${list(v.used_on)}\nused_in_states: ${list(v.used_in_states)}\npart_of: ${list(v.part_of)}`, { id, used_on: v.used_on, used_in_states: v.used_in_states, part_of: v.part_of });
    break;
  }
  case 'class': {
    const owners = Object.entries(reg.components).filter(([, v]) => (v.classes || []).includes(q)).map(([id]) => id);
    const utility = (reg.utilities || []).includes(q);
    const text = owners.length ? `${q}: component ${owners.join(', ')}` : utility ? `${q}: a utility class` : `${q}: not in registry.json — not a class to use`;
    out(text, { class: q, components: owners, utility });
    break;
  }
  case 'utilities': {
    const rows = (reg.utilities || []).filter((u) => !q || u.startsWith(q));
    out(rows.join(' '), rows);
    break;
  }
  case 'shell': out(`components: ${list(reg.shell.components)}\nflags: ${list(reg.shell.flags)}`, reg.shell); break;
  case 'flows': {
    const flows = q ? { [q]: reg.flows[q] || die(`no flow "${q}" — ${Object.keys(reg.flows).join(', ')}`) } : reg.flows;
    out(Object.entries(flows).map(([k, steps]) => `${k}:\n` + steps.map((s, i) => `  ${i + 1}. ${s.id} — ${s.heading || '(no heading)'}${s.primary ? ` → ${s.primary}` : ''}${s.toast ? ` · toast "${s.toast}"` : ''}`).join('\n')).join('\n'), flows);
    break;
  }
  case 'clock': out(JSON.stringify(reg.clock), reg.clock); break;
  case 'themes': out(JSON.stringify(reg.themes, null, 1), reg.themes); break;
  case 'source': out(JSON.stringify(reg.source, null, 1), reg.source); break;
  case 'runtime': out(`runtime_geometry: ${list(reg.runtime_geometry)}`, reg.runtime_geometry); break;
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ''));
    process.exit(what ? 2 : 0);
}
