'use client';

import { useState } from 'react';
import { ContributionGrid } from '../../../components/contribution-grid';
import { ShieldAlert, Award, ArrowUpRight, DollarSign } from 'lucide-react';

export default function CircleDashboardPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'schedule' | 'collateral'>('matrix');

  // Mock circle state for visual proof dashboard
  const circle = {
    id: params.id,
    name: 'Lagos Tech Innovators Ajo',
    contributionAmount: 200,
    intervalDays: 14,
    memberCount: 5,
    collateralRequired: 100,
    currentCycle: 1, // 0-indexed (Cycle 2)
    status: 'Active',
    totalPot: 1000,
    nextRecipient: 'GBX...4K2L',
    deadlineHours: 42,
    members: [
      'GABC1234567890WXYZ1234567890',
      'GBX98765432104K2L9876543210',
      'GDEF4567890123LMNO4567890123',
      'GHIJ7890123456PQRS7890123456',
      'GKLM0123456789TUVW0123456789',
    ],
    contributions: [
      // Cycle 0 (All paid)
      { cycleIndex: 0, memberAddress: 'GABC1234567890WXYZ1234567890', hasPaid: true },
      { cycleIndex: 0, memberAddress: 'GBX98765432104K2L9876543210', hasPaid: true },
      { cycleIndex: 0, memberAddress: 'GDEF4567890123LMNO4567890123', hasPaid: true },
      { cycleIndex: 0, memberAddress: 'GHIJ7890123456PQRS7890123456', hasPaid: true },
      { cycleIndex: 0, memberAddress: 'GKLM0123456789TUVW0123456789', hasPaid: true },
      // Cycle 1 (Current cycle)
      { cycleIndex: 1, memberAddress: 'GABC1234567890WXYZ1234567890', hasPaid: true },
      { cycleIndex: 1, memberAddress: 'GBX98765432104K2L9876543210', hasPaid: true },
      { cycleIndex: 1, memberAddress: 'GDEF4567890123LMNO4567890123', hasPaid: false },
      { cycleIndex: 1, memberAddress: 'GHIJ7890123456PQRS7890123456', hasPaid: false },
      { cycleIndex: 1, memberAddress: 'GKLM0123456789TUVW0123456789', hasPaid: false },
    ],
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {circle.status} • Cycle {circle.currentCycle + 1} of {circle.memberCount}
            </span>
            <span className="text-xs text-slate-400">ID: #{circle.id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{circle.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Fixed Contribution: <span className="text-emerald-400 font-semibold">${circle.contributionAmount} USDC</span> / cycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
            Pay Cycle {circle.currentCycle + 1} (${circle.contributionAmount} USDC)
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
          <span className="text-xs text-slate-400 font-medium">Current Pot Size</span>
          <div className="text-2xl font-black text-white flex items-center">
            <DollarSign className="w-5 h-5 text-emerald-400 mr-1" />
            ${circle.totalPot} USDC
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Next Payout Recipient</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {circle.nextRecipient}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Cycle Deadline Countdown</span>
          <div className="text-xl font-bold text-amber-400">
            {circle.deadlineHours} Hours Left
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Staked Collateral / Member</span>
          <div className="text-xl font-bold text-purple-400">
            ${circle.collateralRequired} USDC
          </div>
        </div>
      </div>

      {/* Visual Proof Matrix */}
      <ContributionGrid
        memberCount={circle.memberCount}
        currentCycle={circle.currentCycle}
        members={circle.members}
        contributions={circle.contributions}
      />
    </div>
  );
}
