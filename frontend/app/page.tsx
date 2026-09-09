'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Award, 
  Users, 
  Lock, 
  ChevronDown,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Coins
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'slashing' | 'yield'>('matrix');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const heroMembers = [
    { name: 'Amina Bello', status: 'paid', slot: 'Cycle 1 (Received)', amount: '₦500,000' },
    { name: 'Tunde Bakare', status: 'paid', slot: 'Cycle 2 (Current)', amount: '₦500,000' },
    { name: 'Chioma Okonkwo', status: 'paid', slot: 'Cycle 3 (Next)', amount: '₦500,000' },
    { name: 'Emeka Nnaji', status: 'paid', slot: 'Cycle 4', amount: '₦500,000' },
    { name: 'Folake Adebayo', status: 'pending', slot: 'Cycle 5', amount: '₦500,000 (14h left)' },
  ];

  const faqs = [
    {
      q: 'What if I have never used crypto or Web3 before?',
      a: 'You do not need to know crypto technicals. All balances are saved in dollar-pegged stablecoins (USDC) so your savings never fluctuate with market swings, and wallet sign-ins take seconds.',
    },
    {
      q: 'What happens if someone receives their payout and stops paying?',
      a: 'Every member stakes collateral upon joining. If a member defaults after taking their payout, the Soroban smart contract mechanically slashes their locked collateral to cover the shortfall.',
    },
    {
      q: 'Where does the money sit during a cycle?',
      a: 'Funds sit in an audited, non-custodial Soroban contract vault on Stellar. Neither the circle creator nor our team has access to withdraw or redirect your money.',
    },
    {
      q: 'Is there any yield generated on locked funds?',
      a: 'Yes. Pooled funds sitting between cycle deadlines are routed into Stellar’s Blend lending protocol, generating extra yield for all circle members.',
    },
  ];

  return (
    <div className="relative space-y-24 py-8">
      {/* Background Ambient Glow */}
      <div className="ambient-glow bg-emerald-500/20 w-[500px] h-[500px] top-10 left-1/2 -translate-x-1/2 -z-10" />

      {/* HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Stellar Soroban Powered Ajo</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Save together with <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
            complete, automated trust.
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Your Nigerian Ajo & Esusu, secured by smart contracts. Code enforces contributions, tracks status transparently, and auto-releases payouts — so no single collector can ever disappear with the pot.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/circles/create"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 group"
          >
            <span>Start a Circle</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/circles"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center"
          >
            Explore Active Circles
          </Link>
        </div>

        {/* INTERACTIVE DEMO PREVIEW WIDGET */}
        <div className="mt-12 glass-card rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-2xl">
          {/* Tab Selection Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Matrix
              </button>
              <button
                onClick={() => setActiveTab('slashing')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'slashing'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Collateral Protection
              </button>
              <button
                onClick={() => setActiveTab('yield')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'yield'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Idle Yield Split
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="font-mono text-emerald-400">Pot: ₦2,500,000 ($1,650 USDC)</span>
            </div>
          </div>

          {/* Tab Content 1: Live Matrix */}
          {activeTab === 'matrix' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-medium px-2 flex justify-between">
                <span>Member Name & Slot</span>
                <span>Payment Status</span>
              </div>
              {heroMembers.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl hover:border-emerald-500/30 transition-colors text-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                      {m.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{m.name}</span>
                      <span className="text-xs text-slate-400">{m.slot}</span>
                    </div>
                  </div>
                  <div>
                    {m.status === 'paid' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid ({m.amount})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        <Clock className="w-3.5 h-3.5 mr-1" /> {m.amount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 2: Slashing Protection */}
          {activeTab === 'slashing' && (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
                <h4 className="font-bold text-white text-base">Automatic Collateral Slashing Engine</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                If a member receives their pot in Cycle 1 and misses their Cycle 2 contribution after the 24-hour grace period, the Soroban smart contract automatically slashes 100% of their locked collateral stake to reimburse the group.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Defaulter Collateral Staked</span>
                  <span className="text-base font-bold text-red-400">₦250,000 ($165 USDC)</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Shortfall Coverage Status</span>
                  <span className="text-base font-bold text-emerald-400">100% Reimbursed</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Idle Yield Split */}
          {activeTab === 'yield' && (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-teal-400">
                <TrendingUp className="w-6 h-6" />
                <h4 className="font-bold text-white text-base">Blend Protocol Yield Optimization</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Pooled funds waiting between cycle release dates earn high-grade lending interest via Stellar's Blend Protocol. Yield is split 70% to circle members (reducing collateral) and 30% to treasury.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Estimated APY Earned</span>
                  <span className="text-base font-bold text-teal-400">~6.8% APY (USDC)</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Member Benefit</span>
                  <span className="text-base font-bold text-white">Reduces Collateral Burden</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS (CLEAN 4-STEP SEQUENCE) */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How CircleChain Works</h2>
          <p className="text-slate-400 text-sm">Four straightforward steps. Governed by smart contract code.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <span className="text-3xl font-black text-emerald-400">01</span>
            <h3 className="text-base font-bold text-white">Create or Join</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Set fixed contribution amounts, intervals (weekly/monthly), and total members.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <span className="text-3xl font-black text-emerald-400">02</span>
            <h3 className="text-base font-bold text-white">Lock Collateral</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Members stake collateral into the vault when joining to protect the circle against default.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <span className="text-3xl font-black text-emerald-400">03</span>
            <h3 className="text-base font-bold text-white">Pay Each Cycle</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Members deposit cycle contributions before the deadline. Track progress on the live matrix.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <span className="text-3xl font-black text-emerald-400">04</span>
            <h3 className="text-base font-bold text-white">Automated Payout</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              When all members pay, the contract automatically releases 100% of the pot to the recipient.
            </p>
          </div>
        </div>
      </section>

      {/* WHY IT'S TRUSTWORTHY / TRUST FEATURES */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Transparency</h2>
          <p className="text-slate-400 text-sm">Replacing human vulnerability with mathematical proof.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Collateral Slashing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Defaulted members lose their locked collateral to protect non-defaulting circle members from loss.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Idle Yield While Locked</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pooled funds waiting between cycles generate lending APY via Stellar Blend Protocol.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Portable Reputation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              On-time payments build a Soulbound credit score, unlocking reduced collateral in future circles.
            </p>
          </div>
        </div>
      </section>

      {/* CLEAN FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm">Clear, honest answers to common trust hesitations.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-xl overflow-hidden transition-colors border border-slate-800"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-semibold text-white text-sm flex items-center justify-between hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-5 text-slate-300 text-xs leading-relaxed border-t border-slate-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SLEEK CTA BANNER */}
      <section className="max-w-4xl mx-auto glass-card border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="ambient-glow bg-emerald-500/20 w-72 h-72 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Ready to save with complete trust?</h2>
        <p className="text-slate-300 text-sm max-w-lg mx-auto">
          Start your own rotating savings circle or explore active pools on Stellar Testnet.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/circles/create"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25"
          >
            Start a Circle
          </Link>
          <Link
            href="/circles"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition-colors"
          >
            Explore Active Circles
          </Link>
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500 space-y-1">
        <p>© 2026 CircleChain Protocol. Built on Stellar Soroban.</p>
        <p>CircleChain is currently operating on Stellar Testnet for testing and verification.</p>
      </footer>
    </div>
  );
}
