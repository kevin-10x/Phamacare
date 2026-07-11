import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, signJwt, verifyJwt, newId, JwtPayload } from './auth';

type Bindings = {
  DB: D1Database;
  PRESCRIPTIONS: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
};

type Variables = {
  user: JwtPayload;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', cors({
  origin: (origin, c) => {
    const allowed = (c.env.CORS_ORIGIN || '').split(',').map((s: string) => s.trim());
    if (allowed.includes('*') || allowed.includes(origin)) return origin;
    return allowed[0] || origin;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

function getJwtSecret(env: { JWT_SECRET?: string }): string {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return env.JWT_SECRET;
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Not authenticated' }, 401);
  const payload = await verifyJwt(token, getJwtSecret(c.env));
  if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);
  c.set('user', payload);
  await next();
}

function requireRole(...roles: string[]) {
  return async (c: any, next: any) => {
    const user = c.get('user') as JwtPayload;
    if (!roles.includes(user.role)) return c.json({ error: 'Forbidden' }, 403);
    await next();
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }));

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json();
  const { email, password, fullName, phone } = body;
  if (!email || !password || !fullName) return c.json({ error: 'Missing required fields' }, 400);
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'Invalid email format' }, 400);
  if (typeof password !== 'string' || password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);
  if (typeof fullName !== 'string' || fullName.trim().length < 2) return c.json({ error: 'Full name is required' }, 400);
  if (phone && typeof phone !== 'string') return c.json({ error: 'Invalid phone number' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const { hash, salt } = await hashPassword(password);
  const id = newId('usr');
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, phone, full_name, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, email, phone || null, fullName, hash, salt, 'customer')
    .run();

  const token = await signJwt(
    { sub: id, role: 'customer', email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    getJwtSecret(c.env)
  );
  return c.json({ token, user: { id, email, fullName, role: 'customer' } }, 201);
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<any>();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

  const token = await signJwt(
    { sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    getJwtSecret(c.env)
  );
  return c.json({
    token,
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, loyaltyPoints: user.loyalty_points },
  });
});

app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare(
    'SELECT id, email, full_name, phone, role, loyalty_points, created_at FROM users WHERE id = ?'
  )
    .bind(user.sub)
    .first();
  return c.json({ user: row });
});

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------
app.get('/api/categories', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY name').all();
  return c.json({ categories: results });
});

// ---------------------------------------------------------------------------
// MEDICINES
// ---------------------------------------------------------------------------
app.get('/api/medicines', async (c) => {
  const { category, search, featured } = c.req.query();
  let query = 'SELECT * FROM medicines WHERE 1=1';
  const params: any[] = [];
  if (category) {
    query += ' AND category_id = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (brand_name LIKE ? OR generic_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (featured === 'true') {
    query += ' AND is_featured = 1';
  }
  query += ' ORDER BY created_at DESC LIMIT 60';
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ medicines: results });
});

app.get('/api/medicines/:id', async (c) => {
  const id = c.req.param('id');
  const medicine = await c.env.DB.prepare('SELECT * FROM medicines WHERE id = ?').bind(id).first();
  if (!medicine) return c.json({ error: 'Not found' }, 404);
  const { results: similar } = await c.env.DB.prepare(
    'SELECT * FROM medicines WHERE category_id = ? AND id != ? LIMIT 4'
  )
    .bind((medicine as any).category_id, id)
    .all();
  return c.json({ medicine, similar });
});

