'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Clock, Shield, PlusCircle, Loader2 } from 'lucide-react';
import { fetchCircles, CircleData } from '../../lib/api';

export default function CirclesExplorePage() {
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCircles() {
      setIsLoading(true);
      const data = await fetchCircles();
      setCircles(data);
      setIsLoading(false);
    }
    loadCircles();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Explore Savings Circles</h1>
          <p className="text-slate-400 text-sm">Join active ROSCA pools on Stellar or start your own group</p>
        </div>
        <Link
          href="/circles/create"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Circle</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-400 text-sm">Connecting to Supabase database...</p>
        </div>
      ) : circles.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
            0
          </div>
          <h3 className="text-xl font-bold text-white">No Savings Circles Yet</h3>
          <p className="text-slate-400 text-sm">
            Be the first to launch an automated ROSCA savings pool on Stellar! Define your custom contribution amount, group size, and interval.
          </p>
          <Link
            href="/circles/create"
            className="inline-block px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Create First Circle Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {circles.map((circle) => (
            <div
              key={circle.circle_id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                      {circle.status || 'Forming'}
                    </span>
                    <h3 className="text-xl font-bold text-white">{circle.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">${circle.contribution_amount}</span>
                    <span className="text-xs text-slate-400 block">USDC / Cycle</span>
                  </div>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2">{circle.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{circle.members?.length || 1} / {circle.member_count} Members</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{circle.interval_days} Days</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>${circle.collateral_required} Collateral</span>
                  </div>
                </div>

                <Link
                  href={`/circles/${circle.circle_id}`}
                  className="block w-full py-2.5 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm transition-colors"
                >
                  View Circle Dashboard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
