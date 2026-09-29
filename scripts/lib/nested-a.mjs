/**
 * Markup the product's DOM holds and HTML cannot.
 *
 * React builds the page with DOM calls, and the DOM accepts trees the HTML
 * parser never produces: a <div> inside a <p> (the parser closes the <p> at
 * the <div> and leaves an empty <p></p> after it — the agent-performance
 * badges moved 5px that way), a link inside a link (the phone layout's app
 * banner lost its text column), a button in a button, a form in a form, a
 * heading directly inside a heading. Serialised and parsed back, those trees
 * come apart and the layout with them.
 *
 * So a compiled page (harness/freeze.js) and a component page
 * (scripts/ds/collect.mjs, catalogue.mjs) write such an element as
 * <pf-el data-pf-tag="p" …> — a name the parser keeps as it is — and RESTORE,
 * run as the page loads, makes each one the real element again with the DOM.
 */
export const RESTORE = "document.querySelectorAll('pf-el').forEach(function(e){var t=e.getAttribute('data-pf-tag');if(!t)return;var a=document.createElement(t);for(var i=0;i<e.attributes.length;i++){var n=e.attributes[i].name;if(n!=='data-pf-tag')a.setAttribute(n,e.attributes[i].value);}while(e.firstChild)a.appendChild(e.firstChild);e.replaceWith(a);});";
/* the older spelling, for any page compiled before the general form */
export const NESTED_A = RESTORE + "document.querySelectorAll('pf-nested-a').forEach(function(e){var a=document.createElement('a');for(var i=0;i<e.attributes.length;i++)a.setAttribute(e.attributes[i].name,e.attributes[i].value);while(e.firstChild)a.appendChild(e.firstChild);e.replaceWith(a);});";
/* does a piece of markup need RESTORE to be itself? */
export const needsRestore = (html) => html.includes('<pf-el') || html.includes('<pf-nested-a');
/* the markup as the product wrote it, for showing and copying */
export const realLinks = (html) => {
  const stack = [];
  return html
    .replace(/<pf-nested-a(?=[\s>])/g, '<a').replace(/<\/pf-nested-a>/g, '</a>')
    .replace(/<pf-el\b([^>]*)>|<\/pf-el>/g, (m, attrs) => {
      if (m === '</pf-el>') return `</${stack.pop() || 'div'}>`;
      const t = (attrs.match(/ data-pf-tag="([\w-]+)"/) || [])[1] || 'div';
      stack.push(t);
      return `<${t}${attrs.replace(/ data-pf-tag="[\w-]+"/, '')}>`;
    });
};
/* The rules, as the parser applies them (WHATWG "in body" insertion mode),
   for a tree to survive being written out and read back. SOURCE is run in
   the page, on a CLONE, by freeze.js and collect.mjs. */
export const UNPARSABLE_SOURCE = `(root) => {
  const P_CLOSERS = 'address,article,aside,blockquote,center,details,dialog,dir,div,dl,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,hr,main,menu,nav,ol,p,pre,search,section,summary,table,ul,li,dd,dt,listing,plaintext,xmp';
  const H = 'h1,h2,h3,h4,h5,h6';
  const swap = (el) => {
    const n = el.ownerDocument.createElement('pf-el');
    n.setAttribute('data-pf-tag', el.tagName.toLowerCase());
    for (const at of el.attributes) n.setAttribute(at.name, at.value);
    while (el.firstChild) n.appendChild(el.firstChild);
    el.replaceWith(n);
    return n;
  };
  const all = (sel) => [...root.querySelectorAll(sel)];
  let n = 0;
  for (const p of all('p')) if (p.querySelector(P_CLOSERS)) { swap(p); n++; }
  for (const a of all('a a')) { swap(a); n++; }
  for (const b of all('button button')) { swap(b); n++; }
  for (const f of all('form form')) { swap(f); n++; }
  for (const h of all(':is(' + H + ') > :is(' + H + ')')) { swap(h); n++; }
  return n;
}`;
