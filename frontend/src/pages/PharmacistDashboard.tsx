import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PharmacistDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function load() {
    api.get('/api/prescriptions/queue').then((d) => setQueue(d.prescriptions || [])).catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: 'approved' | 'rejected') {
    await api.post(`/api/prescriptions/${id}/review`, { status, notes: notes[id] || '' });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Pharmacist review queue</h1>
      <p className="text-ink/60 mb-8">Verify uploaded prescriptions before they can be used at checkout.</p>

      <div className="space-y-4">
        {queue.length === 0 && <p className="text-ink/50">No pending prescriptions. Queue is clear.</p>}
        {queue.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium">{p.file_name}</p>
                <p className="text-xs text-ink/50">
                  {p.full_name} · {p.email} · {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">pending</span>
            </div>
            <textarea
              className="input mb-3"
              placeholder="Notes for the patient (optional)"
              rows={2}
              onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
            />
            <div className="flex gap-3">
              <button onClick={() => review(p.id, 'approved')} className="btn-primary !py-2 text-sm">
                Approve
              </button>
              <button
                onClick={() => review(p.id, 'rejected')}
                className="btn-secondary !py-2 text-sm !border-sienna !text-sienna"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
