-- Migration 0004: Wishlist, Reviews, Coupons, Notifications, Blog, Drug Interactions, Addresses

-- WISHLIST
CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  medicine_id TEXT NOT NULL REFERENCES medicines(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, medicine_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  medicine_id TEXT NOT NULL REFERENCES medicines(id),
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, medicine_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_medicine ON reviews(medicine_id);

-- COUPONS
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent REAL NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_cart_total REAL NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  label TEXT NOT NULL DEFAULT 'Home',
  full_address TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'PharmaCare Team',
  image_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- DRUG INTERACTIONS (pre-seeded lookup table)
CREATE TABLE IF NOT EXISTS drug_interactions (
  id TEXT PRIMARY KEY,
  drug_a TEXT NOT NULL,
  drug_b TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('mild', 'moderate', 'severe')),
  description TEXT NOT NULL
);

-- Seed sample drug interactions
INSERT INTO drug_interactions (id, drug_a, drug_b, severity, description) VALUES
 ('int_01', 'warfarin', 'aspirin', 'severe', 'Increased risk of bleeding. Avoid combination or monitor closely.'),
 ('int_02', 'metformin', 'alcohol', 'severe', 'Alcohol increases risk of lactic acidosis with metformin. Avoid.'),
 ('int_03', 'amlodipine', 'simvastatin', 'moderate', 'High doses of simvastatin with amlodipine increase risk of rhabdomyolysis.'),
 ('int_04', 'ciprofloxacin', 'antacids', 'moderate', 'Antacids reduce absorption of ciprofloxacin. Take 2 hours apart.'),
 ('int_05', 'amoxicillin', 'methotrexate', 'moderate', 'Amoxicillin may increase methotrexate toxicity. Monitor.'),
 ('int_06', 'omeprazole', 'clopidogrel', 'severe', 'Omeprazole reduces effectiveness of clopidogrel. Use pantoprazole instead.'),
 ('int_07', 'losartan', 'potassium', 'moderate', 'Losartan increases potassium levels. Monitor potassium.'),
 ('int_08', 'atenolol', 'insulin', 'moderate', 'Beta-blockers may mask hypoglycemia symptoms. Monitor blood sugar.'),
 ('int_09', 'prednisolone', 'nsaids', 'severe', 'Combined use significantly increases risk of gastrointestinal bleeding.'),
 ('int_10', 'fluconazole', 'warfarin', 'severe', 'Fluconazole increases warfarin effect. Monitor INR closely.'),
 ('int_11', 'levothyroxine', 'calcium', 'moderate', 'Calcium supplements reduce levothyroxine absorption. Take 4 hours apart.'),
 ('int_12', 'glibenclamide', 'fluconazole', 'moderate', 'Fluconazole may increase hypoglycemic effect of glibenclamide.'),
 ('int_13', 'salbutamol', 'atenolol', 'moderate', 'Beta-blockers may reduce effect of salbutamol. Use cardioselective if needed.'),
 ('int_14', 'azithromycin', 'warfarin', 'moderate', 'Azithromycin may increase warfarin effect. Monitor INR.'),
 ('int_15', 'paracetamol', 'warfarin', 'mild', 'High dose paracetamol may slightly increase INR. Monitor at high doses.');

-- Seed sample coupons
INSERT INTO coupons (id, code, discount_percent, max_uses, min_cart_total, expires_at) VALUES
 ('coup_01', 'WELCOME10', 10, 500, 0, '2027-12-31'),
 ('coup_02', 'SAVE500', 15, 200, 3000, '2027-06-30'),
 ('coup_03', 'PHARMA20', 20, 100, 5000, '2027-12-31');

-- Seed sample blog posts
INSERT INTO blog_posts (id, title, slug, excerpt, content, author, published) VALUES
 ('blog_01', 'Understanding Antibiotic Resistance', 'understanding-antibiotic-resistance',
  'Learn why completing your antibiotic course matters and how misuse contributes to resistance.',
  'Antibiotic resistance occurs when bacteria evolve to survive exposure to antibiotics. This is one of the greatest threats to global health. When antibiotics are overused or not taken as prescribed, bacteria can develop resistance, making future infections harder to treat.

Key points:
- Always complete your full antibiotic course, even if you feel better
- Never share antibiotics or use leftover prescriptions
- Only use antibiotics prescribed by a qualified healthcare provider
- Never demand antibiotics for viral infections like colds or flu

In Kenya, antibiotic resistance is a growing concern. By using antibiotics responsibly, we can help preserve their effectiveness for future generations.',
  'Dr. Achieng Okello', 1),

 ('blog_02', 'Managing Diabetes: A Guide for Kenyan Patients', 'managing-diabetes-guide',
  'Practical tips for managing type 2 diabetes through diet, exercise, and medication.',
  'Type 2 diabetes is increasingly common in Kenya. Managing it effectively requires a combination of lifestyle changes and medication.

Diet Tips:
- Choose whole grains over refined grains (ugali from whole maize instead of white)
- Include plenty of vegetables and legumes (sukuma wiki, ndengu, beans)
- Limit sugary drinks and processed foods
- Eat smaller portions at regular intervals

Exercise:
- Aim for at least 30 minutes of moderate activity daily
- Walking is an excellent and accessible exercise
- Consult your doctor before starting any exercise program

Medication:
- Take metformin or other prescribed medications as directed
- Monitor blood sugar regularly
- Never skip doses or stop medication without consulting your doctor

Regular check-ups with your healthcare provider are essential.',
  'Pharmacist James Omondi', 1),

 ('blog_03', 'First Aid Essentials Every Kenyan Home Should Have', 'first-aid-essentials',
  'Build a basic first aid kit and know how to handle common emergencies.',
  'Every household should have a basic first aid kit. Here is what every Kenyan home should have:

Essential Items:
- Bandages (assorted sizes) and adhesive tape
- Antiseptic solution (Dettol or chlorhexidine)
- Cotton wool and gauze
- Paracetamol (for pain and fever)
- ORS (Oral Rehydration Salts)
- Digital thermometer
- Scissors and tweezers
- Disposable gloves

Common Emergencies:
- Burns: Run cool water over the burn for 10 minutes. Do not apply butter or toothpaste
- Cuts: Clean with antiseptic, apply pressure with clean cloth, bandage
- Choking: Perform back blows and chest thrusts
- Food poisoning: Rehydrate with ORS, seek medical help if severe

Keep your first aid kit accessible and check expiry dates regularly.',
  'Nurse Faith Wanjiku', 1);
