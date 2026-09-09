import Link from 'next/link';
import { ArrowRight, ShieldCheck, Coins, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span>Stellar Soroban Powered</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
          Trustless Ajo & Esusu <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">
            On-Chain Savings Circles
          </span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Replace trusted human collectors with deterministic Soroban smart contracts. Mechanical payouts, collateral default protection, and portable credit reputation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/circles/create"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
          >
            <span>Create a Circle</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/circles"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold transition-colors flex items-center justify-center"
          >
            Explore Active Circles
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Collateral-Backed Security</h3>
          <p className="text-slate-400 text-sm">
            Members stake collateral upon joining. If anyone defaults after receiving a payout, their collateral is slashed to protect the group pot.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Transparent Visual Grid</h3>
          <p className="text-slate-400 text-sm">
            Real-time, verifiable on-chain matrix tracking every member's contribution status, deadlines, and recipient queue.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Portable Reputation</h3>
          <p className="text-slate-400 text-sm">
            Build on-chain trust scores for timely contributions. High reputation score members unlock reduced collateral requirements across circles.
          </p>
        </div>
      </section>
    </div>
  );
}
