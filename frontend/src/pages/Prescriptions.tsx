import { useEffect, useState } from 'react';
import { api } from '../api';

const statusColor: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  approved: 'text-clove2 bg-clove2/10',
  rejected: 'text-red-600 bg-red-50',
};

export default function Prescriptions() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [list, setList] = useState<any[]>([]);

  function loadList() {
    api.get('/api/prescriptions/mine').then((d) => setList(d.prescriptions || [])).catch(() => {});
  }

  useEffect(() => {
    loadList();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post('/api/prescriptions', form);
      setMessage('Prescription uploaded — a licensed pharmacist will review it shortly.');
      setFile(null);
      loadList();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Upload a prescription</h1>
      <p className="text-ink/60 mb-8">
        Upload a clear photo or PDF of your prescription. Our pharmacists verify every prescription before
        it's approved for checkout.
      </p>

      <form onSubmit={handleUpload} className="card p-6 mb-10">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm"
        />
        {message && <p className="text-sm text-clove mb-4">{message}</p>}
        <button className="btn-primary" disabled={!file || uploading}>
          {uploading ? 'Uploading…' : 'Upload prescription'}
        </button>
      </form>

      <h2 className="font-display text-xl font-semibold mb-4">Your prescriptions</h2>
      <div className="space-y-3">
        {list.length === 0 && <p className="text-ink/50">No prescriptions uploaded yet.</p>}
        {list.map((p) => (
          <div key={p.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{p.file_name}</p>
              <p className="text-xs text-ink/50">{new Date(p.created_at).toLocaleString()}</p>
              {p.pharmacist_notes && <p className="text-xs text-ink/60 mt-1">Note: {p.pharmacist_notes}</p>}
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[p.status] || ''}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
