/* Ricmuk admin dashboard */
(function () {
  'use strict';
  var A = App, $ = A.$, esc = A.esc;
  var TABS = [['overview', 'Overview'], ['orders', 'Orders'], ['products', 'Products'], ['quotes', 'Quotes'], ['messages', 'Messages'], ['users', 'Customers'], ['settings', 'Settings']];
  var tab = 'overview', S = null, cats = [];
  var view = function () { return $('#view'); };

  A.ready.then(function () {
    if (!A.user || A.user.role !== 'admin') { $('#gate').hidden = false; return; }
    $('#dash').hidden = false;
    $('#refresh').onclick = function () { go(tab); A.toast('Refreshed'); };
    A.api('/api/admin/categories').then(function (d) { cats = d.categories || []; });
    go('overview');
  });

  function go(t) {
    tab = t;
    A.api('/api/admin/summary').then(function (d) {
      S = d.success ? d : null;
      var c = S ? S.counts : {}, n = { orders: c.pending, quotes: c.quotes, messages: c.messages };
      $('#tabs').innerHTML = TABS.map(function (x) { return '<button type="button" data-t="' + x[0] + '" class="' + (x[0] === tab ? 'on' : '') + '">' + x[1] + (n[x[0]] ? '<span class="badge">' + n[x[0]] + '</span>' : '') + '</button>'; }).join('');
      var fn = { overview: vOverview, orders: vOrders, products: vProducts, quotes: vQuotes, messages: vMessages, users: vUsers, settings: vSettings }[tab];
      fn();
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('#tabs [data-t]'); if (b) go(b.dataset.t); });

  /* ---- modal ---- */
  function modal(html) { $('#admCard').innerHTML = '<button type="button" class="modal-x" aria-label="Close" id="admX">&times;</button><div style="padding:clamp(18px,4vw,30px)">' + html + '</div>'; $('#adm').classList.add('open'); $('#admX').onclick = closeM; }
  function closeM() { $('#adm').classList.remove('open'); }
  document.addEventListener('click', function (e) { if (e.target.id === 'adm') closeM(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeM(); });
  var pill = function (s, label) { return '<span class="status-pill ' + esc(s) + '">' + esc(label || s) + '</span>'; };
  var table = function (head, rows) { return '<div class="table-wrap"><table class="t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="muted" style="text-align:center;padding:30px">Nothing here yet.</td></tr>') + '</tbody></table></div>'; };
  var wa = function (phone, text) { return 'https://wa.me/' + String(phone || '').replace(/\D/g, '').replace(/^0/, '263') + (text ? '?text=' + encodeURIComponent(text) : ''); };

  /* ---- overview ---- */
  function vOverview() {
    if (!S) { view().innerHTML = '<p class="msg err">Could not load the dashboard.</p>'; return; }
    var c = S.counts, max = Math.max.apply(null, S.visits.map(function (v) { return v.hits; }).concat([1]));
    view().innerHTML =
      (S.prices_confirmed ? '' : '<div class="notice"><b>Sample prices are in use.</b> The catalogue was set up with placeholder prices. Update every price under <b>Products</b>, then tick &ldquo;I have checked all prices&rdquo; in <b>Settings</b> to remove this notice.</div>') +
      '<div class="stats">' +
      '<div class="stat ' + (c.pending ? 'hot' : '') + '"><b>' + c.pending + '</b><span>New orders to confirm</span></div>' +
      '<div class="stat"><b>' + c.open + '</b><span>Open orders</span></div>' +
      '<div class="stat"><b>' + A.money(c.revenue) + '</b><span>Completed sales</span></div>' +
      '<div class="stat ' + (c.quotes ? 'hot' : '') + '"><b>' + c.quotes + '</b><span>New quote requests</span></div>' +
      '<div class="stat ' + (c.messages ? 'hot' : '') + '"><b>' + c.messages + '</b><span>New messages</span></div>' +
      '<div class="stat ' + (c.lowStock ? 'hot' : '') + '"><b>' + c.lowStock + '</b><span>Low-stock products</span></div>' +
      '<div class="stat"><b>' + c.products + '</b><span>Products in the shop</span></div>' +
      '<div class="stat"><b>' + c.users + '</b><span>Registered users</span></div></div>' +
      '<div class="card"><h3>Website visits, last 7 days</h3><div class="bars">' + S.visits.map(function (v) { return '<div class="bar" title="' + v.visitors + ' visitors"><b>' + v.hits + '</b><i style="height:' + Math.max(3, Math.round(v.hits / max * 100)) + '%"></i>' + v.day + '</div>'; }).join('') + '</div></div>' +
      '<div id="recent" style="margin-top:22px"></div>';
    A.api('/api/admin/orders').then(function (d) {
      var rows = (d.orders || []).filter(function (o) { return o.status === 'pending'; }).slice(0, 8).map(function (o) { return '<tr><td><b>' + esc(o.order_no) + '</b></td><td>' + esc(o.name) + '<br><small class="muted">' + esc(o.phone) + '</small></td><td>' + A.money(o.total) + '</td><td>' + esc(A.fmtDate(o.created_at)) + '</td><td><button class="btn btn-navy btn-sm" data-open-order="' + o.id + '">Open</button></td></tr>'; });
      $('#recent').innerHTML = '<h3 style="margin-bottom:10px">Orders waiting for confirmation</h3>' + table(['Order', 'Customer', 'Total', 'Placed', ''], rows);
      window.__orders = d.orders || [];
    });
  }

  /* ---- orders ---- */
  var OS = ['pending', 'confirmed', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
  function vOrders() {
    view().innerHTML = '<div class="toolbar"><input id="oq" type="search" placeholder="Search order no, name or phone"><select id="os"><option value="">All statuses</option>' + OS.map(function (s) { return '<option value="' + s + '">' + A.statusLabel(s) + '</option>'; }).join('') + '</select></div><div id="ot"></div>';
    A.api('/api/admin/orders').then(function (d) { window.__orders = d.orders || []; drawOrders(); });
    $('#oq').oninput = drawOrders; $('#os').onchange = drawOrders;
  }
  function drawOrders() {
    var q = ($('#oq').value || '').toLowerCase(), st = $('#os').value;
    var rows = (window.__orders || []).filter(function (o) { return (!st || o.status === st) && (!q || (o.order_no + o.name + o.phone).toLowerCase().indexOf(q) > -1); }).map(function (o) {
      return '<tr><td><b>' + esc(o.order_no) + '</b><br><small class="muted">' + esc(A.fmtDate(o.created_at)) + '</small></td><td>' + esc(o.name) + '<br><small class="muted">' + esc(o.phone) + '</small></td><td>' + o.items.reduce(function (a, l) { return a + l.qty; }, 0) + ' (' + (o.method === 'delivery' ? 'delivery' : 'collect') + ')</td><td><b>' + A.money(o.total) + '</b></td><td>' + pill(o.status, A.statusLabel(o.status)) + '</td><td>' + pill(o.payment_status) + '</td><td><button class="btn btn-navy btn-sm" data-open-order="' + o.id + '">Open</button></td></tr>';
    });
    $('#ot').innerHTML = table(['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', ''], rows);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-open-order]'); if (b) openOrder(Number(b.dataset.openOrder)); });
  function openOrder(id) {
    var o = (window.__orders || []).filter(function (x) { return x.id === id; })[0]; if (!o) return;
    modal('<h2 style="font-size:2rem">' + esc(o.order_no) + '</h2><p class="muted small">' + esc(A.fmtDate(o.created_at)) + ' &middot; ' + (o.method === 'delivery' ? 'Delivery' : 'Collection') + ' &middot; pays ' + (o.payment_method === 'ecocash' ? 'by EcoCash' + (o.payment_ref ? ' (ref ' + esc(o.payment_ref) + ')' : '') : 'at shop / on delivery') + '</p>' +
      '<p style="margin:12px 0"><b>' + esc(o.name) + '</b> &middot; <a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + '</a> &middot; <a target="_blank" rel="noopener" href="' + wa(o.phone, 'Hello ' + o.name + ', this is Ricmuk Enterprises about your order ' + o.order_no + '.') + '">WhatsApp</a>' + (o.email ? ' &middot; ' + esc(o.email) : '') + '</p>' +
      (o.method === 'delivery' ? '<p><b>Deliver to:</b> ' + esc(o.address) + '</p>' : '') + (o.note ? '<p><b>Customer note:</b> ' + esc(o.note) + '</p>' : '') +
      '<div class="table-wrap" style="margin:14px 0"><table class="t" style="min-width:0"><tbody>' + o.items.map(function (l) { return '<tr><td>' + esc(l.name) + ' <small class="muted">(' + esc(l.unit) + ')</small></td><td>' + l.qty + ' &times; ' + A.money(l.price) + '</td><td style="text-align:right"><b>' + A.money(l.line) + '</b></td></tr>'; }).join('') + '<tr><td colspan="2" style="text-align:right">Delivery</td><td style="text-align:right">' + A.money(o.delivery_fee) + '</td></tr><tr><td colspan="2" style="text-align:right"><b>Total</b></td><td style="text-align:right"><b>' + A.money(o.total) + '</b></td></tr></tbody></table></div>' +
      '<div class="row2"><div class="fg"><label class="f" for="oSt">Status</label><select id="oSt">' + OS.map(function (s) { return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + A.statusLabel(s) + '</option>'; }).join('') + '</select></div><div class="fg"><label class="f" for="oPay">Payment</label><select id="oPay"><option value="unpaid"' + (o.payment_status === 'unpaid' ? ' selected' : '') + '>Unpaid</option><option value="paid"' + (o.payment_status === 'paid' ? ' selected' : '') + '>Paid</option></select></div></div>' +
      '<div class="fg"><label class="f" for="oNote">Message shown to the customer</label><textarea id="oNote" rows="2" placeholder="e.g. Ready from 2pm. Delivery fee $5.">' + esc(o.staff_note) + '</textarea></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-red" id="oSave" type="button">Save changes</button><a class="btn btn-line" target="_blank" href="order.html?no=' + encodeURIComponent(o.order_no) + '">View / print slip</a></div><p class="msg" id="oMsg"></p>');
    $('#oSave').onclick = function () {
      if ($('#oSt').value === 'cancelled' && o.status !== 'cancelled' && !confirm('Cancel this order? Stock will be returned to the shelf.')) return;
      A.api('/api/admin/orders/' + id, { method: 'PATCH', body: { status: $('#oSt').value, payment_status: $('#oPay').value, staff_note: $('#oNote').value } }).then(function (d) {
        if (d.success) { closeM(); A.toast('Order updated'); go('orders'); } else { $('#oMsg').className = 'msg err'; $('#oMsg').textContent = d.message; }
      });
    };
  }

  /* ---- products ---- */
  function vProducts() {
    view().innerHTML = '<div class="toolbar"><input id="pq" type="search" placeholder="Search products"><select id="pc"><option value="">All categories</option>' + cats.map(function (c) { return '<option value="' + c.slug + '">' + esc(c.name) + '</option>'; }).join('') + '</select><button class="btn btn-red btn-sm" id="pNew" type="button">+ Add product</button></div><div id="pt"></div>';
    A.api('/api/admin/products').then(function (d) { window.__prods = d.products || []; drawProds(); });
    $('#pq').oninput = drawProds; $('#pc').onchange = drawProds; $('#pNew').onclick = function () { editProd(null); };
  }
  function drawProds() {
    var q = ($('#pq').value || '').toLowerCase(), c = $('#pc').value;
    var rows = (window.__prods || []).filter(function (p) { return (!c || p.category === c) && (!q || p.name.toLowerCase().indexOf(q) > -1); }).map(function (p) {
      var cat = cats.filter(function (x) { return x.slug === p.category; })[0];
      return '<tr style="' + (p.active ? '' : 'opacity:.5') + '"><td style="width:64px"><div class="cart-thumb" style="width:52px;height:52px">' + A.thumb(p) + '</div></td><td><b>' + esc(p.name) + '</b><br><small class="muted">' + esc(cat ? cat.name : p.category) + '</small></td><td>' + A.money(p.price) + '<br><small class="muted">' + esc(p.unit) + '</small></td><td>' + (p.stock === null ? '<span class="muted">not tracked</span>' : p.stock) + '</td><td>' + (!p.active ? pill('cancelled', 'Hidden') : !p.available_flag ? pill('unpaid', 'Out of stock') : pill('paid', 'Live')) + (p.featured ? ' ' + pill('confirmed', 'Popular') : '') + '</td><td><button class="btn btn-navy btn-sm" data-edit="' + p.id + '">Edit</button></td></tr>';
    });
    $('#pt').innerHTML = table(['', 'Product', 'Price', 'Stock', 'Status', ''], rows);
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-edit]'); if (b) editProd(Number(b.dataset.edit)); });
  function editProd(id) {
    var p = id ? (window.__prods || []).filter(function (x) { return x.id === id; })[0] : { name: '', category: cats[0] ? cats[0].slug : '', unit: 'each', price: '', stock: null, description: '', image_raw: '', active: true, available_flag: true, featured: false };
    var img = p.image_raw || '';
    modal('<h2 style="font-size:2rem;margin-bottom:14px">' + (id ? 'Edit product' : 'Add product') + '</h2>' +
      '<div class="fg"><label class="f" for="fN">Name</label><input id="fN" value="' + esc(p.name) + '"></div>' +
      '<div class="row2"><div class="fg"><label class="f" for="fC">Category</label><select id="fC">' + cats.map(function (c) { return '<option value="' + c.slug + '"' + (c.slug === p.category ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div><div class="fg"><label class="f" for="fU">Sold per</label><input id="fU" value="' + esc(p.unit) + '" placeholder="each, per metre, per 50kg bag"></div></div>' +
      '<div class="row2"><div class="fg"><label class="f" for="fP">Price (USD)</label><input id="fP" type="number" step="0.01" min="0" value="' + esc(p.price) + '"></div><div class="fg"><label class="f" for="fS">Stock (blank = not tracked)</label><input id="fS" type="number" min="0" value="' + (p.stock === null ? '' : p.stock) + '"></div></div>' +
      '<div class="fg"><label class="f" for="fD">Description</label><textarea id="fD" rows="3">' + esc(p.description) + '</textarea></div>' +
      '<div class="fg"><label class="f">Photo</label><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="cart-thumb" id="fImgBox">' + (img ? '<img src="' + esc(img.indexOf('uploads/') === 0 ? '/' + img : '/img/' + img) + '" alt="">' : '<div class="tile">' + A.svg(p.category) + '</div>') + '</div><input type="file" id="fF" accept="image/png,image/jpeg,image/webp" style="flex:1;min-width:180px"><button type="button" class="btn btn-line btn-sm" id="fRm">Remove photo</button></div><p class="muted small" style="margin-top:6px">No photo? The shop shows a clean category icon instead.</p></div>' +
      '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:16px"><label><input type="checkbox" id="fA"' + (p.available_flag ? ' checked' : '') + '> In stock / orderable</label><label><input type="checkbox" id="fV"' + (p.active ? ' checked' : '') + '> Visible in shop</label><label><input type="checkbox" id="fF2"' + (p.featured ? ' checked' : '') + '> Show as popular</label></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-red" id="fSave" type="button">Save product</button>' + (id ? '<button class="btn btn-line" id="fDel" type="button">Hide from shop</button>' : '') + '</div><p class="msg" id="fMsg"></p>');
    $('#fRm').onclick = function () { img = ''; $('#fImgBox').innerHTML = '<div class="tile">' + A.svg($('#fC').value) + '</div>'; };
    $('#fF').onchange = function () {
      var f = this.files[0]; if (!f) return;
      if (f.size > 4 * 1024 * 1024) { $('#fMsg').className = 'msg err'; $('#fMsg').textContent = 'Image must be under 4 MB.'; return; }
      var r = new FileReader();
      r.onload = function () {
        $('#fMsg').className = 'msg'; $('#fMsg').textContent = 'Uploading...';
        A.api('/api/admin/upload', { body: { data: r.result } }).then(function (d) { if (d.success) { img = d.path; $('#fImgBox').innerHTML = '<img src="/' + esc(d.path) + '" alt="">'; $('#fMsg').textContent = 'Photo uploaded. Press Save product.'; $('#fMsg').className = 'msg good'; } else { $('#fMsg').className = 'msg err'; $('#fMsg').textContent = d.message; } });
      };
      r.readAsDataURL(f);
    };
    $('#fSave').onclick = function () {
      var body = { name: $('#fN').value, category: $('#fC').value, unit: $('#fU').value, price: $('#fP').value, stock: $('#fS').value, description: $('#fD').value, image: img, available: $('#fA').checked, active: $('#fV').checked, featured: $('#fF2').checked };
      A.api(id ? '/api/admin/products/' + id : '/api/admin/products', { method: id ? 'PUT' : 'POST', body: body }).then(function (d) {
        if (d.success) { closeM(); A.toast('Product saved'); go('products'); } else { $('#fMsg').className = 'msg err'; $('#fMsg').textContent = d.message; }
      });
    };
    if (id) $('#fDel').onclick = function () { if (confirm('Hide this product from the shop? You can show it again later by editing it.')) A.api('/api/admin/products/' + id, { method: 'DELETE' }).then(function () { closeM(); go('products'); }); };
  }

  /* ---- quotes & messages ---- */
  function vQuotes() {
    A.api('/api/admin/quotes').then(function (d) {
      view().innerHTML = table(['Ref', 'From', 'Request', 'Status', ''], (d.quotes || []).map(function (q) {
        return '<tr><td><b>' + esc(q.ref) + '</b><br><small class="muted">' + esc(A.fmtDate(q.created_at)) + '</small></td><td>' + esc(q.name) + '<br><a href="tel:' + esc(q.phone) + '">' + esc(q.phone) + '</a> &middot; <a target="_blank" rel="noopener" href="' + wa(q.phone, 'Hello ' + q.name + ', this is Ricmuk Enterprises about your quote ' + q.ref + '.') + '">WhatsApp</a>' + (q.email ? '<br><small>' + esc(q.email) + '</small>' : '') + '</td><td style="max-width:380px;white-space:pre-wrap">' + (q.category ? '<b>' + esc(q.category) + '</b><br>' : '') + esc(q.details) + '</td><td><select data-qs="' + q.id + '" style="width:auto">' + ['new', 'replied', 'closed'].map(function (s) { return '<option' + (s === q.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td><button class="btn btn-line btn-sm" data-qd="' + q.id + '">Delete</button></td></tr>';
      }));
    });
  }
  function vMessages() {
    A.api('/api/admin/messages').then(function (d) {
      view().innerHTML = table(['From', 'Message', 'Status', ''], (d.messages || []).map(function (m) {
        return '<tr><td><b>' + esc(m.name) + '</b><br><small class="muted">' + esc(A.fmtDate(m.created_at)) + '</small>' + (m.phone ? '<br><a href="tel:' + esc(m.phone) + '">' + esc(m.phone) + '</a> &middot; <a target="_blank" rel="noopener" href="' + wa(m.phone) + '">WhatsApp</a>' : '') + (m.email ? '<br><a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '') + '</td><td style="max-width:460px;white-space:pre-wrap">' + esc(m.message) + '</td><td><select data-ms="' + m.id + '" style="width:auto">' + ['new', 'done'].map(function (s) { return '<option' + (s === m.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td><button class="btn btn-line btn-sm" data-md="' + m.id + '">Delete</button></td></tr>';
      }));
    });
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.qs) A.api('/api/admin/quotes/' + t.dataset.qs, { method: 'PATCH', body: { status: t.value } }).then(function () { A.toast('Updated'); });
    if (t.dataset.ms) A.api('/api/admin/messages/' + t.dataset.ms, { method: 'PATCH', body: { status: t.value } }).then(function () { A.toast('Updated'); });
  });
  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-qd]'), m = e.target.closest('[data-md]');
    if (q && confirm('Delete this quote request?')) A.api('/api/admin/quotes/' + q.dataset.qd, { method: 'DELETE' }).then(function () { go('quotes'); });
    if (m && confirm('Delete this message?')) A.api('/api/admin/messages/' + m.dataset.md, { method: 'DELETE' }).then(function () { go('messages'); });
  });

  /* ---- users ---- */
  function vUsers() {
    A.api('/api/admin/users').then(function (d) {
      view().innerHTML = table(['Name', 'Contact', 'Joined', 'Role', ''], (d.users || []).map(function (u) {
        var me = u.id === A.user.id;
        return '<tr><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.email) + (u.phone ? '<br><small class="muted">' + esc(u.phone) + '</small>' : '') + '</td><td>' + esc(A.fmtDate(u.created_at)) + '</td><td>' + pill(u.role === 'admin' ? 'confirmed' : 'new', u.role) + '</td><td style="white-space:nowrap">' + (me ? '<span class="muted small">You</span>' : '<button class="btn btn-line btn-sm" data-role="' + u.id + '" data-to="' + (u.role === 'admin' ? 'user' : 'admin') + '">' + (u.role === 'admin' ? 'Remove admin' : 'Make admin') + '</button> <button class="btn btn-line btn-sm" data-ud="' + u.id + '">Delete</button>') + '</td></tr>';
      }));
    });
  }
  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-role]'), d = e.target.closest('[data-ud]');
    if (r && confirm('Change this user\'s role to ' + r.dataset.to + '?')) A.api('/api/admin/users/' + r.dataset.role, { method: 'PATCH', body: { role: r.dataset.to } }).then(function (x) { if (!x.success) A.toast(x.message); go('users'); });
    if (d && confirm('Delete this account? Their past orders are kept.')) A.api('/api/admin/users/' + d.dataset.ud, { method: 'DELETE' }).then(function (x) { if (!x.success) A.toast(x.message); go('users'); });
  });

  /* ---- settings ---- */
  var FIELDS = [
    ['Shop details', [['shop_name', 'Shop name'], ['tagline', 'Tagline'], ['address', 'Street address'], ['area', 'Area / suburb'], ['email', 'Email'], ['phone1', 'Phone 1'], ['phone2', 'Phone 2'], ['phone3', 'Phone 3 (optional)'], ['whatsapp', 'WhatsApp number (digits only, with country code, e.g. 263788675136)'], ['facebook', 'Facebook page link']]],
    ['Opening hours', [['hours_weekdays', 'Monday - Friday (e.g. 08:00 - 17:00)'], ['hours_saturday', 'Saturday (e.g. 08:00 - 13:00)'], ['hours_sunday', 'Sunday (e.g. Closed)']]],
    ['Prices & delivery', [['zwg_rate', 'ZWG per 1 USD (0 = hide ZWG amounts)'], ['delivery_fee', 'Delivery fee in USD (0 = staff confirm by phone)'], ['price_notice', 'Price notice shown to customers']]]
  ];
  function vSettings() {
    A.api('/api/admin/settings').then(function (d) {
      var s = d.settings || {};
      view().innerHTML = '<form class="card" id="stF" style="max-width:780px">' + FIELDS.map(function (g) {
        return '<h3 style="margin:6px 0 12px">' + g[0] + '</h3>' + g[1].map(function (f) { return '<div class="fg"><label class="f" for="s_' + f[0] + '">' + f[1] + '</label>' + (f[0] === 'price_notice' ? '<textarea id="s_' + f[0] + '" rows="2">' + esc(s[f[0]]) + '</textarea>' : '<input id="s_' + f[0] + '" value="' + esc(s[f[0]]) + '">') + '</div>'; }).join('');
      }).join('') +
        '<label style="display:flex;gap:10px;margin-bottom:10px"><input type="checkbox" id="s_delivery_enabled"' + (s.delivery_enabled === '1' ? ' checked' : '') + '> Offer delivery at checkout</label>' +
        '<h3 style="margin:14px 0 12px">Payment options</h3>' +
        '<label style="display:flex;gap:10px;margin-bottom:10px"><input type="checkbox" id="s_pay_ecocash"' + (s.pay_ecocash === '1' ? ' checked' : '') + '> Let customers pay by EcoCash at checkout (they enter the reference; you mark the order Paid after seeing the money)</label>' +
        '<div class="row2"><div class="fg"><label class="f" for="s_ecocash_number">EcoCash number</label><input id="s_ecocash_number" value="' + esc(s.ecocash_number) + '" placeholder="e.g. 0771234567"></div><div class="fg"><label class="f" for="s_ecocash_name">Name on the EcoCash account</label><input id="s_ecocash_name" value="' + esc(s.ecocash_name) + '"></div></div>' +
        '<h3 style="margin:14px 0 12px">Go-live check</h3><label style="display:flex;gap:10px;margin-bottom:16px"><input type="checkbox" id="s_prices_confirmed"' + (s.prices_confirmed === '1' ? ' checked' : '') + '> I have checked every product price</label>' +
        '<button class="btn btn-red" type="submit">Save settings</button><p class="msg" id="stMsg"></p></form>' +
        '<div class="card" style="max-width:780px;margin-top:20px"><h3>Backup</h3><p class="muted" style="margin-bottom:12px">Download all orders, products, quotes, messages and settings as a file. Do this weekly and keep a copy.</p><a class="btn btn-navy btn-sm" href="/api/admin/backup">Download backup</a></div>';
      $('#stF').onsubmit = function (e) {
        e.preventDefault();
        var body = {}; FIELDS.forEach(function (g) { g[1].forEach(function (f) { body[f[0]] = $('#s_' + f[0]).value; }); });
        ['delivery_enabled', 'pay_ecocash', 'prices_confirmed'].forEach(function (k) { body[k] = $('#s_' + k).checked ? '1' : '0'; });
        body.ecocash_number = $('#s_ecocash_number').value; body.ecocash_name = $('#s_ecocash_name').value;
        if (body.pay_ecocash === '1' && !body.ecocash_number.trim()) { $('#stMsg').className = 'msg err'; $('#stMsg').textContent = 'Enter the EcoCash number, or untick EcoCash.'; return; }
        A.api('/api/admin/settings', { method: 'PUT', body: body }).then(function (r) { $('#stMsg').className = 'msg ' + (r.success ? 'good' : 'err'); $('#stMsg').textContent = r.success ? 'Saved. The website now uses these details.' : r.message; });
      };
    });
  }
})();
