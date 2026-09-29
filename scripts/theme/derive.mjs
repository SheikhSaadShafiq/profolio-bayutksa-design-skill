/**
 * Screens neither build draws — composed inside the build, from its own data.
 *
 * The designer's decision (2026-09-29): derive them from the spec now, tagged
 * [derived], and replace them when the handover draws them.
 *
 * Mark as Booked (spec 03 · J; the phone's row menu) has its logic in both
 * builds — kinds, calendar cells with their colours, hint, summary, confirm
 * label and state (renderVals: bookKinds, bookCells, weekDays,
 * bookMonthLabel, selHint / selSummary or bookHint, confirmLabel,
 * confirmBg / confirmOpacity) — but no template. So the Request Services
 * modal (web) or sheet (phone) is opened for the daily rental, and its title,
 * body and primary button are rewritten from those values, laid out as the
 * spec's element table says: the kind as a two-way segmented control, the
 * month with prev and next, past days muted, booked nights green, blocked
 * nights grey, the selection's ends green and its middle tinted, the hint,
 * and a footer of Cancel and the confirm label. The only things composed are
 * the arrangement and the chevrons; every colour, word and date is the
 * build's.
 *
 * Each export is code for page.evaluate — capture.mjs runs it in the state's
 * scope after the build state is set, and it returns 'ok' or what is missing.
 */
export const BOOKING = (device) => `(() => {
  const b = window.__pfBuild;
  const scope = document.querySelector('[data-pf-scope]');
  const label = ${JSON.stringify(device === 'web' ? 'Request Services modal' : 'Request Services sheet')};
  const box = [...scope.querySelectorAll('[data-screen-label]')].find((e) => e.getAttribute('data-screen-label') === label);
  if (!box) return 'no ' + label;
  const v = b.renderVals();
  if (!v.bookCells || !v.bookKinds) return 'no booking values';
  const kids = [...box.children];
  const [head, body, foot] = ${device === 'web' ? 'kids' : 'kids.slice(1)'};
  const title = [...head.querySelectorAll('div')].find((e) => (e.textContent || '').trim() === 'Request Services');
  if (!title || !body || !foot) return 'no chrome';
  const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
  const font = 'font-family: Figtree, sans-serif;';
  /* templates from the chrome itself, taken before the body is cleared */
  const pillRow = body.children[0] && body.children[0].children[1];
  const noteRow = body.children[3] && body.children[3].lastElementChild;
  if (!pillRow || !noteRow) return 'no templates';
  title.textContent = 'Mark as Booked';
  body.innerHTML = '';
  /* the kind: a two-way segmented control, the service pills' shape */
  const kinds = pillRow.cloneNode(false);
  const pillTpl = pillRow.children[0];
  for (const k of v.bookKinds) {
    const p = pillTpl.cloneNode(true);
    const icon = [...p.children].find((c) => c.querySelector('svg'));
    if (icon) icon.remove();
    const text = p.lastElementChild;
    text.textContent = k.label;
    p.style.background = k.bg;
    p.style.outline = '1px solid ' + k.outline;
    p.style.outlineOffset = '-1px';
    p.style.justifyContent = 'center';
    text.style.color = k.color;
    text.style.fontWeight = k.weight;
    kinds.appendChild(p);
  }
  body.appendChild(kinds);
  /* the month: prev, its name, next */
  const cal = el('div', 'align-self: stretch; display: flex; flex-direction: column; gap: 12px;');
  const chev = (dir, opacity) => { const btn = el('div', 'width: ${device === 'web' ? 28 : 32}px; height: ${device === 'web' ? 28 : 32}px; border-radius: 8px; outline: 1px solid #E6E6E6; outline-offset: -1px; display: flex; align-items: center; justify-content: center; opacity: ' + opacity + ';'); btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="' + (dir < 0 ? 'M7.5 2.5 4 6l3.5 3.5' : 'M4.5 2.5 8 6 4.5 9.5') + '" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'; return btn; };
  const month = el('div', 'display: flex; align-items: center; justify-content: space-between;');
  month.appendChild(chev(-1, v.bookPrevOpacity || '1'));
  month.appendChild(el('div', font + 'font-size: 15px; font-weight: 600; line-height: 22px; color: #222222;', v.bookMonthLabel));
  month.appendChild(chev(1, '1'));
  cal.appendChild(month);
  const week = el('div', 'display: grid; grid-template-columns: repeat(7, 1fr);');
  for (const w of v.weekDays) week.appendChild(el('div', font + 'text-align: center; font-size: 11px; font-weight: 500; line-height: 16px; color: #9D9D9D;', w.d));
  cal.appendChild(week);
  /* the days: each cell as the build colours it; a run of one colour is one band, its ends rounded */
  const grid = el('div', 'display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 4px;');
  const cells = v.bookCells;
  const filled = (c) => c && c.label && c.bg && c.bg !== 'transparent';
  const band = (a, c) => filled(a) && filled(c) && (a.bg === c.bg || [a.bg, c.bg].every((x) => x === '#28B16D' || x === '#F0FAF5'));
  cells.forEach((c, i) => {
    const col = i % 7;
    const d = el('div', font + 'height: 40px; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 20px;');
    if (c.label) {
      d.textContent = c.label;
      d.style.color = c.color;
      d.style.fontWeight = c.weight || '400';
      if (filled(c)) {
        d.style.background = c.bg;
        const joinL = col > 0 && band(cells[i - 1], c), joinR = col < 6 && band(cells[i + 1], c);
        const end = c.bg === '#28B16D';
        d.style.borderRadius = end ? '8px' : (joinL ? '0' : '8px') + ' ' + (joinR ? '0' : '8px') + ' ' + (joinR ? '0' : '8px') + ' ' + (joinL ? '0' : '8px');
      }
    }
    grid.appendChild(d);
  });
  cal.appendChild(grid);
  body.appendChild(cal);
  /* the hint, in the chrome's note row */
  const note = noteRow.cloneNode(true);
  const words = [...note.querySelectorAll('span, div')].reverse().find((e) => e.children.length === 0 && (e.textContent || '').trim());
  const hint = ${device === 'web' ? '(v.hasSel ? v.selSummary : v.selHint)' : 'v.bookHint'};
  if (words) words.textContent = hint;
  body.appendChild(note);
  /* the footer: Cancel, and the confirm label */
  const primary = foot.lastElementChild;
  const primaryText = [...primary.querySelectorAll('span, div')].find((e) => e.children.length === 0) || primary;
  primaryText.textContent = v.confirmLabel;
  ${device === 'web'
    ? `primary.style.background = v.confirmBg; if (!v.hasSel) primary.style.boxShadow = 'none';`
    : `primary.style.opacity = v.confirmOpacity || '1';`}
  box.setAttribute('data-screen-label', ${JSON.stringify(device === 'web' ? 'Mark as Booked modal' : 'Mark as Booked sheet')});
  box.setAttribute('data-pf-derived', 'Mark as Booked');
  return 'ok';
})()`;

export const BOOKING_SOURCE = (device) => `derived: neither build draws Mark as Booked (spec 03 · J${device === 'web' ? '' : '; the phone row menu'}). Composed in the ${device === 'web' ? 'Request Services modal' : 'Request Services sheet'}'s chrome from the build's own booking values (renderVals: bookKinds, bookCells, weekDays, bookMonthLabel, ${device === 'web' ? 'selHint / selSummary, confirmLabel, confirmBg' : 'bookHint, confirmLabel, confirmOpacity'}); laid out per the spec's element table. Replace when the handover draws it.`;
