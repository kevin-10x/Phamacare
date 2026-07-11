import { useState } from 'react';
import { api } from '../api';

const commonDrugs = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Amlodipine',
  'Losartan', 'Atenolol', 'Omeprazole', 'Salbutamol', 'Cetirizine',
  'Warfarin', 'Clopidogrel', 'Aspirin', 'Metronidazole', 'Ciprofloxacin',
  'Fluconazole', 'Insulin', 'Glibenclamide', 'Prednisolone', 'Diazepam',
];

const severityColors: Record<string, string> = {
  severe: 'bg-red-50 text-red-700 border-red-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  mild: 'bg-green-50 text-green-700 border-green-200',
};

export default function DrugInteractionChecker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggle(drug: string) {
    setSelected((prev) =>
      prev.includes(drug) ? prev.filter((d) => d !== drug) : [...prev, drug]
    );
    setChecked(false);
    setInteractions([]);
  }

  async function check() {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const data = await api.post('/api/interactions/check', { drugs: selected });
      setInteractions(data.interactions || []);
      setChecked(true);
    } catch {
      setInteractions([]);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Drug Interaction Checker</h1>
      <p className="text-ink/60 mb-8">Select two or more medicines to check for known interactions.</p>

      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Select medicines ({selected.length} selected)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {commonDrugs.map((drug) => (
            <button
              key={drug}
              onClick={() => toggle(drug)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                selected.includes(drug)
                  ? 'bg-clove text-parchment'
                  : 'bg-mist hover:bg-mist/80 text-ink/70'
              }`}
            >
              {drug}
            </button>
          ))}
        </div>
        <button
          onClick={check}
          disabled={selected.length < 2 || loading}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check Interactions'}
        </button>
      </div>

      {checked && (
        <div className="card p-6">
          <h2 className="font-medium mb-4">Results</h2>
          {interactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-clove2 font-medium">No known interactions found</p>
              <p className="text-sm text-ink/50 mt-1">Always consult a pharmacist before combining medicines.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interactions.map((int) => (
                <div key={int.id} className={`p-4 rounded-xl border ${severityColors[int.severity] || ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/50">
                      {int.severity}
                    </span>
                    <span className="font-medium">{int.drug_a} + {int.drug_b}</span>
                  </div>
                  <p className="text-sm">{int.description}</p>
                </div>
              ))}
              <p className="text-xs text-ink/40 mt-4">
                ⚠️ This is a basic checker. Always consult a qualified pharmacist or doctor for comprehensive interaction advice.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
