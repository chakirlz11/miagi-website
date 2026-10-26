/* MIAGI Haircare — gedeeld script voor alle pagina's */
(() => {
'use strict';

const CATALOG = [
  {id:'shampoo',        title:'Shampoo',           sub:'500 ml · zonder sulfaten, parabenen en siliconen', image:'img/shampoo.webp'},
  {id:'hair-mask',      title:'Hair Mask',         sub:'zonder sulfaten en parabenen',                     image:'img/mask.webp'},
  {id:'serum',          title:'Serum',             sub:'75 ml · parabenenvrij',                            image:'img/serum.webp'},
  {id:'rond-45-zwart',  title:'Ronde föhnborstel', sub:'45 mm · Zwart',  image:'img/rond-45-zwart.jpg'},
  {id:'rond-32-zwart',  title:'Ronde föhnborstel', sub:'32 mm · Zwart',  image:'img/rond-32-zwart.jpg'},
  {id:'rond-45-roze',   title:'Ronde föhnborstel', sub:'45 mm · Roze',   image:'img/rond-45-roze.jpg', limited:true},
  {id:'rond-32-roze',   title:'Ronde föhnborstel', sub:'32 mm · Roze',   image:'img/rond-32-roze.jpg', limited:true},
  {id:'ontwar-zwart-goud', title:'Ontwarborstel',  sub:'Zwart · Goud',   image:'img/ontwar-zwart-goud-1.jpg'},
  {id:'ontwar-blauw-goud', title:'Ontwarborstel',  sub:'Blauw · Goud',   image:'img/ontwar-blauw-goud-1.jpg'},
  {id:'ontwar-rood-goud',  title:'Ontwarborstel',  sub:'Rood · Goud',    image:'img/ontwar-rood-goud-1.jpg'},
  {id:'ontwar-oudroze',    title:'Ontwarborstel',  sub:'Oudroze',        image:'img/ontwar-oudroze.jpg', limited:true}
];
const product = id => CATALOG.find(p => p.id === id);

/* ---------- foto's wisselen op borstelkaarten ---------- */
document.querySelectorAll('.photo-controls button').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.brush');
  card.querySelectorAll('.img img').forEach((img, i) => { img.hidden = i !== Number(button.dataset.photo); });
  card.querySelectorAll('.photo-controls button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}));

/* ---------- mobiel menu ---------- */
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.getElementById('main-nav');
function closeMenu(){ if(!mainNav) return; mainNav.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded','false'); }
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mainNav.classList.toggle('is-open', open);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mainNav.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); } });
  window.matchMedia('(min-width:981px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
}

/* ---------- filter op de shoppagina ---------- */
const chips = document.querySelectorAll('.chip[data-filter]');
if (chips.length) {
  const groups = document.querySelectorAll('[data-group]');
  const apply = f => {
    groups.forEach(g => { g.hidden = f !== 'alles' && g.dataset.group !== f; });
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
  };
  chips.forEach(c => c.addEventListener('click', () => {
    apply(c.dataset.filter);
    history.replaceState(null, '', c.dataset.filter === 'alles' ? location.pathname : '#' + c.dataset.filter);
  }));
  const fromHash = location.hash.slice(1);
  apply(['haarverzorging','borstels'].includes(fromHash) ? fromHash : 'alles');
}

/* ---------- productvenster, zoeken, winkelwagen ---------- */
const dialog = document.getElementById('miagi-dialog');
const panel = document.getElementById('miagi-panel');
const title = document.getElementById('miagi-dialog-title');
const status = document.getElementById('miagi-status');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readStorage(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStorage(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

let cart = readStorage('miagi-ivory-cart', []);
if (!Array.isArray(cart)) cart = [];
cart = cart.filter(x => x && product(x.id) && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 99);
let details = readStorage('miagi-ivory-details', {});
if (!details || typeof details !== 'object' || Array.isArray(details)) details = {};
let returnFocus = null;
let requestText = '';
const count = () => cart.reduce((sum, item) => sum + item.qty, 0);

function syncCart(){
  writeStorage('miagi-ivory-cart', cart);
  const el = document.getElementById('cart-count'); if (el) el.textContent = count();
  const btn = document.querySelector('[data-panel="cart"]'); if (btn) btn.setAttribute('aria-label', 'Winkelwagen, ' + count() + ' producten');
}
function show(heading, html){ title.textContent = heading; panel.innerHTML = html; if (!dialog.open) { returnFocus = document.activeElement; dialog.showModal(); } dialog.scrollTop = 0; }
function close(){ dialog.close(); if (returnFocus && document.contains(returnFocus)) returnFocus.focus(); }
dialog.querySelector('.panel-close').addEventListener('click', close);
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } });

function showProduct(id){
  const p = product(id); if (!p) return;
  show(p.title, `<div class="panel-product"><div class="panel-product-image"><img src="${p.image}" alt="${esc(p.title + ' ' + p.sub)}"></div><div>${p.limited ? '<p class="limited">Limited edition</p>' : ''}<h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p><p>Prijs op aanvraag</p><p class="panel-note">Voeg dit product toe aan je winkelwagen om een productaanvraag samen te stellen.</p><div class="panel-actions"><button type="button" class="btn btn-dark" data-action="add" data-id="${p.id}">In winkelwagen</button></div></div></div>`);
}
function showCart(){
  if (!cart.length) { show('Winkelwagen', '<div class="panel-empty"><p>Je winkelwagen is nog leeg.</p><button class="btn btn-dark" data-action="browse" type="button">Ontdek de collectie</button></div>'); return; }
  show('Winkelwagen · ' + count(), cart.map(item => { const p = product(item.id); return `<div class="cart-row"><img src="${p.image}" alt="${esc(p.title)}"><div><h3>${esc(p.title)}</h3><p>${esc(p.sub)}</p><p>Prijs op aanvraag</p><div class="qty-controls"><button type="button" data-action="minus" data-id="${p.id}" aria-label="Eén minder ${esc(p.title + ' ' + p.sub)}">−</button><span aria-label="Aantal">${item.qty}</span><button type="button" data-action="plus" data-id="${p.id}" aria-label="Eén meer ${esc(p.title + ' ' + p.sub)}" ${item.qty >= 99 ? 'disabled' : ''}>+</button><button type="button" class="cart-remove" data-action="remove" data-id="${p.id}">Verwijderen</button></div></div></div>`; }).join('') + '<p class="panel-note">De prijzen en betaling zijn nog niet ingesteld. Je kunt je selectie bewaren als aanvraag. Er wordt nog geen bestelling geplaatst of verstuurd.</p><div class="panel-actions"><button class="btn btn-dark" type="button" data-action="request">Aanvraag samenstellen</button><button class="btn btn-line" type="button" data-action="browse">Verder bekijken</button></div>');
}
function resultMarkup(items){ return items.length ? items.map(p => `<button type="button" class="search-product" data-action="product" data-id="${p.id}"><img src="${p.image}" alt=""><span><strong>${esc(p.title)}</strong><small>${esc(p.sub)}${p.limited ? ' · Limited edition' : ''}</small></span></button>`).join('') : '<p class="panel-note">Geen producten gevonden. Probeer bijvoorbeeld serum, shampoo of roze.</p>'; }
function showSearch(){
  show('Zoeken', '<label class="panel-field" for="product-search">Zoek een product<input id="product-search" type="search" placeholder="Bijvoorbeeld serum of roze borstel" autocomplete="off"></label><p id="result-count" class="panel-note" role="status"></p><div class="search-results" id="search-results"></div>');
  const input = document.getElementById('product-search'); const results = document.getElementById('search-results');
  function filter(){ const terms = input.value.toLocaleLowerCase('nl').trim().split(/\s+/).filter(Boolean); const found = CATALOG.filter(p => terms.every(t => (p.title + ' ' + p.sub + (p.limited ? ' limited edition' : '')).toLocaleLowerCase('nl').includes(t))); results.innerHTML = resultMarkup(found); document.getElementById('result-count').textContent = found.length + ' producten'; }
  input.addEventListener('input', filter); filter(); input.focus();
}
function fields(){ return `<label class="panel-field">Naam<input name="name" autocomplete="name" maxlength="150" value="${esc(details.name)}"></label><label class="panel-field">Mailadres<input name="email" type="email" autocomplete="email" maxlength="254" required value="${esc(details.email)}"></label>`; }
function showDetails(){ show('Mijn gegevens', `<p class="panel-note">Bewaar je gegevens voor een productaanvraag. Ze worden alleen in deze browser opgeslagen. Er is nog geen online account of aanmelding.</p><form id="details-form">${fields()}<button class="btn btn-dark" type="submit">Gegevens bewaren</button></form><div id="details-status" role="status"></div>`); }
function showRequest(){ if (!cart.length) return showCart(); show('Productaanvraag', `<p class="panel-note">Maak een overzicht van je selectie. Download of kopieer de aanvraag om die zelf te delen. Deze website verstuurt nog geen bestellingen.</p><form id="request-form">${fields()}<label class="panel-field">Opmerking<textarea name="message" maxlength="3000" placeholder="Je vraag of gewenste aantallen"></textarea></label><button class="btn btn-dark" type="submit">Overzicht maken</button></form>`); }
function showTextRequest(form){
  const values = new FormData(form);
  details = {name:String(values.get('name') || '').trim(), email:String(values.get('email') || '').trim()};
  writeStorage('miagi-ivory-details', details);
  requestText = 'MIAGI Productaanvraag\n\nNaam: ' + details.name + '\nMailadres: ' + details.email + '\n\n' + cart.map(item => { const p = product(item.id); return item.qty + ' × ' + p.title + ', ' + p.sub + ' (prijs op aanvraag)'; }).join('\n') + '\n\nOpmerking: ' + String(values.get('message') || '') + '\n\nDit is een aanvraagoverzicht. Er is nog geen bestelling geplaatst of betaling uitgevoerd.';
  show('Jouw aanvraag', `<p class="panel-note">Je overzicht staat klaar om zelf te delen. Het is nog niet verstuurd.</p><label class="panel-field">Aanvraag<textarea id="request-text" readonly rows="12">${esc(requestText)}</textarea></label><div class="panel-actions"><button class="btn btn-dark" type="button" data-action="download">Download aanvraag</button><button class="btn btn-line" type="button" data-action="copy">Kopieer tekst</button></div><p id="copy-status" role="status"></p>`);
}