// Admin: create / update / delete medicines
app.post('/api/medicines', requireAuth, requireRole('admin'), async (c) => {
  const b = await c.req.json();
  if (!b.categoryId || !b.brandName) return c.json({ error: 'categoryId and brandName are required' }, 400);
  if (typeof b.price !== 'number' || b.price < 0) return c.json({ error: 'Valid price is required' }, 400);
  if (b.stockQuantity !== undefined && (typeof b.stockQuantity !== 'number' || b.stockQuantity < 0)) return c.json({ error: 'Stock quantity cannot be negative' }, 400);
  if (b.discountPercent !== undefined && (typeof b.discountPercent !== 'number' || b.discountPercent < 0 || b.discountPercent > 100)) return c.json({ error: 'Discount must be between 0 and 100' }, 400);
  const id = newId('med');
  await c.env.DB.prepare(
    `INSERT INTO medicines
     (id, category_id, brand_name, generic_name, manufacturer, strength, dosage_form, price, discount_percent,
      stock_quantity, image_url, description, uses, dosage_instructions, side_effects, warnings,
      storage_conditions, requires_prescription, is_featured)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      id, b.categoryId, b.brandName, b.genericName || null, b.manufacturer || null, b.strength || null,
      b.dosageForm || null, b.price, b.discountPercent || 0, b.stockQuantity || 0, b.imageUrl || '',
      b.description || '', b.uses || '', b.dosageInstructions || '', b.sideEffects || '', b.warnings || '',
      b.storageConditions || '', b.requiresPrescription ? 1 : 0, b.isFeatured ? 1 : 0
    )
    .run();
  return c.json({ id }, 201);
});

app.put('/api/medicines/:id', requireAuth, requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE medicines SET brand_name=?, price=?, discount_percent=?, stock_quantity=?, description=? WHERE id=?`
  )
    .bind(b.brandName, b.price, b.discountPercent || 0, b.stockQuantity || 0, b.description || '', id)
    .run();
  return c.json({ success: true });
});

app.delete('/api/medicines/:id', requireAuth, requireRole('admin'), async (c) => {
  await c.env.DB.prepare('DELETE FROM medicines WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// CART
// ---------------------------------------------------------------------------
app.get('/api/cart', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT ci.id as cart_item_id, ci.quantity, m.* FROM cart_items ci
     JOIN medicines m ON m.id = ci.medicine_id WHERE ci.user_id = ?`
  )
    .bind(user.sub)
    .all();
  return c.json({ items: results });
});

app.post('/api/cart', requireAuth, async (c) => {
  const user = c.get('user');
  const { medicineId, quantity } = await c.req.json();
  const id = newId('cart');
  await c.env.DB.prepare(
    `INSERT INTO cart_items (id, user_id, medicine_id, quantity) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, medicine_id) DO UPDATE SET quantity = MAX(1, quantity + excluded.quantity)`
  )
    .bind(id, user.sub, medicineId, quantity || 1)
    .run();
  return c.json({ success: true });
});

app.delete('/api/cart/:medicineId', requireAuth, async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare('DELETE FROM cart_items WHERE user_id = ? AND medicine_id = ?')
    .bind(user.sub, c.req.param('medicineId'))
    .run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// PRESCRIPTIONS  (stored in R2; metadata in D1)
// ---------------------------------------------------------------------------
app.post('/api/prescriptions', requireAuth, async (c) => {
  const user = c.get('user');
  const form = await c.req.formData();
  const file = form.get('file') as unknown as File;
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const id = newId('rx');
  const key = `prescriptions/${user.sub}/${id}-${file.name}`;
  await c.env.PRESCRIPTIONS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  await c.env.DB.prepare(
    'INSERT INTO prescriptions (id, user_id, file_key, file_name) VALUES (?, ?, ?, ?)'
  )
    .bind(id, user.sub, key, file.name)
    .run();
  return c.json({ id, status: 'pending' }, 201);
});

app.get('/api/prescriptions/mine', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT id, file_name, status, pharmacist_notes, created_at FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(user.sub)
    .all();
  return c.json({ prescriptions: results });
});

// Pharmacist queue
app.get('/api/prescriptions/queue', requireAuth, requireRole('pharmacist', 'admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.full_name, u.email FROM prescriptions p JOIN users u ON u.id = p.user_id
     WHERE p.status = 'pending' ORDER BY p.created_at ASC`
  ).all();
  return c.json({ prescriptions: results });
});

