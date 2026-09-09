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
  HelpCircle,
  PlayCircle
} from 'lucide-react';

export default function LandingPage() {
  // Realistic Nigerian member mockup data for visual proof hero
  const heroMockupMembers = [
    { name: 'Amina Bello', role: 'Cycle 1 Recipient', paid: true, amount: '₦500,000 ($330 USDC)' },
    { name: 'Tunde Bakare', role: 'Cycle 2 Recipient (Current)', paid: true, amount: '₦500,000 ($330 USDC)' },
    { name: 'Chioma Okonkwo', role: 'Cycle 3 Recipient', paid: true, amount: '₦500,000 ($330 USDC)' },
    { name: 'Emeka Nnaji', role: 'Cycle 4 Recipient', paid: true, amount: '₦500,000 ($330 USDC)' },
    { name: 'Folake Adebayo', role: 'Cycle 5 Recipient', paid: false, amount: 'Pending (18h left)' },
  ];

  const faqs = [
    {
      q: 'What if I have never used crypto or Web3 before?',
      a: 'You do not need to understand blockchain technicals to use CircleChain. You can log in using standard wallets or bank deposit bridges. All contributions are denominated in stable dollars (USDC) so your savings never fluctuate with volatile crypto prices.',
    },
    {
      q: 'What happens if someone takes their payout and disappears?',
      a: 'Every member stakes collateral when joining the circle. If a member misses their contribution deadline after taking a payout, the Soroban smart contract automatically slashes their collateral to cover the shortfall. The group pot is protected.',
    },
    {
      q: 'Where does the money actually sit during a cycle?',
      a: 'Funds sit directly in an audited, non-custodial Soroban smart contract vault on the Stellar blockchain. Neither the circle creator nor the CircleChain platform can touch, freeze, or redirect your funds.',
    },
    {
      q: 'Is CircleChain legal and regulated?',
      a: 'CircleChain provides non-custodial smart contract software. We never hold user funds on our balance sheet. We recommend all circles operate within local community savings guidelines.',
    },
  ];

  return (
    <div className="space-y-24 py-6">
      {/* 1. HERO SECTION */}
      <section className="space-y-12 max-w-5xl mx-auto">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span>Stellar Soroban Smart Contracts</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Your Ajo group, protected by code — so nobody can run off with the pot.
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            CircleChain digitizes West Africa’s traditional rotating savings circles. Automatic payout releases, transparent contribution tracking, and collateral-backed default protection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/circles/create"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center"
            >
              Start a Circle
            </Link>
            <Link
              href="/circles"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition-colors flex items-center justify-center space-x-2"
            >
              <PlayCircle className="w-5 h-5 text-amber-400" />
              <span>Watch 90s Demo Video</span>
            </Link>
          </div>
        </div>

        {/* Real Visual Proof Mockup: Contribution Dashboard */}
        <div className="bg-[#101926] border border-[#1e2d42] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e2d42] pb-6">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live On-Chain Circle</span>
              <h3 className="text-2xl font-bold text-white mt-1">Balogun Market Traders Savings Circle</h3>
              <p className="text-slate-400 text-xs mt-0.5">Cycle 2 of 5 • Interval: 14 Days • Staked Collateral: ₦250,000 / member</p>
            </div>
            <div className="text-left sm:text-right bg-slate-950/60 border border-[#1e2d42] px-4 py-2.5 rounded-xl">
              <span className="text-xs text-slate-400 block">Total Cycle Pot</span>
              <span className="text-xl font-extrabold text-white">₦2,500,000 <span className="text-xs font-normal text-emerald-400">($1,650 USDC)</span></span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
              <span>Member Name & Payout Slot</span>
              <span>Cycle 2 Status</span>
              <span>Contribution</span>
            </div>
            {heroMockupMembers.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-950/40 border border-[#1e2d42]/60 p-3.5 rounded-xl text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                    {m.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{m.name}</span>
                    <span className="text-xs text-slate-400">{m.role}</span>
                  </div>
                </div>
                <div>
                  {m.paid ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {m.amount.split(' ')[0]} {m.amount.split(' ')[1]}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-slate-300 font-mono hidden sm:block">
                  {m.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Traditional Ajo works on trust — until it doesn't.</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Rotating savings has empowered African families and market traders for generations. But relying on a single human collector introduces risks that no community should have to bear.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Collector Default Risk</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              If the traditional collector experiences personal emergency, delays payouts, or disappears, members have no immediate recourse or refund mechanism.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">No Real-Time Visibility</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Members rely on verbal updates or paper notebooks to know who has paid. There is no instant, objective way to confirm that the full pot is ready for release.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <XCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Unenforced Payout Order</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Disputes often arise over recipient scheduling. Without automated smart contract rules, payout queues can be altered arbitrarily.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION (Numbered sequence 01-04) */}
      <section className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">How CircleChain Works</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            A simple 4-step sequence enforced mechanically by Soroban smart contract logic on Stellar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-4 relative">
            <span className="text-4xl font-black text-emerald-500/30">01</span>
            <h3 className="text-lg font-bold text-white">Create or Join</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Set fixed contribution amounts (in USDC), member capacity, and payout interval (weekly, bi-weekly, or monthly).
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-4 relative">
            <span className="text-4xl font-black text-emerald-500/30">02</span>
            <h3 className="text-lg font-bold text-white">Stake Collateral</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Each member deposits collateral upon joining. This stake is locked safely in the smart contract vault until the circle finishes.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-4 relative">
            <span className="text-4xl font-black text-emerald-500/30">03</span>
            <h3 className="text-lg font-bold text-white">Pay Each Cycle</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Members pay their exact contribution before the cycle deadline. Everyone watches the live transparency grid update in real time.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-4 relative">
            <span className="text-4xl font-black text-emerald-500/30">04</span>
            <h3 className="text-lg font-bold text-white">Automated Payout</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Once all members contribute, the contract automatically transfers 100% of the pot to that cycle's designated recipient.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WHAT MAKES IT DIFFERENT / TRUST FEATURES */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Engineered for Complete Trust</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Features traditional Ajo could never offer — made possible by Stellar smart contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Automated Slashing Protection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                If a member defaults after taking a payout, their locked collateral is automatically slashed to cover the missing contribution.
              </p>
            </div>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Yield While Locked</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Idle pooled funds sitting between cycle deadlines are routed into low-risk Stellar lending protocols, earning yield for members.
              </p>
            </div>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Portable Soulbound Reputation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                On-time contributions build a non-transferable credit score. High reputation scores unlock reduced collateral requirements in future circles.
              </p>
            </div>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Real-Time Verification Matrix</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                No secret ledgers. Anyone in the circle can open the dashboard to see exactly who has paid and when the next pot will fire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHO IT'S FOR */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Built for Real Communities</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Tailored for practical group financial goals, whether local or international.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <h3 className="text-lg font-bold text-white">Market Trader Supplier Credit</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Traders pool bi-weekly funds to take turns purchasing bulk inventory from international suppliers without high bank interest rates.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <h3 className="text-lg font-bold text-white">Diaspora Family Pools</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Relatively remote family members across London, Lagos, and Toronto pool stablecoins monthly to fund home construction projects back home.
            </p>
          </div>

          <div className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-3">
            <h3 className="text-lg font-bold text-white">Coworker Savings Groups</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Office colleagues pool monthly contributions to pay annual school fees, rent upfront, or equipment upgrades with full transparency.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ / TRUST OBJECTIONS */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-base">Direct answers to honest questions about security, crypto, and trust.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#101926] border border-[#1e2d42] p-6 rounded-2xl space-y-2">
              <h3 className="text-lg font-semibold text-white flex items-start space-x-2">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed pl-7">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to start your savings circle?</h2>
        <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
          Create a new circle in under 2 minutes or join an active circle on Stellar Testnet.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/circles/create"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors shadow-lg shadow-emerald-900/40"
          >
            Start a Circle
          </Link>
          <Link
            href="/circles"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-colors"
          >
            Explore Active Circles
          </Link>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-[#1e2d42] pt-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 CircleChain Protocol. Built on Stellar Soroban Smart Contracts.</p>
        <p>CircleChain is currently deployed on Stellar Testnet for demonstration and testing purposes.</p>
      </footer>
    </div>
  );
}
