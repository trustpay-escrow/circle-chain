'use client';

import { useEffect, useState } from 'react';
import { ContributionGrid } from '../../../components/contribution-grid';
import { ShieldAlert, Award, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { fetchCircleById, CircleData } from '../../../lib/api';

export default function CircleDashboardPage({ params }: { params: { id: string } }) {
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCircle() {
      setIsLoading(true);
      const data = await fetchCircleById(params.id);
      setCircle(data);
      setIsLoading(false);
    }
    loadCircle();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading circle metrics from database...</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-white">Circle #{params.id} Not Found</h2>
        <p className="text-slate-400 text-sm">
          This circle may have been removed or does not exist in the database.
        </p>
      </div>
    );
  }

  const memberAddresses = (circle.members && circle.members.length > 0)
    ? circle.members.map((m: any) => typeof m === 'string' ? m : m.wallet_address || m)
    : [circle.creator_address];

  const totalPot = (circle.contribution_amount || 100) * (circle.member_count || 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {circle.status || 'Forming'} • Cycle 1 of {circle.member_count}
            </span>
            <span className="text-xs text-slate-400">ID: #{circle.circle_id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{circle.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Fixed Contribution: <span className="text-emerald-400 font-semibold">${circle.contribution_amount} USDC</span> / cycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
            Pay Cycle 1 (${circle.contribution_amount} USDC)
          </button>
          <button className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center">
            <span>Release Pot</span>
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Cycle Pot</span>
          <div className="text-2xl font-black text-white flex items-center">
            <DollarSign className="w-5 h-5 text-emerald-400 mr-1" />
            ${totalPot} USDC
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Creator / Recipient</span>
          <div className="text-sm font-bold text-emerald-400 font-mono truncate">
            {circle.creator_address}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Cycle Interval</span>
          <div className="text-xl font-bold text-amber-400">
            {circle.interval_days} Days / Cycle
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Staked Collateral / Member</span>
          <div className="text-xl font-bold text-purple-400">
            ${circle.collateral_required} USDC
          </div>
        </div>
      </div>

      {/* Visual Proof Matrix */}
      <ContributionGrid
        memberCount={circle.member_count || 5}
        currentCycle={0}
        members={memberAddresses}
        contributions={circle.contributions || []}
      />
    </div>
  );
}
