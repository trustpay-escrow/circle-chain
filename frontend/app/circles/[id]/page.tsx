'use client';

import { useEffect, useState } from 'react';
import { ContributionGrid } from '../../../components/contribution-grid';
import { ShieldAlert, Award, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchCircleById, CircleData } from '../../../lib/api';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export default function CircleDashboardPage({ params }: { params: { id: string } }) {
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCircle() {
      setIsLoading(true);
      const data = await fetchCircleById(params.id);
      setCircle(data);
      setIsLoading(false);
    }
    loadCircle();
  }, [params.id]);

  const handlePayContribution = () => {
    toast.success('Contribution Payment Triggered', {
      description: `Paying $${circle?.contribution_amount || 100} USDC to Soroban contract...`
    });
  };

  const handleReleasePot = () => {
    toast.info('Pot Release Initiated', {
      description: 'Releasing total accumulated pot to designated recipient...'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading circle metrics from database...</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-white">Circle #{params.id} Not Found</h2>
        <p className="text-slate-400 text-sm">
          This circle may have been removed or does not exist in the database.
        </p>
      </Card>
    );
  }

  const memberAddresses = (circle.members && circle.members.length > 0)
    ? circle.members.map((m: any) => typeof m === 'string' ? m : m.wallet_address || m)
    : [circle.creator_address];

  const totalPot = (circle.contribution_amount || 100) * (circle.member_count || 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Badge variant="default">
              {circle.status || 'Forming'} • Cycle 1 of {circle.member_count}
            </Badge>
            <span className="text-xs text-slate-400">ID: #{circle.circle_id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{circle.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Fixed Contribution: <span className="text-emerald-400 font-semibold">${circle.contribution_amount} USDC</span> / cycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="gradient" size="md" onClick={handlePayContribution}>
            Pay Cycle 1 (${circle.contribution_amount} USDC)
          </Button>
          <Button variant="outline" size="md" onClick={handleReleasePot}>
            <span>Release Pot</span>
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Cycle Pot</span>
          <div className="text-2xl font-black text-white flex items-center">
            <DollarSign className="w-5 h-5 text-emerald-400 mr-1" />
            ${totalPot} USDC
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Creator / Recipient</span>
          <div className="text-sm font-bold text-emerald-400 font-mono truncate">
            {circle.creator_address}
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Cycle Interval</span>
          <div className="text-xl font-bold text-amber-400">
            {circle.interval_days} Days / Cycle
          </div>
        </Card>

        <Card className="p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Staked Collateral / Member</span>
          <div className="text-xl font-bold text-purple-400">
            ${circle.collateral_required} USDC
          </div>
        </Card>
      </div>

      {/* Visual Proof Matrix */}
      <ContributionGrid
        memberCount={circle.member_count || 5}
        currentCycle={0}
        members={memberAddresses}
        contributions={circle.contributions || []}
      />
    </div>
  );
}
