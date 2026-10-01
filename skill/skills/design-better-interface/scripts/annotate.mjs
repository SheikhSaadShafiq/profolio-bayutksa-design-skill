#!/usr/bin/env node
/**
 * Pin findings onto a screen: numbered markers on the elements they are about, and the
 * list beside the screen, in a copy of the screen's own HTML (<name>.annotated.html).
 *
 *   node scripts/annotate.mjs <screen.html> <polish.json> [--out dir] [--png] [--width 1440]
 *
 * polish.json (schema/polish.schema.json): { findings: [{ id, severity, domain, screen,
 * selector | region, title, fix }] }. Only the findings for this screen are pinned: those
 * whose `screen` is its file name (with or without the folder and extension), or that
 * name no screen. The pins are drawn when the page loads, so they follow the layout at
 * any width; pins on the same spot fan out instead of stacking. A finding whose element
 * is missing, or not visible in this state, is listed and says so. --png also saves a
 * full-page picture at --width (default 1440), when a headless browser is available.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const [screen, data] = argv.filter((a, i) => !a.startsWith('--') && !['--out', '--width'].includes(argv[i - 1]));
const WIDTH = argv.includes('--width') ? parseInt(argv[argv.indexOf('--width') + 1], 10) || 1440 : 1440;
if (!screen || !data) { console.error('usage: node scripts/annotate.mjs <screen.html> <polish.json> [--out dir] [--png]'); process.exit(2); }
const out = resolve(argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : dirname(screen));
mkdirSync(out, { recursive: true });
const name = basename(screen).replace(/\.html?$/i, '');
const all = JSON.parse(readFileSync(data, 'utf8')).findings || [];
const norm = (x) => basename(String(x)).replace(/\.html?$/i, '').toLowerCase();
const mine = all.filter((f) => !f.screen || norm(f.screen) === name.toLowerCase());
const others = [...new Set(all.filter((f) => f.screen && norm(f.screen) !== name.toLowerCase()).map((f) => f.screen))];
if (others.length) console.log(`  note: ${all.length - mine.length} finding(s) name other screens (${others.join(', ')}); a finding's screen is its file name`);
const COLOUR = { high: '#d92d20', medium: '#dc8b00', low: '#2e6bd9' };

const layer = `
<style>
.dbi-pin{position:absolute;z-index:2147483646;pointer-events:none;border:2px solid var(--c);border-radius:4px}
.dbi-pin b{position:absolute;left:-2px;top:-22px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--c);color:#fff;font:600 12px/20px system-ui,sans-serif;text-align:center}
.dbi-list{position:fixed;top:12px;right:12px;width:320px;max-height:calc(100vh - 24px);overflow:auto;z-index:2147483647;background:#fff;color:#1f2328;border:1px solid #d0d7de;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.15);font:13px/1.45 system-ui,sans-serif;padding:12px}
.dbi-list h2{font-size:14px;margin:0 0 8px}.dbi-list ol{margin:0;padding-left:22px}.dbi-list li{margin:0 0 8px}
.dbi-list small{display:block;color:#57606a}.dbi-list .dbi-miss{color:#8c959f}
.dbi-hide .dbi-pin,.dbi-hide .dbi-list ol{display:none}
</style>
<script>
(function(){
  var F=${JSON.stringify(mine.map((f, i) => ({ n: i + 1, id: f.id || '', sel: f.selector || null, region: f.region || null, sev: f.severity || 'medium', title: f.title || f.issue || '', fix: f.fix || '', domain: f.domain || '' })))};
  var SHOT=${JSON.stringify(argv.includes('--png'))};
  var C=${JSON.stringify(COLOUR)};
  function draw(){
    document.querySelectorAll('.dbi-pin,.dbi-list').forEach(function(e){e.remove();});
    var list=document.createElement('div');list.className='dbi-list';
    if(SHOT){list.style.position='static';list.style.width='auto';list.style.maxHeight='none';list.style.margin='24px';list.style.boxShadow='none';}
    var taken=[];
    list.innerHTML='<h2>'+F.length+' polish finding'+(F.length===1?'':'s')+' <button type="button" onclick="document.documentElement.classList.toggle(\\'dbi-hide\\')">hide</button></h2>';
    var ol=document.createElement('ol');
    F.forEach(function(f){
      var el=null;try{el=f.sel&&document.querySelector(f.sel);}catch(e){}
      var r=null,miss='';
      if(el){r=el.getBoundingClientRect();var seen=el.checkVisibility?el.checkVisibility({opacityProperty:true,visibilityProperty:true}):true;if(!seen||r.width<1||r.height<1){miss='not visible in this state: '+f.sel;r=null;}}
      else if(f.region){r={left:f.region[0]-scrollX,top:f.region[1]-scrollY,width:f.region[2],height:f.region[3]};}
      else miss=f.sel?'element not found: '+f.sel:'no selector or region';
      var li=document.createElement('li');
      li.innerHTML='<strong style="color:'+C[f.sev]+'">'+(f.id?f.id+' · ':'')+f.title.replace(/</g,'&lt;')+'</strong><small>'+(f.domain?f.domain+' · ':'')+f.fix.replace(/</g,'&lt;')+(miss?' <span class="dbi-miss">('+miss.replace(/</g,'&lt;')+')</span>':'')+'</small>';
      ol.appendChild(li);
      if(!r)return;
      var p=document.createElement('div');
      p.className='dbi-pin';p.style.setProperty('--c',C[f.sev]);
      p.style.left=(r.left+scrollX-3)+'px';p.style.top=(r.top+scrollY-3)+'px';p.style.width=(r.width+6)+'px';p.style.height=(r.height+6)+'px';
      /* a badge on a spot already taken moves along, so every number stays readable */
      var bx=r.left+scrollX,by=r.top+scrollY,shift=0;
      while(taken.some(function(t){return Math.abs(t[0]-(bx+shift))<22&&Math.abs(t[1]-by)<20;}))shift+=24;
      taken.push([bx+shift,by]);
      p.innerHTML='<b style="left:'+(shift-2)+'px">'+f.n+'</b>';document.body.appendChild(p);
    });
    list.appendChild(ol);document.body.appendChild(list);
  }
  window.addEventListener('load',function(){setTimeout(draw,150);});
  window.addEventListener('resize',function(){clearTimeout(window.__dbiT);window.__dbiT=setTimeout(draw,150);});
})();
</script>`;
const html = readFileSync(screen, 'utf8');
/* the copy lives elsewhere: its relative links still resolve against the screen's own folder */
const base = `<base href="${pathToFileURL(resolve(dirname(screen))).href}/">`;
const withBase = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + base) : base + html;
const annotated = /<\/body>/i.test(withBase) ? withBase.replace(/<\/body>/i, layer + '\n</body>') : withBase + layer;
const file = join(out, `${name}.annotated.html`);
writeFileSync(file, annotated);
console.log(`  ${mine.length} finding(s) for this screen → ${file}${argv.includes('--png') ? '' : ' (pins are drawn when it opens)'}`);

if (argv.includes('--png')) {
  const here = dirname(fileURLToPath(import.meta.url));
  const launcher = [join(here, 'browser.mjs'), join(here, '..', '..', '_shared', 'browser.mjs')].find(existsSync);
  if (!launcher) { console.log('  no browser launcher: the picture is skipped'); process.exit(0); }
  const { launch } = await import(pathToFileURL(launcher).href);
  const b = await launch({ install: true });
  if (b.error) { console.log(`  no browser — ${b.error}: the picture is skipped`); process.exit(0); }
  const p = await b.page({ width: WIDTH, height: 900 });
  await p.goto(pathToFileURL(file).href);
  await new Promise((r) => setTimeout(r, 400));
  const drawn = await p.evaluate(() => ({ pins: document.querySelectorAll('.dbi-pin').length, missed: [...document.querySelectorAll('.dbi-miss')].map((e) => e.textContent) }));
  console.log(`  ${drawn.pins} pinned${drawn.missed.length ? `; not pinned: ${drawn.missed.join('; ')}` : ''}`);
  await p.screenshot({ path: file.replace(/\.html$/, '.png'), fullPage: true });
  await b.close();
  console.log(`  picture → ${file.replace(/\.html$/, '.png')}`);
}