app.post('/api/prescriptions/:id/review', requireAuth, requireRole('pharmacist', 'admin'), async (c) => {
  const user = c.get('user');
  const { status, notes } = await c.req.json(); // status: approved | rejected
  if (!status || !['approved', 'rejected'].includes(status)) return c.json({ error: 'Status must be approved or rejected' }, 400);
  await c.env.DB.prepare(
    'UPDATE prescriptions SET status = ?, pharmacist_notes = ?, reviewed_by = ? WHERE id = ?'
  )
    .bind(status, notes || null, user.sub, c.req.param('id'))
    .run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// ORDERS / CHECKOUT
// ---------------------------------------------------------------------------
app.post('/api/orders', requireAuth, async (c) => {
  const user = c.get('user');
  const { paymentMethod, deliveryAddress, prescriptionId } = await c.req.json();
  if (!paymentMethod || !['mpesa', 'card', 'cod'].includes(paymentMethod)) return c.json({ error: 'Valid payment method required (mpesa, card, cod)' }, 400);
  if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5) return c.json({ error: 'Delivery address is required' }, 400);

  const { results: cartItems } = await c.env.DB.prepare(
    `SELECT ci.quantity, m.id as medicine_id, m.price, m.discount_percent, m.requires_prescription
     FROM cart_items ci JOIN medicines m ON m.id = ci.medicine_id WHERE ci.user_id = ?`
  )
    .bind(user.sub)
    .all<any>();

  if (!cartItems.length) return c.json({ error: 'Cart is empty' }, 400);

  const needsRx = cartItems.some((i) => i.requires_prescription);
  if (needsRx && !prescriptionId) {
    return c.json({ error: 'A verified prescription is required for one or more items in your cart' }, 400);
  }

  const subtotal = cartItems.reduce(
    (sum, i) => sum + i.quantity * i.price * (1 - i.discount_percent / 100),
    0
  );
  const deliveryFee = subtotal > 3000 ? 0 : 200;
  const total = subtotal + deliveryFee;

  const orderId = newId('ord');
  await c.env.DB.prepare(
    `INSERT INTO orders (id, user_id, payment_method, subtotal, delivery_fee, total, delivery_address, prescription_id)
     VALUES (?,?,?,?,?,?,?,?)`
  )
    .bind(orderId, user.sub, paymentMethod, subtotal, deliveryFee, total, deliveryAddress || null, prescriptionId || null)
    .run();

  for (const item of cartItems) {
    await c.env.DB.prepare(
      'INSERT INTO order_items (id, order_id, medicine_id, quantity, unit_price) VALUES (?,?,?,?,?)'
    )
      .bind(newId('oit'), orderId, item.medicine_id, item.quantity, item.price)
      .run();
  }
  await c.env.DB.prepare('DELETE FROM cart_items WHERE user_id = ?').bind(user.sub).run();

  // Notify user
  await createNotification(c.env.DB, user.sub, 'Order placed', `Your order #${orderId.slice(-8).toUpperCase()} has been created.`, `/dashboard`);

  // --- Payment: M-Pesa STK push stub -------------------------------------
  // Wire up the real Safaricom Daraja API here. See src/mpesa.ts for the
  // request shape; this MVP marks the order pending until a webhook (or the
  // admin) confirms payment.
  return c.json({ orderId, total, status: 'pending', message: 'Order created. Awaiting payment confirmation.' }, 201);
});

app.get('/api/orders/mine', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(user.sub)
    .all();
  return c.json({ orders: results });
});

app.get('/api/orders/:id', requireAuth, async (c) => {
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!order) return c.json({ error: 'Not found' }, 404);
  const { results: items } = await c.env.DB.prepare(
    `SELECT oi.*, m.brand_name, m.image_url FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id
     WHERE oi.order_id = ?`
  )
    .bind(c.req.param('id'))
    .all();
  return c.json({ order, items });
});

// Admin: all orders + update status
app.get('/api/admin/orders', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  return c.json({ orders: results });
});

app.put('/api/admin/orders/:id/status', requireAuth, requireRole('admin'), async (c) => {
  const { status } = await c.req.json();
  const validStatuses = ['pending', 'paid', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) return c.json({ error: `Status must be one of: ${validStatuses.join(', ')}` }, 400);
  await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, c.req.param('id')).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD STATS
// ---------------------------------------------------------------------------
app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (c) => {
  const revenue = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(total),0) as total FROM orders WHERE payment_status = 'paid'"
  ).first<any>();
  const orderCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM orders').first<any>();
  const customerCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'customer'"
  ).first<any>();
  const lowStock = await c.env.DB.prepare(
    'SELECT id, brand_name, stock_quantity FROM medicines WHERE stock_quantity < 20 ORDER BY stock_quantity ASC LIMIT 10'
  ).all();
  const pendingRx = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM prescriptions WHERE status = 'pending'"
  ).first<any>();

  return c.json({
    totalRevenue: revenue?.total || 0,
    totalOrders: orderCount?.count || 0,
    totalCustomers: customerCount?.count || 0,
    lowStock: lowStock.results,
    pendingPrescriptions: pendingRx?.count || 0,
  });
});

