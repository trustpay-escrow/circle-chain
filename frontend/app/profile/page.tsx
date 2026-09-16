'use client';

import { useEffect, useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, History, Loader2, User } from 'lucide-react';
import { fetchUserProfileApi, UserProfileData } from '../../lib/api';

export default function ProfilePage() {
  const [walletAddress, setWalletAddress] = useState<string>('GABC1234567890WXYZ1234567890');
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfileApi(walletAddress);
      setProfile(data);
      setIsLoading(false);
    }
    loadProfile();
  }, [walletAddress]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching user reputation and profile metrics from database...</p>
      </div>
    );
  }

  const user = profile || {
    wallet_address: walletAddress,
    display_name: 'Saver Account',
    reputation_score: 95,
    circles_completed: 0,
    punctual_contributions: 0,
    total_collateral_staked: 0
  };

  const initials = user.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 shadow-xl">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-500/20">
          {initials}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mx-auto sm:mx-0">
              Verified Soroban Saver
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">{user.wallet_address}</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 font-medium block">Portable SBT Score</span>
          <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
            {user.reputation_score ?? 95} / 100
          </span>
        </div>
      </div>

      {/* Reputation Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold text-white">Circles Completed</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">{user.circles_completed ?? 0}</span>
          <p className="text-xs text-slate-400">Successfully finished without default</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <History className="w-5 h-5" />
            <h3 className="font-semibold text-white">Punctual Payments</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">{user.punctual_contributions ?? 0}</span>
          <p className="text-xs text-slate-400">On-time cycle payments recorded</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-white">Active Collateral</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">${user.total_collateral_staked ?? 0} USDC</span>
          <p className="text-xs text-slate-400">Staked across active circles</p>
        </div>
      </div>
    </div>
  );
}
