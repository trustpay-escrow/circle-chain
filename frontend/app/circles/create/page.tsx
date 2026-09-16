'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCircleApi } from '../../../lib/api';
import { Loader2 } from 'lucide-react';

export default function CreateCirclePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: 100,
    intervalDays: 7,
    memberCount: 5,
    collateralRequired: 50,
    payoutMode: 'Fixed',
    creatorAddress: 'GABC1234567890WXYZ1234567890'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createCircleApi({
        name: formData.name,
        description: formData.description,
        creator_address: formData.creatorAddress,
        contribution_amount: formData.contributionAmount,
        interval_days: formData.intervalDays,
        member_count: formData.memberCount,
        collateral_required: formData.collateralRequired,
        payout_mode: formData.payoutMode
      });

      if (result) {
        alert('✨ Circle successfully created and saved to database!');
        router.push('/circles');
      } else {
        alert('Failed to save circle to database. Please check your backend connection.');
      }
    } catch (err: any) {
      alert(`Error creating circle: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Create a New Savings Circle</h1>
        <p className="text-slate-400 text-sm">Configure your rotating savings parameters and deployment settings</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Circle Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lagos Tech Founders Ajo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Group Description</label>
            <textarea
              rows={3}
              placeholder="Describe the purpose of this savings pool..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contribution per Cycle (USDC)</label>
              <input
                type="number"
                required
                min={1}
                value={formData.contributionAmount}
                onChange={(e) => setFormData({ ...formData, contributionAmount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Collateral Deposit (USDC)</label>
              <input
                type="number"
                required
                min={0}
                value={formData.collateralRequired}
                onChange={(e) => setFormData({ ...formData, collateralRequired: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Members</label>
              <input
                type="number"
                required
                min={2}
                max={20}
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cycle Interval (Days)</label>
              <select
                value={formData.intervalDays}
                onChange={(e) => setFormData({ ...formData, intervalDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value={7}>7 Days (Weekly)</option>
                <option value={14}>14 Days (Bi-weekly)</option>
                <option value={30}>30 Days (Monthly)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Circle to Database...</span>
            </>
          ) : (
            <span>Initialize Circle & Save to Database</span>
          )}
        </button>
      </form>
    </div>
  );
}