/* producten openen: kaarten, miniaturen en knoppen met data-product */
document.querySelectorAll('article.brush[data-id]').forEach(card => {
  const id = card.dataset.id; const a = card.querySelector('a');
  if (a) a.addEventListener('click', e => { e.preventDefault(); showProduct(id); });
  const b = document.createElement('button'); b.type = 'button'; b.className = 'brush-detail'; b.textContent = 'Bekijk product';
  b.addEventListener('click', () => showProduct(id)); card.append(b);
});
document.querySelectorAll('a[data-product]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showProduct(a.dataset.product); }));
document.querySelectorAll('a[data-panel]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); closeMenu(); ({search:showSearch, details:showDetails, cart:showCart})[a.dataset.panel](); }));
document.querySelectorAll('[data-open="cart"]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); showCart(); }));

panel.addEventListener('click', async event => {
  const b = event.target.closest('button[data-action]'); if (!b) return;
  const action = b.dataset.action; const id = b.dataset.id; const item = cart.find(x => x.id === id);
  if (action === 'product') showProduct(id);
  if (action === 'browse') { close(); if (!/shop\.html$/.test(location.pathname)) location.href = 'shop.html'; }
  if (action === 'add' && product(id)) { if (item) item.qty = Math.min(99, item.qty + 1); else cart.push({id, qty:1}); syncCart(); status.textContent = product(id).title + ' toegevoegd aan de winkelwagen.'; showCart(); }
  if (['minus','plus','remove'].includes(action) && item) { if (action === 'remove' || (action === 'minus' && item.qty === 1)) cart = cart.filter(x => x.id !== id); else item.qty = Math.max(1, Math.min(99, item.qty + (action === 'plus' ? 1 : -1))); syncCart(); showCart(); }
  if (action === 'request') showRequest();
  if (action === 'download') { const url = URL.createObjectURL(new Blob([requestText], {type:'text/plain;charset=utf-8'})); const a = document.createElement('a'); a.href = url; a.download = 'MIAGI-productaanvraag.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  if (action === 'copy') { try { await navigator.clipboard.writeText(requestText); document.getElementById('copy-status').textContent = 'Aanvraag gekopieerd.'; } catch { const area = document.getElementById('request-text'); area.focus(); area.select(); document.getElementById('copy-status').textContent = 'De tekst is geselecteerd. Kopieer met Ctrl+C of ⌘+C.'; } }
});
panel.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'details-form') { const data = new FormData(e.target); details = {name:String(data.get('name') || '').trim(), email:String(data.get('email') || '').trim()}; writeStorage('miagi-ivory-details', details); const s = document.getElementById('details-status'); s.className = 'panel-status'; s.textContent = 'Je gegevens zijn bewaard in deze browser.'; }
  if (e.target.id === 'request-form') showTextRequest(e.target);
});
syncCart();
})();
