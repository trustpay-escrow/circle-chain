'use client';

import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { CycleContributionStatus } from '../lib/types';

interface ContributionGridProps {
  memberCount: number;
  currentCycle: number;
  members: string[];
  contributions: CycleContributionStatus[];
}

export function ContributionGrid({ memberCount, currentCycle, members, contributions }: ContributionGridProps) {
  const isPaid = (memberAddress: string, cycleIndex: number) => {
    return contributions.some(
      (c) => c.memberAddress.toLowerCase() === memberAddress.toLowerCase() && c.cycleIndex === cycleIndex && c.hasPaid
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Transparency Matrix</h3>
          <p className="text-xs text-slate-400">Live on-chain contribution verification grid</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center text-emerald-400"><CheckCircle2 className="w-4 h-4 mr-1" /> Paid</span>
          <span className="flex items-center text-amber-400"><Clock className="w-4 h-4 mr-1" /> Current Cycle</span>
          <span className="flex items-center text-slate-500"><XCircle className="w-4 h-4 mr-1" /> Pending</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="py-3 px-4 font-semibold">Member</th>
              {Array.from({ length: memberCount }).map((_, idx) => (
                <th key={idx} className="py-3 px-4 text-center font-semibold">
                  Cycle {idx + 1} {idx === currentCycle && <span className="text-amber-400">(Current)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((addr, mIdx) => (
              <tr key={mIdx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 font-mono text-xs text-emerald-400">
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                </td>
                {Array.from({ length: memberCount }).map((_, cIdx) => {
                  const paid = isPaid(addr, cIdx);
                  const isCurrent = cIdx === currentCycle;

                  return (
                    <td key={cIdx} className="py-3 px-4 text-center">
                      {paid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 inline-block" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5 text-amber-400 inline-block animate-pulse" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-700 inline-block" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
