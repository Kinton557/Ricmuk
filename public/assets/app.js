/* Ricmuk Enterprises: shared front-end (header, footer, cart, product cards, helpers). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var I = {
    cart: '<path d="M3 4h2.5l2.2 11h10.6L21 7H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    truck: '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.2A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.6C3.7 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 004.2 4.2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    roofing: '<path d="M2 12 12 4l10 8"/><path d="M5 11v9h14v-9"/><path d="M9 20v-5h6v5"/>',
    steel: '<path d="M5 4v16h16"/><path d="M9 8v8h8"/>',
    cement: '<path d="M6 4h12l2 4v12H4V8z"/><path d="M4 8h16M9 14h6"/>',
    timber: '<rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/>',
    plumbing: '<path d="M4 8h9a3 3 0 013 3v9"/><path d="M2 6h3v4H2zM14 18h4v3h-4z"/>',
    pumps: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
    electrical: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    tiles: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
    security: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    bathroom: '<path d="M6 21V8a4 4 0 018 0"/><path d="M10 8h8M12 12v1M15 12v1M18 12v1M13 16v1M16 16v1"/>',
    tools: '<path d="M14 4l6 6-3 3-6-6z"/><path d="M12 9l-8 8a2 2 0 003 3l8-8"/>'
  };
  var svg = function (n, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + (I[n] || '') + '</svg>'; };
  var WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg>';

  var App = { cfg: {}, user: null, shop: null, esc: esc, $: $, $$: $$, svg: svg, icons: I };

  /* ---------- api ---------- */
  App.api = function (url, opts) {
    opts = opts || {};
    var init = { method: opts.method || (opts.body ? 'POST' : 'GET'), credentials: 'same-origin', headers: {} };
    if (opts.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(url, init).then(function (r) { return r.json().catch(function () { return { success: false, message: 'Unexpected reply from the server.' }; }); })
      .catch(function () { return { success: false, message: 'Could not reach the server. Check your internet connection and try again.' }; });
  };

  /* ---------- money ---------- */
  App.money = function (n) { n = Number(n) || 0; return '$' + n.toFixed(2).replace(/\.00$/, '.00'); };
  App.zwg = function (n) { var r = Number(App.cfg.zwg_rate) || 0; return r > 0 ? 'ZWG ' + Math.round(n * r).toLocaleString('en-US') : ''; };
  App.priceHtml = function (n) { var z = App.zwg(n); return App.money(n) + (z ? '<span class="zwg">≈ ' + esc(z) + '</span>' : ''); };

  /* ---------- toast ---------- */
  var toastT;
  App.toast = function (msg) {
    var t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  /* ---------- cart (localStorage: { productId: qty }) ---------- */
  var CK = 'ric_cart';
  var cartRead = function () { try { var c = JSON.parse(localStorage.getItem(CK) || '{}'); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; } };
  var cartWrite = function (c) { try { localStorage.setItem(CK, JSON.stringify(c)); } catch (e) { /* ignore */ } App.cart.badge(); document.dispatchEvent(new Event('cart')); };
  App.cart = {
    get: cartRead,
    count: function () { var c = cartRead(), n = 0; for (var k in c) n += c[k]; return n; },
    add: function (id, q) { var c = cartRead(); c[id] = Math.min(9999, (c[id] || 0) + (q || 1)); cartWrite(c); },
    set: function (id, q) { var c = cartRead(); q = Math.floor(q); if (q < 1) delete c[id]; else c[id] = Math.min(9999, q); cartWrite(c); },
    remove: function (id) { var c = cartRead(); delete c[id]; cartWrite(c); },
    clear: function () { cartWrite({}); },
    badge: function () { $$('.cart-badge').forEach(function (b) { var n = App.cart.count(); b.textContent = n || ''; b.dataset.n = n; }); }
  };

  /* ---------- shop data ---------- */
  App.loadShop = function () {
    if (!App.shopP) App.shopP = App.api('/api/shop').then(function (d) { App.shop = d.success ? d : { categories: [], products: [] }; return App.shop; });
    return App.shopP;
  };
  App.product = function (id) { return App.shop && App.shop.products.filter(function (p) { return p.id === Number(id); })[0]; };
  App.category = function (slug) { return App.shop && App.shop.categories.filter(function (c) { return c.slug === slug; })[0]; };

  App.thumb = function (p) {
    return p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' : '<div class="tile">' + svg(p.category) + '</div>';
  };
  App.card = function (p) {
    var cat = App.category(p.category);
    var tag = !p.available ? '<span class="tag out">Out of stock</span>' : p.low ? '<span class="tag low">Only ' + p.stock + ' left</span>' : p.featured ? '<span class="tag">Popular</span>' : '';
    return '<article class="prod" data-id="' + p.id + '">' +
      '<button type="button" class="prod-img" data-open="' + p.id + '" aria-label="View ' + esc(p.name) + '">' + App.thumb(p) + tag + '</button>' +
      '<div class="prod-body"><span class="prod-cat">' + esc(cat ? cat.name : '') + '</span>' +
      '<h3 data-open="' + p.id + '">' + esc(p.name) + '</h3>' +
      '<div class="prod-price">' + App.priceHtml(p.price) + ' <small>' + esc(p.unit) + '</small></div>' +
      '<div class="prod-actions">' + (p.available ? '<button type="button" class="btn btn-red btn-sm" data-add="' + p.id + '">Add to cart</button>' : '<a class="btn btn-line btn-sm" href="' + waLink('Hello Ricmuk, when will you have ' + p.name + ' in stock?') + '" target="_blank" rel="noopener">Ask us</a>') + '</div></div></article>';
  };

  function waLink(text) { return 'https://wa.me/' + digits(App.cfg.whatsapp) + '?text=' + encodeURIComponent(text); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  App.waLink = waLink;
  App.telLink = function (p) { return 'tel:+' + digits(p).replace(/^0/, '263'); };

  /* product pop-up */
  function ensureModal() {
    var m = $('#prodModal');
    if (m) return m;
    m = document.createElement('div'); m.id = 'prodModal'; m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Product details');
    m.innerHTML = '<div class="modal-card"><button type="button" class="modal-x" aria-label="Close">&times;</button><div class="pm"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.modal-x')) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    return m;
  }
  function closeModal() { var m = $('#prodModal'); if (m) m.classList.remove('open'); document.body.style.overflow = ''; }
  App.openProduct = function (id) {
    var p = App.product(id); if (!p) return;
    var m = ensureModal(), cat = App.category(p.category);
    var stock = !p.available ? '<p style="color:var(--bad);font-weight:700">Out of stock right now. Message us and we will tell you when it arrives.</p>' : p.low ? '<p style="color:var(--warn);font-weight:700">Only ' + p.stock + ' left</p>' : '<p style="color:var(--ok);font-weight:700">Available</p>';
    var pic = p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' : '<div class="tile" style="min-height:260px">' + svg(p.category) + '</div>';
    $('.pm', m).innerHTML = '<div class="pm-img">' + pic + '</div><div class="pm-info"><span class="kicker">' + esc(cat ? cat.name : '') + '</span><h2>' + esc(p.name) + '</h2>' +
      '<div class="pm-price">' + App.priceHtml(p.price) + ' <small class="muted" style="font-family:var(--body);font-size:.95rem">' + esc(p.unit) + '</small></div>' + stock +
      '<p class="muted" style="margin:12px 0 18px">' + esc(p.description || 'Ask us about sizes, colours and bulk prices.') + '</p>' +
      (p.available ? '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div class="qty"><button type="button" data-q="-1" aria-label="Less">&minus;</button><input id="pmQty" type="number" min="1" max="9999" value="1" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></div><button type="button" class="btn btn-red" id="pmAdd">Add to cart</button></div>' : '') +
      '<p style="margin-top:16px"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + waLink('Hello Ricmuk, I am interested in: ' + p.name + ' (' + App.money(p.price) + ' ' + p.unit + ')') + '">Ask on WhatsApp</a> <a class="btn btn-line btn-sm" href="quote.html?item=' + encodeURIComponent(p.name) + '">Bulk quote</a></p>' +
      '<p class="muted small" style="margin-top:14px">' + esc(App.cfg.price_notice || '') + '</p></div>';
    m.classList.add('open'); document.body.style.overflow = 'hidden';
    var qi = $('#pmQty', m);
    $$('[data-q]', m).forEach(function (b) { b.onclick = function () { qi.value = Math.max(1, (parseInt(qi.value, 10) || 1) + Number(b.dataset.q)); }; });
    var add = $('#pmAdd', m);
    if (add) add.onclick = function () { App.cart.add(p.id, Math.max(1, parseInt(qi.value, 10) || 1)); App.toast('Added ' + p.name + ' to your cart'); closeModal(); };
  };
  /* delegated clicks for cards anywhere */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { App.openProduct(o.dataset.open); return; }
    var a = e.target.closest('[data-add]'); if (a) { var p = App.product(a.dataset.add); App.cart.add(Number(a.dataset.add), 1); App.toast('Added ' + (p ? p.name : 'item') + ' to your cart'); }
  });

  /* ---------- open / closed ---------- */
  function openNow() {
    var c = App.cfg, now = new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + 2 * 3600000); // Harare, UTC+2
    var d = now.getDay(), txt = d === 0 ? c.hours_sunday : d === 6 ? c.hours_saturday : c.hours_weekdays;
    var m = /(\d{1,2}):(\d{2})\s*[-–to]+\s*(\d{1,2}):(\d{2})/.exec(txt || '');
    if (!m) return false;
    var mins = now.getHours() * 60 + now.getMinutes();
    return mins >= (+m[1]) * 60 + (+m[2]) && mins < (+m[3]) * 60 + (+m[4]);
  }

  /* ---------- header / footer ---------- */
  var NAV = [['index.html', 'Home', 'home'], ['shop.html', 'Shop', 'shop'], ['quote.html', 'Get a Quote', 'quote'], ['track.html', 'Track Order', 'track'], ['about.html', 'About', 'about'], ['contact.html', 'Contact', 'contact']];
  function renderChrome() {
    var c = App.cfg, page = document.body.dataset.nav || '', u = App.user;
    var open = openNow();
    var hdr = $('#hdr'); if (!hdr) return;
    hdr.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="topstrip"><div class="container"><span class="hrs"><span class="dot ' + (open ? 'open' : '') + '"></span>' + (open ? 'Open now' : 'Closed now') + ' &middot; Mon-Fri ' + esc(c.hours_weekdays) + ' &middot; Sat ' + esc(c.hours_saturday) + '</span>' +
      '<span><a href="' + App.telLink(c.phone1) + '">' + esc(c.phone1) + '</a> &nbsp;|&nbsp; <a href="' + App.telLink(c.phone2) + '">' + esc(c.phone2) + '</a></span></div></div>' +
      '<nav class="navbar" aria-label="Main"><div class="nav-in">' +
      '<a class="logo" href="index.html" aria-label="Ricmuk Enterprises home"><img src="img/logo.png" alt="Ricmuk Enterprises - One Stop Hardware" width="74" height="46"></a>' +
      '<ul class="nav-links" id="navLinks">' + NAV.map(function (n) { return '<li><a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>'; }).join('') + '</ul>' +
      '<div class="nav-auth">' + (u ? (u.role === 'admin' ? '<a class="avatar-link" href="dashboard.html">Dashboard</a>' : '') + '<a class="avatar-link" href="account.html">' + esc(u.name.split(' ')[0]) + '</a>' : '<a class="avatar-link" href="login.html">Sign in</a><a class="btn btn-navy btn-sm" href="signup.html">Create account</a>') + '</div>' +
      '<div class="nav-tools"><button type="button" class="icon-btn theme-toggle" aria-label="Switch light or dark theme">' + svg('moon', 'i-moon') + svg('sun', 'i-sun') + '</button>' +
      '<a class="icon-btn" href="cart.html" aria-label="Cart">' + svg('cart') + '<span class="badge cart-badge" data-n="0"></span></a>' +
      '<button type="button" class="icon-btn nav-toggle" aria-expanded="false" aria-controls="navLinks" aria-label="Menu">' + svg('menu') + '</button></div></div></nav>';
    var ftr = $('#ftr');
    if (ftr) ftr.innerHTML =
      '<footer class="footer"><div class="foot-grid">' +
      '<div><span class="logo-box"><img src="img/logo.png" alt="Ricmuk Enterprises"></span><p>Your one stop hardware shop in Kadoma. Roofing, steel, cement, timber, plumbing, electrical, tiles and more.</p></div>' +
      '<div><h4>Shop</h4><ul><li><a href="shop.html">All products</a></li><li><a href="shop.html?cat=roofing">Roofing sheets</a></li><li><a href="shop.html?cat=cement">Cement &amp; building</a></li><li><a href="shop.html?cat=plumbing">Plumbing</a></li><li><a href="shop.html?cat=electrical">Electrical</a></li></ul></div>' +
      '<div><h4>Help</h4><ul><li><a href="quote.html">Request a quote</a></li><li><a href="track.html">Track an order</a></li><li><a href="contact.html">Contact us</a></li><li><a href="terms.html">Terms &amp; Conditions</a></li><li><a href="privacy.html">Privacy Policy</a></li></ul></div>' +
      '<div><h4>Visit us</h4><ul><li>' + esc(c.address) + '<br>' + esc(c.area) + '</li><li><a href="' + App.telLink(c.phone1) + '">' + esc(c.phone1) + '</a></li><li><a href="' + App.telLink(c.phone2) + '">' + esc(c.phone2) + '</a></li><li><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></li></ul></div></div>' +
      '<div class="foot-bottom">&copy; ' + new Date().getFullYear() + ' ' + esc(c.shop_name) + ' &middot; ' + esc(c.tagline) + ' &middot; Kadoma, Zimbabwe</div></footer>' +
      '<a class="wa-float no-print" href="' + waLink('Hello Ricmuk Enterprises, I would like to make an enquiry.') + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + WA_SVG + '<span>WhatsApp</span></a>';
    App.cart.badge();
    var nt = $('.nav-toggle'), nb = $('.navbar');
    nt.onclick = function () { var o = nb.classList.toggle('open'); nt.setAttribute('aria-expanded', o); };
    $('.theme-toggle').onclick = function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (dark) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('ric_theme', dark ? 'light' : 'dark'); } catch (e) { /* ignore */ }
    };
  }

  /* show/hide password buttons */
  App.pwToggles = function () {
    $$('.pw').forEach(function (w) {
      var inp = $('input', w), b = $('button', w); if (!b) return;
      b.innerHTML = svg('eye'); b.setAttribute('aria-label', 'Show password');
      b.onclick = function () { var show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; b.innerHTML = svg(show ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); };
    });
  };

  App.logout = function () { return App.api('/api/logout', { method: 'POST', body: {} }).then(function () { location.href = 'index.html'; }); };
  App.fmtDate = function (s) { if (!s) return ''; var d = new Date(String(s).replace(' ', 'T') + 'Z'); return isNaN(d) ? s : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Harare' }); };
  App.statusLabel = function (s) { return { pending: 'Received', confirmed: 'Confirmed', ready: 'Ready for collection', out_for_delivery: 'Out for delivery', completed: 'Completed', cancelled: 'Cancelled' }[s] || s; };

  /* ---------- boot ---------- */
  App.ready = Promise.all([App.api('/api/config'), App.api('/api/session')]).then(function (r) {
    if (r[0].success) App.cfg = r[0].config;
    App.user = r[1].user || null;
    renderChrome();
    if (document.body.dataset.noTrack == null) {
      try { var v = localStorage.getItem('ric_vid'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('ric_vid', v); } App.api('/api/track', { body: { vid: v, path: location.pathname } }); } catch (e) { /* ignore */ }
    }
    return App;
  });
  window.App = App;
})();
