import Link from 'next/link';
import { Users, Clock, Shield } from 'lucide-react';

export default function CirclesExplorePage() {
  const sampleCircles = [
    {
      id: '1',
      name: 'Lagos Tech Innovators Ajo',
      description: 'Bi-weekly USDC savings pool for developers & tech founders.',
      contributionAmount: 200,
      memberCount: 5,
      currentMembers: 3,
      collateralRequired: 100,
      status: 'Forming',
      intervalDays: 14,
    },
    {
      id: '2',
      name: 'Abuja Market Traders Esusu',
      description: 'Weekly community rotating savings pool.',
      contributionAmount: 50,
      memberCount: 10,
      currentMembers: 10,
      collateralRequired: 25,
      status: 'Active',
      intervalDays: 7,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Explore Savings Circles</h1>
          <p className="text-slate-400 text-sm">Join active ROSCA pools on Stellar or start your own group</p>
        </div>
        <Link
          href="/circles/create"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
        >
          Create New Circle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleCircles.map((circle) => (
          <div key={circle.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  {circle.status}
                </span>
                <h3 className="text-xl font-bold text-white">{circle.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">${circle.contributionAmount}</span>
                <span className="text-xs text-slate-400 block">USDC / Cycle</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm">{circle.description}</p>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{circle.currentMembers} / {circle.memberCount} Members</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{circle.intervalDays} Days Interval</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>${circle.collateralRequired} Collateral</span>
              </div>
            </div>

            <Link
              href={`/circles/${circle.id}`}
              className="block w-full py-2.5 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm transition-colors"
            >
              View Circle Dashboard
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
