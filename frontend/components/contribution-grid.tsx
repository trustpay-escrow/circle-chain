'use client';

import { CheckCircle2, XCircle, Clock, AlertTriangle, Shield } from 'lucide-react';
import { CycleContributionStatus } from '../lib/types';

interface ContributionGridProps {
  memberCount: number;
  currentCycle: number;
  members: string[];
  contributions: (CycleContributionStatus | any)[];
}

export function ContributionGrid({ memberCount, currentCycle, members, contributions }: ContributionGridProps) {
  const isPaid = (memberAddress: string, cycleIndex: number) => {
    return contributions.some((c: any) => {
      const addr = c.member_address || c.memberAddress || '';
      const cIdx = c.cycle_index !== undefined ? c.cycle_index : c.cycleIndex;
      const paid = c.status === 'paid' || c.hasPaid === true;
      return addr.toLowerCase() === memberAddress.toLowerCase() && cIdx === cycleIndex && paid;
    });
  };

  const isSlashed = (memberAddress: string, cycleIndex: number) => {
    return contributions.some((c: any) => {
      const addr = c.member_address || c.memberAddress || '';
      const cIdx = c.cycle_index !== undefined ? c.cycle_index : c.cycleIndex;
      return (
        addr.toLowerCase() === memberAddress.toLowerCase() &&
        cIdx === cycleIndex &&
        c.status === 'slashed_covered'
      );
    });
  };

  const isDefaulted = (memberAddress: string, cycleIndex: number) => {
    return contributions.some((c: any) => {
      const addr = c.member_address || c.memberAddress || '';
      const cIdx = c.cycle_index !== undefined ? c.cycle_index : c.cycleIndex;
      const defaulted = c.status === 'defaulted' || c.isDefaulted === true;
      return addr.toLowerCase() === memberAddress.toLowerCase() && cIdx === cycleIndex && defaulted;
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Transparency Matrix</h3>
          <p className="text-xs text-slate-400">Live on-chain contribution verification grid</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mr-1 shrink-0" /> Paid</span>
          <span className="flex items-center text-purple-400"><Shield className="w-4 h-4 mr-1 shrink-0" /> Slashed / Covered</span>
          <span className="flex items-center text-amber-400"><Clock className="w-4 h-4 mr-1 shrink-0" /> Current Cycle</span>
          <span className="flex items-center text-rose-400"><AlertTriangle className="w-4 h-4 mr-1 shrink-0" /> Defaulted</span>
          <span className="flex items-center text-slate-500"><XCircle className="w-4 h-4 mr-1 shrink-0" /> Pending</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="py-3 px-4 font-semibold min-w-[140px]">Member</th>
              {Array.from({ length: Math.max(memberCount, 1) }).map((_, idx) => (
                <th key={idx} className="py-3 px-4 text-center font-semibold whitespace-nowrap">
                  Cycle {idx + 1} {idx === currentCycle && <span className="text-amber-400">(Current)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={Math.max(memberCount, 1) + 1} className="py-8 text-center text-slate-500 text-xs italic">
                  No members joined yet. Stake collateral above to fill the first seat!
                </td>
              </tr>
            ) : (
              members.map((addr, mIdx) => (
                <tr key={mIdx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                    {addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr}
                  </td>
                  {Array.from({ length: Math.max(memberCount, 1) }).map((_, cIdx) => {
                    const paid = isPaid(addr, cIdx);
                    const slashed = isSlashed(addr, cIdx);
                    const defaulted = isDefaulted(addr, cIdx);
                    const isCurrent = cIdx === currentCycle;

                    return (
                      <td key={cIdx} className="py-3 px-4 text-center">
                        {slashed ? (
                          <span title="Defaulted & Slashed: Pot deficit covered by liquidated collateral">
                            <Shield className="w-5 h-5 text-purple-400 inline-block" />
                          </span>
                        ) : paid ? (
                          <span title="Paid on-chain">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 inline-block" />
                          </span>
                        ) : defaulted ? (
                          <span title="Defaulted">
                            <AlertTriangle className="w-5 h-5 text-rose-400 inline-block" />
                          </span>
                        ) : isCurrent ? (
                          <span title="Due for this cycle">
                            <Clock className="w-5 h-5 text-amber-400 inline-block animate-pulse" />
                          </span>
                        ) : (
                          <span title="Pending future cycle">
                            <XCircle className="w-5 h-5 text-slate-700 inline-block" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
