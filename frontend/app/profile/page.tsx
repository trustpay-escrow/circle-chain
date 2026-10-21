'use client';

import { useEffect, useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, History, Loader2, User, Edit3, Save, X, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserProfileApi, saveUserProfileApi, UserProfileData } from '../../lib/api';
import { useWallet } from '../../lib/wallet-context';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function ProfilePage() {
  const { address, openModal } = useWallet();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
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
      return;
    }

    async function loadProfile() {
      setIsLoading(true);
      const data = await fetchUserProfileApi(address!);
      setProfile(data);
      if (data) {
        setUsernameInput(data.username || '');
        setDisplayNameInput(data.display_name || '');
        setBioInput(data.bio || '');
      }
      setIsLoading(false);
    }
    loadProfile();
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
    </div>
  );
}
