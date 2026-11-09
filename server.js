/*
 * Ricmuk Enterprises - One Stop Hardware, Kadoma
 * Zero-dependency server: Node 22.5+ (built-in HTTP + SQLite). Run: node server.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { CATEGORIES, PRODUCTS } = require('./seed');

/* ---------- env (.env file, simple KEY=VALUE) ---------- */
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env */ }

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const PUBLIC = path.join(__dirname, 'public');
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOADS = path.join(DATA, 'uploads');
[DATA, UPLOADS].forEach((d) => fs.mkdirSync(d, { recursive: true }));

const db = new DatabaseSync(path.join(DATA, 'ricmuk.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT DEFAULT '', password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (slug TEXT PRIMARY KEY, name TEXT NOT NULL, blurb TEXT DEFAULT '', image TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, unit TEXT DEFAULT 'each', price REAL NOT NULL DEFAULT 0, stock INTEGER, description TEXT DEFAULT '', image TEXT DEFAULT '', active INTEGER DEFAULT 1, available INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_no TEXT UNIQUE, user_id INTEGER, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', method TEXT DEFAULT 'collect', address TEXT DEFAULT '', note TEXT DEFAULT '', payment_method TEXT DEFAULT 'shop', payment_ref TEXT DEFAULT '', payment_status TEXT DEFAULT 'unpaid', status TEXT DEFAULT 'pending', items TEXT NOT NULL, subtotal REAL DEFAULT 0, delivery_fee REAL DEFAULT 0, total REAL DEFAULT 0, staff_note TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT, name TEXT, phone TEXT, email TEXT DEFAULT '', category TEXT DEFAULT '', details TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT DEFAULT '', email TEXT DEFAULT '', message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS hits (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, vid TEXT, path TEXT);
CREATE INDEX IF NOT EXISTS idx_hits_t ON hits(t);
`);

/* ---------- settings ---------- */
const DEFAULTS = {
  shop_name: 'Ricmuk Enterprises',
  tagline: 'One Stop Hardware',
  phone1: '+263 788 675 136',
  phone2: '+263 714 258 377',
  phone3: '+263 77 259 2040',
  whatsapp: '263788675136',
  email: 'ricmuk22@gmail.com',
  address: '70A King Street, Chegutu, Kadoma 6843',
  area: 'Rimuka Light Industry, Kadoma, Zimbabwe',
  facebook: 'https://www.facebook.com/search/top?q=Ricmuk%20Kadoma',
  hours_weekdays: '08:00 - 17:00',
  hours_saturday: '08:00 - 13:00',
  hours_sunday: 'Closed',
  zwg_rate: '0',            // ZWG per 1 USD. 0 = hide ZWG equivalent
  delivery_enabled: '1',
  delivery_fee: '0',        // 0 = fee confirmed by staff by phone
  pay_shop: '1',            // pay at the shop on collection / delivery
  pay_ecocash: '0',
  ecocash_number: '',
  ecocash_name: '',
  price_notice: 'Prices are in USD and may change with the market. Ricmuk will confirm your final total and availability by phone before you pay.',
  prices_confirmed: '0'
};
const getSettings = () => {
  const s = { ...DEFAULTS };
  db.prepare('SELECT k, v FROM settings').all().forEach((r) => { s[r.k] = r.v; });
  return s;
};
const PUBLIC_KEYS = Object.keys(DEFAULTS).filter((k) => k !== 'prices_confirmed');

/* ---------- seed ---------- */
if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
  const ic = db.prepare('INSERT INTO categories (slug,name,blurb,image,sort) VALUES (?,?,?,?,?)');
  CATEGORIES.forEach((c, i) => ic.run(c[0], c[1], c[2], c[3], i));
}
if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
  const ip = db.prepare('INSERT INTO products (slug,name,category,unit,price,stock,description,image,featured) VALUES (?,?,?,?,?,?,?,?,?)');
  const feat = new Set(['ibr-04', 'cement-50', 'flash-door', 'jojo-2500', 'tile-porcelain', 'angle-40', 'timber-76', 'sub-ac']);
  PRODUCTS.forEach((p) => ip.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], feat.has(p[0]) ? 1 : 0));
}

/* ---------- crypto helpers ---------- */
const hashPw = (pw) => { const salt = crypto.randomBytes(16).toString('hex'); return `s1$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`; };
const checkPw = (pw, stored) => {
  const [v, salt, hash] = String(stored).split('$');
  if (v !== 's1' || !salt || !hash) return false;
  const a = crypto.scryptSync(pw, salt, 64), b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const SECRET = (() => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const f = path.join(DATA, '.session-secret');
  try { const v = fs.readFileSync(f, 'utf8').trim(); if (v.length >= 32) return v; } catch (e) { /* create */ }
  const v = crypto.randomBytes(48).toString('hex');
  try { fs.writeFileSync(f, v, { mode: 0o600 }); } catch (e) { /* ro disk */ }
  return v;
})();
const SESSION_MS = 30 * 24 * 3600 * 1000;
const sign = (body) => crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
const makeToken = (u) => { const b = Buffer.from(JSON.stringify({ id: u.id, exp: Date.now() + SESSION_MS })).toString('base64url'); return `${b}.${sign(b)}`; };
function readUser(req) {
  const m = /(?:^|;\s*)ric_auth=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [b, s] = m[1].split('.');
  if (!b || !s || sign(b) !== s) return null;
  try {
    const d = JSON.parse(Buffer.from(b, 'base64url').toString());
    if (!(d.exp > Date.now())) return null;
    return db.prepare('SELECT id,name,email,phone,role FROM users WHERE id=?').get(d.id) || null;
  } catch (e) { return null; }
}
const cookie = (val, age) => `ric_auth=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${IS_PROD ? '; Secure' : ''}`;

/* ---------- admin account ---------- */
const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@ricmuk.co.zw').toLowerCase();
if (process.env.RESET_ADMIN_PASSWORD === '1' && process.env.ADMIN_PASSWORD && db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)) {
  db.prepare("UPDATE users SET password_hash=?, role='admin' WHERE email=?").run(hashPw(process.env.ADMIN_PASSWORD), adminEmail);
  console.log('  Admin password reset from ADMIN_PASSWORD. Remove RESET_ADMIN_PASSWORD afterwards.');
}
if (!db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)) {
  let pw = process.env.ADMIN_PASSWORD;
  const generated = !pw;
  if (!pw) pw = crypto.randomBytes(6).toString('hex');
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?, 'admin')").run('Ricmuk Admin', adminEmail, hashPw(pw));
  console.log(`\n  Admin account created\n    email:    ${adminEmail}\n    password: ${pw}${generated ? '   (generated: save it now, it is shown only once. Set ADMIN_PASSWORD in .env to choose your own)' : ''}\n`);
}

/* ---------- utils ---------- */
const clean = (v, max = 200) => String(v == null ? '' : v).trim().slice(0, max);
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const digits = (p) => String(p || '').replace(/\D/g, '');
const samePhone = (a, b) => { a = digits(a); b = digits(b); return a.length >= 7 && b.length >= 7 && a.slice(-9) === b.slice(-9); };
const money = (n) => Math.round(n * 100) / 100;
const STATUSES = ['pending', 'confirmed', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

const buckets = new Map();
function limited(req, key, max, windowMs) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const k = key + ':' + ip, now = Date.now();
  const b = (buckets.get(k) || []).filter((t) => now - t < windowMs);
  b.push(now); buckets.set(k, b);
  if (buckets.size > 5000) for (const [kk, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(kk);
  return b.length > max;
}

const mapProduct = (p) => ({
  id: p.id, slug: p.slug, name: p.name, category: p.category, unit: p.unit, price: p.price,
  description: p.description, image: p.image ? (p.image.startsWith('uploads/') ? '/' + p.image : '/img/' + p.image) : '',
  available: !!p.available && (p.stock === null || p.stock > 0), stock: p.stock, low: p.stock !== null && p.stock > 0 && p.stock <= 5, featured: !!p.featured
});
const parseOrder = (o) => ({ ...o, items: JSON.parse(o.items || '[]') });

function nextOrderNo() {
  const d = new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, '');
  let no;
  do { no = `RIC-${d}-${crypto.randomInt(1000, 9999)}`; } while (db.prepare('SELECT 1 FROM orders WHERE order_no=?').get(no));
  return no;
}

/* ---------- http plumbing ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.mp4': 'video/mp4' };
const send = (res, code, obj, headers = {}) => { const b = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(b); };
const fail = (res, code, message) => send(res, code, { success: false, message });
const ok = (res, extra = {}) => send(res, 200, { success: true, ...extra });

function readBody(req, limit = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch (e) { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

function serveFile(req, res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(req, res);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache || (ext === '.html' ? 'no-cache' : 'public, max-age=3600'), 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}
function notFound(req, res) {
  if ((req.url || '').startsWith('/api/')) return fail(res, 404, 'Not found.');
  fs.readFile(path.join(PUBLIC, '404.html'), (e, b) => { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(e ? 'Not found' : b); });
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const p = url.pathname, m = req.method;
  const user = readUser(req);
  const isAdmin = user && user.role === 'admin';
  const needAdmin = () => { if (!isAdmin) { fail(res, user ? 403 : 401, user ? 'Admin only.' : 'Please sign in first.'); return false; } return true; };
  const body = (m === 'POST' || m === 'PUT' || m === 'PATCH') ? await readBody(req, p === '/api/admin/upload' ? 8 * 1024 * 1024 : 256 * 1024) : {};
  let r;

  if (p === '/api/health') return ok(res, { uptime: Math.round(process.uptime()) });

  if (p === '/api/config' && m === 'GET') {
    const s = getSettings(), c = {};
    PUBLIC_KEYS.forEach((k) => { c[k] = s[k]; });
    if (s.pay_ecocash !== '1') { c.ecocash_number = ''; c.ecocash_name = ''; }
    return send(res, 200, { success: true, config: c });
  }
  if (p === '/api/shop' && m === 'GET') {
    const cats = db.prepare('SELECT slug,name,blurb,image FROM categories ORDER BY sort').all().map((c) => ({ ...c, image: c.image ? '/img/' + c.image : '' }));
    const prods = db.prepare('SELECT * FROM products WHERE active=1 ORDER BY featured DESC, name').all().map(mapProduct);
    return send(res, 200, { success: true, categories: cats, products: prods });
  }
  if (p === '/api/track' && m === 'POST') {
    if (user && user.role === 'admin') return ok(res);
    const vid = clean(body.vid, 40), pg = clean(body.path, 120);
    if (vid && pg && !limited(req, 'hit', 120, 60000)) db.prepare('INSERT INTO hits (t,vid,path) VALUES (?,?,?)').run(Date.now(), vid, pg);
    return ok(res);
  }

  /* --- auth --- */
  if (p === '/api/session' && m === 'GET') return send(res, 200, { success: true, user });
  if (p === '/api/signup' && m === 'POST') {
    if (limited(req, 'auth', 10, 15 * 60000)) return fail(res, 429, 'Too many attempts. Please wait 15 minutes.');
    const name = clean(body.name, 80), email = clean(body.email, 120).toLowerCase(), phone = clean(body.phone, 30), pw = String(body.password || '');
    if (name.length < 2) return fail(res, 400, 'Please enter your name.');
    if (!isEmail(email)) return fail(res, 400, 'Please enter a valid email address.');
    if (pw.length < 8) return fail(res, 400, 'Password must be at least 8 characters.');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return fail(res, 409, 'An account with this email already exists. Please sign in.');
    const id = db.prepare("INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?, 'user')").run(name, email, phone, hashPw(pw)).lastInsertRowid;
    const u = db.prepare('SELECT id,name,email,phone,role FROM users WHERE id=?').get(id);
    return send(res, 200, { success: true, user: u }, { 'Set-Cookie': cookie(makeToken(u), SESSION_MS / 1000) });
  }
  if (p === '/api/login' && m === 'POST') {
    if (limited(req, 'auth', 10, 15 * 60000)) return fail(res, 429, 'Too many attempts. Please wait 15 minutes.');
    const email = clean(body.email, 120).toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!row || !checkPw(String(body.password || ''), row.password_hash)) return fail(res, 401, 'Wrong email or password.');
    return send(res, 200, { success: true, user: { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role } }, { 'Set-Cookie': cookie(makeToken(row), SESSION_MS / 1000) });
  }
  if (p === '/api/account/password' && m === 'POST') {
    if (!user) return fail(res, 401, 'Please sign in first.');
    if (limited(req, 'auth', 10, 15 * 60000)) return fail(res, 429, 'Too many attempts. Please wait 15 minutes.');
    const row = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
    if (!checkPw(String(body.current || ''), row.password_hash)) return fail(res, 400, 'Your current password is wrong.');
    const np = String(body.password || '');
    if (np.length < 8) return fail(res, 400, 'New password must be at least 8 characters.');
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPw(np), user.id);
    return ok(res);
  }
  if (p === '/api/account/profile' && m === 'POST') {
    if (!user) return fail(res, 401, 'Please sign in first.');
    const name = clean(body.name, 80);
    if (name.length < 2) return fail(res, 400, 'Please enter your name.');
    db.prepare('UPDATE users SET name=?, phone=? WHERE id=?').run(name, clean(body.phone, 30), user.id);
    return ok(res);
  }
  if (p === '/api/logout' && m === 'POST') return send(res, 200, { success: true }, { 'Set-Cookie': cookie('', 0) });

  /* --- orders --- */
  if (p === '/api/orders' && m === 'POST') {
    if (limited(req, 'order', 12, 60 * 60000)) return fail(res, 429, 'Too many orders from this connection. Please call us on the shop number.');
    const s = getSettings();
    const items = Array.isArray(body.items) ? body.items.slice(0, 60) : [];
    if (!items.length) return fail(res, 400, 'Your cart is empty.');
    const c = body.customer || {};
    const name = clean(c.name, 80), phone = clean(c.phone, 30), email = clean(c.email, 120).toLowerCase();
    if (name.length < 2) return fail(res, 400, 'Please enter your name.');
    if (digits(phone).length < 9) return fail(res, 400, 'Please enter a phone number we can reach you on.');
    if (email && !isEmail(email)) return fail(res, 400, 'That email address does not look right.');
    const method = body.method === 'delivery' ? 'delivery' : 'collect';
    if (method === 'delivery' && s.delivery_enabled !== '1') return fail(res, 400, 'Delivery is not available right now. Please choose collection.');
    const address = clean(c.address, 300);
    if (method === 'delivery' && address.length < 6) return fail(res, 400, 'Please enter your delivery address.');
    let pay = ['shop', 'ecocash'].includes(body.payment) ? body.payment : 'shop';
    if (pay === 'ecocash' && s.pay_ecocash !== '1') pay = 'shop';
    const lines = [];
    let subtotal = 0;
    for (const it of items) {
      const prod = db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(num(it.id));
      const qty = Math.floor(num(it.qty));
      if (!prod || qty < 1 || qty > 9999) return fail(res, 400, 'One of the items in your cart is no longer available. Please refresh your cart.');
      if (!prod.available || (prod.stock !== null && prod.stock < qty)) return fail(res, 409, `Sorry, ${prod.name} ${prod.stock ? 'only has ' + prod.stock + ' left' : 'is out of stock'}.`);
      lines.push({ id: prod.id, name: prod.name, unit: prod.unit, price: prod.price, qty, line: money(prod.price * qty) });
      subtotal += prod.price * qty;
    }
    const fee = method === 'delivery' ? num(s.delivery_fee) : 0;
    const orderNo = nextOrderNo();
    db.exec('BEGIN');
    try {
      for (const l of lines) db.prepare('UPDATE products SET stock = stock - ? WHERE id=? AND stock IS NOT NULL').run(l.qty, l.id);
      db.prepare('INSERT INTO orders (order_no,user_id,name,phone,email,method,address,note,payment_method,payment_ref,items,subtotal,delivery_fee,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(orderNo, user ? user.id : null, name, phone, email, method, address, clean(c.note, 500), pay, clean(body.paymentRef, 60), JSON.stringify(lines), money(subtotal), fee, money(subtotal + fee));
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    return ok(res, { order_no: orderNo, total: money(subtotal + fee) });
  }
  if (p === '/api/orders/track' && m === 'GET') {
    if (limited(req, 'track', 40, 15 * 60000)) return fail(res, 429, 'Too many lookups. Please wait a few minutes.');
    const no = clean(url.searchParams.get('no'), 40).toUpperCase();
    const o = db.prepare('SELECT * FROM orders WHERE order_no=?').get(no);
    const allowed = o && (isAdmin || (user && o.user_id === user.id) || samePhone(o.phone, url.searchParams.get('phone')));
    if (!allowed) return fail(res, 404, 'We could not find an order with that number and phone. Check both and try again.');
    const out = parseOrder(o); delete out.user_id;
    return send(res, 200, { success: true, order: out });
  }
  if (p === '/api/my/orders' && m === 'GET') {
    if (!user) return fail(res, 401, 'Please sign in first.');
    const rows = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 100').all(user.id).map(parseOrder);
    return send(res, 200, { success: true, orders: rows });
  }
  if (p === '/api/my/orders/cancel' && m === 'POST') {
    if (!user) return fail(res, 401, 'Please sign in first.');
    const o = db.prepare('SELECT * FROM orders WHERE order_no=? AND user_id=?').get(clean(body.order_no, 40), user.id);
    if (!o) return fail(res, 404, 'Order not found.');
    if (o.status !== 'pending') return fail(res, 400, 'This order is already being processed. Please call the shop to change it.');
    cancelOrder(o);
    return ok(res);
  }

  /* --- quotes & contact --- */
  if (p === '/api/quotes' && m === 'POST') {
    if (limited(req, 'form', 8, 60 * 60000)) return fail(res, 429, 'Too many requests. Please call us instead.');
    const name = clean(body.name, 80), phone = clean(body.phone, 30), details = clean(body.details, 2000);
    if (name.length < 2 || digits(phone).length < 9) return fail(res, 400, 'Please enter your name and a phone number.');
    if (details.length < 5) return fail(res, 400, 'Please tell us what you need.');
    const ref = 'Q-' + crypto.randomInt(10000, 99999);
    db.prepare('INSERT INTO quotes (ref,name,phone,email,category,details) VALUES (?,?,?,?,?,?)').run(ref, name, phone, clean(body.email, 120), clean(body.category, 60), details);
    return ok(res, { ref });
  }
  if (p === '/api/contact' && m === 'POST') {
    if (limited(req, 'form', 8, 60 * 60000)) return fail(res, 429, 'Too many messages. Please call us instead.');
    const name = clean(body.name, 80), message = clean(body.message, 2000);
    if (name.length < 2 || message.length < 5) return fail(res, 400, 'Please enter your name and a message.');
    if (!clean(body.phone, 30) && !isEmail(clean(body.email, 120))) return fail(res, 400, 'Please add a phone number or email so we can reply.');
    db.prepare('INSERT INTO messages (name,phone,email,message) VALUES (?,?,?,?)').run(name, clean(body.phone, 30), clean(body.email, 120), message);
    return ok(res);
  }

  /* --- admin --- */
  if (p.startsWith('/api/admin/')) {
    if (!needAdmin()) return;
    const parts = p.split('/').slice(3); // after /api/admin/
    const [res1, idStr] = parts; const id = num(idStr);

    if (res1 === 'summary' && m === 'GET') {
      const one = (sql, ...a) => db.prepare(sql).get(...a);
      const day = 86400000, now = Date.now();
      const visits = [];
      for (let i = 6; i >= 0; i--) {
        const from = new Date(new Date(now + 7200000).toISOString().slice(0, 10) + 'T00:00:00Z').getTime() - 7200000 - i * day;
        const row = one('SELECT COUNT(*) hits, COUNT(DISTINCT vid) vis FROM hits WHERE t>=? AND t<?', from, from + day);
        visits.push({ day: new Date(from + 7200000).toISOString().slice(5, 10), hits: row.hits, visitors: row.vis });
      }
      const s = getSettings();
      return send(res, 200, {
        success: true, visits, prices_confirmed: s.prices_confirmed === '1',
        counts: {
          pending: one("SELECT COUNT(*) c FROM orders WHERE status='pending'").c,
          open: one("SELECT COUNT(*) c FROM orders WHERE status IN ('pending','confirmed','ready','out_for_delivery')").c,
          orders: one('SELECT COUNT(*) c FROM orders').c,
          revenue: money(one("SELECT COALESCE(SUM(total),0) c FROM orders WHERE status='completed'").c),
          quotes: one("SELECT COUNT(*) c FROM quotes WHERE status='new'").c,
          messages: one("SELECT COUNT(*) c FROM messages WHERE status='new'").c,
          products: one('SELECT COUNT(*) c FROM products WHERE active=1').c,
          lowStock: one('SELECT COUNT(*) c FROM products WHERE active=1 AND stock IS NOT NULL AND stock<=5').c,
          users: one('SELECT COUNT(*) c FROM users').c
        }
      });
    }
    if (res1 === 'products') {
      if (m === 'GET') return send(res, 200, { success: true, products: db.prepare('SELECT * FROM products ORDER BY category, name').all().map((x) => ({ ...mapProduct(x), active: !!x.active, available_flag: !!x.available, image_raw: x.image })) });
      if (m === 'POST' || (m === 'PUT' && id)) {
        const name = clean(body.name, 140), category = clean(body.category, 40);
        if (!name) return fail(res, 400, 'Product name is required.');
        if (!db.prepare('SELECT 1 FROM categories WHERE slug=?').get(category)) return fail(res, 400, 'Pick a category.');
        const price = num(body.price, -1); if (price < 0) return fail(res, 400, 'Enter a valid price.');
        const stock = body.stock === '' || body.stock == null ? null : Math.max(0, Math.floor(num(body.stock)));
        const f = [name, category, clean(body.unit, 30) || 'each', price, stock, clean(body.description, 1200), clean(body.image, 200), body.active === false ? 0 : 1, body.available === false ? 0 : 1, body.featured ? 1 : 0];
        if (m === 'POST') {
          let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'item';
          while (db.prepare('SELECT 1 FROM products WHERE slug=?').get(slug)) slug += '-' + crypto.randomInt(10, 99);
          const nid = db.prepare('INSERT INTO products (name,category,unit,price,stock,description,image,active,available,featured,slug) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...f, slug).lastInsertRowid;
          return ok(res, { id: Number(nid) });
        }
        db.prepare('UPDATE products SET name=?,category=?,unit=?,price=?,stock=?,description=?,image=?,active=?,available=?,featured=? WHERE id=?').run(...f, id);
        return ok(res);
      }
      if (m === 'DELETE' && id) {
        db.prepare('UPDATE products SET active=0 WHERE id=?').run(id); // keep history; just hide
        return ok(res);
      }
    }
    if (res1 === 'orders') {
      if (m === 'GET') return send(res, 200, { success: true, orders: db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 500').all().map(parseOrder) });
      if (m === 'PATCH' && id) {
        const o = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
        if (!o) return fail(res, 404, 'Order not found.');
        const status = body.status !== undefined ? clean(body.status, 30) : o.status;
        if (!STATUSES.includes(status)) return fail(res, 400, 'Bad status.');
        if (status === 'cancelled' && o.status !== 'cancelled') cancelOrder(o);
        else if (o.status === 'cancelled' && status !== 'cancelled') return fail(res, 400, 'A cancelled order cannot be reopened. Ask the customer to place a new order.');
        const ps = body.payment_status !== undefined ? (body.payment_status === 'paid' ? 'paid' : 'unpaid') : o.payment_status;
        db.prepare("UPDATE orders SET status=?, payment_status=?, staff_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, ps, body.staff_note !== undefined ? clean(body.staff_note, 500) : o.staff_note, id);
        return ok(res);
      }
    }
    if (res1 === 'quotes') {
      if (m === 'GET') return send(res, 200, { success: true, quotes: db.prepare('SELECT * FROM quotes ORDER BY id DESC LIMIT 300').all() });
      if (m === 'PATCH' && id) { db.prepare('UPDATE quotes SET status=? WHERE id=?').run(['new', 'replied', 'closed'].includes(body.status) ? body.status : 'new', id); return ok(res); }
      if (m === 'DELETE' && id) { db.prepare('DELETE FROM quotes WHERE id=?').run(id); return ok(res); }
    }
    if (res1 === 'messages') {
      if (m === 'GET') return send(res, 200, { success: true, messages: db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 300').all() });
      if (m === 'PATCH' && id) { db.prepare('UPDATE messages SET status=? WHERE id=?').run(['new', 'done'].includes(body.status) ? body.status : 'new', id); return ok(res); }
      if (m === 'DELETE' && id) { db.prepare('DELETE FROM messages WHERE id=?').run(id); return ok(res); }
    }
    if (res1 === 'users') {
      if (m === 'GET') return send(res, 200, { success: true, users: db.prepare('SELECT id,name,email,phone,role,created_at FROM users ORDER BY id DESC').all() });
      if (m === 'PATCH' && id) {
        if (id === user.id) return fail(res, 400, 'You cannot change your own role.');
        db.prepare('UPDATE users SET role=? WHERE id=?').run(body.role === 'admin' ? 'admin' : 'user', id); return ok(res);
      }
      if (m === 'DELETE' && id) {
        if (id === user.id) return fail(res, 400, 'You cannot delete your own account.');
        db.prepare('UPDATE orders SET user_id=NULL WHERE user_id=?').run(id);
        db.prepare('DELETE FROM users WHERE id=?').run(id); return ok(res);
      }
    }
    if (res1 === 'backup' && m === 'GET') {
      const dump = {};
      ['categories', 'products', 'orders', 'quotes', 'messages', 'settings'].forEach((t) => { dump[t] = db.prepare('SELECT * FROM ' + t).all(); });
      dump.users = db.prepare('SELECT id,name,email,phone,role,created_at FROM users').all();
      dump.exported_at = new Date().toISOString();
      const b = JSON.stringify(dump, null, 1);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="ricmuk-backup-${dump.exported_at.slice(0, 10)}.json"`, 'Cache-Control': 'no-store' });
      return res.end(b);
    }
    if (res1 === 'categories' && m === 'GET') return send(res, 200, { success: true, categories: db.prepare('SELECT slug,name FROM categories ORDER BY sort').all() });
    if (res1 === 'settings') {
      if (m === 'GET') return send(res, 200, { success: true, settings: getSettings() });
      if (m === 'PUT') {
        const up = db.prepare('INSERT INTO settings (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v');
        Object.keys(DEFAULTS).forEach((k) => { if (body[k] !== undefined) up.run(k, clean(body[k], 500)); });
        return ok(res);
      }
    }
    if (res1 === 'upload' && m === 'POST') {
      const mt = /^data:image\/(png|jpe?g|webp);base64,(.+)$/s.exec(String(body.data || ''));
      if (!mt) return fail(res, 400, 'Please choose a JPG, PNG or WEBP image.');
      const buf = Buffer.from(mt[2], 'base64');
      if (buf.length > 5 * 1024 * 1024) return fail(res, 400, 'Image is too large (max 5 MB).');
      const ext = mt[1] === 'png' ? 'png' : mt[1] === 'webp' ? 'webp' : 'jpg';
      const fname = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS, fname), buf);
      return ok(res, { path: 'uploads/' + fname });
    }
  }
  return fail(res, 404, 'Not found.');
}

