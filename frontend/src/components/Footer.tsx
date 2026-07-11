import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-clove text-parchment/80 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display text-xl text-white mb-3">PharmaCare</div>
          <p>Licensed online pharmacy delivering across Kenya. Reg. No. PPB/XXXX.</p>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Shop</div>
          <ul className="space-y-2">
            <li><Link to="/shop?category=cat_antibiotics" className="hover:text-white transition-colors">Prescription Medicines</Link></li>
            <li><Link to="/shop?category=cat_pain" className="hover:text-white transition-colors">OTC Medicines</Link></li>
            <li><Link to="/shop?category=cat_vitamins" className="hover:text-white transition-colors">Vitamins &amp; Supplements</Link></li>
            <li><Link to="/shop?category=cat_baby" className="hover:text-white transition-colors">Mother &amp; Baby</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Support</div>
          <ul className="space-y-2">
            <li><Link to="/prescriptions" className="hover:text-white transition-colors">Talk to a Pharmacist</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Track My Order</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Delivery Areas</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Legal</div>
          <ul className="space-y-2">
            <li><Link to="/prescriptions" className="hover:text-white transition-colors">Prescription Policy</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Pharmacy Board License</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs py-4">
        © {new Date().getFullYear()} PharmaCare. All rights reserved.
      </div>
    </footer>
  );
}
