'use client';

import { useEffect, useState, useCallback } from 'react';
import { ContributionGrid } from '../../../components/contribution-grid';
import { ShieldCheck, ArrowUpRight, DollarSign, Loader2, UserPlus, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchCircleById, 
  CircleData, 
  joinCircleApi, 
  recordContributionApi, 
  releasePayoutApi,
  fetchContributionsApi 
} from '../../../lib/api';
import { useWallet } from '../../../lib/wallet-context';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export default function CircleDashboardPage({ params }: { params: { id: string } }) {
  const { address, openModal } = useWallet();
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadCircleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCircleById(params.id);
      setCircle(data);
      if (data) {
        // Also fetch up-to-date contributions
        const contribs = await fetchContributionsApi(params.id);
        setContributions(contribs.length > 0 ? contribs : (data.contributions || []));
      }
    } catch (err) {
      console.error('Error fetching circle:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadCircleData();
  }, [loadCircleData]);

  const handleJoinCircle = async () => {
    if (!address) {
      toast.error('Connect Wallet', { description: 'Please connect your Stellar wallet first to join.' });
      openModal();
      return;
    }

    if (!circle) return;

    setIsActionLoading(true);
    try {
      const res = await joinCircleApi(circle.circle_id, address, circle.collateral_required);
      if (res.success) {
        toast.success('Joined Circle Successfully!', {
          description: `Staked $${circle.collateral_required} USDC collateral and registered to pool roster.`
        });
        await loadCircleData();
      } else {
        toast.error('Failed to Join Circle', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Join Error', { description: err.message || 'Unexpected network error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePayContribution = async () => {
    if (!address) {
      toast.error('Connect Wallet', { description: 'Please connect your wallet to make a contribution.' });
      openModal();
      return;
    }

    if (!circle) return;

    setIsActionLoading(true);
    try {
      const res = await recordContributionApi({
        circle_id: circle.circle_id,
        cycle_index: 0,
        member_address: address,
        amount: circle.contribution_amount
      });

      if (res.success) {
        toast.success('Cycle Contribution Recorded!', {
          description: `Paid $${circle.contribution_amount} USDC for Cycle 1.`
        });
        await loadCircleData();
      } else {
        toast.error('Contribution Failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Payment Error', { description: err.message || 'Unexpected network error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReleasePot = async () => {
    if (!address) {
      toast.error('Connect Wallet', { description: 'Please connect your wallet first.' });
      openModal();
      return;
    }

    if (!circle) return;

    setIsActionLoading(true);
    try {
      const totalPot = (circle.contribution_amount || 100) * (circle.member_count || 5);
      const res = await releasePayoutApi({
        circle_id: circle.circle_id,
        cycle_index: 0,
        recipient_address: circle.creator_address,
        total_pot: totalPot
      });

      if (res.success) {
        toast.success('Pot Release Successful!', {
          description: res.message || `Released $${totalPot} USDC to recipient wallet.`
        });
        await loadCircleData();
      } else {
        toast.error('Pot Release Failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Release Error', { description: err.message || 'Unexpected network error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading circle metrics and blockchain records...</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <h2 className="text-2xl font-bold text-white">Circle #{params.id} Not Found</h2>
        <p className="text-slate-400 text-sm">
          This circle may not exist or the database server is currently restarting.
        </p>
      </Card>
    );
  }

  // Member roster
  const memberList: string[] = (circle.members && circle.members.length > 0)
    ? circle.members.map((m: any) => typeof m === 'string' ? m : m.wallet_address || m)
    : [circle.creator_address];

  const isUserMember = address
    ? memberList.some((m) => m.toLowerCase() === address.toLowerCase())
    : false;

  const totalPot = (circle.contribution_amount || 100) * (circle.member_count || 5);

  const hasUserPaidCycle0 = address
    ? contributions.some(
        (c: any) =>
          (c.member_address || c.memberAddress || '').toLowerCase() === address.toLowerCase() &&
          (c.cycle_index === 0 || c.cycleIndex === 0) &&
          (c.status === 'paid' || c.hasPaid === true)
      )
    : false;

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

        <div className="flex flex-wrap items-center gap-3">
          {!isUserMember ? (
            <Button
              variant="gradient"
              size="md"
              onClick={handleJoinCircle}
              disabled={isActionLoading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span>Join Circle (Stake ${circle.collateral_required} USDC)</span>
            </Button>
          ) : (
            <>
              {hasUserPaidCycle0 ? (
                <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Cycle 1 Paid</span>
                </div>
              ) : (
                <Button
                  variant="gradient"
                  size="md"
                  onClick={handlePayContribution}
                  disabled={isActionLoading}
                >
                  Pay Cycle 1 (${circle.contribution_amount} USDC)
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={handleReleasePot}
                disabled={isActionLoading}
              >
                <span>Release Pot</span>
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
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
          <span className="text-xs text-slate-400 font-medium">Scheduled Recipient (Cycle 1)</span>
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
        members={memberList}
        contributions={contributions}
      />
    </div>
  );
}