function cancelOrder(o) {
  if (o.status === 'cancelled') return;
  db.exec('BEGIN');
  try {
    JSON.parse(o.items || '[]').forEach((l) => db.prepare('UPDATE products SET stock = stock + ? WHERE id=? AND stock IS NOT NULL').run(l.qty, l.id));
    db.prepare("UPDATE orders SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(o.id);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) {
      try { return await api(req, res, url); }
      catch (e) {
        if (e.message === 'too large') return fail(res, 413, 'That is too large.');
        if (e.message === 'bad json') return fail(res, 400, 'Bad request.');
        console.error('API error', req.method, url.pathname, e);
        return fail(res, 500, 'Something went wrong on our side. Please try again.');
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let rel;
    try { rel = decodeURIComponent(url.pathname); } catch (e) { return notFound(req, res); }
    if (rel.startsWith('/uploads/')) {
      const f = path.join(UPLOADS, path.basename(rel));
      return serveFile(req, res, f, 'public, max-age=604800');
    }
    if (rel === '/') rel = '/index.html';
    if (rel.length > 1 && !path.extname(rel)) rel += '.html'; // /shop -> /shop.html
    const f = path.join(PUBLIC, path.normalize(rel));
    if (!f.startsWith(PUBLIC + path.sep)) return notFound(req, res);
    return serveFile(req, res, f);
  } catch (e) { console.error(e); res.writeHead(500); res.end('Server error'); }
});
server.listen(PORT, () => console.log(`Ricmuk Enterprises site running at http://localhost:${PORT}`));
