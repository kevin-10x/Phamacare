-- Sample categories
INSERT INTO categories (id, name, slug, icon, requires_prescription) VALUES
 ('cat_pain', 'Pain Relief', 'pain-relief', '💊', 0),
 ('cat_antibiotics', 'Antibiotics', 'antibiotics', '🧫', 1),
 ('cat_diabetes', 'Diabetes', 'diabetes', '🩸', 1),
 ('cat_bp', 'Blood Pressure', 'blood-pressure', '❤️', 1),
 ('cat_allergy', 'Allergy', 'allergy', '🤧', 0),
 ('cat_vitamins', 'Vitamins & Supplements', 'vitamins-supplements', '🌿', 0),
 ('cat_baby', 'Baby & Mother Care', 'baby-mother-care', '🍼', 0),
 ('cat_skin', 'Skin Care', 'skin-care', '🧴', 0),
 ('cat_firstaid', 'First Aid', 'first-aid', '🩹', 0),
 ('cat_personal', 'Personal Care', 'personal-care', '🧼', 0);

-- Sample medicines
INSERT INTO medicines (id, category_id, brand_name, generic_name, manufacturer, strength, dosage_form, price, discount_percent, stock_quantity, image_url, description, uses, dosage_instructions, side_effects, warnings, storage_conditions, requires_prescription, is_featured, rating) VALUES
 ('med_panadol', 'cat_pain', 'Panadol', 'Paracetamol', 'GSK', '500mg', 'Tablet', 150, 0, 500, '', 'Fast-acting pain and fever relief.', 'Headache, fever, muscle aches', '1-2 tablets every 4-6 hours, max 8/day', 'Nausea, rash (rare)', 'Do not exceed recommended dose', 'Store below 25°C', 0, 1, 4.6),
 ('med_amoxil', 'cat_antibiotics', 'Amoxil', 'Amoxicillin', 'GSK', '500mg', 'Capsule', 350, 5, 200, '', 'Broad-spectrum antibiotic.', 'Bacterial infections', 'As prescribed by physician', 'Diarrhea, allergic reactions', 'Complete full course; prescription required', 'Store below 25°C, dry place', 1, 0, 4.4),
 ('med_metformin', 'cat_diabetes', 'Glucophage', 'Metformin', 'Merck', '500mg', 'Tablet', 420, 0, 300, '', 'Manages type 2 diabetes blood sugar.', 'Type 2 diabetes', 'As prescribed, usually with meals', 'GI upset, vitamin B12 deficiency (long term)', 'Prescription required', 'Store below 30°C', 1, 1, 4.5),
 ('med_amlodipine', 'cat_bp', 'Norvasc', 'Amlodipine', 'Pfizer', '5mg', 'Tablet', 380, 0, 250, '', 'Lowers high blood pressure.', 'Hypertension', 'Once daily as prescribed', 'Swelling, dizziness, flushing', 'Prescription required', 'Store below 25°C', 1, 0, 4.3),
 ('med_cetirizine', 'cat_allergy', 'Zyrtec', 'Cetirizine', 'UCB', '10mg', 'Tablet', 200, 10, 400, '', 'Relieves allergy symptoms.', 'Hay fever, hives, itching', '1 tablet once daily', 'Drowsiness (mild)', 'Avoid alcohol', 'Store below 25°C', 0, 1, 4.7),
 ('med_multivit', 'cat_vitamins', 'Centrum', 'Multivitamin', 'Pfizer', 'Standard', 'Tablet', 990, 0, 150, '', 'Daily multivitamin and mineral supplement.', 'General nutrition support', '1 tablet daily with food', 'Rare mild GI upset', 'Keep out of reach of children', 'Store below 25°C', 0, 1, 4.6),
 ('med_babylotion', 'cat_baby', 'Johnson''s Baby Lotion', NULL, 'Johnson & Johnson', '200ml', 'Lotion', 650, 0, 180, '', 'Gentle moisturizing lotion for babies.', 'Daily skin moisturizing', 'Apply as needed', 'None known', 'External use only', 'Store at room temperature', 0, 0, 4.8),
 ('med_bandaid', 'cat_firstaid', 'Band-Aid', NULL, 'J&J', 'Assorted', 'Adhesive bandage', 250, 0, 600, '', 'Sterile adhesive bandages for minor wounds.', 'Wound protection', 'Apply to clean, dry wound', 'None known', 'For external use only', 'Store in a cool dry place', 0, 0, 4.5),
 ('med_hydrocortisone', 'cat_skin', 'Hydrocortisone Cream', 'Hydrocortisone', 'Various', '1%', 'Cream', 300, 0, 220, '', 'Relieves skin irritation, itching, and inflammation.', 'Eczema, insect bites, rashes', 'Apply thin layer 1-2 times daily', 'Skin thinning with prolonged use', 'Avoid broken skin unless advised', 'Store below 25°C', 0, 0, 4.2),
 ('med_toothpaste', 'cat_personal', 'Colgate Total', NULL, 'Colgate-Palmolive', '150ml', 'Toothpaste', 280, 0, 400, '', 'Complete oral care toothpaste.', 'Daily oral hygiene', 'Brush twice daily', 'None known', 'External use only', 'Store at room temperature', 0, 0, 4.6);