// ---------------------------------------------------------------------------
// WISHLIST
// ---------------------------------------------------------------------------
app.get('/api/wishlist', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT w.id as wishlist_id, w.created_at as added_at, m.*
     FROM wishlist w JOIN medicines m ON m.id = w.medicine_id
     WHERE w.user_id = ? ORDER BY w.created_at DESC`
  ).bind(user.sub).all();
  return c.json({ items: results });
});

app.post('/api/wishlist', requireAuth, async (c) => {
  const user = c.get('user');
  const { medicineId } = await c.req.json();
  if (!medicineId) return c.json({ error: 'medicineId required' }, 400);
  const existing = await c.env.DB.prepare(
    'SELECT id FROM wishlist WHERE user_id = ? AND medicine_id = ?'
  ).bind(user.sub, medicineId).first();
  if (existing) return c.json({ error: 'Already in wishlist' }, 409);
  const id = newId('wl');
  await c.env.DB.prepare(
    'INSERT INTO wishlist (id, user_id, medicine_id) VALUES (?, ?, ?)'
  ).bind(id, user.sub, medicineId).run();
  return c.json({ success: true, id }, 201);
});

app.delete('/api/wishlist/:medicineId', requireAuth, async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare('DELETE FROM wishlist WHERE user_id = ? AND medicine_id = ?')
    .bind(user.sub, c.req.param('medicineId')).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------
app.get('/api/reviews/:medicineId', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, u.full_name as reviewer_name FROM reviews r
     JOIN users u ON u.id = r.user_id WHERE r.medicine_id = ?
     ORDER BY r.created_at DESC`
  ).bind(c.req.param('medicineId')).all();
  const stats = await c.env.DB.prepare(
    'SELECT COUNT(*) as count, COALESCE(AVG(rating),0) as avg_rating FROM reviews WHERE medicine_id = ?'
  ).bind(c.req.param('medicineId')).first<any>();
  return c.json({ reviews: results, stats: { count: stats?.count || 0, avg: stats?.avg_rating || 0 } });
});

app.post('/api/reviews', requireAuth, async (c) => {
  const user = c.get('user');
  const { medicineId, rating, comment } = await c.req.json();
  if (!medicineId || !rating) return c.json({ error: 'medicineId and rating required' }, 400);
  if (typeof rating !== 'number' || rating < 1 || rating > 5) return c.json({ error: 'Rating must be 1-5' }, 400);
  const existing = await c.env.DB.prepare(
    'SELECT id FROM reviews WHERE user_id = ? AND medicine_id = ?'
  ).bind(user.sub, medicineId).first();
  if (existing) return c.json({ error: 'You already reviewed this medicine' }, 409);
  const id = newId('rev');
  await c.env.DB.prepare(
    'INSERT INTO reviews (id, user_id, medicine_id, rating, comment) VALUES (?,?,?,?,?)'
  ).bind(id, user.sub, medicineId, rating, comment || null).run();
  // Update medicine average rating
  const avg = await c.env.DB.prepare(
    'SELECT AVG(rating) as avg FROM reviews WHERE medicine_id = ?'
  ).bind(medicineId).first<any>();
  await c.env.DB.prepare('UPDATE medicines SET rating = ? WHERE id = ?')
    .bind(Math.round((avg?.avg || 0) * 10) / 10, medicineId).run();
  return c.json({ success: true, id }, 201);
});

// ---------------------------------------------------------------------------
// COUPONS
// ---------------------------------------------------------------------------
app.post('/api/coupons/validate', requireAuth, async (c) => {
  const { code, cartTotal } = await c.req.json();
  if (!code) return c.json({ error: 'Coupon code required' }, 400);
  const coupon = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE code = ? AND active = 1'
  ).bind(code.toUpperCase()).first<any>();
  if (!coupon) return c.json({ error: 'Invalid coupon code' }, 404);
  if (coupon.used_count >= coupon.max_uses) return c.json({ error: 'Coupon usage limit reached' }, 400);
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return c.json({ error: 'Coupon has expired' }, 400);
  if (cartTotal && cartTotal < coupon.min_cart_total) return c.json({ error: `Minimum cart total is KSh ${coupon.min_cart_total}` }, 400);
  return c.json({ valid: true, discountPercent: coupon.discount_percent, code: coupon.code });
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
app.get('/api/notifications', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(user.sub).all();
  const unread = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).bind(user.sub).first<any>();
  return c.json({ notifications: results, unreadCount: unread?.count || 0 });
});

app.put('/api/notifications/:id/read', requireAuth, async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.sub).run();
  return c.json({ success: true });
});

