/**
 * The Foundations section — typefaces, colour, type and corners as a person
 * sees them, built by scripts/ds/tokens.mjs.
 *
 * Every value here is one the product paints (data/ds/painted.json, read off
 * the compiled pages by scripts/ds/painted.mjs) or declares
 * (deliverables/profolio.css), and every name is the product's own
 * (src/theme/index.js themeColors) or antd's (data/antd-tokens.json). What
 * this adds is ORDER: the theme's greys as one ramp, its teals as another,
 * each status colour with the states antd derives from it; the sizes the
 * text is drawn at as a scale, with the product's own words as samples; the
 * corners as a scale from the smallest radius to the pill.
 *
 * The typefaces are the two the product's stack names — Figtree and Droid
 * Arabic Kufi (antd fontFamily: Figtree, "Droid Arabic Kufi", sans-serif).
 * A colour the product paints but names nowhere is not a foundation, and is
 * left out.
 */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* a token name breaks at its camelCase joints, not mid-word */
const wbr = (s) => esc(s).replace(/([a-z])([A-Z0-9])/g, '$1<wbr>$2');
const share = (n, total) => { const p = (100 * n) / (total || 1); return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`; };

/* ── colour ─────────────────────────────────────────────────────────── */
/* each row: the theme's or antd's names (antd's all start with "color"),
   in the order a designer reads them; `sort: 'lum'` orders light → dark */
const PALETTES = [
  { title: 'Brand', note: 'The product’s teal, from its theme, lightest to darkest — and the hover, active, border and fill steps antd derives from it for buttons, links, selects and tabs.', rows: [
    { label: 'Primary', names: ['primaryLight', 'primaryLight4', 'primaryLight3', 'primaryLight2', 'primaryLight1', 'primaryColor'], key: 'primaryColor', sort: 'lum' },
    { label: 'Primary — states', names: ['colorPrimaryBg', 'colorPrimaryBgHover', 'colorPrimaryBorder', 'colorPrimaryBorderHover', 'colorPrimaryHover', 'colorPrimaryActive'], sort: 'lum' },
    { label: 'Secondary', names: ['secondaryColor'] },
  ] },
  { title: 'Greys', note: 'The theme’s neutral greys (gray100–gray900) and its cool, blue-leaning greys, light to dark; then the text and line colours antd paints with.', rows: [
    { label: 'Neutral', names: ['whiteColor', 'gray200', 'gray100', 'gray300', 'gray400', 'colorBorder', 'gray500', 'grayLightestColor', 'gray550', 'gray600', 'gray700', 'gray800', 'gray900', 'baseColor'], sort: 'lum' },
    { label: 'Cool', names: ['bgGrayColorLight', 'bgGrayColorNormal', 'borderColorLight', 'bgGrayColorDeep', 'borderColorDeep', 'extraLightColor', 'lightGrayColor', 'grayColor', 'grayHover', 'darkColor', 'darkHover'], sort: 'lum' },
    { label: 'Text', names: ['colorText', 'colorTextSecondary', 'colorTextTertiary', 'colorTextDisabled'], text: true },
    { label: 'Lines and fills', names: ['colorSplit', 'colorFillQuaternary', 'colorFillTertiary', 'colorFillSecondary', 'colorFill', 'colorBgMask'] },
  ] },
  { title: 'Status', note: 'Each status colour as the theme names it, with antd’s background, border, hover and active steps around it — the steps an alert, a tag, a badge and a form error paint with.', rows: [
    { label: 'Success', names: ['colorSuccessBg', 'colorSuccessBgHover', 'colorSuccessBorder', 'colorSuccessBorderHover', 'successColor', 'successHover', 'colorSuccessActive'] },
    { label: 'Warning', names: ['colorWarningBg', 'colorWarningBgHover', 'colorWarningBorder', 'colorWarningBorderHover', 'warningColor', 'warningHover', 'colorWarningActive'] },
    { label: 'Error', names: ['colorErrorBg', 'colorErrorBgHover', 'colorErrorBorder', 'colorErrorBorderHover', 'dangerColor', 'colorErrorHover', 'errorHover', 'colorErrorActive'] },
    { label: 'Info', names: ['colorInfoBg', 'colorInfoBgHover', 'colorInfoBorder', 'colorInfoBorderHover', 'infoColor', 'infoColorAlt', 'infoHover', 'colorInfoActive'] },
    { label: 'Link', names: ['colorLinkHover', 'linkColor', 'linkHover', 'colorLinkActive'] },
  ] },
  { title: 'Other', note: 'The theme’s remaining colours that the product paints.', rows: [
    { label: 'Listing health', names: ['healthColorGood', 'healthColorAvg', 'healthColorLow', 'healthColorDefault'] },
    { label: 'Elsewhere', names: ['sliderRailColor', 'dubizzlePrimary'] },
  ] },
];

export function foundations({ norm, key, themeColors, antd, colourList, painted, arabic, rest }) {
  const tok = antd.token;
  const declared = new Map(colourList.map((c) => [c.value, c.count]));
  const paintedUses = new Map();
  for (const c of (painted && painted.colours) || []) { const o = norm(c.value); if (o) paintedUses.set(key(o), (paintedUses.get(key(o)) || 0) + c.uses); }
  /* relative luminance over white, for light → dark order */
  const lum = (o) => { const ch = (v) => { v = (o.a * v + (1 - o.a) * 255) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * ch(o.r) + 0.7152 * ch(o.g) + 0.0722 * ch(o.b); };
  const themeNamesOf = new Map();
  for (const [n, v] of Object.entries(themeColors)) { const o = norm(v); if (o) (themeNamesOf.get(key(o)) || themeNamesOf.set(key(o), []).get(key(o))).push(n); }
  const entry = (name) => {
    const source = /^color[A-Z]/.test(name) ? 'antd' : 'theme';
    const v = source === 'antd' ? tok[name] : themeColors[name];
    const o = typeof v === 'string' ? norm(v) : null;
    if (!o) return null;
    const k = key(o);
    return { name, source, value: k, o, uses: paintedUses.get(k) || 0, decl: declared.get(k) || 0, lum: lum(o), also: (themeNamesOf.get(k) || []).filter((x) => x !== name) };
  };
  const palettes = PALETTES.map((p) => ({ ...p, rows: p.rows.map((r) => {
    let list = r.names.map(entry).filter((e) => e && (e.uses > 0 || e.decl > 0));
    const seen = new Set(); list = list.filter((e) => (seen.has(e.value) ? false : seen.add(e.value)));
    if (r.sort === 'lum') list.sort((a, b) => b.lum - a.lum);
    return { ...r, list };
  }).filter((r) => r.list.length) })).filter((p) => p.rows.length);
  const hexOf = (e) => (e.o.a === 1 ? e.value.toUpperCase() : e.value);
  const chip = (e, r) => `<figure class="ds-chip${r.key === e.name ? ' ds-chip--key' : ''}${r.text ? ' ds-chip--text' : ''}${e.lum > 0.9 ? ' ds-chip--pale' : ''}" title="${esc(e.name)} · ${esc(e.value)}">${r.text ? `<i style="color:${e.value}">Aa</i>` : `<i style="background:${e.value}"></i>`}<figcaption><b>${wbr(e.name)}</b><code>${esc(hexOf(e))}</code><span>${e.uses ? plural(e.uses, 'use') : `${plural(e.decl, 'rule')}`}${e.source === 'antd' ? ' · antd' : ''}</span>${e.also.length ? `<em>= ${e.also.slice(0, 3).map(wbr).join(', ')}</em>` : ''}</figcaption></figure>`;
  const colourHtml = palettes.map((p) => `<div class="ds-palette"><h4>${esc(p.title)}</h4><p class="ds-note">${esc(p.note)}</p>${p.rows.map((r) => `<div class="ds-ramp"><div class="ds-ramp-label">${esc(r.label)}</div><div class="ds-ramp-row">${r.list.map((e) => chip(e, r)).join('')}</div></div>`).join('')}</div>`).join('');

  /* ── type ─────────────────────────────────────────────────────────── */
  /* a weight caught mid-transition (a tab animates 400 → 600) is read as the
     hundred it is passing */
  const text = ((painted && painted.text) || []).filter((t) => t.family === 'Figtree' && typeof t.size === 'number' && t.size >= 8)
    .map((t) => ({ ...t, weight: typeof t.weight === 'number' ? Math.round(t.weight / 100) * 100 : t.weight }));
  const total = text.reduce((a, t) => a + t.uses, 0);
  const famUses = new Map(((painted && painted.families) || []).map(([f, n]) => [f, n]));
  const famTotal = [...famUses.values()].reduce((a, b) => a + b, 0) || 1;
  const WEIGHT = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
  const SIZE_TOKENS = {};
  for (const k of ['fontSizeHeading1', 'fontSizeHeading2', 'fontSizeHeading3', 'fontSizeHeading4', 'fontSizeHeading5', 'fontSizeXL', 'fontSizeLG', 'fontSize', 'fontSizeSM']) if (typeof tok[k] === 'number') (SIZE_TOKENS[tok[k]] ||= []).push(k);
  const lhOf = (t) => (typeof t.lh === 'number' ? Math.round(t.lh * 10) / 10 : null);
  const readable = (w) => {
    const fit = w.filter((x) => x.length <= 34);
    const words = fit.filter((x) => !/^[\d\s.,:%+-]+$/.test(x));
    const long = words.filter((x) => x.length >= 4);
    return long.length ? long : words.length ? words : fit;
  };
  /* by size: its line height, its weights, a sample */
  const bySize = new Map();
  for (const t of text) { const s = bySize.get(t.size) || bySize.set(t.size, { size: t.size, uses: 0, weights: new Map(), lh: new Map(), styles: [] }).get(t.size); s.uses += t.uses; s.weights.set(t.weight, (s.weights.get(t.weight) || 0) + t.uses); if (lhOf(t)) s.lh.set(lhOf(t), (s.lh.get(lhOf(t)) || 0) + t.uses); s.styles.push(t); }
  const scale = [...bySize.values()].sort((a, b) => b.size - a.size).map((s) => {
    const weights = [...s.weights.entries()].sort((a, b) => b[1] - a[1]);
    const lh = [...s.lh.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const lead = s.styles.filter((t) => t.weight === weights[0][0]).sort((a, b) => b.uses - a.uses)[0];
    const words = readable(lead.words).slice(0, 3);
    return { size: s.size, lh, weights, uses: s.uses, tokens: SIZE_TOKENS[s.size] || [], sample: words.join(' · '), weight: weights[0][0], whole: Number.isInteger(s.size) };
  });
  /* a step of the scale is a whole size drawn five times or more; a size set
     in em, or scaled down by the listing preview, comes out fractional (15.98,
     14.55) — drawn, but between the steps */
  const between = scale.filter((s) => !s.whole);
  const rare = scale.filter((s) => s.whole && s.uses < 5);
  scale.splice(0, scale.length, ...scale.filter((s) => s.whole && s.uses >= 5));
  const scaleHtml = `<div class="ds-typescale">${scale.map((s) => `<div class="ds-ts-row"><div class="ds-ts-spec"><b>${s.size}</b><span>${s.lh ? `/ ${s.lh}` : ''}</span>${s.lh ? `<small>${(s.lh / s.size).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}</small>` : ''}${s.tokens.length ? `<code>${esc(s.tokens.join(' · '))}</code>` : ''}</div><div class="ds-ts-sample" style="font-family:Figtree,sans-serif;font-size:${s.size}px;${s.lh ? `line-height:${s.lh}px;` : ''}font-weight:${s.weight}">${esc(s.sample)}</div><div class="ds-ts-weights">${s.weights.slice(0, 5).map(([w, n]) => `<span style="font-weight:${w}">${w}<small>${n}</small></span>`).join('')}</div><div class="ds-ts-uses">${share(s.uses, total)}</div></div>`).join('')}</div>${rare.length || between.length ? `<p class="ds-note">${rare.length ? `Rarely, at ${rare.map((s) => `<b>${s.size}px</b>${s.sample ? ` (${esc(s.sample.split(' · ')[0])})` : ''}`).join(', ')}. ` : ''}${between.length ? `And at ${between.length} fractional sizes between ${Math.min(...between.map((s) => s.size))} and ${Math.max(...between.map((s) => s.size))}px — text set in em, or scaled down by the listing preview (${esc([...new Set(between.map((s) => s.sample.split(' · ')[0]))].slice(0, 3).join(', '))}).` : ''}</p>` : ''}`;
  const weightUses = new Map();
  for (const t of text) weightUses.set(+t.weight, (weightUses.get(+t.weight) || 0) + t.uses);
  const weights = [...weightUses.entries()].filter(([w]) => WEIGHT[w]).sort((a, b) => a[0] - b[0]);
  const weightsHtml = `<div class="ds-weights">${weights.map(([w, n]) => `<figure><i style="font-weight:${w}">Ag</i><figcaption><b>${w}</b><span>${WEIGHT[w]}</span><small>${share(n, total)} of text</small></figcaption></figure>`).join('')}</div>`;
  /* the combined styles the product paints most, as specimens */
  const who = (c) => c.replace(/^pf-/, '').replace(/--[\w]+$/, '').replace(/-styled$/, '').replace(/^btn$/, 'button').replace(/-/g, ' ');
  const styles = text.filter((t) => lhOf(t)).sort((a, b) => b.uses - a.uses).slice(0, 12);
  const stylesHtml = `<div class="ds-styles">${styles.map((t) => { const words = readable(t.words); return `<div class="ds-style"><div class="ds-style-sample" style="font-family:Figtree,sans-serif;font-size:${t.size}px;line-height:${lhOf(t)}px;font-weight:${t.weight}">${esc(words.slice(0, 2).join(' · ') || 'Profolio')}</div><div class="ds-style-meta"><b>${t.size} / ${lhOf(t)} · ${t.weight}</b><span>${esc(WEIGHT[t.weight] || '')}</span><span>${plural(t.uses, 'use')}</span><span>${esc([...new Set(t.who.map(([c]) => who(c)))].slice(0, 3).join(', '))}</span></div></div>`; }).join('')}</div>`;
  const figtreeShare = Math.round((1000 * (famUses.get('Figtree') || 0)) / famTotal) / 10;
  const faceWeights = weights.map(([w]) => w);
  const facesHtml = `<div class="ds-faces">
<figure class="ds-face"><div class="ds-face-art">Aa</div><figcaption><h4>Figtree</h4><p>Latin · variable, 300–900 · upright${famUses.size ? ` · ${figtreeShare}% of the text the product draws` : ''}</p>
<div class="ds-face-line">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · 1,250,000 · 64 Sq. M.</div>
<div class="ds-face-weights">${(faceWeights.length ? faceWeights : [300, 400, 500, 600, 700, 800]).map((w) => `<span style="font-weight:${w}">${w}</span>`).join('')}</div></figcaption></figure>
<figure class="ds-face ds-face--ar"><div class="ds-face-art" lang="ar" dir="rtl">أب</div><figcaption><h4>Droid Arabic Kufi</h4><p>Arabic · 400 · every Arabic glyph — Figtree has none, so the stack falls through to it</p>
<div class="ds-face-line" lang="ar" dir="rtl">${esc(arabic.join(' · '))}<br>ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي<br>٠١٢٣٤٥٦٧٨٩</div>
<div class="ds-face-weights" dir="rtl"><span style="font-weight:400">400</span></div></figcaption></figure>
</div>
<p class="ds-note">The stack is antd’s <code>fontFamily</code> token — <code>${esc(tok.fontFamily || 'Figtree, "Droid Arabic Kufi", sans-serif')}</code>. Figtree is variable, so 500 and 600 are real weights; the Arabic samples are the product’s own strings (translation.json).</p>`;

  /* ── corners ──────────────────────────────────────────────────────── */
  /* a radius under a pixel is not a corner anyone sees */
  const radii = ((painted && painted.radii) || []).filter((r) => !/^[\d.]+px$/.test(r.value) || parseFloat(r.value) >= 1);
  const RADIUS_TOKENS = {};
  for (const k of ['borderRadiusXS', 'borderRadiusSM', 'borderRadius', 'borderRadiusLG']) if (typeof tok[k] === 'number') (RADIUS_TOKENS[`${tok[k]}px`] ||= []).push(k);
  const whoNames = (r) => [...new Set(r.who.map(([c]) => who(c)))].slice(0, 3).join(' · ');
  const uniform = radii.filter((r) => !r.value.includes(' ') && r.uses >= 5 && (!/px$/.test(r.value) || Number.isInteger(parseFloat(r.value))));
  const rank = (v) => (v === 'pill' ? 1e6 : v === 'circle' ? 1e6 + 1 : v.endsWith('%') ? 1e5 + parseFloat(v) : parseFloat(v));
  uniform.sort((a, b) => rank(a.value) - rank(b.value));
  const partialOf = (v) => {
    const c = v.split(' ').map((x) => parseFloat(x) > 0);
    const at = { '1100': 'top', '0011': 'bottom', '1001': 'left', '0110': 'right', '1000': 'top left', '0100': 'top right', '0010': 'bottom right', '0001': 'bottom left' }[c.map(Number).join('')];
    const r = v.split(' ').map(parseFloat).filter((x) => x > 0);
    return at && r.every((x) => x === r[0]) ? { at, r: r[0] } : null;
  };
  const partialGroups = new Map();
  for (const r of radii.filter((x) => x.value.includes(' '))) {
    const p = partialOf(r.value);
    if (!p) continue;
    const k = /^(top|bottom) (left|right)$/.test(p.at) ? `${p.r}|one corner` : `${p.r}|${p.at}`;
    const g = partialGroups.get(k) || partialGroups.set(k, { r: p.r, at: k.split('|')[1], uses: 0, who: [], value: r.value }).get(k);
    g.uses += r.uses; g.who.push(...r.who);
  }
  const partial = [...partialGroups.values()].filter((g) => g.uses >= 4).sort((a, b) => b.uses - a.uses);
  const rareCorners = radii.filter((r) => !uniform.includes(r) && !(r.value.includes(' ') && partialOf(r.value) && partial.some((g) => g.r === partialOf(r.value).r))).map((r) => r.value.replace(/(\d+\.\d)\d+/g, '$1')).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);
  const tile = (r) => { const v = r.value; const style = v === 'pill' ? 'border-radius:999px' : v === 'circle' ? 'border-radius:50%' : `border-radius:${v}`; return `<figure class="ds-corner${v === 'pill' ? ' ds-corner--pill' : ''}"><i style="${style}"></i><figcaption><b>${esc(v)}</b>${RADIUS_TOKENS[v] ? `<code>${esc(RADIUS_TOKENS[v].join(' · '))}</code>` : ''}<span>${plural(r.uses, 'use')}</span><em>${esc(whoNames(r))}</em></figcaption></figure>`; };
  const cornerCss = (g) => { const R = `${g.r}px`; return g.at === 'top' ? `${R} ${R} 0 0` : g.at === 'bottom' ? `0 0 ${R} ${R}` : g.at === 'left' ? `${R} 0 0 ${R}` : g.at === 'right' ? `0 ${R} ${R} 0` : `${R} 0 0 0`; };
  const cornersHtml = `<div class="ds-corners">${uniform.map(tile).join('')}</div>
${partial.length ? `<h4>Some corners only</h4><div class="ds-corners ds-corners--partial">${partial.map((g) => `<figure class="ds-corner"><i style="border-radius:${cornerCss(g)}"></i><figcaption><b>${g.r}px · ${esc(g.at)}</b><span>${plural(g.uses, 'use')}</span><em>${esc([...new Set(g.who.map(([c]) => who(c)))].slice(0, 3).join(' · '))}</em></figcaption></figure>`).join('')}</div>` : ''}
${rareCorners.length ? `<p class="ds-note">Also drawn once or twice: ${rareCorners.map((v) => `<code>${esc(v)}</code>`).join(' ')}.</p>` : ''}`;

  const html = `
<p class="ds-note">What the product paints — read off ${painted ? `its ${painted.files} compiled pages and states` : 'the compiled pages'} — named from its theme (<code>src/theme/index.js</code>) and antd’s resolved tokens (antd ${esc(antd.antdVersion)}). A use is a distinct page and string, or page and component. The named values are in <a href="tokens.css"><code>tokens.css</code></a>.</p>
<h3 id="typefaces">Typefaces</h3>
${facesHtml}
<h3 id="colour">Colour</h3>
${colourHtml}
<h3 id="type">Type scale <small>every size the text is drawn at, its line height and its weights — the sample is the words the product draws most at that size</small></h3>
${scaleHtml}
<h3>Weights</h3>
${weightsHtml}
<h3>Type styles <small>the size, line height and weight combinations the product draws most</small></h3>
${stylesHtml}
<h3 id="corners">Corners</h3>
<p class="ds-note">Every radius a painted box has, smallest to largest. A radius as large as half the box’s shorter side reads as a pill, or a circle when the box is square, whatever number set it.</p>
${cornersHtml}
${rest}`;
  return { html, palettes: palettes.map((p) => ({ title: p.title, rows: p.rows.map((r) => ({ label: r.label, colours: r.list.map((e) => ({ name: e.name, source: e.source, value: e.value, uses: e.uses, rules: e.decl, also: e.also })) })) })), typeScale: scale.map(({ size, lh, weights, uses, tokens, sample }) => ({ size, lh, weights, uses, tokens, sample })), typeStyles: styles.map((t) => ({ size: t.size, lh: lhOf(t), weight: t.weight, uses: t.uses, words: t.words.slice(0, 3) })), corners: uniform.map((r) => ({ value: r.value, tokens: RADIUS_TOKENS[r.value] || [], uses: r.uses, who: r.who.slice(0, 4).map(([c]) => c) })), partialCorners: partial.map((g) => ({ radius: g.r, at: g.at, uses: g.uses })) };
}
