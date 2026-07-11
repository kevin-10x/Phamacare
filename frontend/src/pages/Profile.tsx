import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/auth/me').then((d) => {
      if (d.user) {
        setFullName(d.user.full_name || '');
        setPhone(d.user.phone || '');
      }
    }).catch(() => {});
    api.get('/api/addresses').then((d) => setAddresses(d.addresses || [])).catch(() => {});
  }, []);

  async function saveProfile() {
    setMsg('');
    try {
      await api.put('/api/auth/profile', { fullName, phone });
      setMsg('Profile updated!');
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function addAddress() {
    if (!newAddress.trim()) return;
    try {
      await api.post('/api/addresses', { label: newLabel, fullAddress: newAddress, isDefault: addresses.length === 0 });
      const d = await api.get('/api/addresses');
      setAddresses(d.addresses || []);
      setNewAddress('');
      setMsg('Address added!');
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function deleteAddress(id: string) {
    await api.del(`/api/addresses/${id}`);
    const d = await api.get('/api/addresses');
    setAddresses(d.addresses || []);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">My Profile</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Personal Information</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-ink/60 mb-1 block">Full Name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-ink/60 mb-1 block">Email</label>
            <input className="input bg-mist" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="text-sm text-ink/60 mb-1 block">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <button onClick={saveProfile} className="btn-primary !py-2 text-sm">Save Changes</button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Saved Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-ink/50 mb-4">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start justify-between p-3 bg-mist rounded-lg">
                <div>
                  <p className="font-medium text-sm">{a.label} {a.is_default ? '(Default)' : ''}</p>
                  <p className="text-sm text-ink/60">{a.full_address}</p>
                </div>
                <button onClick={() => deleteAddress(a.id)} className="text-xs text-sienna hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <select className="input text-sm" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
          <input className="input text-sm col-span-2" placeholder="New address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
        </div>
        <button onClick={addAddress} className="btn-secondary !py-2 text-sm mt-2">Add Address</button>
      </div>

      {msg && <p className="text-sm text-clove2 mt-4">{msg}</p>}
    </div>
  );
}
