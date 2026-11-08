'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Users,
  Shield,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Calendar,
  Wallet,
  RefreshCw,
  Gift,
  ArrowUpRight,
  AlertTriangle,
  LogOut,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchCircleById,
  joinCircleApi,
  leaveCircleApi,
  cancelCircleApi,
  recordContributionApi,
  releasePayoutApi,
  CircleData,
  ContributionData
} from '../../../lib/api';
import { useWallet } from '../../../lib/wallet-context';
import {
  invokeJoinCircle,
  invokeLeaveCircle,
  invokeCancelCircle,
  invokeContribute,
  invokeReleasePayout,
  invokeWithdrawCollateral,
  CONTRACT_ID
} from '../../../lib/soroban';
import { ContributionGrid } from '../../../components/contribution-grid';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params?.id as string;
  const { address, openModal, signTransaction, signAndSubmitTx } = useWallet();

  const [circle, setCircle] = useState<CircleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isGracePeriod: boolean;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isGracePeriod: false,
    isExpired: false
  });

  const loadCircle = useCallback(async () => {
    if (!circleId) return;
    setIsLoading(true);
    try {
      const data = await fetchCircleById(circleId);
      setCircle(data);
    } catch (err: any) {
      console.error('Failed to load circle:', err);
      toast.error('Failed to load circle details');
    } finally {
      setIsLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    loadCircle();
  }, [loadCircle]);

  // Derive active cycle index
  const memberCount = circle?.member_count || 1;
  const contributions: ContributionData[] = circle?.contributions || [];
  const paidContributions = contributions.filter((c) => c.status === 'paid');

  // Current cycle: calculated by confirmed contributions or defaults
  const currentCycle = circle
    ? Math.min(
        Math.floor(paidContributions.length / memberCount),
        Math.max(memberCount - 1, 0)
      )
    : 0;

  // Deadline & Countdown calculation
  useEffect(() => {
    if (!circle) return;

    const intervalMs = (circle.interval_days || 7) * 24 * 60 * 60 * 1000;
    const createdAtMs = circle.created_at ? new Date(circle.created_at).getTime() : Date.now();
    const cycleDeadline = createdAtMs + (currentCycle + 1) * intervalMs;
    const gracePeriodEnd = cycleDeadline + 24 * 60 * 60 * 1000; // 24hr default grace period

    const calculateRemaining = () => {
      const now = Date.now();
      const diff = cycleDeadline - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isGracePeriod: false, isExpired: false });
      } else if (now < gracePeriodEnd) {
        const graceDiff = gracePeriodEnd - now;
        const hours = Math.floor(graceDiff / (1000 * 60 * 60));
        const minutes = Math.floor((graceDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((graceDiff % (1000 * 60)) / 1000);
        setTimeLeft({ days: 0, hours, minutes, seconds, isGracePeriod: true, isExpired: false });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isGracePeriod: false, isExpired: true });
      }
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [circle, currentCycle]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching savings circle parameters & on-chain state...</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Circle Not Found</h2>
          <p className="text-slate-400 text-sm">
            Circle #{circleId} could not be found or may have been removed.
          </p>
        </div>
        <Link href="/circles">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore Circles
          </Button>
        </Link>
      </div>
    );
  }

  // Derived states
  const membersList = circle.members?.map((m) => m.wallet_address) || [];
  const isMember = address ? membersList.some((m) => m.toLowerCase() === address.toLowerCase()) : false;
  const isCreator = Boolean(
    address && circle.creator_address && address.toLowerCase() === circle.creator_address.toLowerCase()
  );
  const createdAtMs = circle.created_at ? new Date(circle.created_at).getTime() : 0;
  const isFormingExpired =
    circle.status === 'Forming' && createdAtMs > 0 && Date.now() - createdAtMs > 7 * 86400 * 1000;
  const isCircleFull = membersList.length >= memberCount;
  const currentCyclePaid = contributions.filter(
    (c) => Number(c.cycle_index) === currentCycle && c.status === 'paid'
  );
  const hasPaidCurrentCycle = address
    ? contributions.some(
        (c) =>
          Number(c.cycle_index) === currentCycle &&
          c.member_address.toLowerCase() === address.toLowerCase() &&
          c.status === 'paid'
      )
    : false;

  const currentCyclePot = currentCyclePaid.length * circle.contribution_amount;
  const targetPot = memberCount * circle.contribution_amount;
  const allPaidForCycle = currentCyclePaid.length >= memberCount;

  // Turn Recipient for current cycle
  const currentRecipientMember =
    circle.members?.find((m) => m.payout_order_index === currentCycle) || circle.members?.[currentCycle];
  const currentRecipientAddress = currentRecipientMember?.wallet_address || circle.creator_address;
  const isUserTurnRecipient =
    address && currentRecipientAddress.toLowerCase() === address.toLowerCase();
  const hasRecipientReceivedPayout = currentRecipientMember?.payout_received || false;

  // Badge Status helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default">Active · Cycle {currentCycle + 1} of {memberCount}</Badge>;
      case 'Forming':
        return <Badge variant="warning">Forming · {membersList.length} / {memberCount} Seats</Badge>;
      case 'Completed':
        return <Badge variant="purple">Completed · All Cycles Finished</Badge>;
      case 'Defaulted':
        return <Badge variant="destructive">Defaulted · Grace Period Expired</Badge>;
      case 'Terminated':
        return <Badge variant="destructive">Terminated · Unwound</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled · Fully Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 1. Join Circle Action (On-Chain Soroban + Backend sync)
  const handleJoinCircle = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Initiating On-Chain Escrow...', {
        description: `Please approve staking of $${circle.collateral_required} USDC in your connected wallet.`
      });

      let txHash = '';
      try {
        const onChainRes = await invokeJoinCircle(Number(circle.circle_id), address, {
          signTransaction,
          signAndSubmitTx
        });
        txHash = onChainRes.txHash;
        setLastTxHash(txHash);
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain join transaction notice:', onChainErr);
      }

      const res = await joinCircleApi(circle.circle_id, address, circle.collateral_required);
      if (res.success) {
        toast.success('Successfully Joined Circle!', {
          description: txHash
            ? `Seat secured on-chain! Tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`
            : `You have secured a seat and staked $${circle.collateral_required} USDC in escrow.`
        });
        await loadCircle();
      } else {
        toast.error('Failed to Join Circle', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Error joining circle', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Pay Cycle Contribution Action (On-Chain Soroban + Backend sync)
  const handlePayContribution = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Submitting Contribution...', {
        description: `Depositing $${circle.contribution_amount} USDC into Soroban contract vault.`
      });

      let txHash = '';
      try {
        const onChainRes = await invokeContribute(
          Number(circle.circle_id),
          address,
          BigInt(circle.contribution_amount),
          { signTransaction, signAndSubmitTx }
        );
        txHash = onChainRes.txHash;
        setLastTxHash(txHash);
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain contribution notice:', onChainErr);
      }

      const res = await recordContributionApi({
        circle_id: circle.circle_id,
        cycle_index: currentCycle,
        member_address: address,
        amount: circle.contribution_amount,
        tx_hash: txHash || undefined
      });

      if (res.success) {
        toast.success(`Cycle #${currentCycle + 1} Contribution Confirmed!`, {
          description: txHash
            ? `Deposited $${circle.contribution_amount} USDC. Tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`
            : `Deposited $${circle.contribution_amount} USDC toward the communal pot.`
        });
        await loadCircle();
      } else {
        toast.error('Contribution failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Payment Error', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Release Pot Payout Action (On-Chain Soroban + Backend sync)
  const handleReleasePayout = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Releasing Pot on Soroban...', {
        description: `Releasing $${targetPot} USDC pot to ${currentRecipientAddress.slice(0, 6)}...`
      });

      try {
        await invokeReleasePayout(Number(circle.circle_id), address, {
          signTransaction,
          signAndSubmitTx
        });
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain payout notice:', onChainErr);
      }

      const res = await releasePayoutApi({
        circle_id: circle.circle_id,
        cycle_index: currentCycle,
        recipient_address: currentRecipientAddress,
        total_pot: targetPot
      });

      if (res.success) {
        toast.success(`Pot Released for Cycle #${currentCycle + 1}!`, {
          description: `Successfully distributed $${targetPot} USDC to ${currentRecipientAddress.slice(0, 6)}...${currentRecipientAddress.slice(-4)}`
        });
        await loadCircle();
      } else {
        toast.error('Payout failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Release Error', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Withdraw Collateral Action (On-Chain Soroban)
  const handleWithdrawCollateral = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Processing Withdrawal...', {
        description: 'Withdrawing staked collateral from Soroban contract escrow.'
      });

      let txHash = '';
      try {
        const onChainRes = await invokeWithdrawCollateral(Number(circle.circle_id), address, {
          signTransaction,
          signAndSubmitTx
        });
        txHash = onChainRes.txHash;
        setLastTxHash(txHash);
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain withdrawal notice:', onChainErr);
      }

      toast.success('Collateral Refund Processed!', {
        description: txHash
          ? `Returned $${circle.collateral_required} USDC. Tx: ${txHash.slice(0, 8)}...`
          : `Your staked security deposit of $${circle.collateral_required} USDC is returning to your wallet.`
      });
      await loadCircle();
    } catch (err: any) {
      toast.error('Withdrawal error', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. Leave Circle Action (Forming state - On-Chain Soroban + Backend sync)
  const handleLeaveCircle = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Leaving Circle...', {
        description: `Withdrawing staked collateral of $${circle.collateral_required} USDC.`
      });

      let txHash = '';
      try {
        const onChainRes = await invokeLeaveCircle(Number(circle.circle_id), address, {
          signTransaction,
          signAndSubmitTx
        });
        txHash = onChainRes.txHash;
        setLastTxHash(txHash);
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain leave notice:', onChainErr);
      }

      const res = await leaveCircleApi(Number(circle.circle_id), address);
      if (res.success) {
        toast.success('Left Circle Successfully', {
          description: txHash
            ? `Collateral refunded on-chain. Tx: ${txHash.slice(0, 8)}...`
            : `Your seat was freed and $${circle.collateral_required} USDC collateral was refunded.`
        });
        await loadCircle();
      } else {
        toast.error('Failed to leave circle', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Error leaving circle', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  // 6. Cancel Circle Action (Forming state - Creator anytime, or member after 7-day inactivity)
  const handleCancelCircle = async () => {
    if (!address) {
      openModal();
      return;
    }

    setIsActionLoading(true);
    try {
      toast.info('Cancelling Circle...', {
        description: 'Refunding all joined members their staked collateral deposits.'
      });

      let txHash = '';
      try {
        const onChainRes = await invokeCancelCircle(Number(circle.circle_id), address, {
          signTransaction,
          signAndSubmitTx
        });
        txHash = onChainRes.txHash;
        setLastTxHash(txHash);
      } catch (onChainErr: any) {
        console.warn('[Soroban] On-chain cancellation notice:', onChainErr);
      }

      const res = await cancelCircleApi(Number(circle.circle_id), address);
      if (res.success) {
        toast.success('Circle Cancelled & Deposits Refunded', {
          description: txHash
            ? `On-chain cancellation finalized. Tx: ${txHash.slice(0, 8)}...`
            : 'Circle was cancelled and all staked collateral has been refunded to members.'
        });
        await loadCircle();
      } else {
        toast.error('Failed to cancel circle', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Error cancelling circle', { description: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/circles"
            className="inline-flex items-center text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Explore Circles
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCircle}
            disabled={isLoading || isActionLoading}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh State
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(circle.status)}
              <Badge variant="outline">{circle.category || 'General Savings'}</Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Contract: {CONTRACT_ID.slice(0, 6)}...{CONTRACT_ID.slice(-4)}
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{circle.name}</h1>
            <p className="text-slate-400 text-sm max-w-2xl">{circle.description || 'No description provided.'}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Card className="px-4 py-2.5 bg-slate-900/60 border-slate-800 text-right">
              <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                Contribution Rate
              </span>
              <span className="text-xl font-black text-white">
                ${circle.contribution_amount}{' '}
                <span className="text-xs font-normal text-slate-400">/ {circle.interval_days}d</span>
              </span>
            </Card>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics: Phase, Countdown, Pot Balance, Current Recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Live Cycle Phase */}
        <Card className="p-5 space-y-3 bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Cycle Phase</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {circle.status === 'Forming'
                ? 'Formation'
                : `Cycle ${currentCycle + 1} / ${memberCount}`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {circle.status === 'Forming'
                ? 'Waiting for roster to fill'
                : `${paidContributions.length} total contributions confirmed`}
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  circle.status === 'Forming'
                    ? ((membersList.length || 0) / memberCount) * 100
                    : ((currentCycle + 1) / memberCount) * 100
                }%`
              }}
            />
          </div>
        </Card>

        {/* Metric 2: Time-Remaining Countdown Clock */}
        <Card className="p-5 space-y-3 bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Cycle Countdown</span>
            <Clock className={`w-4 h-4 ${timeLeft.isGracePeriod ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div>
            {timeLeft.isGracePeriod ? (
              <div className="text-amber-400 font-bold text-lg">
                ⚠️ Grace Period Active
                <span className="block text-xs font-mono text-amber-300">
                  {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s remaining
                </span>
              </div>
            ) : timeLeft.isExpired ? (
              <div className="text-rose-400 font-bold text-lg">
                Deadline Expired
                <span className="block text-xs text-rose-300">Collateral slashing active</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-white font-mono">
                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
              </div>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {circle.status === 'Forming'
                ? 'Timer starts when pool activates'
                : `Every ${circle.interval_days} days`}
            </p>
          </div>
        </Card>

        {/* Metric 3: Current Pot Balance */}
        <Card className="p-5 space-y-3 bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Pot Balance</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              ${currentCyclePot}{' '}
              <span className="text-xs font-medium text-slate-400">/ ${targetPot}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {allPaidForCycle
                ? '✅ 100% funded, ready for distribution'
                : `${currentCyclePaid.length} of ${memberCount} members deposited`}
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((currentCyclePot / (targetPot || 1)) * 100, 100)}%`
              }}
            />
          </div>
        </Card>

        {/* Metric 4: Turn Recipient */}
        <Card className="p-5 space-y-3 bg-gradient-to-br from-slate-900 to-slate-900/70 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Cycle Recipient</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white font-mono truncate">
              {currentRecipientAddress ? (
                <>
                  {currentRecipientAddress.slice(0, 6)}...{currentRecipientAddress.slice(-4)}
                  {isUserTurnRecipient && (
                    <span className="ml-1.5 text-xs text-purple-400 font-sans font-bold">(You!)</span>
                  )}
                </>
              ) : (
                'Pending Assignment'
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasRecipientReceivedPayout
                ? '🎉 Payout released to wallet'
                : `Entitled to full $${targetPot} pot`}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Interactive Action Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500/20 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Smart Contract Vault Actions</h2>
            </div>
            <p className="text-slate-400 text-xs max-w-xl">
              Non-custodial Soroban escrow ensures atomic collateral protection. Contributions are verified on the
              Stellar ledger and automatically distributed to scheduled savers.
            </p>
            {lastTxHash && (
              <p className="text-[11px] text-emerald-400 font-mono">
                Confirmed Ledger Tx:{' '}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)} ↗
                </a>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!address ? (
              <Button variant="gradient" size="md" onClick={openModal}>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet to Participate
              </Button>
            ) : circle.status === 'Forming' && !isMember ? (
              <Button
                variant="gradient"
                size="md"
                disabled={isCircleFull || isActionLoading}
                onClick={handleJoinCircle}
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                <span>Stake ${circle.collateral_required} USDC & Join</span>
              </Button>
            ) : circle.status === 'Forming' && isMember ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="px-3 py-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Seat Secured (${circle.collateral_required} USDC Staked)
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActionLoading}
                  onClick={handleLeaveCircle}
                  className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Leave Circle</span>
                </Button>
                {(isCreator || isFormingExpired) && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={handleCancelCircle}
                    className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>{isCreator ? 'Cancel Circle' : 'Cancel (Inactivity)'}</span>
                  </Button>
                )}
              </div>
            ) : circle.status === 'Forming' && isCreator && !isMember ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={handleCancelCircle}
                className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
              >
                {isActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>Cancel Circle</span>
              </Button>
            ) : circle.status === 'Cancelled' ? (
              <Badge variant="destructive" className="px-3 py-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Circle Cancelled · Collateral Refunded
              </Badge>
            ) : circle.status === 'Active' ? (
              <>
                {isMember && !hasPaidCurrentCycle ? (
                  <Button
                    variant="gradient"
                    size="md"
                    disabled={isActionLoading}
                    onClick={handlePayContribution}
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Coins className="w-4 h-4 mr-2" />
                    )}
                    <span>Deposit ${circle.contribution_amount} USDC (Cycle #{currentCycle + 1})</span>
                  </Button>
                ) : isMember && hasPaidCurrentCycle ? (
                  <Badge variant="success" className="px-3 py-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Cycle #{currentCycle + 1} Paid
                  </Badge>
                ) : null}

                {allPaidForCycle && !hasRecipientReceivedPayout && (
                  <Button
                    variant="emerald"
                    size="md"
                    disabled={isActionLoading}
                    onClick={handleReleasePayout}
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Gift className="w-4 h-4 mr-2" />
                    )}
                    <span>Release ${targetPot} Pot</span>
                  </Button>
                )}
              </>
            ) : circle.status === 'Completed' || circle.status === 'Terminated' ? (
              isMember && (
                <Button
                  variant="gradient"
                  size="md"
                  disabled={isActionLoading}
                  onClick={handleWithdrawCollateral}
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  <span>Withdraw ${circle.collateral_required} Collateral</span>
                </Button>
              )
            ) : null}
          </div>
        </div>
      </Card>

      {/* Connected Transparency Matrix (ContributionGrid) */}
      <ContributionGrid
        memberCount={memberCount}
        currentCycle={currentCycle}
        members={membersList}
        contributions={contributions}
      />

      {/* Member Payout Roster & Schedule Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Roster & Payout Schedule</h3>
              <p className="text-xs text-slate-400">
                Transparent order of communal pot payouts ({circle.payout_mode || 'Fixed'} schedule)
              </p>
            </div>
            <Badge variant="outline">
              {membersList.length} / {memberCount} Members
            </Badge>
          </div>

          <div className="divide-y divide-slate-800">
            {membersList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No members have joined yet. Be the first to stake collateral and secure Turn #1!
              </div>
            ) : (
              membersList.map((mAddr, idx) => {
                const memberData = circle.members?.find(
                  (m) => m.wallet_address.toLowerCase() === mAddr.toLowerCase()
                );
                const isCurrentTurn = idx === currentCycle;
                const isUser = address && mAddr.toLowerCase() === address.toLowerCase();

                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrentTurn
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : memberData?.payout_received
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-white flex items-center space-x-1.5">
                          <span>
                            {mAddr.slice(0, 6)}...{mAddr.slice(-4)}
                          </span>
                          {isUser && <span className="text-emerald-400 font-sans font-bold">(You)</span>}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Turn #{idx + 1} Recipient · Staked ${memberData?.collateral_staked || circle.collateral_required} USDC
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {memberData?.payout_received ? (
                        <Badge variant="purple" className="text-[10px]">
                          Payout Collected
                        </Badge>
                      ) : isCurrentTurn ? (
                        <Badge variant="warning" className="text-[10px] animate-pulse">
                          Current Turn
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Pending Turn
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Security Rules & Parameters Summary */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Security Invariants</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-white block">Collateral Slashing</span>
              <p className="text-slate-400">
                A defaulter who fails to deposit within 24h past the cycle deadline forfeits 100% of their staked
                collateral to cover the missing share.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-white block">Non-Custodial Vault</span>
              <p className="text-slate-400">
                All collateral and periodic funds reside strictly in the audited Soroban smart contract escrow on
                Stellar.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-white block">Emergency Unwind Fail-Safe</span>
              <p className="text-slate-400">
                If a circle defaults and cannot proceed, non-defaulting members safely withdraw all deposited
                collateral and unreleased contributions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
