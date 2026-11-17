'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, Clock, Shield, PlusCircle, Loader2, Search, Filter, CheckCircle2, UserCheck, Sparkles, X } from 'lucide-react';
import { fetchCircles, CircleData } from '../../lib/api';
import { useWallet } from '../../lib/wallet-context';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type StatusFilter = 'all' | 'my' | 'Active' | 'Forming' | 'Completed' | 'Defaulted';

export default function CirclesExplorePage() {
  const { address } = useWallet();
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    async function loadCircles() {
      setIsLoading(true);
      const data = await fetchCircles();
      setCircles(data);
      setIsLoading(false);
    }
    loadCircles();
  }, []);

  // Filter circles by search query and status tab
  const filteredCircles = useMemo(() => {
    return circles.filter((circle) => {
      // 1. Search Query filter (matches name, description, category, or creator)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        circle.name.toLowerCase().includes(q) ||
        (circle.description && circle.description.toLowerCase().includes(q)) ||
        (circle.category && circle.category.toLowerCase().includes(q)) ||
        circle.creator_address.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Status Tab filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'my') {
        if (!address) return false;
        const userAddr = address.toLowerCase();
        const isMember = circle.members?.some((m) => m.wallet_address.toLowerCase() === userAddr);
        const isCreator = circle.creator_address.toLowerCase() === userAddr;
        return isMember || isCreator;
      }
      return circle.status === statusFilter;
    });
  }, [circles, searchQuery, statusFilter, address]);

  // Counts for tabs
  const myCirclesCount = useMemo(() => {
    if (!address) return 0;
    const userAddr = address.toLowerCase();
    return circles.filter(
      (c) =>
        c.creator_address.toLowerCase() === userAddr ||
        c.members?.some((m) => m.wallet_address.toLowerCase() === userAddr)
    ).length;
  }, [circles, address]);

  const activeCount = useMemo(() => circles.filter((c) => c.status === 'Active').length, [circles]);
  const formingCount = useMemo(() => circles.filter((c) => c.status === 'Forming').length, [circles]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Explore Savings Circles</h1>
          <p className="text-slate-400 text-sm">Join active ROSCA pools on Stellar or start your own group</p>
        </div>
        <Link href="/circles/create">
          <Button variant="gradient" size="md">
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Create New Circle</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by circle name, category, or creator address..."
            className="pl-9 pr-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Pools ({circles.length})
          </button>

          {address && (
            <button
              onClick={() => setStatusFilter('my')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                statusFilter === 'my'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>My Circles</span>
              {myCirclesCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-purple-500/30 text-purple-300 rounded-full">
                  {myCirclesCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'Active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter('Forming')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'Forming'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Forming ({formingCount})
          </button>

          <button
            onClick={() => setStatusFilter('Completed')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'Completed'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Circles Grid or Loading / Empty States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading savings circles from Stellar database...</p>
        </div>
      ) : filteredCircles.length === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 rounded-full bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-xl font-bold text-white">
            {searchQuery
              ? `No circles matching "${searchQuery}"`
              : statusFilter === 'my'
              ? "You haven't joined any circles yet"
              : 'No circles found for this filter'}
          </h3>
          <p className="text-slate-400 text-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'Try clearing your search query or switching filters to see more savings pools.'
              : 'Be the first to launch an automated ROSCA savings pool on Stellar!'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            )}
            <Link href="/circles/create">
              <Button variant="gradient" size="sm">
                Create First Circle Now
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCircles.map((circle) => {
            const isUserMember = address && circle.members?.some(
              (m) => m.wallet_address.toLowerCase() === address.toLowerCase()
            );
            const isUserCreator = address && circle.creator_address.toLowerCase() === address.toLowerCase();

            return (
              <Card
                key={circle.circle_id}
                className="p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
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
                          {circle.status || 'Forming'}
                        </Badge>
                        {circle.payout_mode && (
                          <Badge variant="outline" className="text-[10px]">
                            {circle.payout_mode}
                          </Badge>
                        )}
                        {isUserMember && (
                          <Badge variant="success" className="text-[10px] flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Joined</span>
                          </Badge>
                        )}
                        {isUserCreator && (
                          <Badge variant="purple" className="text-[10px] flex items-center space-x-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Creator</span>
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {circle.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-white">${circle.contribution_amount}</span>
                      <span className="text-xs text-slate-400 block">USDC / Cycle</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-2">
                    {circle.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {circle.members?.length || 1} / {circle.member_count} Members
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{circle.interval_days} Days</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>${circle.collateral_required} Collateral</span>
                    </div>
                  </div>

                  <Link href={`/circles/${circle.circle_id}`} className="block">
                    <Button variant="outline" size="md" className="w-full">
                      View Circle Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
