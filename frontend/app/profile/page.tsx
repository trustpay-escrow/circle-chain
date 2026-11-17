'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  History,
  Loader2,
  User,
  Edit3,
  Save,
  X,
  Wallet,
  Coins,
  Clock,
  Shield,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchUserProfileApi,
  saveUserProfileApi,
  fetchCircles,
  UserProfileData,
  CircleData,
  ReputationLogData
} from '../../lib/api';
import { useWallet } from '../../lib/wallet-context';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ProfilePage() {
  const { address, openModal } = useWallet();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userCircles, setUserCircles] = useState<CircleData[]>([]);
  const [activeTab, setActiveTab] = useState<'circles' | 'reputation'>('circles');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');

  useEffect(() => {
    if (!address) {
      setProfile(null);
      setUserCircles([]);
      return;
    }

    async function loadProfileAndCircles() {
      setIsLoading(true);
      try {
        const [profileData, allCircles] = await Promise.all([
          fetchUserProfileApi(address!),
          fetchCircles()
        ]);

        setProfile(profileData);
        if (profileData) {
          setUsernameInput(profileData.username || '');
          setDisplayNameInput(profileData.display_name || '');
          setBioInput(profileData.bio || '');
        }

        // Filter circles where connected address is member or creator
        const userAddr = address!.toLowerCase();
        const my = allCircles.filter(
          (c) =>
            c.creator_address.toLowerCase() === userAddr ||
            c.members?.some((m) => m.wallet_address.toLowerCase() === userAddr)
        );
        setUserCircles(my);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfileAndCircles();
  }, [address]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsSaving(true);

    const updatedData: UserProfileData = {
      ...(profile || { wallet_address: address }),
      wallet_address: address,
      username: usernameInput.replace(/^@/, '').trim(),
      display_name: displayNameInput.trim() || `Saver (${address.slice(0, 4)}...${address.slice(-4)})`,
      bio: bioInput.trim()
    };

    try {
      const saved = await saveUserProfileApi(updatedData);
      setProfile(saved || updatedData);
      toast.success('Profile updated successfully!', {
        description: 'Your @username handle and profile details have been saved.'
      });
      setIsEditing(false);
    } catch (err: any) {
      toast.error('Failed to update profile', {
        description: err.message || 'Database error occurred'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Connect Your Stellar Wallet</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Connect your Freighter, Albedo, or xBull wallet to view your portable Soulbound reputation score, credit history, and manage your @username handle.
          </p>
        </div>
        <Button variant="gradient" size="lg" onClick={openModal}>
          Connect Wallet to View Profile
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching user reputation and profile metrics from database...</p>
      </div>
    );
  }

  const user = profile || {
    wallet_address: address,
    username: '',
    display_name: `Saver (${address.slice(0, 4)}...${address.slice(-4)})`,
    reputation_score: 100,
    circles_completed: 0,
    punctual_contributions: 0,
    total_collateral_staked: 0
  };

  const initials = user.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  const formattedUsername = user.username ? (user.username.startsWith('@') ? user.username : `@${user.username}`) : '@username_not_set';

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-emerald-500/20 shrink-0">
          {initials}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
            <Badge variant="default" className="w-fit mx-auto sm:mx-0">
              Verified Soroban Saver
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
            <Badge variant="purple">
              {formattedUsername}
            </Badge>
            <span className="font-mono text-slate-400">{user.wallet_address}</span>
          </div>

          {user.bio && <p className="text-slate-300 text-sm mt-2">{user.bio}</p>}
        </div>

        <div className="flex flex-col items-center sm:items-end space-y-3 shrink-0">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 px-5 text-center">
            <span className="text-xs text-slate-400 font-medium block">Portable SBT Score</span>
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              {user.reputation_score ?? 100} / 100
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            {isEditing ? 'Cancel Editing' : 'Edit Username'}
          </Button>
        </div>
      </Card>

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSaveProfile}>
          <Card className="border-emerald-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span>Update Profile & Username Handle</span>
              </h2>
              <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Display Name</label>
                <Input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="e.g. Zion Williams"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Username Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">@</span>
                  <Input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/^@/, ''))}
                    placeholder="zion_saver"
                    className="pl-8"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Unique identifier for off-chain ROSCA roster recognition.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Bio / Description</label>
              <Input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="e.g. Soroban Smart Contract Developer & ROSCA Saver"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Username & Profile
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Reputation Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold text-white">Circles Completed</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">{user.circles_completed ?? 0}</span>
          <p className="text-xs text-slate-400">Successfully finished without default</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <History className="w-5 h-5" />
            <h3 className="font-semibold text-white">Punctual Payments</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">{user.punctual_contributions ?? 0}</span>
          <p className="text-xs text-slate-400">On-time cycle payments recorded</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-white">Active Collateral</h3>
          </div>
          <span className="text-3xl font-extrabold text-white block">${user.total_collateral_staked ?? 0} USDC</span>
          <p className="text-xs text-slate-400">Staked across active circles</p>
        </Card>
      </div>

      {/* Tab Switcher: My Savings Circles vs Reputation Ledger */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('circles')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'circles'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>My Savings Circles</span>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-mono">
            {userCircles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reputation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'reputation'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>On-Chain Reputation Ledger</span>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full font-mono">
            {profile?.reputation_logs?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1 Content: My Savings Circles */}
      {activeTab === 'circles' ? (
        userCircles.length === 0 ? (
          <Card className="p-10 text-center space-y-4 border-dashed border-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-xl">
              ⭕
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Savings Circles Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You are not currently enrolled in any ROSCA savings pools. Explore open groups to stake collateral and begin rotating savings.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <Link href="/circles">
                <Button variant="outline" size="sm">Explore Open Circles</Button>
              </Link>
              <Link href="/circles/create">
                <Button variant="gradient" size="sm">Create New Circle</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCircles.map((circle) => {
              const isCreator = circle.creator_address.toLowerCase() === address.toLowerCase();
              const myMember = circle.members?.find(
                (m) => m.wallet_address.toLowerCase() === address.toLowerCase()
              );
              const turnIdx = myMember?.payout_order_index;

              return (
                <Card
                  key={circle.circle_id}
                  className="p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              circle.status === 'Active'
                                ? 'default'
                                : circle.status === 'Forming'
                                ? 'warning'
                                : circle.status === 'Completed'
                                ? 'purple'
                                : 'destructive'
                            }
                          >
                            {circle.status}
                          </Badge>
                          {isCreator && (
                            <Badge variant="purple" className="text-[10px]">
                              Creator
                            </Badge>
                          )}
                          {turnIdx !== undefined && turnIdx !== null && (
                            <Badge variant="outline" className="text-[10px]">
                              Turn #{turnIdx + 1}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white">{circle.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">${circle.contribution_amount}</span>
                        <span className="text-[11px] text-slate-400 block">USDC / Cycle</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {circle.description || 'On-chain rotating savings circle'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Circle Size:</span>
                      <span className="text-white font-mono">{circle.members?.length || 1} / {circle.member_count} Members</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Staked Security Deposit:</span>
                      <span className="text-emerald-400 font-mono">${myMember?.collateral_staked ?? circle.collateral_required} USDC</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Turn Payout Status:</span>
                      <span className="font-semibold text-white">
                        {myMember?.payout_received ? '✅ Payout Collected' : '⏳ Pending Cycle'}
                      </span>
                    </div>

                    <Link href={`/circles/${circle.circle_id}`} className="block pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Open Circle Dashboard
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Tab 2 Content: On-Chain Reputation & Audit Ledger */
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>On-Chain Credit & Reputation History</span>
              </h3>
              <p className="text-xs text-slate-400">
                Transparent cryptographic record of verified savings punctuality and circle completions
              </p>
            </div>
            <Badge variant="default" className="font-mono">
              Score: {user.reputation_score ?? 100} / 100
            </Badge>
          </div>

          {!profile?.reputation_logs || profile.reputation_logs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No reputation events recorded yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Punctual cycle contributions (+5 pts) and successful circle completions (+20 pts) are automatically indexed here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {profile.reputation_logs.map((log) => {
                const isPositive = log.score_change >= 0;
                const formattedDate = log.created_at
                  ? new Date(log.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Recent';

                return (
                  <div key={log.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPositive ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">
                            {log.event_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {log.circle_id && (
                            <Link
                              href={`/circles/${log.circle_id}`}
                              className="text-emerald-400 hover:underline font-mono"
                            >
                              Circle #{String(log.circle_id)}
                            </Link>
                          )}
                        </div>
                        <p className="text-slate-400">{log.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <Badge
                        variant={isPositive ? 'success' : 'destructive'}
                        className="font-mono text-xs font-bold"
                      >
                        {isPositive ? `+${log.score_change}` : log.score_change} pts
                      </Badge>
                      <span className="text-[10px] text-slate-500 block">{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
