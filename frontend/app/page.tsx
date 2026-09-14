'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletModal } from '../components/wallet-modal';
import { Button } from '../components/ui/button';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  ChevronDown,
  ArrowRight,
  PlayCircle,
  X,
  Play,
  Star,
  Quote,
  HeartHandshake,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'slashing' | 'yield'>('matrix');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoStep, setActiveVideoStep] = useState(0);

  const heroMembers = [
    { name: 'Amina Bello', status: 'paid', slot: 'Cycle 1 (Received)', amount: '₦500,000' },
    { name: 'Tunde Bakare', status: 'paid', slot: 'Cycle 2 (Current)', amount: '₦500,000' },
    { name: 'Chioma Okonkwo', status: 'paid', slot: 'Cycle 3 (Next)', amount: '₦500,000' },
    { name: 'Emeka Nnaji', status: 'paid', slot: 'Cycle 4', amount: '₦500,000' },
    { name: 'Folake Adebayo', status: 'pending', slot: 'Cycle 5', amount: '₦500,000 (14h left)' },
  ];

  const videoSteps = [
    {
      title: '1. Create or Join a Circle',
      desc: 'Set fixed contribution amount (USDC), member capacity, and payout interval.',
      visual: 'Circle Creation Wizard • Configured for 5 Members, 14-day interval',
      caption: 'Initializes on Stellar Soroban in 1 click.',
    },
    {
      title: '2. Stake Collateral in Vault',
      desc: 'Members deposit required collateral upon joining. Vault holds funds securely.',
      visual: 'Wallet Approval Prompt • Staked ₦250,000 ($165 USDC)',
      caption: 'Protects the group against future defaults.',
    },
    {
      title: '3. Real-Time Matrix Tracking',
      desc: 'Watch the live transparency grid update as each member pays their cycle.',
      visual: 'Transparency Grid • 4 of 5 Paid • Cycle 2 Countdown: 14h Left',
      caption: 'Everyone sees payment status in real time.',
    },
    {
      title: '4. Automated Payout Release',
      desc: 'Once all contributions land, Soroban contract transfers 100% pot to recipient.',
      visual: 'Smart Contract Execution • ₦2,500,000 Sent to Recipient Wallet',
      caption: 'Zero human delay. Pure code release.',
    },
    {
      title: '5. Build Soulbound Reputation',
      desc: 'On-time completion updates your portable credit score for future circles.',
      visual: 'Reputation Profile • Score: 98/100 • Unlocked 20% Collateral Discount',
      caption: 'Your good savings record travels with you.',
    },
  ];

  const testimonials = [
    {
      name: 'Amina Adebayo',
      role: 'Market Vendor Leader',
      location: 'Lagos, Nigeria',
      avatar: 'AA',
      badge: 'Lagos Traders Circle (₦5M Total Saved)',
      quote: 'Our 10-member market contribution used to suffer from delayed payouts and missing trust. With CircleChain, every payout is 100% instant and guaranteed by smart code!',
      stars: 5,
    },
    {
      name: 'Tunde Bakare',
      role: 'Software Engineer',
      location: 'Abuja, Nigeria',
      avatar: 'TB',
      badge: 'Techies Escalator (₦2.5M Saved)',
      quote: 'I was skeptical about crypto until I tried CircleChain. Staking locked collateral means no member can vanish after receiving an early pot. Pure peace of mind!',
      stars: 5,
    },
    {
      name: 'Chioma Okonkwo',
      role: 'Boutique Owner',
      location: 'Enugu, Nigeria',
      avatar: 'CO',
      badge: 'Enugu Savings Circle (₦4M Saved)',
      quote: 'The idle yield feature is amazing! Our pooled savings generated real lending returns on Stellar while waiting for payout dates. Never going back to manual Ajo.',
      stars: 5,
    },
    {
      name: 'Emeka Nnaji',
      role: 'Financial Analyst',
      location: 'Port Harcourt, Nigeria',
      avatar: 'EN',
      badge: 'PH Investment Syndicate (₦10M Saved)',
      quote: 'Super clean, simple interface. Connecting my wallet takes 5 seconds, and tracking cycle contributions live on the grid makes group management effortless.',
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: 'What if I have never used crypto or Web3 before?',
      a: 'You do not need crypto experience! All balances are backed in dollar-pegged stablecoins (USDC) so your savings stay completely safe from market fluctuations.',
    },
    {
      q: 'What happens if someone receives their payout and stops paying?',
      a: 'Every member stakes collateral upon joining. If a member defaults after receiving their pot, the Soroban smart contract automatically slashes their locked collateral to cover the group shortfall.',
    },
    {
      q: 'Where does the money sit during a cycle?',
      a: 'Funds sit in an audited, non-custodial Soroban contract vault on Stellar. Neither the circle organizer nor our team can withdraw or touch your money.',
    },
    {
      q: 'Is there any yield generated on locked funds?',
      a: 'Yes! Pooled funds waiting between cycle deadlines earn high-grade lending interest via Stellar Blend Protocol, giving extra returns back to members.',
    },
  ];

  return (
    <div className="relative space-y-16 sm:space-y-24 py-4">
      {/* Background Ambient Glow */}
      <div className="ambient-glow bg-emerald-500/15 w-[600px] h-[600px] top-0 left-1/2 -translate-x-1/2 -z-10" />

      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-8 pt-4">
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-medium text-slate-200 shadow-lg shadow-emerald-950/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Simple, Automated & Trustless Ajo Savings</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Save together with <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
            complete, stress-free trust.
          </span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          Your traditional Nigerian Ajo & Esusu, upgraded by smart contract technology. Automatic contribution tracking, locked collateral safety, and instant code-driven payouts.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {walletAddress ? (
            <Link href="/circles" className="w-full sm:w-auto">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto space-x-2 group">
                <span>Go to Circles Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="gradient"
              size="lg"
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full sm:w-auto space-x-2 group"
            >
              <span>Connect Wallet to Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full sm:w-auto space-x-2"
          >
            <PlayCircle className="w-5 h-5 text-amber-400" />
            <span>Watch Demo Video (90s)</span>
          </Button>
        </div>

        {/* TRUST BADGES BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center backdrop-blur-sm">
            <span className="text-emerald-400 font-bold text-base block">100% Automated</span>
            <span className="text-slate-400 text-xs">Code Payouts</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center backdrop-blur-sm">
            <span className="text-teal-400 font-bold text-base block">Zero Theft Risk</span>
            <span className="text-slate-400 text-xs">Stakes Collateral</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center backdrop-blur-sm">
            <span className="text-emerald-400 font-bold text-base block">Idle Yield</span>
            <span className="text-slate-400 text-xs">Earns interest</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center backdrop-blur-sm">
            <span className="text-purple-400 font-bold text-base block">Stellar Soroban</span>
            <span className="text-slate-400 text-xs">Non-custodial</span>
          </div>
        </div>

        {/* INTERACTIVE DEMO PREVIEW WIDGET */}
        <div className="mt-8 glass-card rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-2xl border border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'matrix' ? 'emerald' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('matrix')}
              >
                Live Matrix
              </Button>
              <Button
                variant={activeTab === 'slashing' ? 'emerald' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('slashing')}
              >
                Collateral Protection
              </Button>
              <Button
                variant={activeTab === 'yield' ? 'emerald' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('yield')}
              >
                Idle Yield Split
              </Button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-semibold">Circle Pot: ₦2,500,000 ($1,650 USDC)</span>
            </div>
          </div>

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

          {activeTab === 'slashing' && (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
                <h4 className="font-bold text-white text-base">Automatic Collateral Protection Engine</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                If a member receives their pot early and defaults on subsequent contributions, the Soroban smart contract mechanically slashes their locked collateral to cover the shortfall for all group members.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Locked Member Collateral</span>
                  <span className="text-base font-bold text-red-400">₦250,000 ($165 USDC)</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Shortfall Coverage Status</span>
                  <span className="text-base font-bold text-emerald-400">100% Reimbursed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'yield' && (
            <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-4">
              <div className="flex items-center space-x-3 text-teal-400">
                <TrendingUp className="w-6 h-6" />
                <h4 className="font-bold text-white text-base">Blend Protocol Yield Optimization</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Pooled funds waiting between payout deadlines automatically earn lending interest via Stellar's Blend Protocol. Yield is shared back with circle members to offset fees.
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

      {/* 2. HOW IT WORKS */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Simple Process</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white">How CircleChain Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Four simple, stress-free steps. Enforced automatically by smart contract code.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-white">Create or Join</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Set fixed contribution amounts, frequency (weekly/monthly), and select number of members.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-white">Lock Collateral</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Members deposit security collateral into the contract vault to guarantee group integrity.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-white">Pay Each Cycle</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Deposit your contribution before the cycle deadline and watch the live payment matrix update.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-lg">
              4
            </div>
            <h3 className="text-base font-bold text-white">Automated Payout</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Once cycle contributions land, smart contract code transfers 100% of the pot directly to recipient.
            </p>
          </div>
        </div>
      </section>

      {/* 3. TESTIMONIALS SECTION */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Community Stories</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white">Loved by Savers & Circle Leaders</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            See how real savings groups across Nigeria use CircleChain for stress-free, transparent Ajo contributions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 space-y-4 border border-slate-800/90 relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 border border-slate-800">
                    {t.badge}
                  </span>
                </div>

                <div className="relative">
                  <Quote className="w-8 h-8 text-emerald-500/10 absolute -top-2 -left-2 -z-10 rotate-180" />
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 pt-3 border-t border-slate-800/70">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {t.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-white font-semibold text-sm">{t.name}</h4>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium" title="Verified Saver">
                      <Check className="w-3 h-3 mr-0.5" /> Verified
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    {t.role} • <span className="text-slate-500">{t.location}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TRUST FEATURES */}
      <section className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Unmatched Security</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Complete Transparency</h2>
          <p className="text-slate-400 text-sm">Replacing human vulnerability with mathematical proof.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Collateral Slashing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Defaulted members lose their locked collateral to protect non-defaulting circle members from any financial loss.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Idle Yield Earned</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pooled funds waiting between cycles generate real lending APY via Stellar Blend Protocol automatically.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Portable Reputation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              On-time payments build a Soulbound credit score, unlocking reduced collateral in future circles.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE VIDEO WALKTHROUGH SECTION */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Product Walkthrough</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">See How Easy It Is to Use</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Click below to launch the step-by-step interactive video guide on creating circles, depositing collateral, and receiving automated payouts.
          </p>
        </div>

        <div
          className="relative glass-card border border-emerald-500/30 rounded-3xl overflow-hidden p-8 sm:p-12 text-center shadow-2xl group cursor-pointer"
          onClick={() => setIsVideoModalOpen(true)}
        >
          <div className="ambient-glow bg-emerald-500/20 w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />

          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-8 h-8 text-emerald-400 fill-emerald-400 ml-1" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Watch App Demo & Operation Guide</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-4">
            Interactive 90-second video walkthrough showing wallet connection, cycle contributions, and automated Soroban payouts.
          </p>

          <Button variant="emerald" size="sm">
            Launch Interactive Video Player
          </Button>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Help & Answers</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm">Clear, honest answers to common trust hesitations.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-card rounded-xl overflow-hidden transition-colors border border-slate-800/80">
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
          Connect your Stellar wallet to start or join a circle. Experience automated payouts today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {walletAddress ? (
            <Link href="/circles" className="w-full sm:w-auto">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Explore Circles
              </Button>
            </Link>
          ) : (
            <Button variant="gradient" size="lg" onClick={() => setIsWalletModalOpen(true)} className="w-full sm:w-auto">
              Connect Wallet
            </Button>
          )}
        </div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500 space-y-1">
        <p>© 2026 CircleChain Protocol. Built on Stellar Soroban.</p>
        <p>CircleChain is operating on Stellar Testnet for testing and verification.</p>
      </footer>

      {/* MULTI-WALLET MODAL */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectAddress={(pubKey) => setWalletAddress(pubKey)}
      />

      {/* INTERACTIVE VIDEO MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Interactive Video Guide
              </span>
              <h3 className="text-xl font-bold text-white mt-1">CircleChain Application Walkthrough</h3>
            </div>

            {/* Video Player Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 space-y-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Shot {activeVideoStep + 1} of {videoSteps.length}: {videoSteps[activeVideoStep].title}
              </div>

              <div className="py-6 px-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-sm font-semibold text-white block mb-1">
                  {videoSteps[activeVideoStep].visual}
                </span>
                <span className="text-xs text-slate-400">{videoSteps[activeVideoStep].desc}</span>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 font-medium">
                "{videoSteps[activeVideoStep].caption}"
              </div>
            </div>

            {/* Step Selector Controls */}
            <div className="grid grid-cols-5 gap-2">
              {videoSteps.map((step, idx) => (
                <Button
                  key={idx}
                  variant={activeVideoStep === idx ? 'emerald' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveVideoStep(idx)}
                  className="text-xs"
                >
                  Shot {idx + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
