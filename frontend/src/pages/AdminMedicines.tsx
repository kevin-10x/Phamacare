import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [tab, setTab] = useState<'stock' | 'low' | 'expiring' | 'suppliers'>('stock');
  const [msg, setMsg] = useState('');

  // Batch form
  const [batchMedicine, setBatchMedicine] = useState('');
  const [batchSupplier, setBatchSupplier] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [batchPrice, setBatchPrice] = useState('');
  const [batchExpiry, setBatchExpiry] = useState('');

  // Supplier form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supContact, setSupContact] = useState('');

  useEffect(() => {
    api.get('/api/medicines').then((d) => setMedicines(d.medicines || [])).catch(() => {});
    api.get('/api/admin/suppliers').then((d) => setSuppliers(d.suppliers || [])).catch(() => {});
    api.get('/api/admin/low-stock').then((d) => setLowStock(d.lowStock || [])).catch(() => {});
    api.get('/api/admin/expiring').then((d) => setExpiring(d.expiring || [])).catch(() => {});
  }, []);

  async function addBatch() {
    if (!batchMedicine || !batchNumber || !batchQty || !batchExpiry) return;
    setMsg('');
    try {
      await api.post('/api/admin/batches', {
        medicineId: batchMedicine,
        supplierId: batchSupplier || undefined,
        batchNumber,
        quantity: parseInt(batchQty),
        purchasePrice: parseFloat(batchPrice) || 0,
        expiryDate: batchExpiry,
      });
      setMsg('Stock added!');
      setBatchNumber(''); setBatchQty(''); setBatchPrice(''); setBatchExpiry('');
      const d = await api.get('/api/admin/low-stock');
      setLowStock(d.lowStock || []);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function addSupplier() {
    if (!supName) return;
    try {
      await api.post('/api/admin/suppliers', { name: supName, phone: supPhone, contactPerson: supContact });
      const d = await api.get('/api/admin/suppliers');
      setSuppliers(d.suppliers || []);
      setSupName(''); setSupPhone(''); setSupContact('');
      setMsg('Supplier added!');
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  const tabs = [
    ['stock', 'Add Stock'],
    ['low', `Low Stock (${lowStock.length})`],
    ['expiring', `Expiring (${expiring.length})`],
    ['suppliers', 'Suppliers'],
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-6">Inventory Management</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tab === key ? 'bg-clove text-parchment' : 'bg-mist text-ink/70 hover:bg-mist/80'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="card p-6">
          <h2 className="font-medium mb-4">Add Stock to Medicine</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Medicine *</label>
              <select className="input" value={batchMedicine} onChange={(e) => setBatchMedicine(e.target.value)}>
                <option value="">Select medicine…</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.brand_name} ({m.generic_name || 'N/A'}) — {m.dosage_form}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Supplier</label>
              <select className="input" value={batchSupplier} onChange={(e) => setBatchSupplier(e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Batch Number *</label>
              <input className="input" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. PCM24001" />
            </div>
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Quantity *</label>
              <input className="input" type="number" value={batchQty} onChange={(e) => setBatchQty(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Purchase Price (KSh)</label>
              <input className="input" type="number" value={batchPrice} onChange={(e) => setBatchPrice(e.target.value)} placeholder="e.g. 180" />
            </div>
            <div>
              <label className="text-sm text-ink/60 mb-1 block">Expiry Date *</label>
              <input className="input" type="date" value={batchExpiry} onChange={(e) => setBatchExpiry(e.target.value)} />
            </div>
          </div>
          <button onClick={addBatch} className="btn-primary mt-4 !py-2 text-sm">Add Stock</button>
        </div>
      )}

      {tab === 'low' && (
        <div className="card p-6">
          <h2 className="font-medium mb-4">Low Stock Medicines (under 50 units)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-mist text-left"><th className="py-2">Medicine</th><th className="py-2">Stock</th><th className="py-2">Batch Stock</th><th className="py-2">Next Expiry</th></tr></thead>
              <tbody>
                {lowStock.map((m) => (
                  <tr key={m.id} className="border-b border-mist/50">
                    <td className="py-2">{m.brand_name} <span className="text-ink/40">({m.generic_name})</span></td>
                    <td className="py-2"><span className={`font-medium ${m.stock_quantity < 10 ? 'text-sienna' : 'text-ink/70'}`}>{m.stock_quantity}</span></td>
                    <td className="py-2 text-ink/50">{m.batch_stock || 0}</td>
                    <td className="py-2 text-ink/50">{m.next_expiry || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'expiring' && (
        <div className="card p-6">
          <h2 className="font-medium mb-4">Expiring Soon (next 90 days)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-mist text-left"><th className="py-2">Medicine</th><th className="py-2">Batch</th><th className="py-2">Qty</th><th className="py-2">Expiry</th><th className="py-2">Supplier</th></tr></thead>
              <tbody>
                {expiring.map((b) => (
                  <tr key={b.id} className="border-b border-mist/50">
                    <td className="py-2">{b.brand_name}</td>
                    <td className="py-2 text-ink/50">{b.batch_number}</td>
                    <td className="py-2">{b.quantity}</td>
                    <td className="py-2 text-sienna font-medium">{b.expiry_date}</td>
                    <td className="py-2 text-ink/50">{b.supplier_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="card p-6">
          <h2 className="font-medium mb-4">Add Supplier</h2>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <input className="input" placeholder="Supplier name *" value={supName} onChange={(e) => setSupName(e.target.value)} />
            <input className="input" placeholder="Contact person" value={supContact} onChange={(e) => setSupContact(e.target.value)} />
            <input className="input" placeholder="Phone" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} />
          </div>
          <button onClick={addSupplier} className="btn-secondary !py-2 text-sm mb-6">Add Supplier</button>
          <h3 className="font-medium mb-3">Existing Suppliers</h3>
          {suppliers.length === 0 ? <p className="text-ink/50">No suppliers yet.</p> : (
            <div className="space-y-2">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-mist rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-ink/50">{s.contact_person || ''} {s.phone || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && <p className="text-sm text-clove2 mt-4">{msg}</p>}
    </div>
  );
}