app.put('/api/notifications/read-all', requireAuth, async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .bind(user.sub).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// ADDRESSES
// ---------------------------------------------------------------------------
app.get('/api/addresses', requireAuth, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).bind(user.sub).all();
  return c.json({ addresses: results });
});

app.post('/api/addresses', requireAuth, async (c) => {
  const user = c.get('user');
  const { label, fullAddress, isDefault } = await c.req.json();
  if (!fullAddress) return c.json({ error: 'Address required' }, 400);
  if (isDefault) {
    await c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.sub).run();
  }
  const id = newId('addr');
  await c.env.DB.prepare(
    'INSERT INTO addresses (id, user_id, label, full_address, is_default) VALUES (?,?,?,?,?)'
  ).bind(id, user.sub, label || 'Home', fullAddress, isDefault ? 1 : 0).run();
  return c.json({ success: true, id }, 201);
});

app.delete('/api/addresses/:id', requireAuth, async (c) => {
  const user = c.get('user');
  await c.env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.sub).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// PROFILE UPDATE
// ---------------------------------------------------------------------------
app.put('/api/auth/profile', requireAuth, async (c) => {
  const user = c.get('user');
  const { fullName, phone } = await c.req.json();
  if (fullName) await c.env.DB.prepare('UPDATE users SET full_name = ? WHERE id = ?').bind(fullName, user.sub).run();
  if (phone !== undefined) await c.env.DB.prepare('UPDATE users SET phone = ? WHERE id = ?').bind(phone || null, user.sub).run();
  return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// DRUG INTERACTION CHECKER
// ---------------------------------------------------------------------------
app.get('/api/interactions', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM drug_interactions ORDER BY severity DESC').all();
  return c.json({ interactions: results });
});

app.post('/api/interactions/check', async (c) => {
  const { drugs } = await c.req.json();
  if (!Array.isArray(drugs) || drugs.length < 2) return c.json({ error: 'Provide an array of at least 2 drug names' }, 400);
  const normalized = drugs.map((d: string) => d.toLowerCase().trim());
  const { results } = await c.env.DB.prepare('SELECT * FROM drug_interactions').all();
  const found: any[] = [];
  for (const interaction of results as any[]) {
    const a = interaction.drug_a.toLowerCase();
    const b = interaction.drug_b.toLowerCase();
    if ((normalized.includes(a) && normalized.includes(b))) {
      found.push(interaction);
    }
  }
  return c.json({ interactions: found, checked: normalized });
});

// ---------------------------------------------------------------------------
// BLOG
// ---------------------------------------------------------------------------
app.get('/api/blog', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, title, slug, excerpt, author, image_url, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC'
  ).all();
  return c.json({ posts: results });
});

app.get('/api/blog/:slug', async (c) => {
  const post = await c.env.DB.prepare(
    'SELECT * FROM blog_posts WHERE slug = ? AND published = 1'
  ).bind(c.req.param('slug')).first();
  if (!post) return c.json({ error: 'Not found' }, 404);
  return c.json({ post });
});

// ---------------------------------------------------------------------------
// SEED NOTIFICATION on order creation (helper)
// ---------------------------------------------------------------------------
async function createNotification(db: D1Database, userId: string, title: string, message: string, link?: string) {
  const id = newId('ntf');
  await db.prepare(
    'INSERT INTO notifications (id, user_id, title, message, link) VALUES (?,?,?,?,?)'
  ).bind(id, userId, title, message, link || null).run();
}

// ---------------------------------------------------------------------------
// ADMIN: manage users & pharmacist list
// ---------------------------------------------------------------------------
app.get('/api/admin/users', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, email, full_name, phone, role, loyalty_points, created_at FROM users ORDER BY created_at DESC LIMIT 200'
  ).all();
  return c.json({ users: results });
});

app.get('/api/admin/pharmacists', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, email, full_name, phone, created_at FROM users WHERE role = 'pharmacist'"
  ).all();
  return c.json({ pharmacists: results });
});

// ---------------------------------------------------------------------------
// INVENTORY MANAGEMENT (Suppliers + Stock Batches)
// ---------------------------------------------------------------------------
app.get('/api/admin/suppliers', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM suppliers ORDER BY name').all();
  return c.json({ suppliers: results });
});

