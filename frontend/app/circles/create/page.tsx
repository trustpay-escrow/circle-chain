'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCircleApi } from '../../../lib/api';
import { useWallet } from '../../../lib/wallet-context';
import { Loader2, PlusCircle, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

export default function CreateCirclePage() {
  const router = useRouter();
  const { address, openModal } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: 100,
    intervalDays: 7,
    memberCount: 5,
    collateralRequired: 50,
    payoutMode: 'Fixed'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Wallet Required', {
        description: 'Please connect your Stellar wallet before creating a circle.'
      });
      openModal();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCircleApi({
        name: formData.name,
        description: formData.description,
        creator_address: address,
        contribution_amount: formData.contributionAmount,
        interval_days: formData.intervalDays,
        member_count: formData.memberCount,
        collateral_required: formData.collateralRequired,
        payout_mode: formData.payoutMode
      });

      if (result) {
        toast.success('Circle Created Successfully!', {
          description: `Circle "${formData.name}" has been created with you as organizer.`
        });
        router.push(`/circles/${result.circle_id}`);
      } else {
        toast.error('Circle Creation Failed', {
          description: 'Failed to save circle to backend. Please check connection.'
        });
      }
    } catch (err: any) {
      toast.error('Error Creating Circle', {
        description: err?.message || 'Unknown network error occurred.'
      });
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

      {!address && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/20 text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs">You need to connect a Stellar wallet to become the circle organizer.</span>
          </div>
          <Button variant="outline" size="sm" onClick={openModal} className="text-xs shrink-0">
            <Wallet className="w-3.5 h-3.5 mr-1" />
            Connect
          </Button>
        </Card>
      )}

      <Card className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Circle Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Lagos Tech Founders Ajo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Group Description</label>
              <textarea
                rows={3}
                placeholder="Describe the purpose of this savings pool..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>

            {address && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Creator / Organizer Wallet</label>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400">
                  {address}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contribution per Cycle (USDC)</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Collateral Deposit (USDC)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={formData.collateralRequired}
                  onChange={(e) => setFormData({ ...formData, collateralRequired: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Members</label>
                <Input
                  type="number"
                  required
                  min={2}
                  max={20}
                  value={formData.memberCount}
                  onChange={(e) => setFormData({ ...formData, memberCount: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cycle Interval (Days)</label>
                <select
                  value={formData.intervalDays}
                  onChange={(e) => setFormData({ ...formData, intervalDays: Number(e.target.value) })}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                >
                  <option value={7}>7 Days (Weekly)</option>
                  <option value={14}>14 Days (Bi-weekly)</option>
                  <option value={30}>30 Days (Monthly)</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Creating Circle...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Initialize Circle & Deploy</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