app.post('/api/admin/suppliers', requireAuth, requireRole('admin'), async (c) => {
  const b = await c.req.json();
  if (!b.name) return c.json({ error: 'Supplier name required' }, 400);
  const id = newId('sup');
  await c.env.DB.prepare(
    'INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES (?,?,?,?,?,?)'
  ).bind(id, b.name, b.contactPerson || null, b.phone || null, b.email || null, b.address || null).run();
  return c.json({ id }, 201);
});

app.get('/api/admin/batches', requireAuth, requireRole('admin'), async (c) => {
  const { medicineId } = c.req.query();
  let query = `SELECT sb.*, m.brand_name, m.generic_name, s.name as supplier_name
               FROM stock_batches sb
               JOIN medicines m ON m.id = sb.medicine_id
               LEFT JOIN suppliers s ON s.id = sb.supplier_id`;
  const params: any[] = [];
  if (medicineId) {
    query += ' WHERE sb.medicine_id = ?';
    params.push(medicineId);
  }
  query += ' ORDER BY sb.expiry_date ASC';
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ batches: results });
});

app.post('/api/admin/batches', requireAuth, requireRole('admin'), async (c) => {
  const b = await c.req.json();
  if (!b.medicineId || !b.batchNumber || !b.quantity || !b.expiryDate) {
    return c.json({ error: 'medicineId, batchNumber, quantity, and expiryDate are required' }, 400);
  }
  const id = newId('bat');
  await c.env.DB.prepare(
    `INSERT INTO stock_batches (id, medicine_id, supplier_id, batch_number, quantity, purchase_price, selling_price, expiry_date, notes)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(
    id, b.medicineId, b.supplierId || null, b.batchNumber, b.quantity,
    b.purchasePrice || 0, b.sellingPrice || null, b.expiryDate, b.notes || null
  ).run();
  // Update medicine stock quantity
  await c.env.DB.prepare(
    'UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE id = ?'
  ).bind(b.quantity, b.medicineId).run();
  return c.json({ id }, 201);
});

app.get('/api/admin/low-stock', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT m.id, m.brand_name, m.generic_name, m.stock_quantity, m.dosage_form,
            (SELECT MIN(sb.expiry_date) FROM stock_batches sb WHERE sb.medicine_id = m.id AND sb.expiry_date > date('now')) as next_expiry,
            (SELECT SUM(sb.quantity) FROM stock_batches sb WHERE sb.medicine_id = m.id AND sb.expiry_date > date('now')) as batch_stock
     FROM medicines m
     WHERE m.stock_quantity < 50
     ORDER BY m.stock_quantity ASC LIMIT 30`
  ).all();
  return c.json({ lowStock: results });
});

app.get('/api/admin/expiring', requireAuth, requireRole('admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT sb.*, m.brand_name, m.generic_name, s.name as supplier_name
     FROM stock_batches sb
     JOIN medicines m ON m.id = sb.medicine_id
     LEFT JOIN suppliers s ON s.id = sb.supplier_id
     WHERE sb.expiry_date <= date('now', '+90 days') AND sb.expiry_date > date('now')
     ORDER BY sb.expiry_date ASC LIMIT 50`
  ).all();
  return c.json({ expiring: results });
});

// ---------------------------------------------------------------------------
// CART: apply coupon
// ---------------------------------------------------------------------------
app.post('/api/cart/coupon', requireAuth, async (c) => {
  const user = c.get('user');
  const { couponCode } = await c.req.json();
  if (!couponCode) return c.json({ error: 'Coupon code required' }, 400);
  const coupon = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE code = ? AND active = 1'
  ).bind(couponCode.toUpperCase()).first<any>();
  if (!coupon) return c.json({ error: 'Invalid coupon code' }, 404);
  if (coupon.used_count >= coupon.max_uses) return c.json({ error: 'Coupon usage limit reached' }, 400);
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return c.json({ error: 'Coupon has expired' }, 400);
  const { results: cartItems } = await c.env.DB.prepare(
    `SELECT ci.quantity, m.price, m.discount_percent FROM cart_items ci
     JOIN medicines m ON m.id = ci.medicine_id WHERE ci.user_id = ?`
  ).bind(user.sub).all<any>();
  const cartTotal = cartItems.reduce((sum: number, i: any) => sum + i.quantity * i.price * (1 - i.discount_percent / 100), 0);
  if (cartTotal < coupon.min_cart_total) return c.json({ error: `Minimum cart total is KSh ${coupon.min_cart_total}` }, 400);
  return c.json({ valid: true, discountPercent: coupon.discount_percent, code: coupon.code });
});

export default app;
